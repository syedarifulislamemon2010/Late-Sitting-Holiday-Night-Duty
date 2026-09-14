'use client';

import React, { useState, useEffect } from 'react';
import { KeyRound, Smartphone, Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, ArrowLeft, X, RefreshCw } from 'lucide-react';
import { toBanglaDigits } from '@/lib/bengali-converter';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ForgotPasswordModal({ isOpen, onClose, onSuccess }: ForgotPasswordModalProps) {
  const [step, setStep] = useState<'REQUEST_OTP' | 'VERIFY_OTP'>('REQUEST_OTP');
  const [bankId, setBankId] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [maskedMobile, setMaskedMobile] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Resend countdown timer
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(prev => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  if (!isOpen) return null;

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const cleanBankId = bankId.trim();
    if (!cleanBankId) {
      setError('অনুগ্রহ করে আপনার ব্যাংক আইডি প্রদান করুন।');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bankId: cleanBankId }),
      });

      const data = await res.json();

      if (res.ok) {
        setMaskedMobile(data.maskedMobile || '');
        setSuccess(data.message || 'আপনার মোবাইলে ৬-সংখ্যার ওটিপি পাঠানো হয়েছে।');
        setStep('VERIFY_OTP');
        setResendCooldown(60);
      } else {
        setError(data.error || 'ওটিপি পাঠাতে সমস্যা হয়েছে।');
      }
    } catch {
      setError('সার্ভারের সাথে যোগাযোগ করতে ব্যর্থ হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const cleanOtp = otp.trim();
    const cleanPassword = newPassword.trim();
    const cleanConfirm = confirmPassword.trim();

    if (!cleanOtp) {
      setError('অনুগ্রহ করে মোবাইলে প্রাপ্ত ওটিপি কোডটি লিখুন।');
      return;
    }

    if (!cleanPassword) {
      setError('অনুগ্রহ করে নতুন পাসওয়ার্ড প্রদান করুন।');
      return;
    }

    if (cleanPassword.length < 4) {
      setError('নতুন পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে।');
      return;
    }

    if (cleanPassword !== cleanConfirm) {
      setError('নতুন পাসওয়ার্ড ও নিশ্চিতকরণ পাসওয়ার্ড মেলেনি।');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password/verify-and-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bankId: bankId.trim(),
          otp: cleanOtp,
          newPassword: cleanPassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess('পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে! লগইন করুন...');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      } else {
        setError(data.error || 'পাসওয়ার্ড রিসেট ব্যর্থ হয়েছে।');
      }
    } catch {
      setError('সার্ভারে যোগাযোগ করতে সমস্যা হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 relative">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center shadow-inner border border-indigo-200/60 dark:border-indigo-800/60">
            <Smartphone size={24} />
          </div>
          <h2 className="text-lg sm:text-xl font-black text-slate-800 dark:text-slate-100">
            পাসওয়ার্ড রিসেট (SMS OTP)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {step === 'REQUEST_OTP'
              ? 'আপনার ব্যাংক আইডি প্রদান করুন। নিবন্ধিত মোবাইলে ওটিপি পাঠানো হবে।'
              : `মোবাইলে (${maskedMobile}) প্রেরিত ওটিপি ও নতুন পাসওয়ার্ড প্রদান করুন।`}
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <AlertCircle size={16} className="shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
            <span>{success}</span>
          </div>
        )}

        {/* Step 1: Request OTP */}
        {step === 'REQUEST_OTP' && (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                ব্যাংক আইডি (Bank ID)*
              </label>
              <input
                type="text"
                required
                autoFocus
                value={bankId}
                onChange={(e) => setBankId(e.target.value)}
                placeholder="যেমন: 12345 বা JB ID"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>ওটিপি পাঠানো হচ্ছে...</span>
                </>
              ) : (
                <span>ওটিপি পাঠান</span>
              )}
            </button>
          </form>
        )}

        {/* Step 2: Verify OTP and Set New Password */}
        {step === 'VERIFY_OTP' && (
          <form onSubmit={handleVerifyAndReset} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  ৬-সংখ্যার ওটিপি কোড (OTP)*
                </label>
                {resendCooldown > 0 ? (
                  <span className="text-[10px] font-bold text-slate-400">
                    পুনরায় পাঠান ({toBanglaDigits(resendCooldown)} সে.)
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleRequestOtp}
                    disabled={loading}
                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw size={10} />
                    <span>পুনরায় ওটিপি পাঠান</span>
                  </button>
                )}
              </div>
              <input
                type="text"
                required
                maxLength={6}
                autoFocus
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="৬ সংখ্যার ওটিপি লিখুন"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-center font-mono font-black tracking-widest text-indigo-600 dark:text-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                নতুন পাসওয়ার্ড (New Password)*
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock size={15} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="নতুন পাসওয়ার্ড লিখুন (কমপক্ষে ৪ অক্ষর)"
                  className="w-full pl-9 pr-10 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                নতুন পাসওয়ার্ড নিশ্চিত করুন*
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <KeyRound size={15} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="পাসওয়ার্ড পুনরায় লিখুন"
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setStep('REQUEST_OTP');
                  setError('');
                }}
                className="px-3 py-2 text-slate-500 hover:text-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft size={13} />
                <span>পেছনে</span>
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>যাচাই হচ্ছে...</span>
                  </>
                ) : (
                  <span>পাসওয়ার্ড রিসেট করুন</span>
                )}
              </button>
            </div>
          </form>
        )}

        <div className="text-center pt-2 border-t border-slate-100 dark:border-slate-800">
          <p className="text-[10px] text-slate-400">
            মোবাইলে এসএমএস পেতে কোনো সমস্যা হলে সিস্টেম অ্যাডমিনের সাথে যোগাযোগ করুন।
          </p>
        </div>
      </div>
    </div>
  );
}
