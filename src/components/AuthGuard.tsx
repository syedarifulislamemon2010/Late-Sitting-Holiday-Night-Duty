'use client';
import logger from '@/lib/logger';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ShieldCheck, AlertCircle, Eye, EyeOff, User, KeyRound } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import { canAccessRoute } from '@/permissions/rbac';
import { evaluateAuthResponse } from '@/lib/auth-guard-helper';



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
  const checkBlockStatus = () => {
    return { isBlocked: false, timeRemaining: 0 };
  };

  const [, setAttempts] = useState<number>(0);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/profile');
        const contentType = res.headers.get('content-type');
        let data = null;
        if (contentType && contentType.includes('application/json')) {
          try {
            data = await res.json();
          } catch {}
        }

        const evaluation = evaluateAuthResponse(
          res.status,
          contentType,
          data,
          authenticated
        );

        if (evaluation.logWarn) {
          logger.warn(evaluation.logWarn);
        }

        if (evaluation.shouldUpdate) {
          setAuthenticated(evaluation.authenticated);
          if (evaluation.authenticated && data?.user) {
            setUserProfile(data.user);
          } else if (!evaluation.authenticated) {
            setUserProfile(null);
          }
        }
      } catch {
        // Transient network error — do NOT log out if already authenticated
        logger.warn('Auth verification failed (transient network error)');
        // Only set unauthenticated if we haven't authenticated yet (initial load)
        setAuthenticated((prev) => (prev === null ? false : prev));
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
      <div className="fixed inset-0 h-full w-full flex flex-col items-center justify-between p-2 sm:p-4 overflow-y-auto font-sans z-50 select-none" suppressHydrationWarning={true}>
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
            
            {/* Top: Janata Bank Logo & Header — Large matching user specification */}
            <div className="flex items-center justify-center gap-3.5 pt-1">
              <Image
                src="/janata-bank-logo-real.svg"
                alt="Janata Bank Logo"
                width={56}
                height={56}
                priority
                className="shrink-0 object-contain drop-shadow-sm"
              />
              <div className="flex flex-col text-left">
                <span className="font-black text-slate-900 dark:text-slate-100 text-2xl sm:text-[28px] leading-tight tracking-tight font-sans">
                  জনতা ব্যাংক পিএলসি.
                </span>
                <span className="text-xs sm:text-[13px] font-extrabold text-[#00A2E8] dark:text-[#38BDF8] uppercase tracking-wider mt-0.5">
                  JANATA BANK PLC
                </span>
              </div>
            </div>

            {/* Portal Branding Title & Tags */}
            <div className="text-center space-y-1">
              <h2 className="text-base sm:text-[17px] font-black text-[#0B5E9E] dark:text-sky-400 tracking-wide leading-snug font-sans">
                লেট সিটিং, ছুটির দিনে ও রাত্রীকালীন ডিউটি ছুটির আবেদন পোর্টাল
              </h2>
              
              <div className="flex flex-wrap items-center justify-center gap-1.5 pt-0.5">
                <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold rounded-full border border-indigo-100 dark:border-indigo-800">Late Sitting</span>
                <span className="text-slate-300 dark:text-slate-600 text-[10px]">•</span>
                <span className="px-2 py-0.5 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 text-[10px] font-bold rounded-full border border-sky-100 dark:border-sky-800">Holiday</span>
                <span className="text-slate-300 dark:text-slate-600 text-[10px]">•</span>
                <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-100 dark:border-emerald-800">Night Duty</span>
                <span className="text-slate-300 dark:text-slate-600 text-[10px]">•</span>
                <span className="px-2 py-0.5 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 text-[10px] font-bold rounded-full border border-purple-100 dark:border-purple-800">Leave Application</span>
              </div>
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
                    লগইন
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

        {/* CSS Keyframe Animations for Fade-In & Shake */}
        <style>{`
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
    </>
  );
}
