from typing import Any, Text, Dict, List
from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
from rasa_sdk.events import SlotSet
import requests
import os

# URL of your Node.js backend (running on port 5000)
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:5000")


class ActionCheckComplaintStatus(Action):
    """Fetches complaint status from the SmartCivic Node.js backend."""

    def name(self) -> Text:
        return "action_check_complaint_status"

    def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[Dict[Text, Any]]:

        complaint_id = tracker.get_slot("complaint_id")

        if not complaint_id:
            dispatcher.utter_message(text=(
                "Please share your Complaint ID (format: CMP-YYYY-XXXX) "
                "and I'll check the status for you."
            ))
            return []

        # Normalize: uppercase, strip whitespace
        complaint_id = complaint_id.strip().upper()

        try:
            # Call the Node.js internal status endpoint (no auth needed for bot)
            response = requests.get(
                f"{BACKEND_URL}/api/chatbot/complaint-status/{complaint_id}",
                timeout=5
            )

            if response.status_code == 200:
                data = response.json()
                complaint = data.get("complaint", {})

                status = complaint.get("status", "unknown")
                title = complaint.get("title", "N/A")
                category = complaint.get("category", "N/A")
                created_at = complaint.get("createdAt", "N/A")
                assigned_dept = complaint.get("assignedDepartment", "Not yet assigned")
                is_duplicate = complaint.get("isDuplicate", False)
                incident_id = complaint.get("incidentGroupId", None)

                status_emoji = {
                    "pending": "🟡 Pending Verification",
                    "verified": "🔵 Verified",
                    "rejected": "🔴 Rejected",
                    "assigned": "🟣 Department Assigned",
                    "in_progress": "🟠 Work In Progress",
                    "completed": "🟢 Completed",
                    "closed": "✅ Closed",
                }.get(status, f"📋 {status.capitalize()}")

                msg = (
                    f"📋 **Complaint Status: {complaint_id}**\n\n"
                    f"**Title:** {title}\n"
                    f"**Category:** {category}\n"
                    f"**Status:** {status_emoji}\n"
                    f"**Department:** {assigned_dept}\n"
                    f"**Submitted:** {created_at[:10] if created_at != 'N/A' else 'N/A'}\n"
                )

                if is_duplicate and incident_id:
                    msg += (
                        f"\n🔗 **Note:** Your complaint is grouped under "
                        f"Incident **{incident_id}** with other reporters."
                        f" You'll be notified together when resolved."
                    )

                if status == "pending":
                    msg += "\n\n⏳ Your complaint is waiting for admin verification (usually within 24 hours)."
                elif status == "in_progress":
                    msg += "\n\n⚙️ A field worker is currently working on this issue!"
                elif status in ["completed", "closed"]:
                    msg += "\n\n🎉 This issue has been resolved! Please check your email for details."

                dispatcher.utter_message(text=msg)
                return [SlotSet("complaint_id", None)]  # clear slot after use

            elif response.status_code == 404:
                dispatcher.utter_message(
                    text=(
                        f"❌ No complaint found with ID **{complaint_id}**.\n\n"
                        "Please check the ID format: **CMP-2024-0042**\n"
                        "You can find your IDs in **My Complaints** section."
                    )
                )
                return [SlotSet("complaint_id", None)]

            else:
                raise Exception(f"Backend returned {response.status_code}")

        except requests.exceptions.ConnectionError:
            dispatcher.utter_message(
                text=(
                    "⚠️ I'm having trouble connecting to the system right now. "
                    "Please check your complaint status directly in the "
                    "**My Complaints** section of your dashboard."
                )
            )
        except Exception as e:
            dispatcher.utter_message(
                text=(
                    "⚠️ Something went wrong while fetching your complaint. "
                    "Please visit **My Complaints** in your dashboard to see the latest status."
                )
            )

        return [SlotSet("complaint_id", None)]


