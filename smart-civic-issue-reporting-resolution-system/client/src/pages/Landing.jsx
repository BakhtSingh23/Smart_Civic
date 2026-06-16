import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import Background3D from '../components/landing/Background3D';
import SplashScreen from '../components/landing/SplashScreen';
import '../styles/landing.css';

gsap.registerPlugin(ScrollTrigger);

// ==========================================
// HEADER COMPONENT
// ==========================================
const Header = ({ theme, toggleTheme }) => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 500);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const headerStyle = {
    position: 'fixed',
    top: 0,
    width: '100%',
    zIndex: 999,
    height: scrolled ? '64px' : '72px',
    background: 'var(--bg-nav)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid var(--border-color)',
    boxShadow: 'var(--shadow-color)',
    transition: 'all 0.3s ease',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: scrolled ? '0 20px' : '0 24px',
  };

  const createRipple = (event) => {
    const button = event.currentTarget;
    const circle = document.createElement('span');
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;
    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${event.clientX - button.offsetLeft - radius}px`;
    circle.style.top = `${event.clientY - button.offsetTop - radius}px`;
    circle.classList.add('ripple-element');
    const ripple = button.getElementsByClassName('ripple-element')[0];
    if (ripple) ripple.remove();
    button.appendChild(circle);
  };

  return (
    <header style={headerStyle}>
      <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', opacity: scrolled ? 0.8 : 1 }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '50%', display: 'flex',
          justifyContent: 'center', alignItems: 'center', transition: 'background 0.3s ease'
        }}>
          <img src="/assets/logo.png" alt="Smart Civic Logo" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
        </div>
        <span className="h5" style={{ marginLeft: '8px', display: window.innerWidth > 640 ? 'block' : 'none' }}>SmartCivic</span>
      </div>

      {window.innerWidth > 1024 && (
        <nav style={{ display: 'flex', gap: '40px' }}>
          {['Home', 'How It Works', 'Categories', 'Community', 'Features', 'Contact'].map(item => (
            <a key={item}
              href={item === 'Community' ? '/community' : `#${item.replace(/\s+/g, '-').toLowerCase()}`}
              style={{
                textDecoration: 'none', color: 'var(--text-secondary)', fontWeight: 500,
                fontSize: '0.95rem', position: 'relative', transition: 'all 0.2s ease', cursor: 'pointer'
              }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--primary-blue)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              {item}
            </a>
          ))}
        </nav>
      )}

      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <button onClick={toggleTheme} style={{
          width: '40px', height: '40px', borderRadius: '50%', background: 'transparent',
          border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center',
          transition: 'transform 0.3s ease, background 0.3s ease'
        }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--theme-toggle-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          title="Switch to Dark/Light Mode"
        >
          {theme === 'light' ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
          )}
        </button>

        <button style={{
          height: '40px', padding: '0 16px', background: 'transparent', border: '1.5px solid var(--primary-blue)',
          color: 'var(--primary-blue)', borderRadius: '8px', cursor: 'pointer', fontWeight: 600,
          transition: 'all 0.2s ease'
        }}
          onClick={() => navigate('/login')}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--theme-toggle-hover)'; e.currentTarget.style.boxShadow = '0 0 12px rgba(30,64,175,0.2)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.boxShadow = 'none'; }}
          onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
          onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          🔑 Login
        </button>

        <button style={{
          position: 'relative', overflow: 'hidden', height: '40px', padding: '0 16px', background: 'var(--primary-blue)',
          color: '#FFF', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600,
          transition: 'all 0.2s ease'
        }}
          onClick={(e) => { createRipple(e); setTimeout(() => navigate('/register'), 300); }}
          onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.1)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(30,64,175,0.3)'; }}
          onMouseLeave={e => { e.currentTarget.style.filter = 'none'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
          onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
          onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          ✓ Register
        </button>
      </div>
    </header>
  );
};

// ==========================================
// NEW: HERO ILLUSTRATION (animated SVG cycle)
// ==========================================
const HeroIllustration = () => (
  <div className="hero-illustration-wrap">
    <div style={{
      width: '380px', height: '380px', position: 'relative',
      background: 'var(--bg-nav)', borderRadius: '24px',
      border: '1px solid var(--border-color)',
      boxShadow: '0 24px 64px rgba(30,64,175,0.12)',
      overflow: 'hidden',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      {/* Background grid lines */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.06 }} viewBox="0 0 380 380">
        {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
          <line key={`h${i}`} x1="0" y1={i * 54} x2="380" y2={i * 54} stroke="var(--primary-blue)" strokeWidth="1" />
        ))}
        {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
          <line key={`v${i}`} x1={i * 54} y1="0" x2={i * 54} y2="380" stroke="var(--primary-blue)" strokeWidth="1" />
        ))}
      </svg>

      {/* Step 1: Citizen reports */}
      <div className="hero-step-card step-1">
        <div style={{ fontSize: '56px' }}>📱</div>
        <div style={{
          background: 'var(--bg-hover)', border: '1px solid var(--border-color)',
          borderRadius: '12px', padding: '12px 20px', textAlign: 'center'
        }}>
          <div className="h6" style={{ color: 'var(--primary-blue)', marginBottom: '4px' }}>Citizen Reports</div>
          <div className="caption" style={{ opacity: 0.8 }}>Photo + GPS location attached</div>
        </div>
        <div style={{
          display: 'flex', gap: '8px', alignItems: 'center',
          background: 'rgba(5,150,105,0.1)', border: '1px solid rgba(5,150,105,0.3)',
          borderRadius: '999px', padding: '6px 14px'
        }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary-green)', animation: 'glowPulse 2s infinite' }}></div>
          <span className="caption" style={{ color: 'var(--primary-green)', fontWeight: 600 }}>Submitting complaint...</span>
        </div>
      </div>

      {/* Step 2: Municipality receives */}
      <div className="hero-step-card step-2">
        <div style={{ fontSize: '56px' }}>🏛️</div>
        <div style={{
          background: 'var(--bg-hover)', border: '1px solid var(--border-color)',
          borderRadius: '12px', padding: '12px 20px', textAlign: 'center'
        }}>
          <div className="h6" style={{ color: 'var(--primary-blue)', marginBottom: '4px' }}>Municipality Notified</div>
          <div className="caption" style={{ opacity: 0.8 }}>Assigned to Roads Dept.</div>
        </div>
        <div style={{
          display: 'flex', gap: '8px', alignItems: 'center',
          background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)',
          borderRadius: '999px', padding: '6px 14px'
        }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary-blue)', animation: 'glowPulse 2s infinite' }}></div>
          <span className="caption" style={{ color: 'var(--primary-blue)', fontWeight: 600 }}>Verified & assigned ✓</span>
        </div>
      </div>

      {/* Step 3: Issue resolved */}
      <div className="hero-step-card step-3">
        <div style={{ fontSize: '56px' }}>✅</div>
        <div style={{
          background: 'rgba(5,150,105,0.08)', border: '1px solid rgba(5,150,105,0.3)',
          borderRadius: '12px', padding: '12px 20px', textAlign: 'center'
        }}>
          <div className="h6" style={{ color: 'var(--primary-green)', marginBottom: '4px' }}>Issue Resolved!</div>
          <div className="caption" style={{ opacity: 0.8 }}>Completed in 48 hours</div>
        </div>
        <div style={{
          display: 'flex', gap: '8px', alignItems: 'center',
          background: 'rgba(5,150,105,0.1)', border: '1px solid rgba(5,150,105,0.3)',
          borderRadius: '999px', padding: '6px 14px'
        }}>
          <span style={{ fontSize: '14px' }}>⭐⭐⭐⭐⭐</span>
          <span className="caption" style={{ color: 'var(--primary-green)', fontWeight: 600 }}>Citizen rated 5 stars</span>
        </div>
      </div>

      {/* Corner label */}
      <div style={{
        position: 'absolute', bottom: '16px', right: '16px',
        background: 'var(--bg-hover)', borderRadius: '8px', padding: '4px 10px'
      }}>
        <span className="caption" style={{ color: 'var(--primary-blue)', fontWeight: 600 }}>Live Demo</span>
      </div>
    </div>
  </div>
);

