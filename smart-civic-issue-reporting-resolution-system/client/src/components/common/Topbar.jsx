import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaBell, FaSignOutAlt, FaUserCircle, FaChevronDown, FaKey } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { http } from '../../api/http';

const roleColors = {
  citizen: 'bg-emerald-500/20 text-emerald-300',
  admin: 'bg-rose-500/20 text-rose-300',
  officer: 'bg-amber-500/20 text-amber-300',
  worker: 'bg-sky-500/20 text-sky-300',
};

const rolePaths = {
  citizen: '/citizen',
  admin: '/admin',
  officer: '/officer',
  worker: '/worker',
};

export default function Topbar({ title }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  const role = user?.role?.toLowerCase() || 'guest';
  const basePath = rolePaths[role] || '';

  useEffect(() => {
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
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function onLogout() {
    logout();
    navigate('/login');
  }

  return (
    <header className="flex items-center justify-between border-b border-white/10 bg-[#0F172A] px-6 py-4 text-white">
      <div className="pl-10 lg:pl-0 flex items-center gap-3">
        <img src="/assets/logo.png" alt="Smart Civic Logo" className="w-10 h-10 object-contain" />
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/50">SmartCivic</p>
          <h1 className="text-lg font-display font-semibold">{title}</h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Role badge */}
        <span
          className={`hidden rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide sm:inline ${
            roleColors[role] || 'bg-white/10 text-white/80'
          }`}
        >
          {role}
        </span>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="rounded-full bg-white/10 p-2 text-white/70 hover:text-white transition-colors"
          title="Toggle Light/Dark Mode"
        >
          {theme === 'light' ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
          )}
        </button>

        {/* Notification bell */}
        <Link
          to={`${basePath}/notifications`}
          className="relative rounded-full bg-white/10 p-2 text-white/70 hover:text-white"
        >
          <FaBell />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        {/* Avatar dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen((v) => !v)}
            className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-sm font-semibold text-white/80 hover:text-white"
          >
            <FaUserCircle className="text-lg" />
            <span className="hidden sm:inline">{user?.name?.split(' ')[0] || 'User'}</span>
            <FaChevronDown className="text-xs" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-xl border border-white/10 bg-slateink-800 py-1 shadow-lg z-50">
              <Link
                to={`${basePath}/profile`}
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white"
              >
                <FaUserCircle />
                Profile
              </Link>
              <Link
                to={`${basePath}/change-password`}
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white"
              >
                <FaKey />
                Change Password
              </Link>
              <hr className="my-1 border-white/10" />
              <button
                type="button"
                onClick={onLogout}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-rose-400 hover:bg-white/10"
              >
                <FaSignOutAlt />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