class ActionDetectCategoryFromText(Action):
    """Keyword-based category detector as fallback (no ML API needed)."""

    def name(self) -> Text:
        return "action_detect_category_from_text"

    def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[Dict[Text, Any]]:

        # Get the latest user message
        user_text = tracker.latest_message.get("text", "").lower()

        road_keywords = ["pothole", "road", "pavement", "footpath", "divider", "crack", "broken road", "highway"]
        water_keywords = ["water", "pipe", "leak", "supply", "borewell", "sewage drinking", "tap", "pipeline"]
        sanitation_keywords = ["garbage", "waste", "dustbin", "sanitation", "trash", "dump", "litter", "stray animal"]
        electricity_keywords = ["light", "wire", "electric", "streetlight", "pole", "transformer", "power", "fuse"]
        drainage_keywords = ["drain", "drainage", "flood", "waterlog", "manhole", "sewer", "overflow", "storm"]

        detected = "Other"
        if any(kw in user_text for kw in road_keywords):
            detected = "Roads"
        elif any(kw in user_text for kw in water_keywords):
            detected = "Water"
        elif any(kw in user_text for kw in sanitation_keywords):
            detected = "Sanitation"
        elif any(kw in user_text for kw in electricity_keywords):
            detected = "Electricity"
        elif any(kw in user_text for kw in drainage_keywords):
            detected = "Drainage"

        dispatcher.utter_message(
            text=(
                f"🔍 Based on your description, this appears to be a "
                f"**{detected}** issue.\n\n"
                f"👉 Go to **Report Issue** → Select **{detected}** as the category."
            )
        )
        return [SlotSet("detected_category", detected)]

from rasa_sdk.forms import FormValidationAction
from rasa_sdk.events import SlotSet, ActiveLoop
import re

# ─────────────────────────────────────────────────────
# VALIDATOR — validates and cleans slots as user fills them
# ─────────────────────────────────────────────────────

