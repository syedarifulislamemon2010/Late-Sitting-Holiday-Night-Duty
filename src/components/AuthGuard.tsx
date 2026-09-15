'use client';
import logger from '@/lib/logger';

import { useState, useEffect } from 'react';
import { ShieldCheck, AlertCircle, Eye, EyeOff, Lock, User, KeyRound } from 'lucide-react';
import { signIn, signOut } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import { canAccessRoute } from '@/permissions/rbac';
import ForcedPasswordChangeModal from '@/components/ForcedPasswordChangeModal';
import ForgotPasswordModal from '@/components/ForgotPasswordModal';



interface Cell {
  id: number;
  name: string;
  description: string | null;
}

interface UserProfile {
  id: number;
  name: string;
  username: string;
  role: 'ADMIN' | 'USER' | 'EMPLOYEE';
  cells?: Cell[];
  mustChangePassword?: boolean;
}

// ===== MAIN AUTH GUARD COMPONENT =====
export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const checkBlockStatus = () => {
    return { isBlocked: false, timeRemaining: 0 };
  };

  const [attempts, setAttempts] = useState<number>(0);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/profile');
        const contentType = res.headers.get('content-type');
        if (res.ok && contentType && contentType.includes('application/json')) {
          const data = await res.json();
          if (data.authenticated) {
            setAuthenticated(true);
            setUserProfile(data.user);
          } else {
            setAuthenticated(false);
            setUserProfile(null);
          }
        } else if (res.status === 429) {
          // Rate limited — do NOT log out, just skip this cycle
          logger.warn('Auth check rate limited, skipping cycle');
        } else {
          setAuthenticated(false);
          setUserProfile(null);
        }
      } catch (err) {
        // Transient network error — do NOT log out if already authenticated
        logger.warn('Auth verification failed (transient network error)');
        // Only set unauthenticated if we haven't authenticated yet (initial load)
        setAuthenticated((prev) => prev === null ? false : prev);
      }
    };
    checkAuth();
    // Poll every 60 seconds instead of 4 seconds to prevent flickering and rate limit hits
    const interval = setInterval(checkAuth, 60000);
    return () => clearInterval(interval);
  }, []);

  // Handle active block countdown and automatic reset
  // Login block status check removed temporarily

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

  // Route-based role protection redirection
  useEffect(() => {
    if (authenticated && userProfile) {
      const isRouteAllowed = canAccessRoute(userProfile.role, pathname);
      if (!isRouteAllowed) {
        if (userProfile.role === 'EMPLOYEE') {
          if (pathname !== '/analytics' && pathname !== '/my-portal') {
            window.location.href = '/my-portal';
          }
        } else {
          router.replace('/');
        }
      }
    }
  }, [authenticated, userProfile, pathname, router]);

  // Prevent scrolling on the login screen
  useEffect(() => {
    if (authenticated === false) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [authenticated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const { isBlocked, timeRemaining } = checkBlockStatus();
    if (isBlocked) {
      const minutes = Math.ceil(timeRemaining / 60000);
      setError(`অতিরিক্ত ভুল প্রচেষ্টার কারণে আপনার লগইন সাময়িকভাবে ব্লক করা হয়েছে। অনুগ্রহ করে ${minutes} মিনিট পর পুনরায় চেষ্টা করুন।`);
      return;
    }

    setLoading(true);

    try {
      const res = await signIn('credentials', {
        redirect: false,
        username,
        password,
      });

      if (res && !res.error) {
        setAuthenticated(true);
        localStorage.removeItem('login_attempts');
        localStorage.removeItem('login_blocked_until');
        setAttempts(0);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('tab_session_active', 'true');
        }
        window.dispatchEvent(new Event('storage'));
        // Fetch detailed profile immediately
        const profileRes = await fetch('/api/profile');
        const profileData = await profileRes.json();
        if (profileRes.ok && profileData.authenticated) {
          setUserProfile(profileData.user);
        }
        window.location.href = '/';
      } else {
        if (res?.error === 'CredentialsSignin' || res?.error) {
          setError('ভুল ব্যাংক আইডি বা পাসওয়ার্ড! (প্রথমবার লগইনের জন্য ডিফল্ট পাসওয়ার্ড: 123456)');
        } else {
          setError('লগইন ব্যর্থ হয়েছে। অনুগ্রহ করে ব্যাংক আইডি ও পাসওয়ার্ড পরীক্ষা করুন।');
        }
      }
    } catch (err) {
      logger.error('Login error:', err);
      setError('সার্ভারে যোগাযোগ করতে ব্যর্থ হয়েছে। অনুগ্রহ করে ইন্টারনেট বা সার্ভার কানেকশন চেক করুন।');
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
      <div className="fixed inset-0 h-full w-full flex flex-col items-center justify-between p-2 sm:p-4 overflow-hidden font-sans z-50 select-none" suppressHydrationWarning={true}>
        {/* Animated Subtle Mesh Background */}
        <div className="absolute inset-0 -z-20 overflow-hidden bg-[#e8f4fd] transition-colors duration-500">
          <div className="absolute -inset-[10px] opacity-60">
            <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-gradient-to-br from-blue-300 to-sky-400/80 blur-[130px] animate-blob1" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-gradient-to-br from-indigo-300 to-purple-400/80 blur-[130px] animate-blob2" style={{ animationDelay: '2s' }} />
            <div className="absolute top-[30%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-cyan-300 to-blue-400/80 blur-[110px] animate-blob3" style={{ animationDelay: '4s' }} />
            <div className="absolute bottom-[20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-sky-300 to-indigo-400/80 blur-[110px] animate-blob1" style={{ animationDelay: '6s' }} />
          </div>
        </div>

        {/* Centered Main Login Layout (Stable, always visible, zero jitter, zero scroll) */}
        <div className="flex-1 flex items-center justify-center w-full z-10 py-1 min-h-0 px-4">
          <div 
            className="login-box w-full max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-[0_20px_50px_rgba(21,101,192,0.14)] border border-white/80 dark:border-slate-800 px-6 py-4 sm:px-7 sm:py-5 space-y-3 animate-fade-in"
            style={{ maxWidth: '420px', width: '100%', margin: '0 auto' }}
          >
            
            {/* Top: Janata Bank Logo & Header */}
            <div className="flex items-center justify-center gap-2.5 pt-0.5">
              <svg viewBox="0 0 512 512" className="h-9 w-9 shrink-0 text-[#00B7DE]" fill="none" aria-hidden="true">
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
                <span className="font-bold text-slate-800 dark:text-slate-100 text-base leading-tight tracking-wide font-sans">জনতা ব্যাংক পিএলসি.</span>
                <span className="text-[10px] font-semibold text-[#00B7DE] uppercase tracking-wider">Janata Bank PLC</span>
              </div>
            </div>

            {/* Portal Branding Title & Tags */}
            <div className="text-center space-y-1">
              <h2 className="text-base sm:text-lg font-black text-[#1565C0] dark:text-sky-400 tracking-wide leading-tight">
                লেট সিটিং, ছুটির দিনে ও রাত্রীকালীন ডিউটি পোর্টাল
              </h2>
              
              <div className="flex items-center justify-center gap-1.5 pt-0.5">
                <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold rounded-full border border-indigo-100 dark:border-indigo-800">Late Sitting</span>
                <span className="text-slate-300 dark:text-slate-600 text-[10px]">•</span>
                <span className="px-2 py-0.5 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 text-[10px] font-bold rounded-full border border-sky-100 dark:border-sky-800">Holiday</span>
                <span className="text-slate-300 dark:text-slate-600 text-[10px]">•</span>
                <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-100 dark:border-emerald-800">Night Duty</span>
              </div>

              <p className="text-[10px] font-bold uppercase tracking-wider text-[#00B7DE]">অনলাইন ব্যাংকিং ডিপার্টমেন্ট</p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-3 pt-0.5">
              {error && (
                <div role="alert" className="p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl flex items-center gap-2 text-xs font-semibold animate-shake">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Bank ID Input */}
              <div className="space-y-1 text-left group">
                <label htmlFor="username-input" className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider px-1">ব্যাংক আইডি</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-slate-400 group-focus-within:text-[#1565C0] transition-colors">
                    <User size={15} />
                  </span>
                  <input 
                    id="username-input"
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="যেমন: 026799"
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-[#1565C0] focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 rounded-xl text-sm font-semibold outline-none transition-all"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1 text-left relative font-sans group">
                <label htmlFor="password-input" className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider px-1">পাসওয়ার্ড</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-slate-400 group-focus-within:text-[#1565C0] transition-colors">
                    <KeyRound size={15} />
                  </span>
                  <input 
                    id="password-input"
                    type={showPassword ? "text" : "password"} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-[#1565C0] focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 rounded-xl text-sm font-semibold outline-none transition-all font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#1565C0] focus:outline-none focus:text-[#1565C0] focus:ring-2 focus:ring-blue-200 rounded-lg p-1 transition-colors cursor-pointer"
                    aria-label={showPassword ? "পাসওয়ার্ড লুকান" : "পাসওয়ার্ড দেখান"}
                  >
                    {showPassword ? (
                      <EyeOff size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </button>
                </div>
              </div>

              {/* Forgot Password Link */}
              <div className="flex justify-end pr-1 -mt-1">
                <button
                  type="button"
                  onClick={() => setIsForgotPasswordOpen(true)}
                  className="text-xs font-semibold text-[#1565C0] dark:text-sky-400 hover:text-[#0D47A1] hover:underline transition-colors focus:outline-none cursor-pointer"
                >
                  পাসওয়ার্ড ভুলে গেছেন?
                </button>
              </div>

              {/* Login Submit Button */}
              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-[#1565C0] via-[#0D47A1] to-[#0A2F6C] hover:from-[#0D47A1] hover:to-[#1565C0] focus:outline-none focus:ring-4 focus:ring-blue-100 text-white font-bold text-sm tracking-wide rounded-xl transition-all shadow-md shadow-blue-700/10 hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <ShieldCheck size={17} />
                    নিরাপদ লগইন
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <footer className="w-full max-w-[420px] mx-auto text-center space-y-0.5 text-slate-500 select-none no-print print:hidden font-sans pb-2 sm:pb-3 z-10 px-4">
          <div className="flex flex-col gap-0.5 text-[10px] font-bold">
            <span>ডিজাইন ও ডেভেলপমেন্ট: অনলাইন ব্যাংকিং ডিপার্টমেন্ট | সংস্করণ ১.০.০</span>
          </div>
        </footer>

        {/* Forgot Password Modal */}
        <ForgotPasswordModal
          isOpen={isForgotPasswordOpen}
          onClose={() => setIsForgotPasswordOpen(false)}
          onSuccess={() => {
            setIsForgotPasswordOpen(false);
          }}
        />

        {/* CSS Keyframe Animations for Fade-In & Shake */}
        <style>{`
          html, body {
            overflow: hidden !important;
            height: 100% !important;
          }
          .login-box {
            max-width: 420px !important;
            width: 100% !important;
            margin-left: auto !important;
            margin-right: auto !important;
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.97); }
            to { opacity: 1; transform: scale(1); }
          }
          .animate-fade-in {
            animation: fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            20% { transform: translateX(-6px); }
            40% { transform: translateX(6px); }
            60% { transform: translateX(-4px); }
            80% { transform: translateX(4px); }
          }
          @keyframes blob1 {
            0%, 100% { transform: translate(0px, 0px) scale(1); }
            33% { transform: translate(30px, -50px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.95); }
          }
          @keyframes blob2 {
            0%, 100% { transform: translate(0px, 0px) scale(1); }
            33% { transform: translate(-30px, 40px) scale(0.95); }
            66% { transform: translate(40px, -20px) scale(1.1); }
          }
          @keyframes blob3 {
            0%, 100% { transform: translate(0px, 0px) scale(1); }
            33% { transform: translate(20px, -30px) scale(1.05); }
            66% { transform: translate(-40px, 40px) scale(0.9); }
          }
          .animate-blob1 {
            animation: blob1 18s infinite alternate ease-in-out;
          }
          .animate-blob2 {
            animation: blob2 22s infinite alternate ease-in-out;
          }
          .animate-blob3 {
            animation: blob3 20s infinite alternate ease-in-out;
          }
          .animate-shake {
            animation: shake 0.4s ease-in-out;
          }
        `}</style>
      </div>
    );
  }

  return (
    <>
      {children}
      {userProfile?.mustChangePassword && (
        <ForcedPasswordChangeModal
          isOpen={true}
          onSuccess={() => {
            setUserProfile((prev) => (prev ? { ...prev, mustChangePassword: false } : prev));
          }}
        />
      )}
    </>
  );
}
