import { useState, useRef, useEffect } from 'react';
import { http } from '../../api/http';
import { useAuth } from '../../hooks/useAuth';

const QUICK_ACTIONS = [
  { label: '🚨 Report Issue Here', message: 'I want to report a civic issue right here in chat' },
  { label: '📍 Check My Complaint', message: 'I want to check my complaint status' },
  { label: '📞 Emergency Contacts', message: 'Give me emergency helpline numbers' },
  { label: '❓ How it works', message: 'How does this platform work' },
];

export default function ChatbotWidget() {
	const { user } = useAuth();
	const [isOpen, setIsOpen] = useState(false);
	const [messages, setMessages] = useState([]);
	const [inputText, setInputText] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [showQuickActions, setShowQuickActions] = useState(true);
	const [isFormActive, setIsFormActive] = useState(false);
	const [formStep, setFormStep] = useState(0);
	const [gpsLoading, setGpsLoading] = useState(false);
	const [gpsError, setGpsError] = useState('');
	const messagesEndRef = useRef(null);

	// Auto-scroll to latest message
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages]);

	useEffect(() => {
		if (messages.length === 0) return;
		const lastBotMsg = [...messages].reverse().find(m => m.role === 'assistant');
		if (!lastBotMsg) return;

		const content = lastBotMsg.content;

		if (content.includes('Please describe the civic issue')) { setIsFormActive(true); setFormStep(1); }
		else if (content.includes("I've detected this as")) { setFormStep(2); }
		else if (content.includes('Where exactly is this issue') || content.includes('exactly is this issue located')) { setFormStep(3); setGpsError(''); }
		else if (content.includes('Which city or town')) { setFormStep(4); }
		else if (content.includes('How urgent is this')) { setFormStep(5); }
		else if (content.includes('Review Your Complaint')) { setFormStep(6); }
		else if (content.includes('Complaint Submitted') || content.includes('cancelled')) {
			setIsFormActive(false); setFormStep(0);
		}
	}, [messages]);

	// Greeting on first open
	useEffect(() => {
		if (isOpen && messages.length === 0) {
			setMessages([
				{
					role: 'assistant',
					content: `👋 Hello${user?.name ? ' ' + user.name.split(' ')[0] : ''}! I'm SmartCivic AI Assistant.\n\nI can help you file complaints, check status, or provide emergency contacts.\n\nWhat would you like help with?`,
					timestamp: new Date(),
				},
			]);
		}
	}, [isOpen]);

	const sendMessage = async (text) => {
		if (!text.trim() || isLoading) return;

		const userMsg = { role: 'user', content: text, timestamp: new Date() };
		setMessages((prev) => [...prev, userMsg]);
		setInputText('');
		setIsLoading(true);
		setShowQuickActions(false);
		setGpsError('');

		try {
			const { data } = await http.post('/chatbot/chat', {
				message: text,
				senderId: user?._id || user?.id || 'guest',
			});
			setMessages((prev) => [
				...prev,
				{
					role: 'assistant',
					content: data.reply,
					timestamp: new Date(),
				},
			]);
		} catch {
			setMessages((prev) => [
				...prev,
				{
					role: 'assistant',
					content: "⚠️ I'm having trouble connecting. Please try again.",
					timestamp: new Date(),
				},
			]);
		} finally {
			setIsLoading(false);
		}
	};

	// ── GPS Location Handler ──────────────────────────────────────────────────
	const handleUseGPS = () => {
		if (!navigator.geolocation) {
			setGpsError('❌ GPS is not supported by your browser.');
			return;
		}

		setGpsLoading(true);
		setGpsError('');

		navigator.geolocation.getCurrentPosition(
			async (position) => {
				const { latitude, longitude, accuracy } = position.coords;
				try {
					// Reverse geocode using OpenStreetMap Nominatim (free, no API key)
					const res = await fetch(
						`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
						{ headers: { 'Accept-Language': 'en' } }
					);
					const geo = await res.json();

					// Build a readable address from the response parts
					const addr = geo.address || {};
					const parts = [
						addr.road || addr.pedestrian || addr.footway || addr.street,
						addr.neighbourhood || addr.suburb || addr.quarter || addr.village,
						addr.city_district || addr.county,
					].filter(Boolean);

					const locationText = parts.length > 0
						? parts.join(', ')
						: geo.display_name?.split(',').slice(0, 3).join(', ') || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;

					const city = addr.city || addr.town || addr.village || addr.county || 'Unknown';
					const accuracyNote = accuracy < 50 ? '' : ` (±${Math.round(accuracy)}m)`;

					// Send location as the user's message automatically
					sendMessage(`${locationText}${accuracyNote}`);

					// Pre-fill city for the next step
					setInputText(city);

				} catch {
					// Fallback: send raw coordinates if reverse geocoding fails
					sendMessage(`GPS: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
				} finally {
					setGpsLoading(false);
				}
			},
			(err) => {
				setGpsLoading(false);
				const messages = {
					1: '❌ Location access denied. Please type your location manually or allow GPS in browser settings.',
					2: '❌ GPS signal unavailable. Please type your location.',
					3: '❌ GPS request timed out. Please type your location.',
				};
				setGpsError(messages[err.code] || '❌ Could not get GPS location.');
			},
			{ enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
		);
	};

	const formatTime = (date) =>
		date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

	return (
		<>
			{/* Floating Button */}
			<button
				onClick={() => setIsOpen(!isOpen)}
				className="fixed bottom-20 right-5 z-50 w-14 h-14 rounded-full
          bg-gradient-to-br from-blue-600 to-purple-600
          shadow-lg shadow-blue-500/40 hover:scale-110
          transition-all duration-200 flex items-center justify-center text-2xl
          md:bottom-6 md:right-6"
				title="SmartCivic AI Assistant"
			>
				{isOpen ? '✕' : '🤖'}
			</button>

			{/* Chat Window */}
			{isOpen && (
				<div
					className="fixed bottom-36 right-5 z-50
          w-[calc(100vw-2.5rem)] sm:w-96 h-[520px]
          bg-slate-900 border border-blue-900/40
          rounded-2xl shadow-2xl flex flex-col overflow-hidden
          animate-chatbot-slide-up
          md:bottom-24 md:right-6 md:w-96"
				>
					{/* Header */}
					<div
						className="flex items-center gap-3 px-4 py-3
            bg-gradient-to-r from-blue-900 to-purple-900 border-b border-white/10"
					>
						<span className="text-2xl">🤖</span>
						<div>
							<p className="text-white font-semibold text-sm">SmartCivic AI</p>
							<p className="text-green-400 text-xs flex items-center gap-1">
								<span className="w-2 h-2 bg-green-400 rounded-full inline-block animate-pulse" />
								Online
							</p>
						</div>
						<button
							onClick={() => setIsOpen(false)}
							className="ml-auto text-white/60 hover:text-white text-lg"
						>
							✕
						</button>
					</div>

					{isFormActive && (
						<div className="px-4 pb-2 bg-blue-950/30 border-b border-blue-900/30">
							<p className="text-xs text-blue-300 mb-1">📋 Filing complaint — Step {formStep} of 6</p>
							<div className="w-full bg-slate-700 rounded-full h-1.5">
								<div
									className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
									style={{ width: `${(formStep / 6) * 100}%` }}
								/>
							</div>
						</div>
					)}

					{/* Messages */}
					<div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-slate-700">
						{messages.map((msg, i) => (
							<div
								key={i}
								className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
							>
								<div
									className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap
                  ${
										msg.role === 'user'
											? 'bg-blue-600 text-white rounded-br-none'
											: 'bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700'
									}`}
								>
									{msg.content}
									<p className="text-xs mt-1 opacity-50">{formatTime(msg.timestamp)}</p>
								</div>
							</div>
						))}

						{/* Quick Actions (shown only initially) */}
						{showQuickActions && messages.length <= 1 && (
							<div className="flex flex-wrap gap-2 mt-2">
								{QUICK_ACTIONS.map((action) => (
									<button
										key={action.label}
										onClick={() => sendMessage(action.message)}
										className="text-xs bg-slate-800 hover:bg-blue-900
                      border border-slate-700 hover:border-blue-600
                      text-slate-300 rounded-full px-3 py-1.5 transition-colors"
									>
										{action.label}
									</button>
								))}
							</div>
						)}

						{/* GPS button — shown only at location step (step 3) */}
						{formStep === 3 && !isLoading && (
							<div className="flex justify-start">
								<div className="max-w-[90%] w-full">
									<button
										onClick={handleUseGPS}
										disabled={gpsLoading}
										className="w-full flex items-center justify-center gap-2
											bg-gradient-to-r from-emerald-600 to-teal-600
											hover:from-emerald-500 hover:to-teal-500
											disabled:opacity-50 disabled:cursor-not-allowed
											text-white text-sm font-semibold
											rounded-xl px-4 py-2.5
											shadow-md shadow-emerald-900/30
											transition-all duration-200 hover:shadow-emerald-700/40 hover:scale-[1.02]"
									>
										{gpsLoading ? (
											<>
												<span className="flex gap-1">
													<span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
													<span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
													<span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
												</span>
												Fetching location...
											</>
										) : (
											<>
												<span className="text-base">📍</span>
												Use GPS — Get My Exact Location
											</>
										)}
									</button>
									{gpsError && (
										<p className="mt-2 text-xs text-rose-400 px-1">{gpsError}</p>
									)}
									<p className="mt-1.5 text-xs text-slate-500 px-1 text-center">
										or type your location below
									</p>
								</div>
							</div>
						)}

						{/* Loading dots */}
						{isLoading && (
							<div className="flex justify-start">
								<div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-bl-none px-4 py-3">
									<span className="flex gap-1">
										<span
											className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
											style={{ animationDelay: '0ms' }}
										/>
										<span
											className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
											style={{ animationDelay: '150ms' }}
										/>
										<span
											className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
											style={{ animationDelay: '300ms' }}
										/>
									</span>
								</div>
							</div>
						)}
						<div ref={messagesEndRef} />
					</div>

					{/* Input */}
					<div className="p-3 border-t border-slate-800 flex gap-2">
						<textarea
							rows={1}
							value={inputText}
							onChange={(e) => setInputText(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === 'Enter' && !e.shiftKey) {
									e.preventDefault();
									sendMessage(inputText);
								}
							}}
							placeholder={formStep === 3 ? 'Or type location manually...' : 'Type your message...'}
							maxLength={300}
							className="flex-1 bg-slate-800 text-slate-100 placeholder-slate-500
                border border-slate-700 rounded-xl px-3 py-2
                text-sm resize-none focus:outline-none focus:border-blue-500"
						/>
						<button
							onClick={() => sendMessage(inputText)}
							disabled={!inputText.trim() || isLoading}
							className="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-500
                disabled:opacity-40 disabled:cursor-not-allowed
                flex items-center justify-center text-white font-bold transition-colors"
						>
							➤
						</button>
					</div>
				</div>
			)}
		</>
	);
}