class ValidateComplaintForm(FormValidationAction):

    def name(self) -> Text:
        return "validate_complaint_form"

    # ── Validate issue_description ──
    async def validate_issue_description(
        self,
        slot_value: Any,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> Dict[Text, Any]:

        if not slot_value or len(slot_value.strip()) < 10:
            dispatcher.utter_message(text=(
                "⚠️ Please provide a bit more detail about the issue "
                "(at least 10 characters). What exactly is the problem?"
            ))
            return {"issue_description": None}

        if len(slot_value.strip()) > 500:
            dispatcher.utter_message(text=(
                "Please keep the description under 500 characters. "
                "Summarize the key problem."
            ))
            return {"issue_description": None}

        # After accepting description, auto-detect category using keywords
        description_lower = slot_value.lower()

        road_kw = ["pothole", "road", "pavement", "footpath", "crack", "divider", "highway", "broken road", "tar", "asphalt"]
        water_kw = ["water", "pipe", "leak", "supply", "borewell", "sewage", "tap", "pipeline", "drinking"]
        sanitation_kw = ["garbage", "waste", "dustbin", "trash", "dump", "litter", "stray", "sweeping", "sanitation"]
        electricity_kw = ["light", "wire", "electric", "streetlight", "pole", "transformer", "power", "fuse", "bulb"]
        drainage_kw = ["drain", "flood", "waterlog", "manhole", "sewer", "overflow", "storm", "drainage", "blocked"]

        if any(kw in description_lower for kw in road_kw):
            detected = "Roads"
        elif any(kw in description_lower for kw in water_kw):
            detected = "Water"
        elif any(kw in description_lower for kw in sanitation_kw):
            detected = "Sanitation"
        elif any(kw in description_lower for kw in electricity_kw):
            detected = "Electricity"
        elif any(kw in description_lower for kw in drainage_kw):
            detected = "Drainage"
        else:
            detected = "Other"

        return {
            "issue_description": slot_value.strip(),
            "issue_category": detected
        }

    # ── Validate category_confirmed ──
    async def validate_category_confirmed(
        self,
        slot_value: Any,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> Dict[Text, Any]:

        current_category = tracker.get_slot("issue_category")

        if slot_value is True:
            # User confirmed — proceed
            return {"category_confirmed": True}

        elif slot_value is False:
            # User denied — ask them to type correct category
            dispatcher.utter_message(text=(
                "No problem! Please type the correct category:\n"
                "🛣️ Roads | 💧 Water | 🗑️ Sanitation | ⚡ Electricity | 🌊 Drainage | 📍 Other"
            ))
            return {"category_confirmed": None, "issue_category": None}

        else:
            # User typed a category name directly (neither affirm nor deny)
            valid_cats = ["roads", "water", "sanitation", "electricity", "drainage", "other"]
            typed = str(slot_value).strip().lower()

            cat_map = {
                "roads": "Roads", "road": "Roads",
                "water": "Water",
                "sanitation": "Sanitation", "garbage": "Sanitation",
                "electricity": "Electricity", "electric": "Electricity", "light": "Electricity",
                "drainage": "Drainage", "drain": "Drainage",
                "other": "Other"
            }

            if typed in cat_map:
                new_cat = cat_map[typed]
                dispatcher.utter_message(text=f"✅ Category updated to **{new_cat}**.")
                return {"issue_category": new_cat, "category_confirmed": True}
            else:
                dispatcher.utter_message(text=(
                    "Please type one of: Roads, Water, Sanitation, Electricity, Drainage, or Other"
                ))
                return {"category_confirmed": None}

    # ── Validate issue_location_text ──
    async def validate_issue_location_text(
        self,
        slot_value: Any,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> Dict[Text, Any]:

        if not slot_value or len(slot_value.strip()) < 5:
            dispatcher.utter_message(text=(
                "📍 Please provide a bit more detail about the location "
                "(street name, landmark, or area name)."
            ))
            return {"issue_location_text": None}

        return {"issue_location_text": slot_value.strip()}

    # ── Validate issue_city ──
    async def validate_issue_city(
        self,
        slot_value: Any,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> Dict[Text, Any]:

        if not slot_value or len(slot_value.strip()) < 2:
            dispatcher.utter_message(text="Please enter a valid city name.")
            return {"issue_city": None}

        return {"issue_city": slot_value.strip().title()}

    # ── Validate issue_priority ──
    async def validate_issue_priority(
        self,
        slot_value: Any,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> Dict[Text, Any]:

        priority_map = {
            "low": "low",
            "medium": "medium",
            "med": "medium",
            "high": "high",
            "urgent": "urgent",
            "critical": "urgent",
            "emergency": "urgent",
            "very urgent": "urgent",
            "not urgent": "low",
            "can wait": "low",
            "important": "high",
            "very important": "urgent",
            "needs immediate attention": "urgent"
        }

        normalized = str(slot_value).strip().lower()
        priority = priority_map.get(normalized)

        if not priority:
            # Try partial match
            for key, val in priority_map.items():
                if key in normalized:
                    priority = val
                    break

        if not priority:
            dispatcher.utter_message(text=(
                "⚠️ Please type one of these priority levels:\n"
                "• **low** — minor inconvenience\n"
                "• **medium** — affects daily life\n"
                "• **high** — dangerous or widespread\n"
                "• **urgent** — immediate safety risk"
            ))
            return {"issue_priority": None}

        priority_emoji = {"low": "🟢", "medium": "🟡", "high": "🟠", "urgent": "🔴"}
        dispatcher.utter_message(
            text=f"Priority set to {priority_emoji[priority]} **{priority.capitalize()}**."
        )
        return {"issue_priority": priority}

    # ── Validate submission_confirmed ──
    async def validate_submission_confirmed(
        self,
        slot_value: Any,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> Dict[Text, Any]:

        if slot_value is True:
            return {"submission_confirmed": True}
        elif slot_value is False:
            return {"submission_confirmed": False}
        else:
            dispatcher.utter_message(text="Please reply with **yes** to submit or **no** to cancel.")
            return {"submission_confirmed": None}


# ─────────────────────────────────────────────────────
# ACTION — Submits the collected complaint to Node.js backend
# ─────────────────────────────────────────────────────

class ActionSubmitComplaint(Action):

    def name(self) -> Text:
        return "action_submit_complaint"

    def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[Dict[Text, Any]]:

        # Read all collected slots
        description   = tracker.get_slot("issue_description")
        category      = tracker.get_slot("issue_category")
        location_text = tracker.get_slot("issue_location_text")
        city          = tracker.get_slot("issue_city")
        priority      = tracker.get_slot("issue_priority")
        confirmed     = tracker.get_slot("submission_confirmed")
        sender_id     = tracker.sender_id  # this is the citizen's user ID

        # User said no at confirmation
        if not confirmed:
            dispatcher.utter_message(
                text="❌ Complaint cancelled. No problem — you can report again anytime!"
            )
            return [
                SlotSet("issue_description", None),
                SlotSet("issue_category", None),
                SlotSet("category_confirmed", None),
                SlotSet("issue_location_text", None),
                SlotSet("issue_city", None),
                SlotSet("issue_priority", None),
                SlotSet("submission_confirmed", None),
            ]

        # Submit to Node.js backend
        try:
            response = requests.post(
                f"{BACKEND_URL}/api/chatbot/submit-complaint",
                json={
                    "citizenId": sender_id,
                    "title": f"{category} issue: {description[:60]}",
                    "description": description,
                    "category": category,
                    "address": location_text,
                    "city": city,
                    "priority": priority,
                    "source": "chatbot"
                },
                timeout=8
            )

            if response.status_code == 201:
                data = response.json()
                complaint_id = data.get("complaintId", "N/A")

                priority_emoji = {"low": "🟢", "medium": "🟡", "high": "🟠", "urgent": "🔴"}
                cat_emoji = {
                    "Roads": "🛣️", "Water": "💧", "Sanitation": "🗑️",
                    "Electricity": "⚡", "Drainage": "🌊", "Other": "📍"
                }

                dispatcher.utter_message(text=(
                    f"✅ **Complaint Submitted Successfully!**\n\n"
                    f"🎫 **Complaint ID:** `{complaint_id}`\n"
                    f"{cat_emoji.get(category, '📍')} **Category:** {category}\n"
                    f"{priority_emoji.get(priority, '⚠️')} **Priority:** {priority.capitalize()}\n"
                    f"📍 **Location:** {location_text}, {city}\n\n"
                    f"📧 A confirmation email has been sent to you.\n"
                    f"📊 Track your complaint under **My Complaints** → `{complaint_id}`\n\n"
                    f"Thank you for reporting! Our team will verify within 24 hours. 🙏"
                ))

                return [
                    SlotSet("submitted_complaint_id", complaint_id),
                    SlotSet("issue_description", None),
                    SlotSet("issue_category", None),
                    SlotSet("category_confirmed", None),
                    SlotSet("issue_location_text", None),
                    SlotSet("issue_city", None),
                    SlotSet("issue_priority", None),
                    SlotSet("submission_confirmed", None),
                ]

            else:
                raise Exception(f"Backend error: {response.status_code} — {response.text}")

        except requests.exceptions.ConnectionError:
            dispatcher.utter_message(text=(
                "⚠️ I couldn't reach the server right now.\n\n"
                "Please use the **Report Issue** form in your dashboard to submit your complaint.\n"
                "Your details:\n"
                f"• Issue: {description}\n"
                f"• Location: {location_text}, {city}\n"
                f"• Category: {category} | Priority: {priority}"
            ))

        except Exception as e:
            dispatcher.utter_message(text=(
                "⚠️ Something went wrong during submission.\n\n"
                "Please try the **Report Issue** button in the sidebar, or try again in a moment."
            ))

        # Clear slots even on failure
        return [
            SlotSet("issue_description", None),
            SlotSet("issue_category", None),
            SlotSet("category_confirmed", None),
            SlotSet("issue_location_text", None),
            SlotSet("issue_city", None),
            SlotSet("issue_priority", None),
            SlotSet("submission_confirmed", None),
        ]


# ─────────────────────────────────────────────────────
# ACTION — Sets category from slot (needed for form mapping)
# ─────────────────────────────────────────────────────

class ActionDetectAndSetCategory(Action):

    def name(self) -> Text:
        return "action_detect_and_set_category"

    def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[Dict[Text, Any]]:
        # Category is set inside validate_issue_description automatically
        # This action is a passthrough — RASA requires it to be listed
        category = tracker.get_slot("issue_category") or "Other"
        return [SlotSet("issue_category", category)]
