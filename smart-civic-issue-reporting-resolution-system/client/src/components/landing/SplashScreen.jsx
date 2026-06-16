import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import '../../styles/splash.css';

/* ============================================================
   HELPERS
   ============================================================ */
const rand = (min, max) => Math.random() * (max - min) + min;

const generateParticles = (count) =>
  Array.from({ length: count }, (_, i) => ({
    id: i,
    left: `${rand(0, 100)}%`,
    top: `${rand(0, 100)}%`,
    size: rand(1.5, 4),
    driftX: `${rand(-50, 50)}px`,
    driftY: `${rand(-50, 50)}px`,
    dur: `${rand(3, 7)}s`,
    delay: `${rand(0, 3)}s`,
    opacity: rand(0.2, 0.6),
    large: i < 8,
  }));

/* ============================================================
   SCENE 1 — Particles + Network
   ============================================================ */
const Particles = React.memo(({ particles }) => (
  <div className="splash-particles">
    {particles.map((p) => (
      <div
        key={p.id}
        className={`splash-particle${p.large ? ' large' : ''}`}
        style={{
          left: p.left,
          top: p.top,
          width: `${p.size}px`,
          height: `${p.size}px`,
          '--drift-x': p.driftX,
          '--drift-y': p.driftY,
          '--drift-dur': p.dur,
          '--drift-delay': p.delay,
          '--p-opacity': p.opacity,
        }}
      />
    ))}
  </div>
));

/* ============================================================
   SCENE 2 — Smart City Skyline
   ============================================================ */
