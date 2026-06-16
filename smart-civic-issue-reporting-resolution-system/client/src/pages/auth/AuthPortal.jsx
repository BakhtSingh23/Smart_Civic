import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';

// ── SVG Icons ──────────────────────────────────────────────────────────────
const PATHS = {
  envelope: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  lock:     "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
  person:   "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  phone:    "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z",
  eye:      "M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
  eyeOff:   "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.976 9.976 0 012.146-3.57M9.913 6.241A9.023 9.023 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.017 10.017 0 01-2.012 3.59m-1.933-1.933a3 3 0 00-4.243-4.243m4.242 4.242L9.88 9.88",
};

const Icon = ({ name, size = 20, color = '#94A3B8' }) => (
  <svg width={size} height={size} fill="none" stroke={color} viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={PATHS[name]} />
  </svg>
);



// ── Framer Motion Variants ─────────────────────────────────────────────────
// Isolated animation config — all transition logic lives here.

/** Form container: fade + scale on enter/exit */
const formVariants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: [0.42, 0, 0.58, 1],        // easeInOut
      when: 'beforeChildren',
      staggerChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.4, ease: [0.42, 0, 0.58, 1] },
  },
};

/** Child element: subtle slide-up + fade, staggered by parent */
const childVariant = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  exit:    { opacity: 0, y: -6, transition: { duration: 0.2 } },
};

// ── Minimal CSS (custom effects Tailwind can't express) ────────────────────
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

/* ── Particle floating keyframes ───────────────────────────────────── */
@keyframes ap-float-a {
  0%, 100% { transform: translate(0, 0); opacity: 0.18; }
  50%      { transform: translate(8px, -20px); opacity: 0.35; }
}
@keyframes ap-float-b {
  0%, 100% { transform: translate(0, 0); opacity: 0.12; }
  50%      { transform: translate(-10px, 18px); opacity: 0.32; }
}
@keyframes ap-float-c {
  0%, 100% { transform: translate(0, 0); opacity: 0.15; }
  50%      { transform: translate(6px, 22px); opacity: 0.4; }
}
.ap-pa { animation: ap-float-a 3.5s ease-in-out infinite; }
.ap-pb { animation: ap-float-b 4.2s ease-in-out infinite; }
.ap-pc { animation: ap-float-c 5s   ease-in-out infinite; }

/* ── Input focus glow ──────────────────────────────────────────────── */
.ap-input:focus {
  outline: none;
  border-color: var(--pg) !important;
  background: rgba(10,22,40,0.95) !important;
  box-shadow: 0 0 0 3px var(--pg-focus), 0 0 16px var(--pg-glow);
}
.ap-input::placeholder { color: #475569; }

/* ── Submit button glow hover ──────────────────────────────────────── */
.ap-btn { position: relative; overflow: hidden; }
.ap-btn::before {
  content: '';
  position: absolute; inset: 0;
  border-radius: 12px;
  opacity: 0;
  background: radial-gradient(circle at center, rgba(255,255,255,0.15) 0%, transparent 70%);
  transition: opacity 0.35s;
}
.ap-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  filter: brightness(1.12);
  box-shadow: 0 8px 28px rgba(0,0,0,0.35), 0 0 24px var(--pg-glow), 0 0 48px var(--pg-glow);
}
.ap-btn:hover:not(:disabled)::before { opacity: 1; }
.ap-btn:active:not(:disabled) { transform: translateY(0); }

