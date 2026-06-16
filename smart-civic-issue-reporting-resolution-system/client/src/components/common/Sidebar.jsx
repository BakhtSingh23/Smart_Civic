import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  FaHome,
  FaBell,
  FaMapMarkerAlt,
  FaList,
  FaPlusCircle,
  FaUsers,
  FaChartBar,
  FaLayerGroup,
  FaTasks,
  FaCheckCircle,
  FaBriefcase,
  FaDatabase,
  FaInbox,
  FaClipboard,
  FaCheckSquare,
  FaPlayCircle,
  FaCog,
  FaUser,
  FaThLarge,
  FaBars,
  FaTimes,
  FaComments,
  FaBrain,
} from 'react-icons/fa';

const linksByRole = {
  citizen: [
    { to: '/citizen/dashboard', label: 'Dashboard', icon: <FaHome /> },
    { to: '/citizen/report', label: 'Report Issue', icon: <FaPlusCircle /> },
    { to: '/citizen/complaints', label: 'My Complaints', icon: <FaList /> },
    { to: '/citizen/track', label: 'Track Status', icon: <FaMapMarkerAlt /> },
    { to: '/citizen/notifications', label: 'Notifications', icon: <FaBell /> },
    { to: '/community', label: 'Community', icon: <FaComments /> },
    { to: '/citizen/profile', label: 'Profile', icon: <FaUser /> },
  ],
  admin: [
    { to: '/admin/dashboard', label: 'Dashboard', icon: <FaThLarge /> },
    { to: '/admin/complaints', label: 'Complaints', icon: <FaInbox /> },
    { to: '/admin/incidents', label: 'Incident Groups', icon: <FaLayerGroup /> },
    { to: '/admin/staff', label: 'Officers & Workers', icon: <FaUsers /> },
    { to: '/admin/analytics', label: 'Analytics', icon: <FaChartBar /> },
    { to: '/admin/forecasting', label: 'AI Forecasting', icon: <FaBrain /> },
    { to: '/admin/community', label: 'Community', icon: <FaComments /> },
  ],
  officer: [
    { to: '/officer/dashboard', label: 'Dashboard', icon: <FaThLarge /> },
    { to: '/officer/complaints', label: 'Assigned Complaints', icon: <FaClipboard /> },
    { to: '/officer/workers', label: 'My Workers', icon: <FaUsers /> },
  ],
  worker: [
    { to: '/worker/dashboard', label: 'Dashboard', icon: <FaThLarge /> },
    { to: '/worker/tasks', label: 'My Tasks', icon: <FaList /> },
  ],
};

export default function Sidebar({ role, hideMobileToggle = false }) {
  const links = linksByRole[role] || [];
  const [mobileOpen, setMobileOpen] = useState(false);

  const navContent = (
    <>
      <div className="mb-8 flex items-center justify-between">
        <span className="text-xl font-display font-semibold tracking-wide text-white">
          SmartCivic
        </span>
        <button
          className="text-white/60 hover:text-white lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close sidebar"
          type="button"
        >
          <FaTimes />
        </button>
      </div>
      <nav className="space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-civic-600 text-white shadow-glow'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <span className="text-base shrink-0">{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
      </nav>
    </>
  );

  return (
    <>
      {/* Mobile toggle button */}
      {!hideMobileToggle && (
        <button
          className="fixed top-4 left-4 z-50 rounded-lg bg-slateink-900 p-2 text-white shadow-lg lg:hidden"
          onClick={() => setMobileOpen(true)}
          aria-label="Open sidebar"
          type="button"
        >
          <FaBars />
        </button>
      )}

      {/* Mobile overlay */}
      {!hideMobileToggle && mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      {!hideMobileToggle && (
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-64 shrink-0 border-r border-white/10 bg-[#0F172A] px-4 py-6 text-white transition-transform duration-300 lg:hidden ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {navContent}
        </aside>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-white/10 bg-[#0F172A] px-4 py-6 text-white md:block">
        {navContent}
      </aside>
    </>
  );
}
