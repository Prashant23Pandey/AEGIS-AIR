import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Shield,
  Lock,
  Mail,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Radar,
  CloudSun,
  Zap,
  Activity
} from 'lucide-react';

export const AuthScreen: React.FC = () => {
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState<boolean>(false);

  // Form Fields
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  // State
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Video fallback and accessibility
  const [videoLoaded, setVideoLoaded] = useState<boolean>(true);
  const [videoFailed, setVideoFailed] = useState<boolean>(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);
  const [overlayStyle, setOverlayStyle] = useState<'subtle' | 'cinema'>('subtle');
  const videoRef = useRef<HTMLVideoElement>(null);

  // Check prefers-reduced-motion media query
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);

      const handleChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  // Ensure video autoplays reliably with sound muted
  useEffect(() => {
    const video = videoRef.current;
    if (!video || prefersReducedMotion) return;

    video.muted = true;
    const playVideo = () => {
      const promise = video.play();
      if (promise !== undefined) {
        promise.catch((err) => {
          console.warn('[AEGIS AIR] Video autoplay waiting for interaction:', err);
        });
      }
    };

    if (video.readyState >= 2) {
      setVideoLoaded(true);
      playVideo();
    }

    const onReady = () => {
      setVideoLoaded(true);
      playVideo();
    };

    video.addEventListener('loadeddata', onReady);
    video.addEventListener('canplay', onReady);
    video.addEventListener('playing', () => setVideoLoaded(true));

    playVideo();

    return () => {
      video.removeEventListener('loadeddata', onReady);
      video.removeEventListener('canplay', onReady);
    };
  }, [prefersReducedMotion]);

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessNotice(null);

    // Validation
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must contain at least 6 characters.');
      return;
    }

    if (isSignUp) {
      if (!fullName.trim()) {
        setErrorMessage('Please provide your full name for operator credentials.');
        return;
      }

      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match. Please verify your credentials.');
        return;
      }
    }

    setSubmitting(true);

    try {
      if (isSignUp) {
        const { error, user } = await signUp(cleanEmail, password, fullName.trim());
        if (error) {
          if (error.message.toLowerCase().includes('rate limit')) {
            setErrorMessage(
              'Supabase email rate limit exceeded (free tier limit: 3-4 emails/hr). If your account was already created, switch to the "Operator Login" tab. To allow instant registration without email limits, disable "Confirm email" in Supabase Dashboard → Authentication → Providers → Email.'
            );
          } else {
            setErrorMessage(error.message);
          }
        } else {
          if (user?.identities && user.identities.length === 0) {
            setErrorMessage('An operator account with this email address already exists. Please sign in via the "Operator Login" tab.');
          } else {
            setSuccessNotice(
              'Operator account registered! If email confirmation is enabled, check your inbox; otherwise switch to Login now.'
            );
          }
        }
      } else {
        const { error } = await signIn(cleanEmail, password);
        if (error) {
          if (error.message.toLowerCase().includes('email not confirmed')) {
            setErrorMessage(
              'Email not confirmed yet. Check your inbox for the Supabase confirmation link, or disable "Confirm email" in Supabase Dashboard → Authentication → Providers → Email.'
            );
          } else if (error.message.toLowerCase().includes('invalid login credentials')) {
            setErrorMessage(
              'Invalid operator credentials. This account does not exist in your Supabase project yet (or the password was incorrect). Please create this user in your Supabase Dashboard under Authentication → Users, or turn off "Confirm email" in Supabase to register directly.'
            );
          } else {
            setErrorMessage(error.message);
          }
        }
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Authentication request failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex flex-col justify-between bg-[#040814] text-white selection:bg-creator-pink selection:text-pitch-black">
      {/* 1. Full-screen Video Background with Fallback & Reduced-Motion Handling */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
        {/* Fallback gradient if video fails, is loading, or reduced motion is active */}
        {(!videoLoaded || videoFailed || prefersReducedMotion) && (
          <div className="absolute inset-0 bg-gradient-to-br from-[#040814] via-[#08152B] to-[#02050E] dot-grid transition-opacity duration-500" />
        )}

        {/* Video Element */}
        {!prefersReducedMotion && (
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            onError={() => {
              console.warn('[AEGIS AIR] Background video failed to load, switching to tactical gradient fallback.');
              setVideoFailed(true);
            }}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
              videoFailed ? 'hidden' : videoLoaded ? 'opacity-100' : 'opacity-90'
            }`}
          >
            <source src="/videos/intro.mp4" type="video/mp4" />
          </video>
        )}

        {/* 2. Subtle Navy Overlay - keeps video vibrantly visible while ensuring text contrast */}
        {/* Base subtle navy tint (20% in cinema, 30% in subtle) */}
        <div
          className={`absolute inset-0 transition-colors duration-500 ${
            overlayStyle === 'cinema' ? 'bg-[#030919]/15' : 'bg-[#030919]/30'
          }`}
        />

        {/* Directional gradient on left side to guarantee high contrast for hero text */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#030919]/80 via-[#030919]/35 to-transparent w-full lg:w-2/3 pointer-events-none" />

        {/* Gentle vertical edge vignette */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#030919]/40 via-transparent to-[#030919]/50 pointer-events-none" />
      </div>

      {/* Top Animated Marquee Ticker Tape */}
      <div className="relative z-10 bg-creator-pink border-b border-pitch-black py-1.5 overflow-hidden select-none shadow-md">
        <div className="flex animate-marquee whitespace-nowrap">
          <span className="flex items-center text-xs font-display font-bold uppercase tracking-[0.14em] text-pitch-black">
            AEGIS AIR · NATIONAL C-UAS DEFENSE DEMONSTRATION <span className="mx-4 text-pitch-black/30">◆</span>
          </span>
          <span className="flex items-center text-xs font-display font-bold uppercase tracking-[0.14em] text-pitch-black">
            HIGH-ASSURANCE AIRSPACE INTELLIGENCE <span className="mx-4 text-pitch-black/30">◆</span>
          </span>
          <span className="flex items-center text-xs font-display font-bold uppercase tracking-[0.14em] text-pitch-black">
            SUPABASE ROW LEVEL SECURITY ENFORCED <span className="mx-4 text-pitch-black/30">◆</span>
          </span>
          <span className="flex items-center text-xs font-display font-bold uppercase tracking-[0.14em] text-pitch-black">
            SEE THE SKY. UNDERSTAND THE RISK. <span className="mx-4 text-pitch-black/30">◆</span>
          </span>
          <span className="flex items-center text-xs font-display font-bold uppercase tracking-[0.14em] text-pitch-black">
            DETERMINISTIC SIMULATION ENGINE READY <span className="mx-4 text-pitch-black/30">◆</span>
          </span>
          <span className="flex items-center text-xs font-display font-bold uppercase tracking-[0.14em] text-pitch-black">
            AEGIS AIR · NATIONAL C-UAS DEFENSE DEMONSTRATION <span className="mx-4 text-pitch-black/30">◆</span>
          </span>
          <span className="flex items-center text-xs font-display font-bold uppercase tracking-[0.14em] text-pitch-black">
            HIGH-ASSURANCE AIRSPACE INTELLIGENCE <span className="mx-4 text-pitch-black/30">◆</span>
          </span>
        </div>
      </div>

      {/* Main Content: Split-Screen Hero + Authentication Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8 sm:px-6 lg:px-12 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center w-full">

          {/* Left Column: Brand Hero & Product Introduction */}
          <div className="lg:col-span-7 space-y-6 text-left">
            {/* Brand Header */}
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl tracking-[-0.03em] text-white flex items-center gap-2 leading-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                AEGIS <span className="marker-pink text-sm sm:text-base tracking-normal">AIR</span>
              </h1>
              <span className="px-3 py-1 rounded-full text-2xs font-mono font-bold tracking-widest uppercase bg-sunshine-yellow text-pitch-black border border-pitch-black shadow-[2px_2px_0px_#0D0D0D]">
                v2.6 PROTO · C-UAS
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-lime-glow/20 text-lime-acid border border-lime-glow/40 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-lime-glow animate-pulse" />
                DEFENSE READY
              </span>
              <button
                type="button"
                onClick={() => setOverlayStyle((prev) => (prev === 'subtle' ? 'cinema' : 'subtle'))}
                className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-sky-500/20 text-sky-300 border border-sky-400/40 hover:bg-sky-500/35 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                title="Toggle between Cinema Clear and Tactical Navy overlay"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                <span>{overlayStyle === 'cinema' ? 'MODE: CINEMA CLEAR' : 'MODE: SUBTLE NAVY'}</span>
              </button>
            </div>

            {/* Headline */}
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white tracking-tight leading-[1.08] drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]">
              See the Sky.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-creator-pink via-sunshine-yellow to-lime-glow">
                Understand the Risk.
              </span>
            </h2>

            {/* Short Product Introduction */}
            <p className="text-sm sm:text-base text-slate-100 font-sans leading-relaxed max-w-xl drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">
              An enterprise situational awareness and counter-drone defense platform engineered for modern airspace monitoring.
              Combines deterministic multi-target kinematics, live atmospheric intelligence from Open-Meteo,
              real-time RF threat interception, and precision electronic/kinetic countermeasures.
            </p>

            {/* Tactical Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 max-w-2xl">
              <div className="p-3.5 rounded-xl bg-[#060D1E]/70 border border-white/15 backdrop-blur-md shadow-lg">
                <div className="flex items-center gap-2 text-creator-pink mb-1 font-mono text-xs font-bold">
                  <Radar className="w-4 h-4" />
                  <span>10.0 KM RADAR</span>
                </div>
                <p className="text-2xs text-slate-400 font-sans">
                  Dual-projection orthographic vector & Leaflet WGS84 GIS mapping.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#09152C]/80 border border-white/10 backdrop-blur-sm shadow-md">
                <div className="flex items-center gap-2 text-sunshine-yellow mb-1 font-mono text-xs font-bold">
                  <CloudSun className="w-4 h-4" />
                  <span>ATMOSPHERIC INTEL</span>
                </div>
                <p className="text-2xs text-slate-400 font-sans">
                  Live Open-Meteo wind vectors & UAS operational flight envelopes.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#09152C]/80 border border-white/10 backdrop-blur-sm shadow-md">
                <div className="flex items-center gap-2 text-lime-glow mb-1 font-mono text-xs font-bold">
                  <Zap className="w-4 h-4" />
                  <span>C-UAS DEFENSE</span>
                </div>
                <p className="text-2xs text-slate-400 font-sans">
                  RF Jamming, GNSS spoofing, kinetic capture & EMP simulation.
                </p>
              </div>
            </div>

            {/* Security Notice */}
            <div className="flex items-center gap-2 text-2xs font-mono text-slate-400 pt-1">
              <Shield className="w-3.5 h-3.5 text-lime-glow" />
              <span>Protected by Supabase Authentication & Row Level Security (RLS)</span>
            </div>
          </div>

          {/* Right Column: Premium Authentication Card */}
          <div className="lg:col-span-5 w-full flex justify-center lg:justify-end">
            <div className="w-full max-w-md pop-card rounded-2xl bg-white text-pitch-black border border-pitch-black shadow-[5px_5px_0px_#0D0D0D] overflow-hidden">

              {/* Card Header & Tab Switcher */}
              <div className="px-6 sm:px-8 pt-7 pb-5 border-b border-pitch-black bg-surface-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-creator-pink animate-pulse" />
                    <span className="font-display font-extrabold text-sm uppercase tracking-wider text-pitch-black">
                      Tactical Operator Console
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-sunshine-yellow text-pitch-black border border-pitch-black shadow-[1px_1px_0px_#0D0D0D]">
                    ACCESS GATE
                  </span>
                </div>
                <p className="text-2xs text-ink-500 font-mono">
                  {isSignUp
                    ? 'Register authorized operator credentials'
                    : 'Sign in to access real-time radar telemetry'}
                </p>

                {/* Tab Switcher Pills */}
                <div className="mt-4 flex rounded-full border border-pitch-black bg-white p-0.5 shadow-[1.5px_1.5px_0px_#0D0D0D]">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(false);
                      setErrorMessage(null);
                      setSuccessNotice(null);
                    }}
                    className={`flex-1 py-1.5 rounded-full text-xs font-mono font-bold transition-all ${
                      !isSignUp
                        ? 'bg-pitch-black text-white shadow-xs'
                        : 'text-pitch-black hover:bg-surface-2'
                    }`}
                  >
                    Operator Login
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(true);
                      setErrorMessage(null);
                      setSuccessNotice(null);
                    }}
                    className={`flex-1 py-1.5 rounded-full text-xs font-mono font-bold transition-all ${
                      isSignUp
                        ? 'bg-pitch-black text-white shadow-xs'
                        : 'text-pitch-black hover:bg-surface-2'
                    }`}
                  >
                    Create Account
                  </button>
                </div>
              </div>

              {/* Authentication Form */}
              <form onSubmit={handleSubmit} className="px-6 sm:px-8 py-6 space-y-4 text-left">
                {/* Error Banner */}
                {errorMessage && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-pitch-black shadow-[2px_2px_0px_#0D0D0D] text-xs font-mono text-red-900 animate-fadeIn space-y-2">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 leading-snug">{errorMessage}</div>
                    </div>
                    {isSignUp && (
                      <div className="pt-2 border-t border-red-200 flex items-center justify-between gap-2">
                        <span className="text-[10px] text-red-800 font-sans">Already signed up?</span>
                        <button
                          type="button"
                          onClick={() => {
                            setIsSignUp(false);
                            setErrorMessage(null);
                          }}
                          className="px-2.5 py-1 rounded bg-pitch-black text-white text-[10px] font-mono font-bold hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          Switch to Operator Login →
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Success Banner */}
                {successNotice && (
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-lime-glow/20 border border-pitch-black shadow-[1.5px_1.5px_0px_#0D0D0D] text-xs font-mono text-pitch-black animate-fadeIn">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 leading-snug">{successNotice}</div>
                  </div>
                )}

                {/* Registration Field: Full Name */}
                {isSignUp && (
                  <div>
                    <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-pitch-black mb-1">
                      Operator Full Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-ink-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Commander Sarah Chen"
                        className="w-full text-xs font-mono pl-9 pr-3 py-2 rounded-xl border border-pitch-black bg-surface-0 text-pitch-black shadow-[1.5px_1.5px_0px_#0D0D0D] focus:outline-none focus:ring-1 focus:ring-pitch-black"
                      />
                    </div>
                  </div>
                )}

                {/* Email Address */}
                <div>
                  <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-pitch-black mb-1">
                    Operator Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-ink-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="operator@aegisair.defense"
                      className="w-full text-xs font-mono pl-9 pr-3 py-2 rounded-xl border border-pitch-black bg-surface-0 text-pitch-black shadow-[1.5px_1.5px_0px_#0D0D0D] focus:outline-none focus:ring-1 focus:ring-pitch-black"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-pitch-black">
                      Security Key / Password
                    </label>
                    <span className="text-[10px] font-mono text-ink-400">Min 6 characters</span>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-ink-400 absolute left-3 top-2.5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full text-xs font-mono pl-9 pr-10 py-2 rounded-xl border border-pitch-black bg-surface-0 text-pitch-black shadow-[1.5px_1.5px_0px_#0D0D0D] focus:outline-none focus:ring-1 focus:ring-pitch-black"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2 text-ink-400 hover:text-pitch-black focus:outline-none"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Registration Field: Confirm Password */}
                {isSignUp && (
                  <div>
                    <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-pitch-black mb-1">
                      Confirm Security Key
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-ink-400 absolute left-3 top-2.5" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full text-xs font-mono pl-9 pr-10 py-2 rounded-xl border border-pitch-black bg-surface-0 text-pitch-black shadow-[1.5px_1.5px_0px_#0D0D0D] focus:outline-none focus:ring-1 focus:ring-pitch-black"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-2 text-ink-400 hover:text-pitch-black focus:outline-none"
                        title={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Submit Action Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-pop w-full py-2.5 px-4 rounded-xl border border-pitch-black bg-sunshine-yellow hover:bg-sunshine-yellowHover text-pitch-black font-display font-extrabold text-sm tracking-wide shadow-[2px_2px_0px_#0D0D0D] flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {submitting ? (
                      <span className="font-mono text-xs font-bold flex items-center gap-2">
                        <span className="w-3.5 h-3.5 rounded-full border-2 border-pitch-black border-t-transparent animate-spin" />
                        AUTHENTICATING...
                      </span>
                    ) : (
                      <>
                        <span>{isSignUp ? 'REGISTER OPERATOR ACCOUNT' : 'ENTER TACTICAL CONSOLE'}</span>
                        <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                      </>
                    )}
                  </button>
                </div>

                {/* Footnote */}
                <div className="pt-2 flex items-center justify-center gap-1.5 text-[10px] font-mono text-ink-500 text-center">
                  <Shield className="w-3.5 h-3.5 text-pitch-black" />
                  <span>Encrypted session · Zero plain-text credentials stored</span>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Footer Bar */}
      <footer className="relative z-10 border-t border-white/10 bg-[#040814]/90 backdrop-blur-md px-4 sm:px-8 py-3 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-display font-bold text-white tracking-wide">AEGIS AIR DEFENSE</span>
          <span className="text-white/20">·</span>
          <span className="font-mono text-2xs text-slate-400">RESTRICTED OPERATIONAL C-UAS SURVEILLANCE</span>
        </div>
        <div className="flex items-center gap-3 text-2xs font-mono text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-lime-glow animate-pulse" />
            <span>SESSION ENCRYPTION ACTIVE</span>
          </span>
          <span className="text-white/20">|</span>
          <span>AUTONOMOUS KINEMATICS ENGINE</span>
        </div>
      </footer>
    </div>
  );
};
