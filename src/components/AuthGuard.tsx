'use client';
import logger from '@/lib/logger';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ShieldCheck, AlertCircle, Eye, EyeOff, User, KeyRound, Phone, ArrowLeft, CheckCircle2, RotateCcw, Clock } from 'lucide-react';
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

  // ===== FORGOT PASSWORD / OTP STATE =====
  const [authView, setAuthView] = useState<'LOGIN' | 'FORGOT_PASSWORD_INPUT' | 'FORGOT_PASSWORD_OTP' | 'RESET_SUCCESS'>('LOGIN');
  const [resetBankId, setResetBankId] = useState('');
  const [resetMobile, setResetMobile] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [showResetNewPassword, setShowResetNewPassword] = useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [idleTimeoutNotice, setIdleTimeoutNotice] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('idle_logged_out') === 'true') {
      setIdleTimeoutNotice(true);
      sessionStorage.removeItem('idle_logged_out');
    }
  }, []);

  // 60-second countdown timer for resend OTP
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldownSeconds > 0) {
      timer = setTimeout(() => {
        setCooldownSeconds((prev) => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldownSeconds]);

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setResetError('');
    setResetSuccess('');

    if (!resetBankId.trim()) {
      setResetError('অনুগ্রহ করে ব্যাংক আইডি প্রদান করুন।');
      return;
    }
    if (!resetMobile.trim()) {
      setResetError('অনুগ্রহ করে মোবাইল নম্বর প্রদান করুন।');
      return;
    }

    setResetLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SEND_OTP',
          bankId: resetBankId,
          mobile: resetMobile
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setResetError(data.message || 'ওটিপি পাঠাতে ব্যর্থ হয়েছে।');
        if (data.cooldownRemaining) {
          setCooldownSeconds(data.cooldownRemaining);
        }
      } else {
        setResetSuccess(data.message || 'আপনার মোবাইলে ওটিপি কোড পাঠানো হয়েছে।');
        setCooldownSeconds(60);
        setAuthView('FORGOT_PASSWORD_OTP');
      }
    } catch (err: any) {
      logger.error('Error sending OTP:', err);
      setResetError('সার্ভারে যোগাযোগ করতে ব্যর্থ হয়েছে। নেটওয়ার্ক বা কানেকশন চেক করুন।');
    } finally {
      setResetLoading(false);
    }
  };

  const handleVerifyOtpAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');

    if (!resetOtp.trim()) {
      setResetError('৬ ডিজিটের ওটিপি কোড প্রদান করুন।');
      return;
    }
    if (resetNewPassword.length < 6) {
      setResetError('নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
      return;
    }
    if (resetNewPassword !== resetConfirmPassword) {
      setResetError('উভয় পাসওয়ার্ড হুবহু এক হতে হবে।');
      return;
    }

    setResetLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'VERIFY_OTP',
          bankId: resetBankId,
          mobile: resetMobile,
          otp: resetOtp,
          newPassword: resetNewPassword
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setResetError(data.message || 'পাসওয়ার্ড রিসেট ব্যর্থ হয়েছে।');
      } else {
        setResetSuccess(data.message || 'পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে!');
        setAuthView('RESET_SUCCESS');
      }
    } catch (err: any) {
      logger.error('Error verifying OTP and resetting password:', err);
      setResetError('সার্ভারে যোগাযোগ করতে ব্যর্থ হয়েছে। নেটওয়ার্ক চেক করুন।');
    } finally {
      setResetLoading(false);
    }
  };
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

            {/* ============================================================== */}
            {/* VIEW 1: NORMAL LOGIN FORM */}
            {/* ============================================================== */}
            {authView === 'LOGIN' && (
              <form onSubmit={(e) => { setIdleTimeoutNotice(false); handleLogin(e); }} className="space-y-3 pt-0.5">
                {idleTimeoutNotice && (
                  <div role="status" className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 rounded-xl flex items-center gap-2 text-xs font-semibold animate-fade-in">
                    <Clock size={15} className="shrink-0 text-amber-600 dark:text-amber-400" />
                    <span>দীর্ঘক্ষণ নিষ্ক্রিয় থাকার কারণে আপনার সেশনটি স্বয়ংক্রিয়ভাবে বন্ধ হয়েছে। অনুগ্রহ করে পুনরায় লগইন করুন।</span>
                  </div>
                )}
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

                {/* Forgot Password Link - Centered below Login Button */}
                <div className="text-center pt-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setResetBankId(username);
                      setResetError('');
                      setResetSuccess('');
                      setAuthView('FORGOT_PASSWORD_INPUT');
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1565C0] dark:text-sky-400 hover:text-blue-800 dark:hover:text-sky-300 transition-colors cursor-pointer hover:underline"
                  >
                    পাসওয়ার্ড ভুলে গেছেন?
                  </button>
                </div>
              </form>
            )}

            {/* ============================================================== */}
            {/* VIEW 2: FORGOT PASSWORD - STEP 1 (BANK ID & MOBILE NUMBER) */}
            {/* ============================================================== */}
            {authView === 'FORGOT_PASSWORD_INPUT' && (
              <form onSubmit={handleSendOtp} className="space-y-3 pt-0.5 animate-fade-in">
                <div className="p-2.5 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 rounded-xl text-left space-y-0.5">
                  <h3 className="text-xs font-black text-[#1565C0] dark:text-sky-400">পাসওয়ার্ড রিসেট (ধাপ ১/২)</h3>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                    আপনার ব্যাংক আইডি ও পোর্টালে নিবন্ধিত মোবাইল নম্বর দিন। নম্বরে ৬-ডিজিটের ওটিপি কোড পাঠানো হবে।
                  </p>
                </div>

                {resetError && (
                  <div role="alert" className="p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl flex items-center gap-2 text-xs font-semibold animate-shake">
                    <AlertCircle size={15} className="shrink-0" />
                    <span>{resetError}</span>
                  </div>
                )}

                {/* Bank ID Input */}
                <div className="space-y-1 text-left group">
                  <label htmlFor="reset-bankid" className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider px-1">ব্যাংক আইডি</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-slate-400 group-focus-within:text-[#1565C0] transition-colors">
                      <User size={15} />
                    </span>
                    <input 
                      id="reset-bankid"
                      type="text" 
                      value={resetBankId}
                      onChange={(e) => setResetBankId(e.target.value)}
                      placeholder="যেমন: 026795"
                      className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-[#1565C0] focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 rounded-xl text-sm font-semibold outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Mobile Number Input */}
                <div className="space-y-1 text-left group">
                  <label htmlFor="reset-mobile" className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider px-1">নিবন্ধিত মোবাইল নম্বর</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-slate-400 group-focus-within:text-[#1565C0] transition-colors">
                      <Phone size={15} />
                    </span>
                    <input 
                      id="reset-mobile"
                      type="text" 
                      value={resetMobile}
                      onChange={(e) => setResetMobile(e.target.value)}
                      placeholder="যেমন: 01674057529"
                      className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-[#1565C0] focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 rounded-xl text-sm font-semibold outline-none transition-all font-mono"
                      required
                    />
                  </div>
                </div>

                {/* Submit OTP Request Button */}
                <button 
                  type="submit" 
                  disabled={resetLoading}
                  className="w-full py-2.5 bg-gradient-to-r from-[#1565C0] via-[#0D47A1] to-[#0A2F6C] hover:from-[#0D47A1] hover:to-[#1565C0] text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-blue-700/10 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] disabled:opacity-50"
                >
                  {resetLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Phone size={16} />
                      ওটিপি কোড পাঠান
                    </>
                  )}
                </button>

                {/* Back to Login Link */}
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthView('LOGIN');
                      setResetError('');
                      setResetSuccess('');
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-[#1565C0] dark:hover:text-sky-400 transition-colors cursor-pointer"
                  >
                    <ArrowLeft size={14} />
                    লগইন পেজে ফিরে যান
                  </button>
                </div>
              </form>
            )}

            {/* ============================================================== */}
            {/* VIEW 3: FORGOT PASSWORD - STEP 2 (OTP VERIFY & NEW PASSWORD) */}
            {/* ============================================================== */}
            {authView === 'FORGOT_PASSWORD_OTP' && (
              <form onSubmit={handleVerifyOtpAndReset} className="space-y-3 pt-0.5 animate-fade-in">
                <div className="p-2.5 bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 rounded-xl text-left space-y-0.5">
                  <h3 className="text-xs font-black text-emerald-800 dark:text-emerald-300">নতুন পাসওয়ার্ড সেট করুন (ধাপ ২/২)</h3>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium leading-relaxed">
                    আপনার মোবাইলে ({resetMobile.slice(0, 3)}****{resetMobile.slice(-4)}) পাঠানো ৬-ডিজিটের ওটিপি দিন।
                  </p>
                </div>

                {resetSuccess && (
                  <div className="p-2 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-medium text-center">
                    {resetSuccess}
                  </div>
                )}

                {resetError && (
                  <div role="alert" className="p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl flex items-center gap-2 text-xs font-semibold animate-shake">
                    <AlertCircle size={15} className="shrink-0" />
                    <span>{resetError}</span>
                  </div>
                )}

                {/* 6-Digit OTP Input */}
                <div className="space-y-1 text-left group">
                  <div className="flex justify-between items-center px-1">
                    <label htmlFor="reset-otp" className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">৬-ডিজিটের ওটিপি</label>
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                      <Clock size={11} />
                      মেয়াদ ৫ মিনিট
                    </span>
                  </div>
                  <input 
                    id="reset-otp"
                    type="text" 
                    maxLength={6}
                    value={resetOtp}
                    onChange={(e) => setResetOtp(e.target.value)}
                    placeholder="123456"
                    className="w-full text-center tracking-[0.4em] py-2 border-2 border-indigo-200 dark:border-indigo-900/60 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-[#1565C0] focus:ring-4 focus:ring-blue-100 rounded-xl text-base font-black outline-none transition-all font-mono"
                    required
                    autoFocus
                  />
                </div>

                {/* New Password Input */}
                <div className="space-y-1 text-left relative font-sans group">
                  <label htmlFor="reset-new-password" className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider px-1">নতুন পাসওয়ার্ড</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-slate-400 group-focus-within:text-[#1565C0] transition-colors">
                      <KeyRound size={15} />
                    </span>
                    <input 
                      id="reset-new-password"
                      type={showResetNewPassword ? "text" : "password"} 
                      value={resetNewPassword}
                      onChange={(e) => setResetNewPassword(e.target.value)}
                      placeholder="কমপক্ষে ৬ অক্ষর"
                      className="w-full pl-10 pr-10 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-[#1565C0] focus:ring-4 focus:ring-blue-100 rounded-xl text-sm font-semibold outline-none transition-all font-mono"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetNewPassword(!showResetNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#1565C0] p-1 cursor-pointer"
                    >
                      {showResetNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password Input */}
                <div className="space-y-1 text-left relative font-sans group">
                  <label htmlFor="reset-confirm-password" className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider px-1">নতুন পাসওয়ার্ড নিশ্চিত করুন</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-slate-400 group-focus-within:text-[#1565C0] transition-colors">
                      <KeyRound size={15} />
                    </span>
                    <input 
                      id="reset-confirm-password"
                      type={showResetConfirmPassword ? "text" : "password"} 
                      value={resetConfirmPassword}
                      onChange={(e) => setResetConfirmPassword(e.target.value)}
                      placeholder="পাসওয়ার্ড পুনরায় লিখুন"
                      className="w-full pl-10 pr-10 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-[#1565C0] focus:ring-4 focus:ring-blue-100 rounded-xl text-sm font-semibold outline-none transition-all font-mono"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetConfirmPassword(!showResetConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#1565C0] p-1 cursor-pointer"
                    >
                      {showResetConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Reset Password Button */}
                <button 
                  type="submit" 
                  disabled={resetLoading}
                  className="w-full py-2.5 bg-gradient-to-r from-emerald-600 via-teal-700 to-emerald-800 hover:from-emerald-700 hover:to-emerald-900 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-emerald-700/10 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] disabled:opacity-50"
                >
                  {resetLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <ShieldCheck size={17} />
                      পাসওয়ার্ড রিসেট করুন
                    </>
                  )}
                </button>

                {/* Resend OTP Bar */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthView('FORGOT_PASSWORD_INPUT');
                      setResetError('');
                      setResetSuccess('');
                    }}
                    className="text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 cursor-pointer"
                  >
                    ← বাতিল করুন
                  </button>

                  <button
                    type="button"
                    disabled={cooldownSeconds > 0 || resetLoading}
                    onClick={() => handleSendOtp()}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1565C0] dark:text-sky-400 hover:underline disabled:opacity-50 disabled:no-underline cursor-pointer disabled:cursor-not-allowed"
                  >
                    <RotateCcw size={12} className={cooldownSeconds > 0 ? "animate-spin" : ""} />
                    {cooldownSeconds > 0 ? `পুনরায় পাঠান (${cooldownSeconds} সে.)` : 'পুনরায় ওটিপি পাঠান'}
                  </button>
                </div>

                {/* Fallback Support Note */}
                <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center leading-normal pt-1">
                  ওটিপি না পেলে ইনবক্স চেক করুন বা ৬০ সে. পর পুনরায় পাঠান। বারবার সমস্যা হলে সিস্টেম অ্যাডমিনের সাথে যোগাযোগ করুন।
                </p>
              </form>
            )}

            {/* ============================================================== */}
            {/* VIEW 4: RESET SUCCESS */}
            {/* ============================================================== */}
            {authView === 'RESET_SUCCESS' && (
              <div className="py-4 space-y-4 text-center animate-fade-in">
                <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 size={32} />
                </div>

                <div className="space-y-1">
                  <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                    পাসওয়ার্ড রিসেট সফল হয়েছে!
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed px-2">
                    আপনার নতুন পাসওয়ার্ড সফলভাবে সংরক্ষিত হয়েছে। অনুগ্রহ করে এখন নতুন পাসওয়ার্ড দিয়ে সিস্টেমে লগইন করুন।
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setUsername(resetBankId);
                    setPassword('');
                    setResetError('');
                    setResetSuccess('');
                    setAuthView('LOGIN');
                  }}
                  className="w-full py-2.5 bg-gradient-to-r from-[#1565C0] via-[#0D47A1] to-[#0A2F6C] hover:from-[#0D47A1] hover:to-[#1565C0] text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                >
                  <ShieldCheck size={16} />
                  লগইন পেজে যান
                </button>
              </div>
            )}</div>
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
