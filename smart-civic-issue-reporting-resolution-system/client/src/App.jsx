import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext.jsx';
import { ToastContainer } from './components/ui/Toast.jsx';

import ProtectedRoute from './components/common/ProtectedRoute.jsx';
import CitizenLayout from './layouts/CitizenLayout.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';
import OfficerLayout from './layouts/OfficerLayout.jsx';
import WorkerLayout from './layouts/WorkerLayout.jsx';

import Landing from './pages/Landing.jsx';
import AuthPortal from './pages/auth/AuthPortal.jsx';
import Unauthorized from './pages/Unauthorized.jsx';

import CitizenDashboard from './pages/citizen/CitizenDashboard.jsx';
import SubmitComplaint from './pages/citizen/SubmitComplaint.jsx';
import MyComplaints from './pages/citizen/MyComplaints.jsx';
import ComplaintDetail from './pages/citizen/ComplaintDetail.jsx';
import Notifications from './pages/citizen/Notifications.jsx';
import Profile from './pages/citizen/Profile.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import PendingComplaints from './pages/admin/PendingComplaints.jsx';
import AdminComplaintDetail from './pages/admin/ComplaintDetail.jsx';
import IncidentGroups from './pages/admin/IncidentGroups.jsx';
import AllComplaints from './pages/admin/AllComplaints.jsx';
import StaffManagement from './pages/admin/StaffManagement.jsx';
import Analytics from './pages/admin/Analytics.jsx';
import Forecasting from './pages/admin/Forecasting.jsx';
import AutomationReports from './pages/admin/AutomationReports.jsx';
import AutomationLogs from './pages/admin/AutomationLogs.jsx';
import WorkloadDashboard from './pages/admin/WorkloadDashboard.jsx';
import OfficerDashboard from './pages/officer/OfficerDashboard.jsx';
import AssignedComplaints from './pages/officer/AssignedComplaints.jsx';
import OfficerComplaintDetail from './pages/officer/OfficerComplaintDetail.jsx';
import DepartmentWorkers from './pages/officer/DepartmentWorkers.jsx';
import WorkerDashboard from './pages/worker/WorkerDashboard.jsx';
import MyTasks from './pages/worker/MyTasks.jsx';
import TaskDetail from './pages/worker/TaskDetail.jsx';

import CommunityForum from './pages/community/CommunityForum.jsx';
import ThreadDetail from './pages/community/ThreadDetail.jsx';
import CreateThread from './pages/community/CreateThread.jsx';
import CommunityManagement from './pages/admin/CommunityManagement.jsx';

export default function App() {
	return (
		<ToastProvider>
			<div className="min-h-screen bg-slate-50 font-body text-slateink-900">
				<Routes>
					<Route path="/" element={<Landing />} />
					<Route path="/login" element={<AuthPortal />} />
					<Route path="/register" element={<AuthPortal />} />
					<Route path="/unauthorized" element={<Unauthorized />} />

					<Route path="/community" element={<CommunityForum />} />
					<Route path="/community/:threadId" element={<ThreadDetail />} />
					<Route element={<ProtectedRoute allowedRoles={["citizen", "admin", "officer"]} />}>
						<Route path="/community/new" element={<CreateThread />} />
					</Route>

					<Route element={<ProtectedRoute allowedRoles={["citizen"]} />}>
						<Route path="citizen" element={<CitizenLayout />}>
							<Route index element={<Navigate to="dashboard" replace />} />
							<Route path="dashboard" element={<CitizenDashboard />} />
							<Route path="report" element={<SubmitComplaint />} />
							<Route path="complaints" element={<MyComplaints />} />
							<Route path="track" element={<MyComplaints />} />
							<Route path="complaints/:id" element={<ComplaintDetail />} />
							<Route path="notifications" element={<Notifications />} />
							<Route path="profile" element={<Profile />} />
						</Route>
					</Route>

					<Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
						<Route path="admin" element={<AdminLayout />}>
							<Route index element={<Navigate to="dashboard" replace />} />
							<Route path="dashboard" element={<AdminDashboard />} />
							<Route path="complaints/pending" element={<PendingComplaints />} />
							<Route path="complaints" element={<AllComplaints />} />
							<Route path="complaints/:id" element={<AdminComplaintDetail />} />
							<Route path="incidents" element={<IncidentGroups />} />
							<Route path="staff" element={<StaffManagement />} />
							<Route path="analytics" element={<Analytics />} />
							<Route path="forecasting" element={<Forecasting />} />
							<Route path="automation-reports" element={<AutomationReports />} />
							<Route path="automation-logs" element={<AutomationLogs />} />
							<Route path="workload" element={<WorkloadDashboard />} />
							<Route path="community" element={<CommunityManagement />} />
							<Route path="*" element={<Navigate to="dashboard" replace />} />
						</Route>
					</Route>

					<Route element={<ProtectedRoute allowedRoles={["officer"]} />}>
						<Route path="officer" element={<OfficerLayout />}>
							<Route index element={<Navigate to="dashboard" replace />} />
							<Route path="dashboard" element={<OfficerDashboard />} />
							<Route path="complaints" element={<AssignedComplaints />} />
							<Route path="complaints/:id" element={<OfficerComplaintDetail />} />
							<Route path="workers" element={<DepartmentWorkers />} />
							<Route path="*" element={<Navigate to="dashboard" replace />} />
						</Route>
					</Route>

					<Route element={<ProtectedRoute allowedRoles={["worker"]} />}>
						<Route path="worker" element={<WorkerLayout />}>
							<Route index element={<Navigate to="dashboard" replace />} />
							<Route path="dashboard" element={<WorkerDashboard />} />
							<Route path="tasks" element={<MyTasks />} />
							<Route path="tasks/:id" element={<TaskDetail />} />
							<Route path="*" element={<Navigate to="dashboard" replace />} />
						</Route>
					</Route>

					<Route path="*" element={<Navigate to="/login" replace />} />
				</Routes>

				<ToastContainer />
			</div>
		</ToastProvider>
	);
}
