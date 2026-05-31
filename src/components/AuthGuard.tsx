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
  const [userProfile, setUserProfile] = useState<any>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusField, setFocusField] = useState<'none' | 'username' | 'password'>('none');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth');
        const data = await res.json();
        if (res.ok && data.authenticated) {
          setAuthenticated(true);
          setUserProfile(data.user);
        } else {
          setAuthenticated(false);
          setUserProfile(null);
        }
      } catch (err) {
        console.error('Auth verification error:', err);
        setAuthenticated(false);
        setUserProfile(null);
      }
    };
    checkAuth();
    const interval = setInterval(checkAuth, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (userProfile) {
      localStorage.setItem('currentUser', JSON.stringify(userProfile));
      // Dispatch a storage event so components on the same tab are notified
      window.dispatchEvent(new Event('storage'));
    } else {
      localStorage.removeItem('currentUser');
      window.dispatchEvent(new Event('storage'));
    }
  }, [userProfile]);

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
        // Fetch detailed profile immediately
        const profileRes = await fetch('/api/auth');
        const profileData = await profileRes.json();
        if (profileRes.ok && profileData.authenticated) {
          setUserProfile(profileData.user);
        }
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
      <div className="min-h-screen w-full flex items-center justify-center bg-[#e3f2fd]" suppressHydrationWarning={true}>
        <div className="w-10 h-10 border-4 border-[#1976D2] border-t-transparent rounded-full animate-spin" suppressHydrationWarning={true} />
      </div>
    );
  }

  // Login Screen
  if (!authenticated) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden font-sans" suppressHydrationWarning={true}
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
          <div className="flex items-center justify-center gap-3 pt-2">
            <svg viewBox="0 0 512 512" className="h-12 w-12 shrink-0 text-[#00B7DE]" fill="none">
              <g>
                <path fill="currentColor" d="M175.7,351.4c-53.1,0-96.4-43.3-96.4-96.4c0-24.9,9.5-48.6,26.6-66.5l8.2,7.9c-15.1,15.8-23.5,36.7-23.5,58.7c0,46.9,38.1,85.1,85,85.1c46.9,0,85.1-38.2,85.1-85.1v-97.7h11.4v97.7C272.1,308.1,228.9,351.4,175.7,351.4z"/>
                <path fill="currentColor" d="M175.7,329.1c-41.3,0-74.9-33.6-74.9-74.9c0-19.4,7.3-37.7,20.7-51.7l8.2,7.9c-11.3,11.8-17.5,27.4-17.5,43.9c0,35.1,28.5,63.6,63.5,63.6c35.1,0,63.6-28.5,63.6-63.6v-96.9h11.4v96.9C250.7,295.4,217,329.1,175.7,329.1z"/>
                <path fill="currentColor" d="M175.7,306.8c-29.5,0-53.4-24-53.4-53.5c0-13.8,5.2-26.9,14.8-36.9l8.2,7.9c-7.5,7.8-11.6,18.2-11.6,29c0,23.2,18.9,42.1,42.1,42.1c23.2,0,42.1-18.9,42.1-42.1v-96.1h11.4v96.1C229.2,282.8,205.2,306.8,175.7,306.8z"/>
                <path fill="currentColor" d="M175.7,284.4c-17.6,0-32-14.3-32-32c0-8.3,3.1-16.1,8.8-22.1l8.2,7.9c-3.7,3.8-5.7,8.9-5.7,14.2c0,11.4,9.2,20.6,20.6,20.6c11.4,0,20.6-9.2,20.6-20.6v-95.2h11.4v95.2C207.7,270.1,193.3,284.4,175.7,284.4z"/>
                <path fill="currentColor" d="M400.1,255.1c9.9-7.8,15.9-19.8,15.9-32.7c0-23-18.7-41.6-41.6-41.6h-85.1v11.7h85.1c16.5,0,29.9,13.4,29.9,29.9c0,11.8-7,22.5-17.8,27.3l-12.1,5.4l12.1,5.4c10.8,4.8,17.8,15.5,17.8,27.3c0,16.5-13.4,30-29.9,30H270.2c-2.7,4.1-5.8,8-9,11.7h113.1c23,0,41.6-18.7,41.6-41.7C416,274.8,410,262.8,400.1,255.1z"/>
                <path fill="currentColor" d="M442.1,218.5c0-33.9-27.6-61.5-61.5-61.5h-91.4v11.4h91.4c27.7,0,50.2,22.5,50.2,50.2c0,12.1-4.4,23.8-12.3,32.8l-3.3,3.7l3.3,3.7c7.9,9.1,12.3,20.8,12.3,32.9c0,27.7-22.5,50.2-50.2,50.2h-132c-5,4.2-10.5,8-16.2,11.4h148.2c33.9,0,61.5-27.6,61.5-61.5c0-13.2-4.3-26-12.1-36.6C437.9,244.6,442.1,231.8,442.1,218.5z"/>
                <path fill="currentColor" d="M362.7,204.7h-73.5v11.4h73.5c5.4,0,9.7,4.3,9.7,9.7c0,2.6-1,5-2.9,6.9c-1.8,1.8-4.2,2.8-6.8,2.8h-73.5v11.4h73.5c5.7,0,11-2.2,14.9-6.2c4-4,6.2-9.3,6.2-14.9C383.8,214.2,374.3,204.7,362.7,204.7z"/>
                <path fill="currentColor" d="M362.7,263.3h-73.8c-0.3,3.8-0.8,7.6-1.4,11.4h75.2c5.4,0,9.7,4.4,9.7,9.7c0,2.6-1,5.1-2.9,6.9c-1.8,1.8-4.3,2.8-6.8,2.8h-80.4c-1.4,3.9-3.1,7.7-4.9,11.4h85.4c5.6,0,10.9-2.2,14.8-6.1c4-3.9,6.3-9.3,6.3-15C383.8,272.7,374.3,263.3,362.7,263.3z"/>
                <path fill="currentColor" d="M255.8,420.3c-64.5,0-129-12.9-192.9-38.6l-2.7-1.1l-0.7-2.8c-24.7-97.3-24.7-177.2,0.2-244.3l0.9-2.4l2.3-0.9c128.4-51.4,258.3-51.4,386.2,0l2.7,1.1l0.7,2.8c24.7,97.3,24.7,177.2-0.2,244.3l-0.9,2.4l-2.3,0.9C384.9,407.4,320.3,420.3,255.8,420.3z M69.8,372.2c123.4,48.9,248.8,48.9,372.7-0.1c22.9-63.7,22.8-139.8-0.3-232.3c-123.4-48.9-248.8-48.9-372.7,0.1C46.6,203.6,46.7,279.7,69.8,372.2z"/>
              </g>
            </svg>
            <div className="flex flex-col text-left">
              <span className="font-bold text-slate-800 dark:text-slate-100 text-lg leading-tight tracking-wide font-sans">জনতা ব্যাংক পিএলসি.</span>
              <span className="text-[10px] font-semibold text-[#00B7DE] uppercase tracking-wider">Janata Bank PLC</span>
            </div>
          </div>

          {/* ===== MIDDLE: Original Dog Photo with Interactive Eyes ===== */}
          <div className="flex justify-center">
            <DogPhotoWithInteractiveEyes focusField={focusField} usernameLength={username.length} />
          </div>

          {/* ===== CONTENT AREA ===== */}
          <div className="space-y-4">
            
            {/* Branding Text */}
            <div className="text-center space-y-1.5">
              <h2 className="text-2xl font-black text-[#1565C0] tracking-wide">লেট সিটিং-হলিডে-নাইট পোর্টাল</h2>
              
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
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-2xl flex items-center gap-2 text-xs font-semibold animate-shake">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Username Input */}
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">ইউজারনেম</label>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onFocus={() => setFocusField('username')}
                  onBlur={() => setFocusField('none')}
                  placeholder="যেমন: 026799 (ব্যাংক আইডি)"
                  className="w-full px-4 py-3 border border-slate-200 focus:border-[#1565C0] focus:ring-4 focus:ring-blue-100 rounded-2xl text-sm font-semibold outline-none transition-all"
                  required
                />
              </div>

              {/* Password Input */}
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">পাসওয়ার্ড</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusField('password')}
                  onBlur={() => setFocusField('none')}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 border border-slate-200 focus:border-[#1565C0] focus:ring-4 focus:ring-blue-100 rounded-2xl text-sm font-semibold outline-none transition-all font-mono"
                  required
                />
              </div>

              {/* Login Submit Button */}
              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-[#1565C0] to-[#0D47A1] hover:from-[#0D47A1] hover:to-[#0A2F6C] text-white font-bold text-sm tracking-wide rounded-2xl transition-all shadow-md shadow-blue-700/10 hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <ShieldCheck size={18} />
                    নিরাপদ লগইন
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

  return children;
}
