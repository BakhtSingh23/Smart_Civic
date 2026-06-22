import { useState, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import {
  FaHome, FaBell, FaMapMarkerAlt, FaList, FaPlusCircle,
  FaUsers, FaChartBar, FaLayerGroup, FaTasks, FaClipboard,
  FaCog, FaUser, FaThLarge, FaBars, FaTimes, FaComments,
  FaBrain, FaRobot, FaInbox, FaFileAlt, 
  FaExclamationTriangle, FaCheckCircle, FaCamera,
  FaUpload
} from 'react-icons/fa';

/* ─── Role Configuration ────────────────────────────────────────── */
const roleConfig = {
  citizen: {
    nav: [
      {
        links: [
          { to: '/citizen/dashboard', label: 'Dashboard', icon: FaHome },
          { to: '/citizen/report', label: 'Report Issue', icon: FaPlusCircle },
          { to: '/citizen/complaints', label: 'My Complaints', icon: FaList },
          { to: '/citizen/track', label: 'Track Status', icon: FaMapMarkerAlt },
          { to: '/citizen/notifications', label: 'Notifications', icon: FaBell },
          { to: '/community', label: 'Community', icon: FaComments },
          { to: '/citizen/profile', label: 'Profile', icon: FaUser }
        ]
      }
    ]
  },
  admin: {
    nav: [
      {
        links: [
          { to: '/admin/dashboard', label: 'Dashboard', icon: FaThLarge },
          { to: '/admin/complaints', label: 'Complaints', icon: FaInbox },
          { to: '/admin/incidents', label: 'Incident Groups', icon: FaLayerGroup },
          { to: '/admin/staff', label: 'Officers & Workers', icon: FaUsers },
          { to: '/admin/analytics', label: 'Analytics', icon: FaChartBar },
          { to: '/admin/forecasting', label: 'AI Forecasting', icon: FaBrain },
          { to: '/admin/automation-reports', label: 'Automation', icon: FaRobot },
          { to: '/admin/workload', label: 'Workload', icon: FaTasks },
          { to: '/admin/automation-logs', label: 'Audit Logs', icon: FaList },
          { to: '/admin/community', label: 'Community', icon: FaComments }
        ]
      }
    ]
  },
  officer: {
    nav: [
      {
        links: [
          { to: '/officer/dashboard', label: 'Dashboard', icon: FaThLarge },
          { to: '/officer/complaints', label: 'Assigned Complaints', icon: FaClipboard },
          { to: '/officer/workers', label: 'My Workers', icon: FaUsers }
        ]
      }
    ]
  },
  worker: {
    nav: [
      {
        links: [
          { to: '/worker/dashboard', label: 'Dashboard', icon: FaThLarge },
          { to: '/worker/tasks', label: 'My Tasks', icon: FaList }
        ]
      }
    ]
  }
};

/* ─── Component ─────────────────────────────────────────────────────────── */
export default function Sidebar({ role, hideMobileToggle = false }) {
  const config = roleConfig[role] || roleConfig.citizen;
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleRipple = useCallback((e) => {
    const target = e.currentTarget;
    const circle = document.createElement('span');
    const rect = target.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    circle.style.width = circle.style.height = `${size}px`;
    circle.style.left = `${e.clientX - rect.left - size / 2}px`;
    circle.style.top = `${e.clientY - rect.top - size / 2}px`;
    circle.className = 'ripple';
    target.appendChild(circle);
    setTimeout(() => circle.remove(), 600);
  }, []);

  const navContent = (isMobile = false) => (
    <div className="flex flex-col h-full w-full bg-[#0B1120] relative z-10 border-r border-white/5">
      
      {/* ─── SECTION 1: Platform Branding ─── */}
      <div className="flex flex-col shrink-0 h-[72px] justify-center px-6">
        <div className="flex items-center gap-3 w-full">
          <span className="text-xl font-bold tracking-wide text-white">
            SmartCivic
          </span>
          {isMobile && (
            <button className="ml-auto text-white/40 hover:text-white" onClick={() => setMobileOpen(false)}><FaTimes size={16} /></button>
          )}
        </div>
      </div>

      {/* ─── SECTION 2: Navigation ─── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 sc-custom-scrollbar">
        {config.nav.map((section, sIdx) => (
          <div key={sIdx} className="flex flex-col gap-2">
            {section.links.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={(e) => {
                    handleRipple(e);
                    if (isMobile) setMobileOpen(false);
                  }}
                  className={({ isActive }) =>
                    `flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`
                  }
                >
                  <Icon className="text-lg" />
                  <span className="text-[15px] font-medium whitespace-nowrap min-w-0 truncate">{link.label}</span>
                </NavLink>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <>
      {!hideMobileToggle && (
        <button
          className="fixed top-4 left-4 z-50 rounded-lg bg-[#0B1120]/90 backdrop-blur-md p-2.5 text-white shadow-xl lg:hidden border border-white/10 hover:bg-white/10 transition-all"
          onClick={() => setMobileOpen(true)}
          type="button"
        >
          <FaBars size={16} />
        </button>
      )}

      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[260px] h-[100vh] text-white transition-transform duration-300 ease-out lg:hidden shadow-2xl ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {navContent(true)}
      </aside>

      <aside
        className={`hidden lg:flex flex-col h-[100vh] w-[260px] shrink-0 text-white transition-all duration-300 ease-out z-40`}
      >
        {navContent(false)}
      </aside>
    </>
  );
}