const CitySkyline = React.memo(({ visible, brighten }) => {
  // Helper to create window rows for a building
  const windows = (startX, startY, cols, rows, gapX, gapY, w, h, baseDelay) => {
    const els = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const color = (r + c) % 3 === 0 ? '#53D8FB' : '#00AEEF';
        const op = (r + c) % 4 === 0 ? 0.5 : 0.9;
        els.push(
          <rect
            key={`w${startX}${r}${c}`}
            x={startX + c * gapX}
            y={startY + r * gapY}
            width={w}
            height={h}
            rx="1"
            fill={color}
            opacity={op}
            className="window-glow"
            style={{ '--win-delay': `${baseDelay + (r * cols + c) * 0.04}s`, '--win-color': color }}
          />
        );
      }
    }
    return els;
  };

  return (
    <motion.div
      className={`splash-city-container${brighten ? ' city-brighten' : ''}`}
      initial={{ opacity: 0, y: 60 }}
      animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 60 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <svg className="splash-city-svg" viewBox="0 0 1400 350" preserveAspectRatio="xMidYMax meet" fill="none">
        {/* Ground */}
        <rect x="0" y="320" width="1400" height="30" fill="#060f20" />

        {/* Road edge glow line */}
        <line x1="0" y1="320" x2="1400" y2="320" stroke="#00AEEF" strokeWidth="1.5" opacity="0.4"
          className="road-glow" style={{ '--road-delay': '0.2s' }} />

        {/* Road dashes */}
        {Array.from({ length: 28 }, (_, i) => (
          <rect key={`rd${i}`} x={i * 52 + 6} y="333" width="28" height="1.5" rx="0.75"
            fill="#00AEEF" opacity="0.12" className="road-glow" style={{ '--road-delay': `${0.25 + i * 0.02}s` }} />
        ))}

        {/* === BUILDINGS === */}

        {/* B1 — Far left skinny */}
        <rect x="30" y="180" width="40" height="140" rx="2" className="building-body" />
        <rect x="32" y="185" width="1.5" height="130" fill="#00AEEF" opacity="0.3" className="building-glow" style={{ '--bld-delay': '0.1s' }} />
        {windows(38, 190, 2, 5, 16, 25, 8, 12, 0.15)}

        {/* B2 — Short wide left */}
        <rect x="90" y="230" width="80" height="90" rx="2" className="building-body" />
        {windows(100, 240, 3, 3, 22, 25, 12, 14, 0.2)}

        {/* B3 — Tall modern */}
        <rect x="200" y="70" width="55" height="250" rx="2" className="building-body" />
        <rect x="202" y="75" width="1.5" height="240" fill="#00AEEF" opacity="0.4" className="building-glow" style={{ '--bld-delay': '0.12s' }} />
        <rect x="252" y="75" width="1.5" height="240" fill="#53D8FB" opacity="0.3" className="building-glow" style={{ '--bld-delay': '0.14s' }} />
        {windows(210, 82, 2, 8, 20, 28, 10, 14, 0.18)}

        {/* B4 — Medium */}
        <rect x="280" y="160" width="60" height="160" rx="2" className="building-body" />
        {windows(290, 170, 2, 5, 22, 28, 12, 16, 0.25)}
        {/* Antenna */}
        <line x1="310" y1="160" x2="310" y2="138" stroke="#DCE6F2" strokeWidth="1.5" opacity="0.3" />
        <circle cx="310" cy="135" r="3" fill="#53D8FB" className="streetlight-beam" style={{ '--beam-delay': '0.5s' }} />
        <circle cx="310" cy="135" r="6" fill="#53D8FB" opacity="0.15" className="streetlight-beam" style={{ '--beam-delay': '0.52s' }} />

        {/* B5 — HERO skyscraper center */}
        <rect x="380" y="30" width="75" height="290" rx="2" className="building-body" />
        <rect x="382" y="35" width="2" height="280" fill="#00AEEF" opacity="0.5" className="building-glow" style={{ '--bld-delay': '0.08s' }} />
        <rect x="452" y="35" width="2" height="280" fill="#00AEEF" opacity="0.5" className="building-glow" style={{ '--bld-delay': '0.1s' }} />
        {windows(392, 42, 3, 9, 18, 28, 10, 14, 0.12)}
        {/* Spire */}
        <line x1="417" y1="30" x2="417" y2="6" stroke="#DCE6F2" strokeWidth="2" opacity="0.4" />
        <circle cx="417" cy="4" r="4" fill="#00AEEF" className="streetlight-beam" style={{ '--beam-delay': '0.3s' }} />
        <circle cx="417" cy="4" r="10" fill="#00AEEF" opacity="0.1" className="streetlight-beam" style={{ '--beam-delay': '0.32s' }} />

        {/* B6 — Medium-wide right of center */}
        <rect x="490" y="140" width="65" height="180" rx="2" className="building-body" />
        {windows(500, 150, 2, 6, 24, 26, 12, 14, 0.3)}
        <rect x="553" y="145" width="1.5" height="170" fill="#53D8FB" opacity="0.25" className="building-glow" style={{ '--bld-delay': '0.28s' }} />

        {/* B7 — Wide short */}
        <rect x="580" y="240" width="100" height="80" rx="2" className="building-body" />
        {windows(592, 250, 4, 2, 22, 28, 12, 14, 0.35)}

        {/* B8 — Tall right */}
        <rect x="710" y="90" width="55" height="230" rx="2" className="building-body" />
        <rect x="763" y="95" width="1.5" height="220" fill="#00AEEF" opacity="0.35" className="building-glow" style={{ '--bld-delay': '0.16s' }} />
        {windows(720, 100, 2, 7, 18, 30, 10, 14, 0.2)}

        {/* B9 — Far right medium */}
        <rect x="790" y="180" width="50" height="140" rx="2" className="building-body" />
        {windows(800, 190, 2, 4, 18, 28, 10, 14, 0.32)}

        {/* B10 — Far right small */}
        <rect x="860" y="260" width="60" height="60" rx="2" className="building-body" />
        {windows(870, 268, 2, 2, 22, 22, 12, 12, 0.38)}

        {/* Streetlights */}
        {[70, 175, 360, 555, 695, 845].map((x, i) => (
          <g key={`sl${i}`}>
            <line x1={x} y1="320" x2={x} y2="298" stroke="#DCE6F250" strokeWidth="1.5" />
            <circle cx={x} cy="296" r="3" fill="#53D8FB" className="streetlight-beam" style={{ '--beam-delay': `${0.4 + i * 0.06}s` }} />
            <ellipse cx={x} cy="320" rx="14" ry="3" fill="#53D8FB" opacity="0.06" className="streetlight-beam" style={{ '--beam-delay': `${0.42 + i * 0.06}s` }} />
          </g>
        ))}

        {/* Horizon glow */}
        <rect x="0" y="290" width="1400" height="30" fill="url(#horizonGlow)" opacity="0.3" />
        <defs>
          <linearGradient id="horizonGlow" x1="0" y1="290" x2="0" y2="320" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#00AEEF" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#00AEEF" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </motion.div>
  );
});