// ==========================================
// NEW: RECENT RESOLUTION FEED
// ==========================================
const RecentResolutionFeed = () => {
  const feedItems = [
    { issue: 'Pothole fixed', location: 'Jagannaickpur', time: '2h ago', color: 'var(--primary-green)' },
    { issue: 'Streetlight repaired', location: 'Suryaraopeta', time: 'yesterday', color: 'var(--primary-blue)' },
    { issue: 'Drainage cleaned', location: 'Beach Road', time: '5h ago', color: 'var(--secondary-purple)' },
  ];
  return (
    <div style={{
      marginTop: '40px', padding: '24px',
      background: 'var(--bg-nav)', border: '1px solid var(--border-color)',
      borderRadius: '16px', boxShadow: '0 8px 24px rgba(30,64,175,0.06)',
      maxWidth: '800px', margin: '40px auto 0'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary-green)', animation: 'glowPulse 2s infinite' }}></div>
        <span className="label" style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Recent Resolutions</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {feedItems.map((item, i) => (
          <div key={i} className="feed-item">
            {/* Checkmark icon */}
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
              background: `${item.color}18`, border: `1.5px solid ${item.color}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '14px'
            }}>✓</div>
            <div style={{ flex: 1 }}>
              <span className="label" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{item.issue}</span>
              <span className="body-sm" style={{ color: 'var(--text-secondary)', marginLeft: '6px' }}>– {item.location}</span>
            </div>
            <span className="caption" style={{ color: 'var(--text-tertiary)', flexShrink: 0 }}>{item.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ==========================================
// NEW: MAP PREVIEW
// ==========================================
const MapPreview = () => {
  const hotspots = [
    { x: 120, y: 90, color: '#EF4444', label: 'Road damage', reports: 7 },
    { x: 240, y: 140, color: '#F59E0B', label: 'Drainage clog', reports: 4 },
    { x: 180, y: 200, color: '#3B82F6', label: 'Broken light', reports: 2 },
    { x: 320, y: 100, color: '#EF4444', label: 'Water leak', reports: 9 },
  ];
  return (
    <div className="map-card" style={{
      marginTop: '32px', maxWidth: '800px', margin: '32px auto 0',
      background: 'var(--bg-nav)', border: '1px solid var(--border-color)',
      borderRadius: '16px', overflow: 'hidden', boxShadow: '0 8px 24px rgba(30,64,175,0.06)'
    }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>📍</span>
          <span className="label" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Recent activity near you</span>
        </div>
        <span className="caption" style={{ color: 'var(--primary-blue)', fontWeight: 500 }}>Kakinada, Andhra Pradesh</span>
      </div>
      {/* SVG Map */}
      <div style={{ position: 'relative', height: '260px', background: 'var(--bg-secondary)', overflow: 'hidden' }}>
        <svg width="100%" height="100%" viewBox="0 0 440 260" preserveAspectRatio="xMidYMid slice">
          {/* Map grid */}
          {[0, 1, 2, 3, 4, 5].map(i => (
            <line key={`mh${i}`} x1="0" y1={i * 52} x2="440" y2={i * 52} stroke="var(--border-color)" strokeWidth="1" />
          ))}
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <line key={`mv${i}`} x1={i * 56} y1="0" x2={i * 56} y2="260" stroke="var(--border-color)" strokeWidth="1" />
          ))}
          {/* Roads */}
          <line x1="0" y1="130" x2="440" y2="130" stroke="var(--text-tertiary)" strokeWidth="3" opacity="0.3" />
          <line x1="220" y1="0" x2="220" y2="260" stroke="var(--text-tertiary)" strokeWidth="3" opacity="0.3" />
          <line x1="0" y1="65" x2="440" y2="195" stroke="var(--text-tertiary)" strokeWidth="2" opacity="0.15" />
          <line x1="0" y1="195" x2="440" y2="65" stroke="var(--text-tertiary)" strokeWidth="2" opacity="0.15" />
          {/* Area fills */}
          <rect x="40" y="40" width="80" height="60" rx="4" fill="var(--bg-hover)" stroke="var(--border-color)" strokeWidth="1" />
          <rect x="280" y="150" width="100" height="70" rx="4" fill="var(--bg-hover)" stroke="var(--border-color)" strokeWidth="1" />
          <rect x="150" y="30" width="60" height="50" rx="4" fill="var(--bg-hover)" stroke="var(--border-color)" strokeWidth="1" />
          {/* Hotspot pins */}
          {hotspots.map((h, i) => (
            <g key={i}>
              <circle cx={h.x} cy={h.y} r="18" fill={h.color} opacity="0.12" />
              <circle cx={h.x} cy={h.y} r="10" fill={h.color} opacity="0.25" />
              <circle cx={h.x} cy={h.y} r="6" fill={h.color} />
              {/* Report count badge */}
              <circle cx={h.x + 10} cy={h.y - 10} r="9" fill={h.color} />
              <text x={h.x + 10} y={h.y - 6} textAnchor="middle" fontSize="8" fill="white" fontWeight="bold">{h.reports}</text>
            </g>
          ))}
          {/* "You are here" marker */}
          <circle cx="220" cy="130" r="10" fill="var(--primary-blue)" opacity="0.2" />
          <circle cx="220" cy="130" r="5" fill="var(--primary-blue)" />
          <circle cx="220" cy="130" r="3" fill="white" />
        </svg>
        {/* Legend */}
        <div style={{
          position: 'absolute', bottom: '12px', right: '12px',
          background: 'var(--bg-nav)', border: '1px solid var(--border-color)',
          borderRadius: '8px', padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '4px'
        }}>
          {[{ color: '#EF4444', label: 'High priority' }, { color: '#F59E0B', label: 'Medium' }, { color: '#3B82F6', label: 'In progress' }].map((l, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: l.color, flexShrink: 0 }}></div>
              <span className="caption">{l.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// HERO SECTION
// ==========================================
const HeroSection = () => {
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const badgeRef = useRef(null);
  const line1Ref = useRef(null);
  const line2Ref = useRef(null);
  const line3Ref = useRef(null);
  const subRef = useRef(null);
  const btn1Ref = useRef(null);
  const btn2Ref = useRef(null);
  const statsRef = useRef(null);

  useEffect(() => {
    const tl = gsap.timeline();
    tl.fromTo(badgeRef.current, { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: 0.2 })
      .fromTo([line1Ref.current, line2Ref.current, line3Ref.current], { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.3, ease: 'power3.out' }, '-=0.4')
      .fromTo(subRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, '-=0.4')
      .fromTo([btn1Ref.current, btn2Ref.current], { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.6, ease: 'back.out', stagger: 0.1 }, '-=0.4')
      .fromTo(statsRef.current.children, { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.6, stagger: 0.1, ease: 'power3.out' }, '-=0.2');

    gsap.to(badgeRef.current, { scale: 1.02, duration: 2, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 1 });
  }, []);

  const stats = [
    { num: '2,450+', label: 'Issues Resolved', icon: '✅', color: 'var(--success)' },
    { num: '12', label: 'Departments', icon: '🏢', color: 'var(--primary-blue)' },
    { num: '98%', label: 'Satisfaction', icon: '⭐', color: 'var(--accent-amber)' }
  ];

  return (
    <section id="home" ref={heroRef} style={{
      minHeight: 'calc(100vh - 72px)', display: 'flex', flexDirection: 'column',
      justifyContent: 'center', alignItems: 'center', padding: '100px 24px 60px',
      position: 'relative', overflow: 'hidden'
    }}>
      {/* Two-column layout: text left, illustration right */}
      <div className="hero-two-col" style={{
        maxWidth: '1200px', width: '100%', display: 'flex',
        alignItems: 'center', justifyContent: 'center', gap: '60px', zIndex: 1
      }}>
        {/* LEFT: Text content */}
        <div style={{ flex: 1, textAlign: 'left', maxWidth: '600px' }}>
          <div ref={badgeRef} style={{
            display: 'inline-block', padding: '8px 16px', borderRadius: '999px',
            background: 'var(--theme-toggle-hover)', border: '1px solid rgba(30,64,175,0.3)',
            color: 'var(--primary-blue)', fontSize: '0.85rem', fontWeight: 500, marginBottom: '24px'
          }}>
            🌟 Smart Municipal Governance
          </div>

          <h1 style={{ marginBottom: '24px' }} className="h1">
            <div ref={line1Ref} style={{ color: 'var(--text-primary)' }}>Report.</div>
            <div ref={line2Ref} style={{ color: 'var(--text-primary)' }}>Track.</div>
            <div ref={line3Ref} className="text-gradient gradient-civic">Resolve.</div>
          </h1>

          <p ref={subRef} className="body-lg" style={{
            color: 'var(--text-secondary)', maxWidth: '520px', marginBottom: '32px'
          }}>
            SmartCivic connects citizens with their municipality for faster, transparent,
            and effective civic issue resolution. Report problems, track progress, and help
            shape better cities.
          </p>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '48px' }}>
            <button ref={btn1Ref} style={{
              height: '48px', padding: '0 32px', background: 'var(--button-primary-bg)', color: '#FFF',
              border: 'none', borderRadius: '12px', fontWeight: 600, fontSize: '1rem', cursor: 'pointer',
              boxShadow: '0 12px 40px rgba(30,64,175,0.25)', transition: 'all 0.3s ease'
            }}
              onClick={() => navigate('/login')}
              onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.08)'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 16px 48px rgba(30,64,175,0.35)'; }}
              onMouseLeave={e => { e.currentTarget.style.filter = 'none'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(30,64,175,0.25)'; }}
            >
              🚀 Report an Issue Now
            </button>

            <button ref={btn2Ref} style={{
              height: '48px', padding: '0 32px', background: 'transparent', color: 'var(--primary-blue)',
              border: '2px solid var(--primary-blue)', borderRadius: '12px', fontWeight: 600, fontSize: '1rem', cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--theme-toggle-hover)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(30,64,175,0.15)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              📖 See How It Works
            </button>
          </div>

          {/* Stats row */}
          <div ref={statsRef} style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {stats.map((s, i) => (
              <div key={i} style={{
                background: 'var(--bg-nav)', border: '1px solid var(--border-color)', borderRadius: '12px',
                padding: '20px 24px', textAlign: 'center', transition: 'all 0.3s ease', minWidth: '130px'
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.borderColor = 'var(--primary-blue)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(30,64,175,0.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ fontSize: '24px', marginBottom: '6px' }}>{s.icon}</div>
                <div className="h4" style={{ color: 'var(--primary-blue)' }}>{s.num}</div>
                <div className="caption" style={{ color: 'var(--text-secondary)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Animated SVG illustration */}
        <HeroIllustration />
      </div>

      {/* NEW: Recent resolution feed – below stats */}
      <div style={{ maxWidth: '1200px', width: '100%', zIndex: 1 }}>
        <RecentResolutionFeed />
        <MapPreview />
      </div>

      <div style={{ position: 'absolute', bottom: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: 0.6 }}>
        <span className="caption">↓ Scroll to explore</span>
      </div>
    </section>
  );
};

// ==========================================
// NEW: REAL COMPLAINT EXAMPLE CARD
// ==========================================
const RealComplaintExample = () => {
  const timelineSteps = [
    { label: 'Reported', time: 'Mon 9:00 AM', icon: '📍', color: 'var(--primary-blue)', done: true },
    { label: 'Verified', time: 'Mon 10:00 AM', icon: '✅', color: 'var(--primary-green)', done: true },
    { label: 'Assigned', time: 'Mon 11:30 AM', icon: '👷', color: 'var(--accent-amber)', done: true },
    { label: 'Resolved', time: 'Wed 2:00 PM', icon: '🎉', color: 'var(--primary-green)', done: true },
  ];
  return (
    <div style={{
      marginTop: '40px', padding: '28px 32px',
      background: 'var(--bg-primary)', border: '1px solid var(--border-color)',
      borderRadius: '16px', boxShadow: '0 8px 32px rgba(30,64,175,0.06)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div className="label" style={{ color: 'var(--primary-blue)', marginBottom: '6px', fontWeight: 600 }}>📋 Real complaint example</div>
          <div className="h5" style={{ color: 'var(--text-primary)' }}>Pothole near Main Road</div>
          <div className="body-sm" style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Category: Roads · Jagannaickpur, Ward 12 · Reported by citizen_ravi</div>
        </div>
        <a href="#" style={{
          color: 'var(--primary-blue)', fontSize: '0.875rem', fontWeight: 500, textDecoration: 'none',
          borderBottom: '1px solid var(--primary-blue)', paddingBottom: '1px', transition: 'opacity 0.2s'
        }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >View details →</a>
      </div>
      {/* Timeline */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0', overflowX: 'auto', paddingBottom: '4px' }}>
        {timelineSteps.map((step, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', flex: 1, minWidth: '120px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
              {/* Circle */}
              <div style={{
                width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0,
                background: `${step.color}18`, border: `2px solid ${step.color}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
                boxShadow: `0 4px 12px ${step.color}30`
              }}>{step.icon}</div>
              <div className="label" style={{ color: step.color, marginTop: '8px', fontWeight: 600, textAlign: 'center', fontSize: '0.8rem' }}>{step.label}</div>
              <div className="caption" style={{ color: 'var(--text-tertiary)', textAlign: 'center', marginTop: '2px' }}>{step.time}</div>
            </div>
            {/* Connector line */}
            {i < timelineSteps.length - 1 && (
              <div style={{ flex: 1, height: '2px', background: 'var(--border-color)', marginTop: '22px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: 'var(--primary-green)', width: '100%' }}></div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ==========================================
// NEW: REPORTING DEMO CARD
// ==========================================
const ReportingDemo = () => (
  <div style={{
    marginTop: '24px', padding: '28px 32px',
    background: 'var(--bg-primary)', border: '1px solid var(--border-color)',
    borderRadius: '16px', display: 'flex', gap: '28px', alignItems: 'center',
    flexWrap: 'wrap', boxShadow: '0 8px 32px rgba(30,64,175,0.06)'
  }}>
    {/* Phone mockup SVG */}
    <div style={{ flexShrink: 0 }}>
      <svg width="100" height="160" viewBox="0 0 100 160">
        <rect x="10" y="4" width="80" height="152" rx="12" fill="var(--bg-secondary)" stroke="var(--border-color)" strokeWidth="2" />
        <rect x="18" y="18" width="64" height="110" rx="4" fill="var(--bg-hover)" />
        {/* Screen content */}
        <rect x="22" y="22" width="56" height="8" rx="3" fill="var(--primary-blue)" opacity="0.7" />
        <rect x="22" y="34" width="36" height="5" rx="2" fill="var(--text-tertiary)" opacity="0.5" />
        <rect x="22" y="45" width="56" height="40" rx="4" fill="var(--border-color)" />
        <text x="50" y="69" textAnchor="middle" fontSize="16" fill="var(--text-tertiary)">📷</text>
        <rect x="22" y="90" width="56" height="7" rx="3" fill="var(--border-color)" />
        <rect x="22" y="102" width="40" height="7" rx="3" fill="var(--border-color)" />
        <rect x="22" y="116" width="56" height="10" rx="5" fill="var(--primary-blue)" opacity="0.8" />
        <text x="50" y="124" textAnchor="middle" fontSize="6" fill="white">Submit Report</text>
        {/* Home button */}
        <circle cx="50" cy="148" r="6" fill="var(--border-color)" />
      </svg>
    </div>
    <div style={{ flex: 1, minWidth: '200px' }}>
      <div className="h5" style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>⏱️ Reporting takes 30 seconds</div>
      <div className="body-sm" style={{ color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.7' }}>
        Open the app, snap a photo, confirm your location, and hit submit. Our AI auto-detects the issue category so you don't have to guess.
      </div>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        {[{ icon: '📸', text: 'Photo capture' }, { icon: '📍', text: 'Auto GPS' }, { icon: '🤖', text: 'AI category detect' }].map((step, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px',
            background: 'var(--bg-hover)', borderRadius: '999px', fontSize: '0.8rem',
            color: 'var(--text-secondary)', fontWeight: 500
          }}>
            <span>{step.icon}</span><span>{step.text}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ==========================================
// HOW IT WORKS SECTION
// ==========================================
const HowItWorks = () => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.2 });
  const containerRef = useRef(null);

  useEffect(() => {
    if (inView && containerRef.current) {
      gsap.fromTo(containerRef.current.children,
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.15, ease: 'power3.out' }
      );
    }
  }, [inView]);

  const steps = [
    { num: '01', icon: '📍', title: 'Report', desc: 'Submit your complaint with photo & GPS' },
    { num: '02', icon: '✅', title: 'Verify', desc: 'Admin verifies & assigns to department' },
    { num: '03', icon: '⚙️', title: 'Resolve', desc: 'Field worker goes out & fixes the issue' },
    { num: '04', icon: '📊', title: 'Track', desc: 'Get notifications & rate the resolution' },
  ];

  return (
    <section id="how-it-works" style={{ padding: '120px 24px', background: 'var(--bg-secondary)', position: 'relative' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h2 className="h2">How SmartCivic Works</h2>
          <p className="body" style={{ color: 'var(--text-secondary)', marginTop: '12px' }}>4 simple steps from complaint to resolution</p>
        </div>

        {/* Steps + animated connectors */}
        <div style={{ display: 'flex', alignItems: 'stretch', gap: '0', overflowX: 'auto' }}>
          {steps.map((s, i) => (
            <React.Fragment key={i}>
              {/* Step card */}
              <div ref={i === 0 ? (el) => { ref(el); containerRef.current = el?.parentElement; } : null}
                style={{
                  flex: '1', minWidth: '200px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)',
                  borderRadius: '16px', padding: '40px 28px', textAlign: 'center', position: 'relative',
                  transition: 'all 0.3s ease', cursor: 'default'
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-12px)'; e.currentTarget.style.borderColor = 'var(--primary-blue)'; e.currentTarget.style.boxShadow = '0 24px 48px rgba(30,64,175,0.15)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{
                  position: 'absolute', top: '-10px', right: '20px', fontSize: '2.5rem', fontWeight: 800,
                  color: 'var(--bg-hover)', zIndex: 0
                }}>{s.num}</div>

                <div style={{
                  width: '64px', height: '64px', margin: '0 auto 24px', background: 'var(--bg-hover)',
                  borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '32px', position: 'relative', zIndex: 1
                }}>
                  {s.icon}
                </div>

                <h5 className="h5" style={{ marginBottom: '12px', position: 'relative', zIndex: 1 }}>{s.title}</h5>
                <p className="body-sm" style={{ color: 'var(--text-secondary)', position: 'relative', zIndex: 1 }}>{s.desc}</p>
              </div>

              {/* Animated dotted arrow connector (desktop only) */}
              {i < steps.length - 1 && (
                <div className="step-connector" style={{ width: '40px', flexShrink: 0, paddingTop: '60px' }}>
                  <svg width="40" height="24" viewBox="0 0 40 24">
                    <line x1="0" y1="12" x2="32" y2="12" className="dash-line" stroke="var(--primary-blue)" strokeWidth="2.5" strokeDasharray="6 4" />
                    <polygon points="30,6 40,12 30,18" fill="var(--primary-blue)" opacity="0.8" />
                  </svg>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* NEW: Real complaint example + reporting demo */}
        <RealComplaintExample />
        <ReportingDemo />
      </div>
    </section>
  );
};



// ==========================================
// KAKINADA WORD CLOUD – PREMIUM VERSION
// ==========================================
const KakinadaWordCloud = ({ onToast }) => {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [typed, setTyped] = useState('');
  const fullTitle = 'If your street in Kakinada could talk…';

  // Typewriter effect on mount
  useEffect(() => {
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setTyped(fullTitle.slice(0, i));
      if (i >= fullTitle.length) clearInterval(iv);
    }, 52);
    return () => clearInterval(iv);
  }, []);

  const words = [
    // HIGH frequency – largest, bold, pulse
    { text: 'Jagannathapuram pothole', tier: 'high', reports: 18, floatDur: 3.1, floatDelay: 0, angle: -6, color: '#1E40AF', size: 2.0, top: '14%', left: '8%' },
    { text: 'Suryaraopet drain', tier: 'high', reports: 14, floatDur: 3.7, floatDelay: 0.4, angle: 4, color: '#0369A1', size: 1.75, top: '8%', left: '48%' },
    // MEDIUM frequency
    { text: 'Beach Road garbage', tier: 'med', reports: 9, floatDur: 4.2, floatDelay: 0.8, angle: -4, color: '#0891B2', size: 1.4, top: '36%', left: '68%' },
    { text: 'Ramanayyapeta water logging', tier: 'med', reports: 16, floatDur: 3.5, floatDelay: 0.3, angle: 5, color: '#059669', size: 1.5, top: '52%', left: '4%' },
    { text: 'Bus Stand flooding', tier: 'med', reports: 15, floatDur: 4.0, floatDelay: 1.1, angle: -3, color: '#0E7490', size: 1.45, top: '60%', left: '48%' },
    // LOW frequency – smaller, lighter
    { text: 'Collector office junction light out', tier: 'low', reports: 7, floatDur: 5.0, floatDelay: 0.6, angle: 3, color: '#1D4ED8', size: 1.0, top: '28%', left: '28%' },
    { text: 'Kakinada Port road crack', tier: 'low', reports: 11, floatDur: 4.5, floatDelay: 0.9, angle: -5, color: '#047857', size: 1.1, top: '44%', left: '60%' },
    { text: 'KMC road dust', tier: 'low', reports: 8, floatDur: 4.8, floatDelay: 1.5, angle: 4, color: '#1E40AF', size: 0.95, top: '70%', left: '76%' },
    { text: 'Pedda Cheruvu overflow', tier: 'low', reports: 13, floatDur: 3.9, floatDelay: 0.5, angle: -6, color: '#0369A1', size: 1.2, top: '76%', left: '28%' },
    { text: 'Bhanugudi junction', tier: 'low', reports: 6, floatDur: 5.2, floatDelay: 1.8, angle: 5, color: '#065F46', size: 0.85, top: '80%', left: '64%' },
  ];

  const fontWeight = (tier) => tier === 'high' ? 800 : tier === 'med' ? 600 : 400;

  return (
    <div style={{
      background: 'var(--bg-nav)', border: '1px solid var(--border-color)',
      borderRadius: '20px', padding: '28px 28px 24px',
      boxShadow: '0 12px 40px rgba(30,64,175,0.10)',
      position: 'relative', overflow: 'hidden',
      minHeight: '340px', width: '100%'
    }}>

      {/* Kakinada city SVG map watermark */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.035, pointerEvents: 'none', zIndex: 0 }}
        viewBox="0 0 400 340" preserveAspectRatio="xMidYMid meet">
        {/* Stylised abstract Kakinada coastline + road grid watermark */}
        <path d="M30,280 Q80,260 120,240 Q160,220 180,190 Q200,160 220,150 Q250,140 270,120 Q300,95 330,80 Q360,65 380,50" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M10,200 Q60,185 110,170 Q160,155 200,140 Q240,125 290,115 Q340,105 390,100" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.6" />
        <path d="M200,10 Q210,60 215,110 Q218,160 220,200 Q222,240 220,300" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.5" />
        <path d="M100,10 Q105,70 110,130 Q112,180 115,240 Q117,270 120,320" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.4" />
        <path d="M310,10 Q305,80 300,140 Q295,200 290,260 Q288,290 285,330" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.4" />
        <circle cx="220" cy="170" r="18" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.5" />
        <circle cx="220" cy="170" r="5" fill="currentColor" opacity="0.6" />
        <text x="228" y="162" fontSize="9" fill="currentColor" fontWeight="600" opacity="0.8">Kakinada</text>
        {/* Coastline fill hint */}
        <path d="M330,80 Q350,130 360,180 Q370,220 365,280 Q360,320 340,340 L400,340 L400,0 Z" fill="currentColor" opacity="0.4" />
      </svg>

      {/* Header row: typewriter title + live counter */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px', position: 'relative', zIndex: 1, flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>💬</span>
            <h3 style={{
              fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)',
              margin: 0, fontFamily: 'var(--font-body)', minHeight: '1.4em'
            }}>
              {typed}<span style={{ animation: 'pinPulse 0.8s ease-in-out infinite', opacity: typed.length < fullTitle.length ? 1 : 0 }}>|</span>
            </h3>
          </div>
        </div>
        {/* Live counter badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          background: 'linear-gradient(135deg,#1E40AF,#0891B2)',
          borderRadius: '999px', padding: '6px 14px', flexShrink: 0
        }}>
          <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#fff', animation: 'glowPulse 2s infinite' }}></div>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap' }}>10 issues bubbling up right now</span>
        </div>
      </div>

      {/* Word cloud canvas */}
      <div style={{ position: 'relative', height: '260px', width: '100%', zIndex: 1 }}>
        {words.map((w, i) => {
          const isHov = hoveredIdx === i;
          const isHighest = w.tier === 'high';
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: w.top, left: w.left,
                fontSize: `${w.size}rem`,
                fontWeight: fontWeight(w.tier),
                color: isHov ? '#fff' : w.color,
                background: isHov ? w.color : 'transparent',
                borderRadius: isHov ? '8px' : '0',
                padding: isHov ? '4px 10px' : '0',
                cursor: 'pointer',
                transform: isHov ? 'rotate(0deg) scale(1.18) translateY(-4px)' : `rotate(${w.angle}deg) scale(1)`,
                transition: 'all 0.22s cubic-bezier(0.34,1.56,0.64,1)',
                whiteSpace: 'nowrap',
                userSelect: 'none',
                lineHeight: 1.3,
                zIndex: isHov ? 20 : 1,
                animation: isHighest && !isHov
                  ? `floatCloud ${w.floatDur}s ease-in-out ${w.floatDelay}s infinite, wcPulse 2.8s ease-in-out ${w.floatDelay}s infinite`
                  : `floatCloud ${w.floatDur}s ease-in-out ${w.floatDelay}s infinite`,
                textShadow: isHov ? 'none' : w.tier === 'high' ? `0 0 20px ${w.color}55` : 'none',
                boxShadow: isHov ? `0 8px 24px ${w.color}60` : 'none',
                letterSpacing: w.tier === 'high' ? '-0.02em' : 'normal',
              }}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              onClick={() => onToast && onToast(`Report a ${w.text.split(' ').slice(-1)[0]} in ${w.text.split(' ')[0]}?`)}
            >
              {w.text}
              {/* Tooltip on hover */}
              {isHov && (
                <div style={{
                  position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'var(--text-primary)', color: 'var(--bg-primary)',
                  borderRadius: '8px', padding: '7px 13px',
                  fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
                  animation: 'fadeSlideIn 0.15s ease', zIndex: 30,
                  pointerEvents: 'none'
                }}>
                  📍 {w.reports} reports this week · {w.text}
                  <div style={{
                    position: 'absolute', bottom: '-5px', left: '50%', transform: 'translateX(-50%)',
                    width: '10px', height: '10px', background: 'var(--text-primary)',
                    clipPath: 'polygon(50% 100%, 0 0, 100% 0)'
                  }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ==========================================
// KAKINADA CITIZEN BUZZ QUOTE
// ==========================================
const CitizenBuzzQuote = () => {
  const [active, setActive] = useState(0);
  const [animKey, setAnimKey] = useState(0);

  const quotes = [
    {
      text: 'The drain near Pedda Cheruvu has been blocked for 4 days. The smell is unbearable — especially at night.',
      time: '2h ago', area: 'Ramanayyapeta', category: 'Drainage',
      stat: '1 of 34 drainage complaints in Kakinada this week',
      sparkline: [4, 7, 5, 9, 12, 10, 34],
      color: 'var(--secondary-purple)'
    },
    {
      text: 'No drinking water in our entire street since yesterday morning. Children are suffering. KMC please act.',
      time: '45m ago', area: 'Suryaraopeta', category: 'Water',
      stat: '1 of 22 water complaints in Kakinada today',
      sparkline: [2, 3, 8, 5, 11, 9, 22],
      color: '#06B6D4'
    },
    {
      text: 'Streetlight near Kakinada railway station not working for a week. Very dangerous at night for women walking.',
      time: '3h ago', area: 'Station Road', category: 'Electricity',
      stat: '1 of 17 electricity complaints this week',
      sparkline: [3, 2, 4, 6, 8, 10, 17],
      color: 'var(--accent-amber)'
    },
    {
      text: 'Huge pothole on Beach Road near Lighthouse. Three two-wheelers fell already. Urgent attention needed!',
      time: '1h ago', area: 'Beach Road', category: 'Roads',
      stat: '1 of 28 road complaints near Kakinada coast',
      sparkline: [6, 8, 10, 12, 15, 20, 28],
      color: 'var(--primary-blue)'
    },
  ];

  useEffect(() => {
    const t = setInterval(() => {
      setActive(p => (p + 1) % quotes.length);
      setAnimKey(p => p + 1);
    }, 8000);
    return () => clearInterval(t);
  }, []);

  const q = quotes[active];

  // Tiny sparkline SVG
  const SparkLine = ({ data, color }) => {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const w = 80, h = 24;
    const pts = data.map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / (max - min || 1)) * h;
      return `${x},${y}`;
    }).join(' ');
    return (
      <svg width={w} height={h} style={{ display: 'block' }}>
        <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
        <circle cx={(data.length - 1) / (data.length - 1) * w} cy={h - ((data[data.length - 1] - min) / (max - min || 1)) * h} r="3" fill={color} />
      </svg>
    );
  };

  return (
    <div style={{
      background: 'var(--bg-nav)', border: '1px solid var(--border-color)',
      borderRadius: '16px', padding: '24px', boxShadow: '0 8px 28px rgba(30,64,175,0.07)',
      position: 'relative', overflow: 'hidden'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <span style={{ fontSize: '18px' }}>📣</span>
        <div className="label" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>What's buzzing in your neighbourhood?</div>
      </div>

      {/* Quote card */}
      <div key={animKey} style={{
        background: `${q.color}0d`, border: `1.5px solid ${q.color}40`,
        borderRadius: '12px', padding: '20px', marginBottom: '16px',
        animation: 'fadeSlideIn 0.5s ease',
        borderLeft: `4px solid ${q.color}`
      }}>
        <div style={{ fontSize: '28px', color: q.color, lineHeight: 1, marginBottom: '10px', fontFamily: 'Georgia, serif' }}>"</div>
        <p className="body" style={{ color: 'var(--text-primary)', fontStyle: 'italic', lineHeight: 1.7, marginBottom: '14px' }}>
          {q.text}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex', gap: '6px', alignItems: 'center',
            background: `${q.color}18`, borderRadius: '999px', padding: '4px 12px'
          }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: q.color }}></div>
            <span className="caption" style={{ color: q.color, fontWeight: 700 }}>Reported {q.time}</span>
          </div>
          <span className="caption" style={{ color: 'var(--text-secondary)' }}>📍 {q.area}, Kakinada</span>
          <span className="caption" style={{ color: 'var(--text-tertiary)' }}>#{q.category}</span>
        </div>
      </div>

      {/* Stat + sparkline */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', justifyContent: 'space-between' }}>
        <span className="caption" style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
          📊 This is <strong>{q.stat}</strong>
        </span>
        <SparkLine data={q.sparkline} color={q.color} />
      </div>

      {/* Dot nav */}
      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginTop: '16px' }}>
        {quotes.map((_, i) => (
          <button key={i} onClick={() => { setActive(i); setAnimKey(k => k + 1); }}
            style={{
              width: i === active ? '20px' : '7px', height: '7px', borderRadius: '999px',
              background: i === active ? q.color : 'var(--border-color)',
              border: 'none', cursor: 'pointer', padding: 0, transition: 'all 0.3s ease'
            }}
          />
        ))}
      </div>
    </div>
  );
};

// ==========================================
// COLONY CHALLENGE CARD
// ==========================================
const ColonyChallenge = () => {
  const [voted, setVoted] = useState(false);
  const colonies = [
    { name: 'Jagannathapuram', reports: 12, badge: '⚡ Civic Ninja', color: 'var(--primary-blue)', pct: 60 },
    { name: 'Suryaraopet', reports: 8, badge: '🌱 Rising', color: 'var(--primary-green)', pct: 40 },
  ];

  return (
    <div style={{
      background: 'var(--bg-nav)', border: '1px solid var(--border-color)',
      borderRadius: '16px', padding: '24px', boxShadow: '0 8px 28px rgba(30,64,175,0.07)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
        <span style={{ fontSize: '20px' }}>🏆</span>
        <div className="label" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Solve it together — Kakinada Colony Challenge</div>
      </div>
      <div className="caption" style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>Which colony reports issues fastest this week?</div>

      {/* VS layout */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'stretch', marginBottom: '20px' }}>
        {colonies.map((c, i) => (
          <React.Fragment key={i}>
            <div style={{
              flex: 1, padding: '16px', borderRadius: '12px',
              background: `${c.color}0d`, border: `1.5px solid ${c.color}30`,
              textAlign: 'center', transition: 'all 0.3s ease'
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = c.color; e.currentTarget.style.transform = 'translateY(-3px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = `${c.color}30`; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <div className="body-sm" style={{ color: c.color, fontWeight: 700, marginBottom: '4px' }}>{c.name}</div>
              <div className="h3" style={{ color: c.color, margin: '8px 0' }}>{c.reports}</div>
              <div className="caption" style={{ color: 'var(--text-secondary)' }}>reports this week</div>
              <div style={{
                marginTop: '10px', display: 'inline-block', padding: '4px 10px',
                background: c.color, borderRadius: '999px', color: '#fff',
                fontSize: '0.72rem', fontWeight: 700
              }}>{c.badge}</div>
            </div>
            {i === 0 && (
              <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: 'var(--bg-hover)', border: '1px solid var(--border-color)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '12px', fontWeight: 800, color: 'var(--text-secondary)'
                }}>VS</div>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Combined progress bar */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', borderRadius: '999px', overflow: 'hidden', height: '10px' }}>
          <div style={{ width: `${colonies[0].pct}%`, background: colonies[0].color, transition: 'width 1s ease' }}></div>
          <div style={{ width: `${colonies[1].pct}%`, background: colonies[1].color, transition: 'width 1s ease' }}></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
          <span className="caption" style={{ color: colonies[0].color }}>{colonies[0].pct}%</span>
          <span className="caption" style={{ color: colonies[1].color }}>{colonies[1].pct}%</span>
        </div>
      </div>

      <button
        onClick={() => setVoted(true)}
        style={{
          width: '100%', height: '40px', border: 'none', borderRadius: '10px', cursor: voted ? 'default' : 'pointer',
          background: voted ? 'var(--bg-hover)' : 'var(--gradient-civic)',
          color: voted ? 'var(--text-secondary)' : '#fff',
          fontWeight: 600, fontSize: '0.875rem', transition: 'all 0.3s ease',
          fontFamily: 'var(--font-body)'
        }}
        onMouseEnter={e => { if (!voted) { e.currentTarget.style.filter = 'brightness(1.1)'; e.currentTarget.style.transform = 'translateY(-2px)'; } }}
        onMouseLeave={e => { e.currentTarget.style.filter = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
      >
        {voted ? '✅ Thanks! Your report was counted.' : '🚀 Report now & beat your neighbouring colony'}
      </button>
    </div>
  );
};

// ==========================================
// AI PREDICTION PILL + MODAL
// ==========================================
const AIPredictionPill = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating pill */}
      <div
        onClick={() => setOpen(true)}
        style={{
          background: 'linear-gradient(135deg, #7C3AED, #3B82F6)',
          borderRadius: '16px', padding: '16px 20px',
          cursor: 'pointer', transition: 'all 0.3s ease',
          boxShadow: '0 8px 28px rgba(124,58,237,0.25)',
          display: 'flex', gap: '14px', alignItems: 'flex-start'
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(124,58,237,0.35)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(124,58,237,0.25)'; }}
      >
        <div style={{ fontSize: '28px', flexShrink: 0, animation: 'floatCard 3s ease-in-out infinite' }}>🔮</div>
        <div style={{ flex: 1 }}>
          <div className="label" style={{ color: '#fff', fontWeight: 700, marginBottom: '6px' }}>AI Prediction — Before you report</div>
          <div className="body-sm" style={{ color: 'rgba(255,255,255,0.88)', lineHeight: 1.6 }}>
            Based on <strong>142 reports</strong> near Kakinada Municipal Corporation, the drainage issue on Main Road may already be assigned.
          </div>
          <div style={{
            marginTop: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: 'rgba(255,255,255,0.2)', borderRadius: '8px', padding: '6px 14px'
          }}>
            <span style={{ fontSize: '12px', color: '#fff' }}>Tap to check status →</span>
          </div>
        </div>
      </div>

      {/* Modal overlay */}
      {open && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
          animation: 'fadeSlideIn 0.2s ease'
        }}
          onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div style={{
            background: 'var(--bg-primary)', borderRadius: '20px', padding: '32px',
            maxWidth: '480px', width: '100%', boxShadow: '0 32px 80px rgba(0,0,0,0.3)',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔮</div>
                <div className="h5" style={{ color: 'var(--text-primary)' }}>AI Match Found!</div>
                <div className="body-sm" style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Complaint already assigned — Suryaraopet zone</div>
              </div>
              <button onClick={() => setOpen(false)} style={{
                width: '32px', height: '32px', borderRadius: '8px', border: 'none',
                background: 'var(--bg-hover)', cursor: 'pointer', color: 'var(--text-secondary)',
                fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-body)'
              }}>×</button>
            </div>

            {/* Status timeline */}
            {[
              { icon: '📝', label: 'Report received', detail: '142 similar complaints grouped', color: 'var(--primary-blue)', done: true },
              { icon: '✅', label: 'Verified by KMC officer', detail: 'Ward 12 – Drainage Dept.', color: 'var(--primary-green)', done: true },
              { icon: '👷', label: 'Crew scheduled', detail: 'Tomorrow, Suryaraopet zone', color: 'var(--accent-amber)', done: false },
            ].map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: '14px', marginBottom: i < 2 ? '20px' : '0', position: 'relative' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '50%', fontSize: '18px',
                    background: step.done ? `${step.color}18` : 'var(--bg-hover)',
                    border: `2px solid ${step.done ? step.color : 'var(--border-color)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>{step.icon}</div>
                  {i < 2 && <div style={{ width: '2px', height: '20px', background: 'var(--border-color)', margin: '4px 0' }}></div>}
                </div>
                <div style={{ paddingTop: '8px' }}>
                  <div className="label" style={{ color: step.done ? step.color : 'var(--text-tertiary)', fontWeight: 600 }}>{step.label}</div>
                  <div className="caption" style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>{step.detail}</div>
                </div>
              </div>
            ))}

            <div style={{
              marginTop: '24px', padding: '16px', borderRadius: '12px',
              background: 'rgba(5,150,105,0.08)', border: '1px solid rgba(5,150,105,0.25)'
            }}>
              <div className="body-sm" style={{ color: 'var(--primary-green)', fontWeight: 600 }}>
                💡 No need to file a duplicate report! Track this complaint directly.
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{
              marginTop: '16px', width: '100%', height: '44px', borderRadius: '10px',
              background: 'var(--gradient-civic)', color: '#fff', border: 'none',
              fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '0.9rem',
              transition: 'all 0.2s ease'
            }}
              onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.08)'}
              onMouseLeave={e => e.currentTarget.style.filter = 'none'}
            >
              Track this complaint →
            </button>
          </div>
        </div>
      )}
    </>
  );
};

// ==========================================
// TIME MACHINE SLIDER
// ==========================================
const TimeMachineSlider = () => {
  const [val, setVal] = useState(100);

  const timeline = [
    { pct: 0, label: 'Last week', area: 'Kakinada Beach', issue: 'Garbage overflow', icon: '👻', color: '#94A3B8', desc: '47 garbage complaints near Kakinada Beach Road, peak after weekend crowd.' },
    { pct: 33, label: '5 days ago', area: 'Suryaraopet', issue: 'Water shortage', icon: '💧', color: '#06B6D4', desc: 'Water supply cut for 3 streets in Suryaraopet — 22 reports filed.' },
    { pct: 66, label: '2 days ago', area: 'Ramanayyapeta', issue: 'Drain blocked', icon: '🌊', color: 'var(--secondary-purple)', desc: 'Heavy rains caused drain to overflow near Pedda Cheruvu — 34 reports.' },
    { pct: 100, label: 'Today', area: 'Collectorate junction', issue: 'Potholes', icon: '☀️', color: 'var(--primary-blue)', desc: 'Top issue near Kakinada Collectorate: potholes on the main access road — 28 active reports.' },
  ];

  // Find which snapshot we're closest to
  const snap = timeline.reduce((prev, curr) => Math.abs(curr.pct - val) < Math.abs(prev.pct - val) ? curr : prev);

  return (
    <div style={{
      background: 'var(--bg-nav)', border: '1px solid var(--border-color)',
      borderRadius: '16px', padding: '24px', boxShadow: '0 8px 28px rgba(30,64,175,0.07)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
        <span style={{ fontSize: '18px' }}>⏱️</span>
        <div className="label" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Time Machine — complaints last week → today</div>
      </div>
      <div className="caption" style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>Drag to travel through Kakinada's civic complaint history</div>

      {/* Snapshot card */}
      <div style={{
        background: `${snap.color}0d`, border: `1.5px solid ${snap.color}40`,
        borderRadius: '12px', padding: '18px', marginBottom: '20px',
        animation: 'fadeSlideIn 0.3s ease', minHeight: '90px'
      }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <div style={{ fontSize: '32px', flexShrink: 0 }}>{snap.icon}</div>
          <div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap' }}>
              <span className="label" style={{ color: snap.color, fontWeight: 700 }}>{snap.label}</span>
              <span className="caption" style={{ color: 'var(--text-secondary)' }}>·</span>
              <span className="caption" style={{ color: 'var(--text-secondary)' }}>📍 {snap.area}, Kakinada</span>
            </div>
            <div className="body-sm" style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '4px' }}>Top issue: {snap.issue}</div>
            <div className="caption" style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>{snap.desc}</div>
          </div>
        </div>
      </div>

      {/* Slider */}
      <div style={{ position: 'relative' }}>
        <input type="range" min="0" max="100" value={val} onChange={e => setVal(Number(e.target.value))}
          style={{
            width: '100%', height: '6px', borderRadius: '999px', outline: 'none',
            appearance: 'none', WebkitAppearance: 'none',
            background: `linear-gradient(to right, var(--primary-blue) ${val}%, var(--bg-tertiary) ${val}%)`,
            cursor: 'pointer'
          }}
        />
        {/* Timeline markers */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
          {timeline.map((t, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '14px' }}>{t.icon}</span>
              <div className="caption" style={{ color: i === timeline.indexOf(snap) ? snap.color : 'var(--text-tertiary)', fontWeight: i === timeline.indexOf(snap) ? 700 : 400, fontSize: '0.68rem', whiteSpace: 'nowrap' }}>{t.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// KAKINADA SIDEBAR: WEATHER
// ==========================================
const KakinadaWeather = () => (
  <div style={{
    background: 'linear-gradient(135deg, #1E40AF 0%, #06B6D4 100%)',
    borderRadius: '16px', padding: '20px', marginBottom: '16px',
    boxShadow: '0 8px 24px rgba(30,64,175,0.2)'
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
      <div>
        <div className="caption" style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}>📍 Kakinada, AP</div>
        <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>34°C</div>
        <div className="body-sm" style={{ color: 'rgba(255,255,255,0.85)', marginTop: '4px' }}>Mostly cloudy ☁️</div>
      </div>
      <div style={{ fontSize: '48px' }}>⛅</div>
    </div>
    <div style={{
      background: 'rgba(255,255,255,0.15)', borderRadius: '10px', padding: '10px 14px',
      border: '1px solid rgba(255,255,255,0.2)'
    }}>
      <div className="caption" style={{ color: '#fff', lineHeight: 1.5 }}>
        ☀️ Perfect day to report that pothole near <strong>Kakinada Bus Stand</strong>!
      </div>
    </div>
    <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
      {[{ label: 'Humidity', val: '82%', icon: '💧' }, { label: 'Wind', val: '14 km/h', icon: '🌬️' }, { label: 'Rain risk', val: '40%', icon: '🌧️' }].map((d, i) => (
        <div key={i} style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: '14px' }}>{d.icon}</div>
          <div className="caption" style={{ color: '#fff', fontWeight: 700 }}>{d.val}</div>
          <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.65)' }}>{d.label}</div>
        </div>
      ))}
    </div>
  </div>
);

// ==========================================
// KAKINADA SIDEBAR: URGENCY METER (with drip animation on Drainage)
// ==========================================
const UrgencyMeter = ({ inView }) => {
  const bars = [
    { label: 'Drainage', count: 34, pct: 68, color: 'var(--secondary-purple)', drip: true, note: '🌧️ Heavy rains' },
    { label: 'Roads', count: 28, pct: 56, color: 'var(--primary-blue)', drip: false, note: '' },
    { label: 'Water', count: 21, pct: 42, color: '#06B6D4', drip: false, note: '' },
    { label: 'Sanitation', count: 15, pct: 30, color: 'var(--primary-green)', drip: false, note: '' },
    { label: 'Electricity', count: 9, pct: 18, color: 'var(--accent-amber)', drip: false, note: '' },
  ];
  return (
    <div style={{
      background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
      borderRadius: '16px', padding: '20px', marginBottom: '16px',
      boxShadow: '0 8px 24px rgba(30,64,175,0.06)'
    }}>
      <div className="label" style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>📊 Most reported this week</div>
      <div className="caption" style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>Kakinada city — live tally</div>
      {bars.map((b, i) => (
        <div key={i} style={{ marginBottom: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="body-sm" style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{b.label}</span>
              {b.drip && (
                <span className="caption" style={{
                  color: b.color, fontSize: '0.68rem', fontWeight: 600,
                  background: `${b.color}18`, padding: '2px 7px', borderRadius: '999px',
                  animation: 'pinPulse 2s ease-in-out infinite'
                }}>{b.note}</span>
              )}
            </div>
            <span className="caption" style={{ color: b.color, fontWeight: 700 }}>{b.count}</span>
          </div>
          <div className="urgency-bar-track">
            <div className="urgency-bar-fill" style={{
              width: inView ? `${b.pct}%` : '0%',
              background: b.color,
              transition: `width ${0.8 + i * 0.15}s ease ${i * 0.1}s`
            }}></div>
          </div>
          {/* Drip effect for drainage */}
          {b.drip && inView && (
            <div style={{ display: 'flex', gap: '6px', marginTop: '4px', paddingLeft: `${b.pct - 5}%` }}>
              {[0, 1, 2].map(d => (
                <div key={d} style={{
                  width: '3px', height: '8px', borderRadius: '0 0 3px 3px',
                  background: b.color, opacity: 0.6,
                  animation: `barGrow 0.8s ease-in-out ${d * 0.3}s infinite alternate`
                }}></div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// ==========================================
// KAKINADA SIDEBAR: NEAR YOU
// ==========================================
const NearYouCard = () => {
  const items = [
    { icon: '🚰', title: 'Broken pipe', location: 'near Kakinada Port', dist: '0.3 km away', color: '#06B6D4' },
    { icon: '🗑️', title: 'Trash overflowing', location: 'Ramakrishna Theatre street', dist: '0.8 km away', color: '#F97316' },
  ];
  return (
    <div style={{
      background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
      borderRadius: '16px', padding: '20px', marginBottom: '16px',
      boxShadow: '0 8px 24px rgba(30,64,175,0.06)'
    }}>
      <div className="label" style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>📍 Near You</div>
      <div className="caption" style={{ color: 'var(--text-secondary)', marginBottom: '14px' }}>Within 1km — Kakinada city</div>
      {items.map((item, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px',
          background: 'var(--bg-primary)', borderRadius: '10px', marginBottom: '10px',
          border: '1px solid var(--border-color)', transition: 'all 0.2s ease', cursor: 'default'
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = item.color; e.currentTarget.style.transform = 'translateX(4px)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.transform = 'translateX(0)'; }}
        >
          <div style={{
            width: '34px', height: '34px', borderRadius: '8px', flexShrink: 0,
            background: `${item.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px'
          }}>{item.icon}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="label" style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.82rem' }}>{item.title}</div>
            <div className="caption" style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.location}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '1px' }}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={item.color} strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
              <span className="caption" style={{ color: item.color, fontWeight: 600 }}>{item.dist}</span>
            </div>
          </div>
          <a href="#" style={{
            fontSize: '0.7rem', fontWeight: 600, color: 'var(--primary-blue)',
            textDecoration: 'none', whiteSpace: 'nowrap', padding: '4px 8px',
            border: '1px solid var(--primary-blue)', borderRadius: '6px', transition: 'all 0.2s ease', flexShrink: 0
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary-blue)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--primary-blue)'; }}
          >Report</a>
        </div>
      ))}
      {/* KMC Trust badge */}
      <div style={{
        marginTop: '4px', padding: '10px 14px', borderRadius: '10px',
        background: 'rgba(5,150,105,0.08)', border: '1px solid rgba(5,150,105,0.2)',
        display: 'flex', flexDirection: 'column', gap: '4px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '13px' }}>✅</span>
          <span className="caption" style={{ color: 'var(--primary-green)', fontWeight: 700 }}>Verified by Kakinada Municipal Corporation</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary-green)', animation: 'glowPulse 2s infinite', flexShrink: 0 }}></div>
          <span className="caption" style={{ color: 'var(--text-secondary)' }}>Last updated: Just now</span>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// CATEGORIES SECTION
// ==========================================
const CategoriesSection = () => {
  const { ref: inViewRef, inView } = useInView({ triggerOnce: true, threshold: 0.1 });
  const [activeTab, setActiveTab] = useState('All');
  const containerRef = useRef(null);

  useEffect(() => {
    if (inView && containerRef.current) {
      gsap.fromTo(containerRef.current.children,
        { opacity: 0, scale: 0.8 },
        { opacity: 1, scale: 1, duration: 0.6, stagger: 0.08, ease: 'power3.out' }
      );
    }
  }, [inView]);

  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3800);
  };

  const categories = [
    { title: 'Roads', icon: '🛣️', gradient: 'linear-gradient(135deg, #1E40AF, #3B82F6)', count: 28 },
    { title: 'Water', icon: '💧', gradient: 'linear-gradient(135deg, #06B6D4, #0EA5E9)', count: 21 },
    { title: 'Sanitation', icon: '🗑️', gradient: 'linear-gradient(135deg, #059669, #10B981)', count: 15 },
    { title: 'Electricity', icon: '⚡', gradient: 'linear-gradient(135deg, #F59E0B, #FBBF24)', count: 9 },
    { title: 'Drainage', icon: '🌊', gradient: 'linear-gradient(135deg, #7C3AED, #A78BFA)', count: 34 },
  ];

  const tabs = ['All', ...categories.map(c => c.title)];
  const filtered = activeTab === 'All' ? categories : categories.filter(c => c.title === activeTab);

  return (
    <section id="categories" style={{ padding: '120px 24px', background: 'var(--bg-primary)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 className="h2">We Handle These Issues</h2>
          <p className="body" style={{ color: 'var(--text-secondary)', marginTop: '12px' }}>
            Report any civic problem across Kakinada city — from Jagannathapuram to Beach Road
          </p>
        </div>

        {/* Category tab bar */}
        <div style={{
          display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '32px',
          padding: '6px', background: 'var(--bg-secondary)', borderRadius: '14px',
          border: '1px solid var(--border-color)'
        }}>
          {tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{
                padding: '8px 18px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                fontWeight: 600, fontSize: '0.875rem', transition: 'all 0.2s ease',
                background: activeTab === tab ? 'var(--primary-blue)' : 'transparent',
                color: activeTab === tab ? '#fff' : 'var(--text-secondary)',
                fontFamily: 'var(--font-body)'
              }}
              onMouseEnter={e => { if (activeTab !== tab) e.currentTarget.style.background = 'var(--bg-hover)'; }}
              onMouseLeave={e => { if (activeTab !== tab) e.currentTarget.style.background = 'transparent'; }}
            >{tab}</button>
          ))}
        </div>

        {/* Main two-column layout */}
        <div className="categories-two-col" style={{ display: 'flex', gap: '28px', alignItems: 'flex-start' }}>

          {/* LEFT: Category tiles + rich creative content */}
          <div style={{ flex: '1 1 0', display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* Category tiles */}
            <div ref={(el) => { inViewRef(el); containerRef.current = el; }} style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px'
            }}>
              {filtered.map((c, i) => (
                <div key={i} style={{
                  aspectRatio: '1/1', background: c.gradient, borderRadius: '16px', padding: '20px 16px',
                  display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', position: 'relative',
                  overflow: 'hidden', cursor: 'pointer', transition: 'all 0.3s ease'
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-8px) scale(1.05)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; }}
                >
                  <div style={{ position: 'absolute', top: '12px', right: '12px', fontSize: '52px', opacity: 0.2, zIndex: 0 }}>{c.icon}</div>
                  <div style={{ position: 'absolute', top: '12px', left: '12px', background: 'rgba(255,255,255,0.25)', borderRadius: '999px', padding: '2px 8px' }}>
                    <span style={{ fontSize: '0.68rem', color: '#fff', fontWeight: 700 }}>{c.count}</span>
                  </div>
                  <h4 className="h4" style={{ color: '#FFF', margin: 0, position: 'relative', zIndex: 1, fontSize: '1rem' }}>{c.title}</h4>
                </div>
              ))}
            </div>

            {/* 1. Word cloud – full width, premium */}
            <KakinadaWordCloud onToast={showToast} />

            {/* 2. Citizen buzz quotes */}
            <CitizenBuzzQuote />

            {/* 3. Colony challenge */}
            <ColonyChallenge />

            {/* 4. AI prediction pill */}
            <AIPredictionPill />

            {/* 5. Time machine */}
            <TimeMachineSlider />
          </div>

          {/* RIGHT: Sidebar */}
          <div style={{ width: '300px', flexShrink: 0 }}>
            <KakinadaWeather />
            <UrgencyMeter inView={inView} />
            <NearYouCard />
          </div>
        </div>

        {/* Suggest category CTA */}
        <div style={{
          marginTop: '40px', textAlign: 'center', padding: '20px',
          background: 'var(--bg-secondary)', border: '1px dashed var(--border-color)',
          borderRadius: '12px', transition: 'all 0.2s ease', cursor: 'pointer'
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary-blue)'; e.currentTarget.style.background = 'var(--bg-hover)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.background = 'var(--bg-secondary)'; }}
        >
          <span className="body-sm" style={{ color: 'var(--text-secondary)' }}>
            Not seeing your issue?{' '}
            <a href="#" style={{ color: 'var(--primary-blue)', fontWeight: 600, textDecoration: 'none' }}
              onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
              onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
            >
              Suggest a new category ➜
            </a>
          </span>
        </div>
      </div>

      {/* Toast notification */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '32px', left: '50%', transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg,#1E40AF,#059669)',
          color: '#fff', borderRadius: '14px', padding: '14px 24px',
          boxShadow: '0 12px 40px rgba(30,64,175,0.35)',
          zIndex: 9000, display: 'flex', alignItems: 'center', gap: '12px',
          animation: 'fadeSlideIn 0.3s ease', whiteSpace: 'nowrap',
          fontFamily: 'var(--font-body)', fontSize: '0.9rem', fontWeight: 600,
          maxWidth: '90vw'
        }}>
          <span style={{ fontSize: '18px' }}>📋</span>
          <span>{toast} <a href="#" style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'underline', fontWeight: 700, marginLeft: '6px' }}>Click here →</a></span>
          <button onClick={() => setToast(null)} style={{
            background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '6px',
            color: '#fff', width: '24px', height: '24px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-body)', fontSize: '14px', flexShrink: 0
          }}>×</button>
        </div>
      )}
    </section>
  );
};




// ==========================================
// NEW: BEFORE / AFTER TABLE
// ==========================================
const BeforeAfterTable = () => {
  const rows = [
    { metric: '⏱️ Resolution time', before: '5–7 days avg', after: '48h avg' },
    { metric: '📋 Duplicate reports', before: 'Common, ignored', after: 'Auto-grouped' },
    { metric: '📡 Transparency', before: 'Phone calls only', after: 'Live tracking' },
    { metric: '🔔 Notifications', before: 'None', after: 'SMS + Email' },
    { metric: '🏛️ Dept. routing', before: 'Manual', after: 'Instant & accurate' },
  ];
  return (
    <div style={{
      marginTop: '48px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)',
      borderRadius: '16px', overflow: 'hidden', boxShadow: '0 8px 32px rgba(30,64,175,0.06)'
    }}>
      <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
        <h4 className="h4" style={{ margin: 0, color: 'var(--text-primary)' }}>Before SmartCivic vs After</h4>
        <p className="body-sm" style={{ color: 'var(--text-secondary)', marginTop: '6px' }}>Real improvements experienced by citizens</p>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="comparison-table">
          <thead>
            <tr style={{ background: 'var(--bg-secondary)' }}>
              <th style={{ color: 'var(--text-secondary)', fontWeight: 600, padding: '14px 20px' }}>Metric</th>
              <th style={{ color: '#EF4444', padding: '14px 20px' }}>❌ Before SmartCivic</th>
              <th style={{ color: 'var(--primary-green)', padding: '14px 20px' }}>✅ After SmartCivic</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                <td style={{ color: 'var(--text-primary)', fontWeight: 500, padding: '14px 20px' }}>{row.metric}</td>
                <td style={{ color: '#EF4444', padding: '14px 20px', opacity: 0.85 }}>{row.before}</td>
                <td style={{ color: 'var(--primary-green)', fontWeight: 600, padding: '14px 20px' }}>{row.after}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ==========================================
// NEW: TRUST BADGE STRIP
// ==========================================
const TrustBadgeStrip = () => {
  const badges = [
    { icon: '🔒', label: 'ISO 27001 Certified' },
    { icon: '🏛️', label: 'GovTech Alliance' },
    { icon: '🛡️', label: 'Privacy Protected' },
    { icon: '📊', label: 'Open Data Compliant' },
  ];
  return (
    <div style={{
      marginTop: '32px', display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center'
    }}>
      {badges.map((b, i) => (
        <div key={i} className="trust-badge">
          <span>{b.icon}</span>
          <span>{b.label}</span>
        </div>
      ))}
    </div>
  );
};

// ==========================================
// NEW: TESTIMONIAL SLIDER
// ==========================================
const TestimonialSlider = () => {
  const [active, setActive] = useState(0);
  const testimonials = [
    { quote: 'Fixed my water leak in under 24 hours! I was shocked by how fast the municipality responded. SmartCivic is a game changer.', author: 'Priya M.', role: 'Resident, Suryaraopeta', avatar: 'PM' },
    { quote: 'Love the real-time updates. I always knew exactly where my complaint stood. No more calling the helpline and waiting on hold.', author: 'Rajesh K.', role: 'Business owner, Kakinada Port Area', avatar: 'RK' },
    { quote: 'Reporting took seconds, resolution in 2 days! The AI even correctly identified the drainage issue from my photo.', author: 'Amit S.', role: 'Teacher, Ramanayyapeta', avatar: 'AS' },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActive(prev => (prev + 1) % testimonials.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{
      marginTop: '40px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)',
      borderRadius: '16px', padding: '40px 36px', boxShadow: '0 8px 32px rgba(30,64,175,0.06)',
      textAlign: 'center', position: 'relative', overflow: 'hidden'
    }}>
      {/* Quote background decoration */}
      <div style={{ fontSize: '80px', lineHeight: 1, color: 'var(--bg-hover)', position: 'absolute', top: '16px', left: '24px', fontFamily: 'Georgia, serif', userSelect: 'none' }}>"</div>

      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.35 }}
          className="testimonial-slide"
        >
          <p className="body-lg" style={{
            color: 'var(--text-primary)', fontStyle: 'italic', marginBottom: '24px',
            maxWidth: '680px', margin: '0 auto 24px', lineHeight: '1.7', position: 'relative', zIndex: 1
          }}>
            "{testimonials[active].quote}"
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '50%',
              background: 'var(--gradient-civic)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 700, fontSize: '0.9rem'
            }}>{testimonials[active].avatar}</div>
            <div style={{ textAlign: 'left' }}>
              <div className="label" style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{testimonials[active].author}</div>
              <div className="caption" style={{ color: 'var(--text-secondary)' }}>{testimonials[active].role}</div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Dot navigation */}
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '28px' }}>
        {testimonials.map((_, i) => (
          <button
            key={i}
            className={`slider-dot ${i === active ? 'active' : ''}`}
            onClick={() => setActive(i)}
            aria-label={`Go to testimonial ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

// ==========================================
// FEATURES SECTION
// ==========================================
const FeaturesSection = () => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.2 });
  const containerRef = useRef(null);

  useEffect(() => {
    if (inView && containerRef.current) {
      gsap.fromTo(containerRef.current.children,
        { opacity: 0, x: -30 },
        { opacity: 1, x: 0, duration: 0.8, stagger: 0.15, ease: 'power3.out' }
      );
    }
  }, [inView]);

  const features = [
    {
      icon: '🔗', title: 'Smart Duplicate Grouping',
      desc: 'Multiple citizens report the same issue? We group them automatically. No duplicate work, no confusion. One incident, many voices.',
      badge: { label: 'Auto', color: '#059669', bg: 'rgba(5,150,105,0.12)' }
    },
    {
      icon: '📍', title: 'Real-Time Status Tracking',
      desc: 'Follow every step of your complaint from submission to resolution. Live updates via email & SMS. Transparency built-in.',
      badge: { label: 'Live', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' }
    },
    {
      icon: '🤖', title: 'AI-Powered Assistance',
      desc: 'Our smart chatbot guides you through filing complaints, checks status, and even detects the issue category from your photos.',
      badge: { label: 'AI', color: '#7C3AED', bg: 'rgba(124,58,237,0.12)' }
    },
    {
      icon: '🏛️', title: 'Connected to Every Department',
      desc: 'Roads, Water, Sanitation, Electricity, Drainage. Your complaint reaches the right office instantly. No bureaucratic delays.',
      badge: { label: 'Instant', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' }
    }
  ];

  return (
    <section id="features" style={{ padding: '120px 24px', background: 'var(--bg-secondary)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h2 className="h2">Powerful Features</h2>
          <p className="body" style={{ color: 'var(--text-secondary)', marginTop: '12px' }}>Everything you need for transparent civic governance</p>
        </div>

        <div ref={(el) => { ref(el); containerRef.current = el; }} style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '30px'
        }}>
          {features.map((f, i) => (
            <div key={i} style={{
              display: 'flex', gap: '20px', padding: '32px', background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)', borderRadius: '12px', transition: 'all 0.3s ease',
              position: 'relative', overflow: 'hidden'
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(8px)'; e.currentTarget.style.borderColor = 'var(--primary-blue)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(30,64,175,0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateX(0)'; e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              {/* Status badge – top right corner */}
              <div className="feature-badge" style={{
                position: 'absolute', top: '16px', right: '16px',
                background: f.badge.bg, color: f.badge.color,
                border: `1px solid ${f.badge.color}30`
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: f.badge.color, flexShrink: 0 }}></span>
                {f.badge.label}
              </div>

              <div style={{
                width: '80px', height: '80px', flexShrink: 0, background: 'var(--bg-hover)',
                borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px'
              }}>
                {f.icon}
              </div>
              <div style={{ flex: 1, paddingRight: '60px' }}>
                <h4 className="h4" style={{ marginBottom: '8px' }}>{f.title}</h4>
                <p className="body" style={{ color: 'var(--text-secondary)' }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* NEW: Before/After Table */}
        <BeforeAfterTable />

        {/* NEW: Trust Badge Strip */}
        <TrustBadgeStrip />

        {/* NEW: Testimonial Slider */}
        <TestimonialSlider />
      </div>
    </section>
  );
};

// ==========================================
// NEW: EMAIL SIGNUP ROW
// ==========================================
const EmailSignupRow = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = () => {
    if (email && email.includes('@')) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 3500);
    }
  };

  return (
    <section style={{
      padding: '80px 24px',
      background: 'linear-gradient(135deg, rgba(30,64,175,0.92) 0%, rgba(5,150,105,0.88) 100%)',
      borderTop: '1px solid rgba(255,255,255,0.1)',
      borderBottom: '1px solid rgba(255,255,255,0.1)',
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>📬</div>
        <h3 className="h3" style={{ color: '#fff', marginBottom: '8px' }}>Get weekly civic updates in your city</h3>
        <p className="body" style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '32px' }}>
          Stay informed about issues reported, resolved, and trending in your neighbourhood. No spam, unsubscribe anytime.
        </p>

        {subscribed ? (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '10px',
            background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)',
            borderRadius: '12px', padding: '14px 24px', color: '#fff', fontSize: '1rem', fontWeight: 600
          }}>
            ✅ Subscribed! You'll hear from us soon.
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div className="email-input-row">
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubscribe()}
              />
              <button onClick={handleSubscribe}>Subscribe</button>
            </div>
          </div>
        )}

        {/* App store badges */}
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '36px', flexWrap: 'wrap' }}>
          {[
            { store: 'Google Play', icon: '▶', sub: 'GET IT ON' },
            { store: 'App Store', icon: '', sub: 'Download on the' }
          ].map((badge, i) => (
            <a key={i} href="#" style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              background: 'rgba(0,0,0,0.35)', border: '1.5px solid rgba(255,255,255,0.3)',
              borderRadius: '12px', padding: '10px 20px', textDecoration: 'none', color: '#fff',
              transition: 'all 0.2s ease', minWidth: '160px'
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.55)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.35)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <span style={{ fontSize: '28px' }}>{i === 0 ? '▶' : ''}</span>
              {i === 1 && (
                <svg width="24" height="28" viewBox="0 0 24 28" fill="white">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98l-.09.06c-.22.14-2.18 1.27-2.16 3.8.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.37 2.78M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
              )}
              <div>
                <div style={{ fontSize: '0.62rem', opacity: 0.8, lineHeight: 1 }}>{badge.sub}</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, lineHeight: 1.3 }}>{badge.store}</div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

// ==========================================
// CTA SECTION
// ==========================================
const CTASection = () => {
  const navigate = useNavigate();
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.5 });
  const contentRef = useRef(null);

  useEffect(() => {
    if (inView && contentRef.current) {
      gsap.fromTo(contentRef.current, { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 1, ease: 'power3.out' });
    }
  }, [inView]);

  return (
    <section id="contact" style={{
      padding: '120px 24px', minHeight: '400px', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--gradient-civic)', color: '#FFF', textAlign: 'center'
    }}>
      <div ref={(el) => { ref(el); contentRef.current = el; }} style={{ maxWidth: '800px' }}>
        <h2 className="h2" style={{ color: '#FFF' }}>Ready to Make Your City Better?</h2>
        <p className="body-lg" style={{ color: 'rgba(255,255,255,0.9)', margin: '24px auto 40px', maxWidth: '600px' }}>
          Join thousands of citizens making a difference. Report issues, track progress,
          and help shape transparent, responsive governance.
        </p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button style={{
            height: '48px', padding: '0 32px', background: '#FFF', color: 'var(--primary-blue)',
            border: 'none', borderRadius: '12px', fontWeight: 600, fontSize: '1rem', cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
            onClick={() => navigate('/login')}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            Start Reporting Now
          </button>

          <button style={{
            height: '48px', padding: '0 32px', background: 'transparent', color: '#FFF',
            border: '2px solid #FFF', borderRadius: '12px', fontWeight: 600, fontSize: '1rem', cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            Learn More
          </button>
        </div>
      </div>
    </section>
  );
};

// ==========================================
// FOOTER SECTION
// ==========================================
const Footer = () => {
  const socialLinks = [
    {
      name: 'Facebook', href: '#',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
    },
    {
      name: 'X', href: '#',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
    },
    {
      name: 'LinkedIn', href: '#',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z" /><circle cx="4" cy="4" r="2" /></svg>
    },
    {
      name: 'Instagram', href: '#',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>
    },
  ];

  return (
    <footer style={{ background: 'var(--bg-primary)', padding: '60px 24px 24px', borderTop: '1px solid var(--border-color)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        {/* Footer grid columns */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '40px', marginBottom: '40px' }}>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ width: '24px', height: '24px', background: 'var(--primary-blue)', borderRadius: '4px', marginRight: '8px' }}></div>
              <span className="h5">SmartCivic</span>
            </div>
            <p className="body-sm" style={{ color: 'var(--text-tertiary)', marginBottom: '16px' }}>Empowering citizens. Transforming cities.</p>
            {/* Social icons */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {socialLinks.map((s, i) => (
                <a key={i} href={s.href} className="social-icon-btn" title={s.name} aria-label={s.name}>
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h6 className="h6" style={{ marginBottom: '16px' }}>Product</h6>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {['Features', 'Pricing', 'Security', 'Roadmap'].map(item => (
                <a key={item} href="#" className="body-sm" style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s ease' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--primary-blue)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                >{item}</a>
              ))}
            </div>
          </div>

          <div>
            <h6 className="h6" style={{ marginBottom: '16px' }}>Company</h6>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {['About Us', 'Blog', 'Careers', 'Contact'].map(item => (
                <a key={item} href="#" className="body-sm" style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s ease' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--primary-blue)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                >{item}</a>
              ))}
            </div>
          </div>

          <div>
            <h6 className="h6" style={{ marginBottom: '16px' }}>Legal</h6>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {['Privacy Policy', 'Terms of Service', 'Code of Conduct'].map(item => (
                <a key={item} href="#" className="body-sm" style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s ease' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--primary-blue)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                >{item}</a>
              ))}
            </div>
          </div>

        </div>

        <div style={{ height: '1px', background: 'var(--border-color)', marginBottom: '24px' }}></div>

        {/* Bottom bar: copyright + language selector */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
          <p className="body-sm" style={{ color: 'var(--text-tertiary)' }}>© 2026 SmartCivic. All rights reserved.</p>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span className="caption" style={{ color: 'var(--text-tertiary)' }}>🌐 Language:</span>
            <select className="lang-select">
              <option value="en">EN – English</option>
              <option value="hi">HI – हिंदी</option>
              <option value="es">ES – Español</option>
            </select>
          </div>
        </div>

        {/* Municipality trust strip */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px',
          flexWrap: 'wrap', padding: '20px', background: 'var(--bg-secondary)',
          borderRadius: '12px', border: '1px solid var(--border-color)'
        }}>
          <span className="caption" style={{ color: 'var(--text-tertiary)', fontWeight: 500 }}>
            Trusted by 3+ municipal corporations
          </span>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            {[
              { abbr: 'KMC', name: 'Kakinada Municipal Corp.' },
              { abbr: 'GVMC', name: 'Greater Visakhapatnam MC' },
              { abbr: 'VMC', name: 'Vijayawada Municipal Corp.' },
            ].map((muni, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                title={muni.name}
              >
                <div className="muni-logo">{muni.abbr}</div>
              </div>
            ))}
          </div>
          <span className="caption" style={{ color: 'var(--text-tertiary)' }}>and growing →</span>
        </div>

      </div>
    </footer>
  );
};

// ==========================================
// MAIN LANDING COMPONENT
// ==========================================
const Landing = () => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('smartcivic-theme') ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  });

  // Splash screen state — plays once per session
  const [showSplash, setShowSplash] = useState(() => {
    return !sessionStorage.getItem('smartcivic-splash-seen');
  });

  const handleSplashComplete = useCallback(() => {
    sessionStorage.setItem('smartcivic-splash-seen', 'true');
    setShowSplash(false);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('smartcivic-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <div className="landing-page-container">
      {/* Splash Screen Overlay */}
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}

      {/* Landing page content — fades in after splash */}
      <motion.div
        initial={showSplash ? { opacity: 0 } : { opacity: 1 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: showSplash ? 0 : 0, ease: 'easeOut' }}
        style={{ position: 'relative', zIndex: 1 }}
      >
        <Background3D theme={theme} />
        <Header theme={theme} toggleTheme={toggleTheme} />
        <HeroSection />
        <HowItWorks />
        <CategoriesSection />
        <FeaturesSection />
        <CTASection />
        <EmailSignupRow />
        <Footer />
      </motion.div>
    </div>
  );
};

export default Landing;
