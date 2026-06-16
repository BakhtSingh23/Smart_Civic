import { NavLink } from 'react-router-dom';
import {
  FaHome,
  FaBell,
  FaMapMarkerAlt,
  FaList,
  FaPlusCircle,
  FaUser,
  FaThLarge,
} from 'react-icons/fa';

const mobileLinksByRole = {
  citizen: [
    { to: '/citizen/dashboard', label: 'Home', icon: <FaHome /> },
    { to: '/citizen/report', label: 'Report', icon: <FaPlusCircle /> },
    { to: '/citizen/complaints', label: 'Complaints', icon: <FaList /> },
    { to: '/citizen/notifications', label: 'Alerts', icon: <FaBell /> },
    { to: '/citizen/profile', label: 'Profile', icon: <FaUser /> },
  ],
  worker: [
    { to: '/worker/dashboard', label: 'Dashboard', icon: <FaThLarge /> },
    { to: '/worker/tasks', label: 'Tasks', icon: <FaList /> },
  ],
};

export default function BottomNav({ role }) {
  const links = mobileLinksByRole[role] || [];

  if (links.length === 0) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around bg-white border-t border-slate-200 px-2 py-2 pb-safe shadow-[0_-4px_10px_rgba(0,0,0,0.05)] md:hidden">
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center min-w-[60px] min-h-[44px] transition-colors ${
              isActive
                ? 'text-civic-600 font-semibold'
                : 'text-slate-500 hover:text-slate-800'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span className={`text-xl mb-1 transition-transform ${isActive ? 'scale-110' : ''}`}>
                {link.icon}
              </span>
              <span className="text-[10px] uppercase tracking-wider">{link.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