/* ── Password strength bars ────────────────────────────────────────── */
.s1 .ap-sd:nth-child(1) { background: #F43F5E; }
.s2 .ap-sd:nth-child(-n+2) { background: #F59E0B; }
.s3 .ap-sd { background: #10B981; }

/* ── Animated border glow ──────────────────────────────────────────── */
@keyframes ap-border-glow {
  0%, 100% { border-color: rgba(59,130,246,0.15); box-shadow: 0 0 30px rgba(59,130,246,0.06); }
  50%      { border-color: rgba(59,130,246,0.30); box-shadow: 0 0 50px rgba(59,130,246,0.10); }
}
@keyframes ap-border-glow-green {
  0%, 100% { border-color: rgba(16,185,129,0.15); box-shadow: 0 0 30px rgba(16,185,129,0.06); }
  50%      { border-color: rgba(16,185,129,0.30); box-shadow: 0 0 50px rgba(16,185,129,0.10); }
}
.ap-glow-blue  { animation: ap-border-glow 4s ease-in-out infinite; }
.ap-glow-green { animation: ap-border-glow-green 4s ease-in-out infinite; }

/* ── Responsive ────────────────────────────────────────────────────── */
@media (max-width: 520px) {
  .ap-inner-pad { padding: 28px 24px 24px !important; }
  .ap-title-text { font-size: 1.5rem !important; }
  .ap-box-card { border-radius: 18px !important; }
}
`;

// ── Shared input className ─────────────────────────────────────────────────
const INPUT_CLS =
  'ap-input w-full h-[52px] bg-[rgba(10,22,40,0.6)] border border-white/10 ' +
  'rounded-xl pl-12 pr-12 text-sky-50 text-base transition-all duration-[400ms] ' +
  'backdrop-blur-sm';

const FLOAT_CLASSES = ['ap-pa', 'ap-pb', 'ap-pc'];

// ── Main Component ─────────────────────────────────────────────────────────
export default function AuthPortal() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { login, register, user, loading } = useAuth();

  const initMode = location.pathname === '/register' ? 'register' : 'login';
  const [mode, setMode]         = useState(initMode);
  const [busy, setBusy]         = useState(false);
  const [showPw, setShowPw]     = useState(false);
  const [strength, setStrength] = useState(0);
  const [errors, setErrors]     = useState({});
  const [form, setForm]         = useState({ name: '', email: '', phone: '', password: '', confirm: '' });

  const boxControls = useAnimation();

  const isLogin = mode === 'login';
  const pg      = isLogin ? '#3B82F6' : '#10B981';

  // ── Redirect if already authenticated ──────────────────────────────────
  useEffect(() => {
    if (!loading && user) navigate(`/${user.role?.toLowerCase() || 'citizen'}/dashboard`);
  }, [user, loading, navigate]);

  // ── Sync mode with URL ─────────────────────────────────────────────────
  useEffect(() => {
    const t = location.pathname === '/register' ? 'register' : 'login';
    if (t !== mode) setMode(t);
  }, [location.pathname]);

  // ── Password strength calculator ───────────────────────────────────────
  useEffect(() => {
    const p = form.password;
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
    if (/[0-9]/.test(p) && /[^A-Za-z0-9]/.test(p)) s++;
    setStrength(s);
  }, [form.password]);

  // ── Box entrance animation on mount ────────────────────────────────────
  useEffect(() => {
    boxControls.start({
      y: 0, opacity: 1, scale: 1,
      transition: { duration: 1, ease: [0.16, 1, 0.3, 1] },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Mode switch (AnimatePresence handles exit/enter automatically) ─────
  const switchMode = useCallback((next) => {
    if (next === mode) return;
    setErrors({});
    setMode(next);
    navigate(`/${next}`);
  }, [mode, navigate]);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  // ── Form submission ────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      if (isLogin) {
        const res = await login(form.email, form.password);
        // Success pulse
        boxControls.start({
          scale: [1, 1.03, 1],
          transition: { duration: 0.7, ease: 'easeInOut' },
        });
        setTimeout(() => navigate(`/${res.user.role?.toLowerCase() || 'citizen'}/dashboard`), 700);
      } else {
        if (form.password !== form.confirm) throw new Error('Passwords do not match');
        await register(form.name, form.email, form.password, form.phone);
        switchMode('login');
      }
    } catch (err) {
      // Error shake
      boxControls.start({
        x: [0, -8, 8, -6, 6, -4, 4, 0],
        transition: { duration: 0.45, ease: 'easeInOut' },
      });
      setErrors({ g: err.response?.data?.message || err.message });
    } finally {
      setBusy(false);
    }
  };

  // ── Ambient particles (memoised) ───────────────────────────────────────
  const particles = useMemo(() => Array.from({ length: 28 }, (_, i) => ({
    id: i,
    cx: `${Math.random() * 100}%`,
    cy: `${Math.random() * 100}%`,
    r:  Math.random() * 1.5 + .5,
  })), []);

  const cssVars = {
    '--pg':      pg,
    '--pg-dim':  isLogin ? 'rgba(59,130,246,.25)' : 'rgba(16,185,129,.25)',
    '--pg-glow': isLogin ? 'rgba(59,130,246,.15)' : 'rgba(16,185,129,.15)',
    '--pg-focus': isLogin ? 'rgba(59,130,246,.18)' : 'rgba(16,185,129,.18)',
  };

  return (
    <div
      className="w-screen min-h-screen flex items-center justify-center overflow-y-auto relative py-8"
      style={{
        fontFamily: "'Inter', sans-serif",
        color: '#F0F9FF',
        background: '#050D1A',
        ...cssVars,
      }}
    >
      <style>{STYLES}</style>

      {/* ── Background image ─────────────────────────────────────────────── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'url(/assets/background.jfif)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />

      {/* ── Dark overlay for form readability ─────────────────────────────── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(5,13,26,0.55) 0%, rgba(5,13,26,0.35) 40%, rgba(5,13,26,0.65) 100%)',
        }}
      />

      {/* ── Subtle grid overlay ──────────────────────────────────────────── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(30,64,175,0.04) 1px, transparent 1px), ' +
            'linear-gradient(90deg, rgba(30,64,175,0.04) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* ── Ambient particles ────────────────────────────────────────────── */}
      <svg className="absolute inset-0 pointer-events-none z-[1]" aria-hidden="true">
        {particles.map((p) => (
          <circle
            key={p.id}
            cx={p.cx}
            cy={p.cy}
            r={p.r}
            fill={pg}
            opacity=".18"
            className={FLOAT_CLASSES[p.id % 3]}
          />
        ))}
      </svg>

      {/* ── Back to Home ─────────────────────────────────────────────────── */}
      <motion.a
        className="absolute top-6 left-7 flex items-center gap-1.5 text-slate-500 text-sm font-semibold cursor-pointer z-20 no-underline"
        onClick={() => navigate('/')}
        whileHover={{ x: -3, color: pg }}
        transition={{ duration: 0.2 }}
      >
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back to Home
      </motion.a>

      <div className="relative z-10 flex flex-col items-center">

        {/* ── Portal Box ─────────────────────────────────────────────────── */}
        <motion.div
          layout
          className={`ap-box-card relative overflow-hidden rounded-2xl border ${isLogin ? 'ap-glow-blue' : 'ap-glow-green'}`}
          style={{
            width: 'clamp(340px, 90vw, 460px)',
            background: 'linear-gradient(165deg, rgba(8,18,38,0.82) 0%, rgba(4,12,28,0.92) 50%, rgba(2,8,20,0.96) 100%)',
            backdropFilter: 'blur(28px) saturate(1.4)',
            WebkitBackdropFilter: 'blur(28px) saturate(1.4)',
            borderColor: 'rgba(255,255,255,0.08)',
            boxShadow:
              '0 32px 64px rgba(0,0,0,0.55), ' +
              '0 0 0 1px rgba(255,255,255,0.04), ' +
              'inset 0 1px 0 rgba(255,255,255,0.08), ' +
              'inset 0 -1px 0 rgba(0,0,0,0.2)',
          }}
          initial={{ y: 50, opacity: 0, scale: 0.95 }}
          animate={boxControls}
          transition={{ layout: { duration: 0.55, ease: [0.77, 0, 0.175, 1] } }}
        >
          {/* Top edge light sheen */}
          <div
            className="absolute top-0 left-0 right-0 h-[1px] pointer-events-none z-10"
            style={{ background: `linear-gradient(90deg, transparent 0%, ${pg}44 30%, ${pg}66 50%, ${pg}44 70%, transparent 100%)` }}
          />

          {/* ── Form area ──────────────────────────────────────────────── */}
          <div className="ap-inner-pad py-9 px-10 relative z-[5]">

            {/* Tab nav — outside AnimatePresence so tabs never exit/enter */}
            <div className="flex bg-black/45 border border-white/[0.08] rounded-[14px] p-[5px] gap-1 mb-7 relative">
              {['login', 'register'].map((tab) => (
                <div
                  key={tab}
                  className={`
                    flex-1 py-[11px] px-2 text-center text-[15px] font-bold
                    rounded-[10px] cursor-pointer select-none relative z-[2]
                    transition-all duration-[350ms]
                    ${mode === tab
                      ? 'text-white'
                      : 'text-slate-500 hover:text-slate-400 hover:bg-white/[0.04]'}
                  `}
                  style={
                    mode === tab
                      ? { background: pg, boxShadow: `0 4px 20px rgba(0,0,0,0.3), 0 0 24px var(--pg-glow)` }
                      : undefined
                  }
                  onClick={() => switchMode(tab)}
                >
                  {tab === 'login' ? '🔑 Login' : '📋 Register'}
                </div>
              ))}
            </div>

            {/* ── Animated form content ─────────────────────────────────── */}
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                variants={formVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                {/* Heading */}
                <motion.div variants={childVariant} className="mb-6">
                  <h1 className="ap-title-text text-[1.9rem] font-black tracking-tight leading-tight mb-1.5">
                    {isLogin ? 'Welcome Back.' : 'Get Started.'}
                  </h1>
                  <p className="text-base text-slate-500 leading-relaxed">
                    {isLogin
                      ? 'Sign in to your civic account to continue.'
                      : 'Create your secure citizen account today.'}
                  </p>
                </motion.div>

                {/* Error */}
                {errors.g && (
                  <motion.div
                    variants={childVariant}
                    className="bg-rose-500/10 border border-rose-500/30 rounded-[10px] py-3 px-4 text-[0.9rem] mb-3.5 flex items-center gap-2 text-rose-400"
                  >
                    ⚠ {errors.g}
                  </motion.div>
                )}

                <form onSubmit={handleSubmit}>
                  {/* ── Name (register only) ───────────────────────────── */}
                  {!isLogin && (
                    <motion.div variants={childVariant} className="relative mb-4">
                      <span className="absolute left-[15px] top-1/2 -translate-y-1/2 pointer-events-none z-[2]">
                        <Icon name="person" />
                      </span>
                      <input
                        className={INPUT_CLS}
                        style={{ fontFamily: "'Inter', sans-serif" }}
                        type="text"
                        placeholder="Full Name"
                        required
                        value={form.name}
                        onChange={set('name')}
                      />
                    </motion.div>
                  )}

                  {/* ── Email ───────────────────────────────────────────── */}
                  <motion.div variants={childVariant} className="relative mb-4">
                    <span className="absolute left-[15px] top-1/2 -translate-y-1/2 pointer-events-none z-[2]">
                      <Icon name="envelope" />
                    </span>
                    <input
                      className={INPUT_CLS}
                      style={{ fontFamily: "'Inter', sans-serif" }}
                      type="email"
                      placeholder="Email Address"
                      required
                      value={form.email}
                      onChange={set('email')}
                    />
                  </motion.div>

                  {/* ── Phone (register only) ──────────────────────────── */}
                  {!isLogin && (
                    <motion.div variants={childVariant} className="relative mb-4">
                      <span className="absolute left-[15px] top-1/2 -translate-y-1/2 pointer-events-none z-[2]">
                        <Icon name="phone" />
                      </span>
                      <input
                        className={INPUT_CLS}
                        style={{ fontFamily: "'Inter', sans-serif" }}
                        type="tel"
                        placeholder="Phone Number"
                        required
                        value={form.phone}
                        onChange={set('phone')}
                      />
                    </motion.div>
                  )}

                  {/* ── Password ───────────────────────────────────────── */}
                  <motion.div variants={childVariant} className="relative mb-4">
                    <span className="absolute left-[15px] top-1/2 -translate-y-1/2 pointer-events-none z-[2]">
                      <Icon name="lock" />
                    </span>
                    <input
                      className={INPUT_CLS}
                      style={{ fontFamily: "'Inter', sans-serif" }}
                      type={showPw ? 'text' : 'password'}
                      placeholder="Password"
                      required
                      value={form.password}
                      onChange={set('password')}
                    />
                    <button
                      type="button"
                      className="absolute right-[14px] top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer p-1 text-slate-500 flex hover:text-slate-400 transition-colors duration-200"
                      onClick={() => setShowPw(v => !v)}
                    >
                      <Icon name={showPw ? 'eyeOff' : 'eye'} color="#64748B" size={18} />
                    </button>
                    {!isLogin && (
                      <div className={`flex gap-[5px] mt-2 s${strength}`}>
                        <div className="ap-sd h-1 flex-1 bg-white/[0.08] rounded-sm transition-colors duration-[400ms]" />
                        <div className="ap-sd h-1 flex-1 bg-white/[0.08] rounded-sm transition-colors duration-[400ms]" />
                        <div className="ap-sd h-1 flex-1 bg-white/[0.08] rounded-sm transition-colors duration-[400ms]" />
                      </div>
                    )}
                  </motion.div>

                  {/* ── Confirm password (register only) ───────────────── */}
                  {!isLogin && (
                    <motion.div variants={childVariant} className="relative mb-4">
                      <span className="absolute left-[15px] top-1/2 -translate-y-1/2 pointer-events-none z-[2]">
                        <Icon name="lock" />
                      </span>
                      <input
                        className={INPUT_CLS}
                        style={{ fontFamily: "'Inter', sans-serif" }}
                        type="password"
                        placeholder="Confirm Password"
                        required
                        value={form.confirm}
                        onChange={set('confirm')}
                      />
                      {form.password && form.confirm && (
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[1.1rem]">
                          {form.password === form.confirm ? '✅' : '❌'}
                        </span>
                      )}
                    </motion.div>
                  )}

                  {/* ── Forgot password (login only) ───────────────────── */}
                  {isLogin && (
                    <motion.div variants={childVariant} className="flex justify-end mb-4">
                      <button
                        type="button"
                        className="text-sm font-bold bg-transparent border-none cursor-pointer hover:opacity-75 transition-opacity duration-200"
                        style={{ color: pg }}
                        onClick={() => navigate('/forgot-password')}
                      >
                        Forgot Password?
                      </button>
                    </motion.div>
                  )}

                  {/* ── Submit ─────────────────────────────────────────── */}
                  <motion.div variants={childVariant}>
                    <button
                      type="submit"
                      className="ap-btn w-full h-[52px] rounded-xl border-none text-white text-[1.05rem] font-extrabold tracking-wider cursor-pointer mt-2 flex items-center justify-center gap-2.5 transition-all duration-[250ms] disabled:opacity-60 disabled:cursor-not-allowed"
                      style={{ background: pg }}
                      disabled={busy}
                    >
                      {busy ? 'Processing…' : isLogin ? 'Enter Portal →' : 'Create Account →'}
                    </button>
                  </motion.div>
                </form>

                {/* ── Footer link ──────────────────────────────────────── */}
                <motion.p variants={childVariant} className="mt-5 text-center text-[0.9rem] text-slate-500">
                  {isLogin ? (
                    <>
                      New here?{' '}
                      <span
                        className="font-extrabold cursor-pointer hover:underline transition-all duration-300"
                        style={{ color: pg }}
                        onMouseEnter={(e) => { e.target.style.textShadow = `0 0 8px var(--pg-glow)`; }}
                        onMouseLeave={(e) => { e.target.style.textShadow = 'none'; }}
                        onClick={() => switchMode('register')}
                      >
                        Join the platform
                      </span>
                    </>
                  ) : (
                    <>
                      Already a member?{' '}
                      <span
                        className="font-extrabold cursor-pointer hover:underline transition-all duration-300"
                        style={{ color: pg }}
                        onMouseEnter={(e) => { e.target.style.textShadow = `0 0 8px var(--pg-glow)`; }}
                        onMouseLeave={(e) => { e.target.style.textShadow = 'none'; }}
                        onClick={() => switchMode('login')}
                      >
                        Sign in here
                      </span>
                    </>
                  )}
                </motion.p>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
