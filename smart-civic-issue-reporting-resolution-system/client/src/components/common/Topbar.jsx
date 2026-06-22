import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  FaBell,
  FaSignOutAlt,
  FaUserCircle,
  FaChevronDown,
  FaKey,
  FaSearch,
  FaQuestionCircle,
  FaCog,
  FaMoon,
  FaSun
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { http } from '../../api/http';

const roleColors = {
  citizen: { bg: 'rgba(34, 197, 94, 0.15)', text: '#4ade80', label: 'Citizen' },
  admin: { bg: 'rgba(239, 68, 68, 0.15)', text: '#f87171', label: 'Admin' },
  officer: { bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24', label: 'Officer' },
  worker: { bg: 'rgba(56, 189, 248, 0.15)', text: '#38bdf8', label: 'Worker' },
};

const rolePaths = {
  citizen: '/citizen',
  admin: '/admin',
  officer: '/officer',
  worker: '/worker',
};

const customTitles = {
  admin: 'Admin Command',
  citizen: 'Citizen Portal',
  officer: 'Officer Console',
  worker: 'Field Worker'
};

export default function Topbar({ title }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  const role = user?.role?.toLowerCase() || 'guest';
  const basePath = rolePaths[role] || '';
  const roleStyle = roleColors[role] || { bg: 'rgba(255,255,255,0.1)', text: '#94a3b8', label: role };

  const topbarTitle = customTitles[role] || title || 'Portal';

  useEffect(() => {
    // Notifications count
    http
      .get('/notifications/unread-count')
      .then(({ data }) => {
        const count = data?.count ?? data?.data?.count ?? 0;
        setUnreadCount(count);
      })
      .catch(() => setUnreadCount(0));
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  function onLogout() {
    logout();
    navigate('/login');
  }

  const firstName = user?.name?.split(' ')[0] || 'User';

  return (
    <header className="flex items-center justify-between px-6 h-[72px] bg-[#0B1120] text-white border-b border-white/5 relative z-30">
      {/* ─── Left: Logo + Title ────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <img src="/assets/logo.png" alt="Logo" className="w-10 h-10 object-contain" />
        <div className="flex flex-col justify-center">
          <span className="text-[10px] font-bold text-white/50 tracking-[0.2em] uppercase leading-tight mb-0.5">SMARTCIVIC</span>
          <h1 className="text-lg font-bold text-white truncate leading-tight">
            {topbarTitle}
          </h1>
        </div>
      </div>

      {/* ─── Right: Actions ────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        {/* Role Badge */}
        <div className="hidden sm:flex items-center">
          <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider" style={{ backgroundColor: roleStyle.bg, color: roleStyle.text }}>
            {roleStyle.label}
          </span>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="w-9 h-9 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all"
          aria-label="Toggle theme"
          type="button"
        >
          {theme === 'dark' ? <FaSun size={14} /> : <FaMoon size={14} />}
        </button>

        {/* Notification Bell */}
        <Link
          to={`${basePath}/notifications`}
          className="w-9 h-9 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all relative"
          aria-label="Notifications"
        >
          <FaBell size={14} />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white px-1">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        {/* User Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button 
            type="button" 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 transition-all border border-white/5"
          >
            <div className="w-6 h-6 rounded-full flex items-center justify-center bg-white/10 overflow-hidden">
               <FaUserCircle className="w-full h-full text-white/70" />
            </div>
            <span className="text-[13px] font-medium text-white max-w-[100px] truncate hidden sm:block">{firstName}</span>
            <FaChevronDown className={`text-[10px] text-white/50 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {dropdownOpen && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-[#1E293B] border border-white/10 rounded-xl shadow-xl overflow-hidden py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <Link to={`${basePath}/profile`} className="block px-4 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white transition-colors" onClick={() => setDropdownOpen(false)}>Profile</Link>
              <Link to={`${basePath}/settings`} className="block px-4 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white transition-colors" onClick={() => setDropdownOpen(false)}>Settings</Link>
              <div className="h-px bg-white/10 my-1"></div>
              <button onClick={onLogout} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors">Logout</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

