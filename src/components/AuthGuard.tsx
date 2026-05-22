'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck, AlertCircle } from 'lucide-react';

// ===== INTERACTIVE DOG PHOTO EYE OVERLAY COMPONENT =====
// Render a highly interactive, animated vector SVG dog mascot that tracks input and hides its eyes
function DogPhotoWithInteractiveEyes({ focusField, usernameLength }: { 
  focusField: 'none' | 'username' | 'password'; 
  usernameLength: number;
}) {
  const isPasswordMode = focusField === 'password';
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isBlinking, setIsBlinking] = useState(false);

  // Mouse tracking logic when not in password mode
  useEffect(() => {
    if (focusField === 'password') return;

    const handleMouseMove = (e: MouseEvent) => {
      const container = document.getElementById('mascot-container');
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const containerCenterX = rect.left + rect.width / 2;
      const containerCenterY = rect.top + rect.height / 2;

      const dx = e.clientX - containerCenterX;
      const dy = e.clientY - containerCenterY;
      const angle = Math.atan2(dy, dx);
      const distance = Math.min(Math.sqrt(dx * dx + dy * dy), 350);

      const intensity = distance / 350;
      const x = Math.cos(angle) * intensity * 3.5;
      const y = Math.sin(angle) * intensity * 2.5;

      setMousePos({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [focusField]);

  // Occasional natural blinking
  useEffect(() => {
    if (isPasswordMode) return;

    const runBlink = () => {
      setIsBlinking(true);
      setTimeout(() => {
        setIsBlinking(false);
      }, 120);
    };

    let timeoutId: NodeJS.Timeout;
    const scheduleNextBlink = () => {
      const delay = Math.random() * 4000 + 3500;
      timeoutId = setTimeout(() => {
        runBlink();
        scheduleNextBlink();
      }, delay);
    };

    scheduleNextBlink();
    return () => clearTimeout(timeoutId);
  }, [isPasswordMode]);

  // Calculate eye look offsets based on focus state
  let eyeOffsetX = 0;
  let eyeOffsetY = 0;

  if (isPasswordMode) {
    eyeOffsetX = 0;
    eyeOffsetY = 0;
  } else if (focusField === 'username') {
    // Look down towards the username field, track typed text
    eyeOffsetX = Math.min(usernameLength * 0.25, 3.5) - 1.75;
    eyeOffsetY = 2.5; // looking down
  } else {
    // Follow mouse
    eyeOffsetX = mousePos.x;
    eyeOffsetY = mousePos.y;
  }

  const eyesClosed = isPasswordMode || isBlinking;

  return (
    <div 
      id="mascot-container" 
      className="relative w-48 h-48 mx-auto flex items-center justify-center select-none animate-float"
    >
      <svg 
        className="w-full h-full" 
        viewBox="0 0 200 200"
      >
        <defs>
          <radialGradient id="pawPadGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffb37c" />
            <stop offset="100%" stopColor="#d29d62" />
          </radialGradient>
          <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.15" />
          </filter>
        </defs>

        {/* 1. Body & Chest (Breathes gently) */}
        <g className="animate-breathe">
          <path d="M 65 170 Q 100 135 135 170 Q 160 200 160 200 L 40 200 Q 40 200 65 170 Z" fill="#1e1e1e" />
          <path d="M 82 170 Q 100 145 118 170 Q 130 190 130 200 L 70 200 Q 70 190 82 170 Z" fill="#c58c4f" />
        </g>

        {/* 2. Ears (Wiggle continuously, droop on password mode) */}
        <g style={{ 
          transform: isPasswordMode ? 'translateY(3px)' : 'none', 
          transition: 'transform 0.3s ease-out' 
        }}>
          {/* Left Ear */}
          <g className="animate-ear-left">
            <path d="M 55 58 Q 20 48 30 92 Q 55 88 55 58 Z" fill="#1e1e1e" />
            <path d="M 50 63 Q 26 55 35 83 Q 50 78 50 63 Z" fill="#c58c4f" />
          </g>
          {/* Right Ear */}
          <g className="animate-ear-right">
            <path d="M 145 58 Q 180 48 170 92 Q 145 88 145 58 Z" fill="#1e1e1e" />
            <path d="M 150 63 Q 174 55 165 83 Q 150 78 150 63 Z" fill="#c58c4f" />
          </g>
        </g>

        {/* 3. Main Face & Head */}
        <g filter="url(#shadow)">
          <ellipse cx="100" cy="115" rx="55" ry="46" fill="#1e1e1e" />
          
          <ellipse cx="80" cy="85" rx="8" ry="5" fill="#c58c4f" transform="rotate(-8 80 85)" />
          <ellipse cx="120" cy="85" rx="8" ry="5" fill="#c58c4f" transform="rotate(8 120 85)" />

          <circle cx="87" cy="126" r="15" fill="#c58c4f" />
          <circle cx="113" cy="126" r="15" fill="#c58c4f" />
          <path d="M 76 132 Q 100 154 124 132 Z" fill="#c58c4f" />
        </g>

        {/* 4. Eyes System */}
        <g>
          {/* Left Eye */}
          <g transform="translate(76, 100)">
            <ellipse cx="0" cy="0" rx="12" ry="11" fill="white" stroke="#121212" strokeWidth="0.5" />
            <g style={{ 
              transform: `translate(${eyeOffsetX}px, ${eyeOffsetY}px)`,
              transition: 'transform 0.1s ease-out',
              opacity: eyesClosed ? 0 : 1
            }}>
              <circle cx="0" cy="0" r="7.5" fill="#4E342E" />
              <circle cx="0" cy="0" r="4.5" fill="#000000" />
              <circle cx="2" cy="-2" r="1.8" fill="white" />
            </g>
            <path 
              d="M -13 -12 Q 0 -15 13 -12 Q 0 12 -13 -12" 
              fill="#1e1e1e" 
              style={{
                transform: eyesClosed ? 'scaleY(1)' : 'scaleY(0)',
                transformOrigin: '0px -11px',
                transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            />
            <path 
              d="M -9 1 Q 0 6 9 1" 
              fill="none" 
              stroke="#B57C43" 
              strokeWidth="2" 
              strokeLinecap="round"
              style={{
                opacity: isPasswordMode ? 1 : 0,
                transition: 'opacity 0.15s ease-in-out'
              }}
            />
          </g>

          {/* Right Eye */}
          <g transform="translate(124, 100)">
            <ellipse cx="0" cy="0" rx="12" ry="11" fill="white" stroke="#121212" strokeWidth="0.5" />
            <g style={{ 
              transform: `translate(${eyeOffsetX}px, ${eyeOffsetY}px)`,
              transition: 'transform 0.1s ease-out',
              opacity: eyesClosed ? 0 : 1
            }}>
              <circle cx="0" cy="0" r="7.5" fill="#4E342E" />
              <circle cx="0" cy="0" r="4.5" fill="#000000" />
              <circle cx="2" cy="-2" r="1.8" fill="white" />
            </g>
            <path 
              d="M -13 -12 Q 0 -15 13 -12 Q 0 12 -13 -12" 
              fill="#1e1e1e" 
              style={{
                transform: eyesClosed ? 'scaleY(1)' : 'scaleY(0)',
                transformOrigin: '0px -11px',
                transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            />
            <path 
              d="M -9 1 Q 0 6 9 1" 
              fill="none" 
              stroke="#B57C43" 
              strokeWidth="2" 
              strokeLinecap="round"
              style={{
                opacity: isPasswordMode ? 1 : 0,
                transition: 'opacity 0.15s ease-in-out'
              }}
            />
          </g>
        </g>

        {/* 5. Nose */}
        <path d="M 92 116 Q 100 109 108 116 Q 108 123 100 124 Q 92 123 92 116 Z" fill="#0d0d0d" />
        <circle cx="96" cy="113.5" r="1.2" fill="white" opacity="0.8" />

        {/* 6. Mouth */}
        <g>
          {isPasswordMode ? (
            <circle cx="100" cy="132" r="4" fill="#121212" />
          ) : (
            <path d="M 93 127 Q 96 131 100 129 Q 104 131 107 127" fill="none" stroke="#121212" strokeWidth="1.8" strokeLinecap="round" />
          )}
        </g>

        {/* 7. Interactive Peek-a-boo Paws */}
        {/* Left Paw */}
        <g style={{
          transform: isPasswordMode ? 'translate(20px, -65px) rotate(15deg)' : 'translate(0px, 40px)',
          transformOrigin: '50px 190px',
          transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}>
          <path d="M 30 190 Q 32 125 58 125 Q 84 125 86 190 Z" fill="#161616" filter="url(#shadow)" />
          <ellipse cx="58" cy="148" rx="9" ry="7" fill="url(#pawPadGrad)" />
          <circle cx="44" cy="138" r="3" fill="url(#pawPadGrad)" />
          <circle cx="58" cy="132" r="3.2" fill="url(#pawPadGrad)" />
          <circle cx="72" cy="138" r="3" fill="url(#pawPadGrad)" />
        </g>

        {/* Right Paw */}
        <g style={{
          transform: isPasswordMode ? 'translate(-20px, -65px) rotate(-15deg)' : 'translate(0px, 40px)',
          transformOrigin: '150px 190px',
          transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}>
          <path d="M 170 190 Q 168 125 142 125 Q 116 125 114 190 Z" fill="#161616" filter="url(#shadow)" />
          <ellipse cx="142" cy="148" rx="9" ry="7" fill="url(#pawPadGrad)" />
          <circle cx="128" cy="138" r="3" fill="url(#pawPadGrad)" />
          <circle cx="142" cy="132" r="3.2" fill="url(#pawPadGrad)" />
          <circle cx="156" cy="138" r="3" fill="url(#pawPadGrad)" />
        </g>
      </svg>
    </div>
  );
}

// ===== MAIN AUTH GUARD COMPONENT =====
export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusField, setFocusField] = useState<'none' | 'username' | 'password'>('none');

  useEffect(() => {
    const checkAuth = () => {
      const isAuth = document.cookie.split('; ').find(row => row.startsWith('session='));
      setAuthenticated(!!isAuth);
    };
    checkAuth();
    const interval = setInterval(checkAuth, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', username, password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAuthenticated(true);
      } else {
        setError(data.message || 'ভুল ইউজারনেম বা পাসওয়ার্ড!');
      }
    } catch {
      setError('সার্ভারে যোগাযোগ করতে ব্যর্থ হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  // Loading spinner
  if (authenticated === null) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#e3f2fd]">
        <div className="w-10 h-10 border-4 border-[#1976D2] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Login Screen
  if (!authenticated) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden font-sans"
        style={{ background: 'linear-gradient(160deg, #e3f2fd 0%, #bbdefb 35%, #90caf9 65%, #64b5f6 100%)' }}
      >
        {/* Animated floating orbs */}
        <div className="absolute top-[10%] left-[8%] w-48 h-48 bg-white/15 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-[15%] right-[10%] w-64 h-64 bg-blue-200/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-[50%] right-[5%] w-36 h-36 bg-white/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-[5%] left-[20%] w-28 h-28 bg-blue-300/15 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '0.5s' }} />

        {/* Main Login Card */}
        <div className="w-full max-w-[400px] bg-white/95 backdrop-blur-2xl rounded-[32px] shadow-2xl shadow-blue-900/15 border border-white/80 overflow-hidden relative p-8 space-y-6">
          
          {/* ===== TOP: Large Janata Bank Logo ===== */}
          <div className="flex justify-center pt-2">
            <img 
              src="/janata-bank-logo-original.png" 
              alt="Janata Bank PLC Logo" 
              className="h-16 w-auto object-contain max-w-full drop-shadow-sm" 
            />
          </div>

          {/* ===== MIDDLE: Original Dog Photo with Interactive Eyes ===== */}
          <div className="flex justify-center">
            <DogPhotoWithInteractiveEyes focusField={focusField} usernameLength={username.length} />
          </div>

          {/* ===== CONTENT AREA ===== */}
          <div className="space-y-4">
            
            {/* Branding Text */}
            <div className="text-center space-y-1.5">
              <h2 className="text-2xl font-black text-[#1565C0] tracking-wide">ডিউটি পোর্টাল লগইন</h2>
              
              {/* Duty Types - Styled Tags */}
              <div className="flex items-center justify-center gap-1.5 pt-1">
                <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-full border border-indigo-100">Late Sitting</span>
                <span className="text-slate-300 text-[10px]">•</span>
                <span className="px-2.5 py-0.5 bg-sky-50 text-sky-600 text-[10px] font-bold rounded-full border border-sky-100">Holiday</span>
                <span className="text-slate-300 text-[10px]">•</span>
                <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-full border border-emerald-100">Night Duty</span>
              </div>

              <p className="text-[11px] text-slate-400 font-medium">জনতা ব্যাংক পিএলসি.</p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4 pt-1">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-2.5 animate-shake">
                  <AlertCircle size={15} className="shrink-0" />
                  <span className="font-medium">{error}</span>
                </div>
              )}

              {/* Username */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#1976D2] uppercase tracking-[0.12em]">ইউজারনেম</label>
                <input
                  type="text"
                  required
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onFocus={() => { setFocusField('username'); setError(''); }}
                  onBlur={() => setFocusField('none')}
                  className="w-full px-4 py-3 rounded-xl border-2 border-blue-100 bg-blue-50/30 text-sm text-slate-800 focus:outline-none focus:border-[#42A5F5] focus:bg-white focus:shadow-md focus:shadow-blue-100/50 transition-all duration-300 placeholder:text-slate-400"
                />
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#1976D2] uppercase tracking-[0.12em]">পাসওয়ার্ড</label>
                <input
                  type="password"
                  required
                  placeholder="••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => { setFocusField('password'); setError(''); }}
                  onBlur={() => setFocusField('none')}
                  className="w-full px-4 py-3 rounded-xl border-2 border-blue-100 bg-blue-50/30 text-sm text-slate-800 focus:outline-none focus:border-[#42A5F5] focus:bg-white focus:shadow-md focus:shadow-blue-100/50 transition-all duration-300 placeholder:text-slate-400"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-[#1976D2] to-[#1565C0] hover:from-[#1565C0] hover:to-[#0D47A1] active:scale-[0.97] text-white rounded-xl text-sm font-bold transition-all duration-200 shadow-lg shadow-blue-400/30 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 tracking-wide"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <ShieldCheck size={18} />
                    <span>লগইন করুন</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* CSS Keyframe Animations for Mascot & Shake */}
        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-4px); }
          }
          @keyframes breathe {
            0%, 100% { transform: scaleY(1); }
            50% { transform: scaleY(1.02); }
          }
          @keyframes earWiggleLeft {
            0%, 100% { transform: rotate(0deg); }
            50% { transform: rotate(-5deg); }
          }
          @keyframes earWiggleRight {
            0%, 100% { transform: rotate(0deg); }
            50% { transform: rotate(5deg); }
          }
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            20% { transform: translateX(-6px); }
            40% { transform: translateX(6px); }
            60% { transform: translateX(-4px); }
            80% { transform: translateX(4px); }
          }
          .animate-float {
            animation: float 4s ease-in-out infinite;
          }
          .animate-breathe {
            animation: breathe 3s ease-in-out infinite;
            transform-origin: bottom center;
          }
          .animate-ear-left {
            animation: earWiggleLeft 2.5s ease-in-out infinite;
            transform-origin: 55px 58px;
          }
          .animate-ear-right {
            animation: earWiggleRight 2.5s ease-in-out infinite;
            transform-origin: 145px 58px;
          }
          .animate-shake {
            animation: shake 0.4s ease-in-out;
          }
        `}</style>
      </div>
    );
  }

  return <>{children}</>;
}