/* ============================================================
   SCENE 3 — Energy Formation
   ============================================================ */
const EnergyFormation = React.memo(({ visible }) => (
  <motion.div
    className="splash-energy-center"
    initial={{ opacity: 0, scale: 0.3 }}
    animate={visible ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.3 }}
    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
  >
    <div className="energy-core" />
    <div className="hud-ring hud-ring-1" />
    <div className="hud-ring hud-ring-2" />
    <div className="hud-ring hud-ring-3" />
    <div className="hud-ring hud-ring-4" />

    {/* Orbiting particles */}
    {[0, 90, 180, 270].map((start, i) => (
      <div
        key={`orb${i}`}
        className="orbit-particle"
        style={{
          '--orbit-dur': `${1.8 + i * 0.4}s`,
          '--orbit-r': `${40 + i * 20}px`,
          '--orbit-start': `${start / 3.6}%`,
          '--orbit-start-deg': `${start}deg`,
          width: `${3 + i}px`,
          height: `${3 + i}px`,
          opacity: 1 - i * 0.15,
        }}
      />
    ))}
  </motion.div>
));

/* ============================================================
   SCENE 4 — Logo Construction (SVG path-draw)
   ============================================================ */
const LogoConstruction = React.memo(({ visible, phase }) => (
  <motion.div
    className="splash-logo-construct"
    initial={{ opacity: 0, scale: 0.8 }}
    animate={visible ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
  >
    <div className="logo-aura" />
    <svg className="splash-logo-svg" viewBox="0 0 160 160">
      {/* Phase 1: Outer circular rings */}
      {phase >= 1 && (
        <>
          <circle cx="80" cy="80" r="75"
            className="draw-path" stroke="#DCE6F2" strokeWidth="1.5"
            style={{ '--path-len': '472', '--draw-dur': '0.45s', '--draw-delay': '0s' }}
          />
          <circle cx="80" cy="80" r="68"
            className="draw-path" stroke="#00AEEF" strokeWidth="2"
            style={{ '--path-len': '428', '--draw-dur': '0.45s', '--draw-delay': '0.08s' }}
          />
        </>
      )}
      {/* Phase 2: Location pin */}
      {phase >= 2 && (
        <path
          d="M80,22 C55,22 38,42 38,64 C38,94 80,142 80,142 C80,142 122,94 122,64 C122,42 105,22 80,22 Z"
          className="draw-path" stroke="#00AEEF" strokeWidth="2.5"
          style={{ '--path-len': '340', '--draw-dur': '0.4s', '--draw-delay': '0.1s' }}
        />
      )}
      {/* Phase 3: Inner circles */}
      {phase >= 3 && (
        <>
          <circle cx="80" cy="66" r="30"
            className="draw-path" stroke="#53D8FB" strokeWidth="2"
            style={{ '--path-len': '189', '--draw-dur': '0.3s', '--draw-delay': '0.05s' }}
          />
          <circle cx="80" cy="66" r="22"
            className="draw-path" stroke="#DCE6F280" strokeWidth="1.5"
            style={{ '--path-len': '138', '--draw-dur': '0.3s', '--draw-delay': '0.12s' }}
          />
        </>
      )}
      {/* Phase 4: Checkmark */}
      {phase >= 4 && (
        <path
          d="M65,66 L75,78 L97,52"
          className="draw-path" stroke="#53D8FB" strokeWidth="4"
          style={{ '--path-len': '55', '--draw-dur': '0.3s', '--draw-delay': '0.08s' }}
        />
      )}
    </svg>
  </motion.div>
));

/* ============================================================
   SCENE 5 — Achievement Tags
   ============================================================ */
const AchievementTags = React.memo(({ visible }) => {
  const tags = [
    { label: 'Pothole Repaired', icon: '🛣️', x: '6%', y: '22%', floatClass: 'tag-floating' },
    { label: 'Drain Fixed', icon: '🔧', x: 'auto', right: '6%', y: '16%', floatClass: 'tag-floating-alt' },
    { label: 'Litter Removed', icon: '♻️', x: '10%', y: 'auto', bottom: '30%', floatClass: 'tag-floating-slow' },
  ];

  return (
    <>
      {tags.map((tag, i) => (
        <motion.div
          key={tag.label}
          className={`achievement-tag ${tag.floatClass}`}
          style={{
            top: tag.y !== 'auto' ? tag.y : undefined,
            bottom: tag.bottom || undefined,
            left: tag.x !== 'auto' ? tag.x : undefined,
            right: tag.right || undefined,
          }}
          initial={{ opacity: 0, x: i === 1 ? 50 : -50, scale: 0.85 }}
          animate={visible ? { opacity: 1, x: 0, scale: 1 } : { opacity: 0, x: i === 1 ? 50 : -50, scale: 0.85 }}
          transition={{ duration: 0.45, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="tag-icon">{tag.icon}</div>
          <span>{tag.label}</span>
          <div className="tag-check">
            <svg viewBox="0 0 12 12" fill="none">
              <path d="M3 6l2.5 2.5L9 4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </motion.div>
      ))}
    </>
  );
});

/* ============================================================
   SCENE 6 — Brand Reveal
   ============================================================ */
const BrandReveal = React.memo(({ visible }) => (
  <motion.div
    className="splash-brand"
    initial={{ opacity: 0 }}
    animate={visible ? { opacity: 1 } : { opacity: 0 }}
    transition={{ duration: 0.4 }}
  >
    <motion.div
      className="splash-brand-title"
      initial={{ opacity: 0, letterSpacing: '0.6em', y: 20 }}
      animate={visible ? { opacity: 1, letterSpacing: '0.15em', y: 0 } : {}}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
    >
      SMART CIVIC
    </motion.div>
    <motion.div
      className="splash-brand-tagline"
      initial={{ opacity: 0, y: 12 }}
      animate={visible ? { opacity: 0.7, y: 0 } : {}}
      transition={{ duration: 0.5, delay: 0.25, ease: 'easeOut' }}
    >
      Report. Resolve. Improve.
    </motion.div>
  </motion.div>
));

/* ============================================================
   PROGRESS BAR
   ============================================================ */
const ProgressBar = React.memo(({ progress, label }) => (
  <div className="splash-progress-container">
    <div className="splash-progress-track">
      <div className="splash-progress-fill" style={{ width: `${progress}%` }} />
    </div>
    <div className="splash-progress-text">{label}</div>
  </div>
));

/* ============================================================
   MAIN SPLASH SCREEN
   ============================================================ */
const SplashScreen = ({ onComplete }) => {
  const [scene, setScene] = useState(0);
  const [logoPhase, setLogoPhase] = useState(0);
  const [cityBrighten, setCityBrighten] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('Initializing...');

  const particles = useMemo(() => generateParticles(55), []);

  const stableOnComplete = useCallback(() => {
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    const timers = [];
    const t = (fn, ms) => { const id = setTimeout(fn, ms); timers.push(id); };

    /* ─── SCENE 1: Dark startup (0ms) ─── */
    t(() => { setScene(1); setProgress(8); setProgressLabel('Booting systems...'); }, 50);

    /* ─── SCENE 2: City awakens (350ms) ─── */
    t(() => { setScene(2); setProgress(20); setProgressLabel('Activating smart grid...'); }, 350);

    /* ─── SCENE 3: Energy formation (900ms) ─── */
    t(() => { setScene(3); setProgress(35); setProgressLabel('Connecting infrastructure...'); }, 900);

    /* ─── SCENE 4: Logo construction (1300ms) ─── */
    t(() => { setScene(4); setLogoPhase(1); setProgress(45); setProgressLabel('Initializing civic engine...'); }, 1300);
    t(() => { setLogoPhase(2); setProgress(52); }, 1500);
    t(() => { setLogoPhase(3); setProgress(60); }, 1700);
    t(() => { setLogoPhase(4); setProgress(70); }, 1880);

    /* ─── SCENE 5: Achievement tags (2050ms) ─── */
    t(() => { setScene(5); setProgress(80); setProgressLabel('Loading civic data...'); }, 2050);

    /* ─── SCENE 6: Brand reveal (2400ms) ─── */
    t(() => { setScene(6); setProgress(90); setProgressLabel('Almost ready...'); }, 2400);

    /* ─── SCENE 7: Pulse (2700ms) ─── */
    t(() => { setScene(7); setCityBrighten(true); setProgress(100); setProgressLabel('Platform ready'); }, 2700);
    t(() => setCityBrighten(false), 3100);

    /* ─── SCENE 8: Exit (3000ms) ─── */
    t(() => { setScene(8); setExiting(true); }, 3000);

    /* ─── Complete (3600ms) ─── */
    t(() => stableOnComplete(), 3600);

    return () => timers.forEach(clearTimeout);
  }, [stableOnComplete]);

  if (exiting) {
    return (
      <motion.div
        className="splash-overlay"
        key="splash-exit"
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.6, ease: [0.33, 1, 0.68, 1] }}
        style={{ pointerEvents: 'none' }}
      >
        {/* Particles + city fade with overlay */}
        <Particles particles={particles} />
        <CitySkyline visible brighten={false} />
        <div className="splash-bloom splash-bloom-3" />

        {/* Logo morphs toward navbar */}
        <motion.div
          className="splash-logo-area"
          animate={{
            scale: 0.2,
            y: -window.innerHeight / 2 + 36,
            x: -window.innerWidth / 2 + 60,
            opacity: 0,
          }}
          transition={{ duration: 0.6, ease: [0.65, 0, 0.35, 1] }}
        >
          <div className="splash-logo-construct">
            <svg className="splash-logo-svg" viewBox="0 0 160 160">
              <circle cx="80" cy="80" r="75" stroke="#DCE6F2" strokeWidth="1.5" fill="none" />
              <circle cx="80" cy="80" r="68" stroke="#00AEEF" strokeWidth="2" fill="none" />
              <path d="M80,22 C55,22 38,42 38,64 C38,94 80,142 80,142 C80,142 122,94 122,64 C122,42 105,22 80,22 Z" stroke="#00AEEF" strokeWidth="2.5" fill="none" />
              <circle cx="80" cy="66" r="30" stroke="#53D8FB" strokeWidth="2" fill="none" />
              <circle cx="80" cy="66" r="22" stroke="#DCE6F280" strokeWidth="1.5" fill="none" />
              <path d="M65,66 L75,78 L97,52" stroke="#53D8FB" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="splash-overlay"
      key="splash"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Background layers */}
      <div className="splash-grid" />
      <div className="splash-vignette" />
      <div className="splash-bloom splash-bloom-1" />
      <div className="splash-bloom splash-bloom-2" />
      {scene >= 3 && <div className="splash-bloom splash-bloom-3" />}

      {/* Scan line effect */}
      {scene >= 2 && scene < 8 && <div className="splash-scanline" />}

      {/* Scene 1+: Particles */}
      {scene >= 1 && <Particles particles={particles} />}

      {/* Scene 2+: City */}
      {scene >= 2 && <CitySkyline visible brighten={cityBrighten} />}

      {/* Scene 3-4: Energy formation */}
      <AnimatePresence>
        {scene >= 3 && scene < 5 && <EnergyFormation visible key="energy" />}
      </AnimatePresence>

      {/* Scene 4+: Logo + Brand */}
      {scene >= 4 && (
        <div className="splash-logo-area">
          <LogoConstruction visible phase={logoPhase} />
          {scene >= 6 && <BrandReveal visible />}
        </div>
      )}

      {/* Scene 5-7: Achievement tags */}
      <AnimatePresence>
        {scene >= 5 && scene < 8 && <AchievementTags visible key="tags" />}
      </AnimatePresence>

      {/* Scene 7: Pulse waves */}
      {scene >= 7 && (
        <>
          <div className="splash-pulse-wave" />
          <div className="splash-pulse-wave splash-pulse-wave-2" />
        </>
      )}

      {/* Progress bar */}
      <ProgressBar progress={progress} label={progressLabel} />
    </motion.div>
  );
};

export default SplashScreen;
