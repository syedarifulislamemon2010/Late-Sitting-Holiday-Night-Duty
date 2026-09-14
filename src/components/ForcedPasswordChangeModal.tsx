'use client';

import React, { useState } from 'react';
import { ShieldAlert, KeyRound, Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface ForcedPasswordChangeModalProps {
  isOpen: boolean;
  onSuccess: () => void;
}

export default function ForcedPasswordChangeModal({ isOpen, onSuccess }: ForcedPasswordChangeModalProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const cleanNew = newPassword.trim();
    const cleanConfirm = confirmPassword.trim();

    if (!cleanNew) {
      setError('অনুগ্রহ করে নতুন পাসওয়ার্ড প্রদান করুন।');
      return;
    }

    if (cleanNew.length < 4) {
      setError('পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে।');
      return;
    }

    if (cleanNew === '123456') {
      setError('ডিফল্ট পাসওয়ার্ড (123456) পুনরায় ব্যবহার করা যাবে না। একটি ভিন্ন পাসওয়ার্ড দিন।');
      return;
    }

    if (cleanNew !== cleanConfirm) {
      setError('নতুন পাসওয়ার্ড ও নিশ্চিতকরণ পাসওয়ার্ড মেলেনি।');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: cleanNew }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess('পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে! ড্যাশবোর্ডে প্রবেশ করানো হচ্ছে...');
        setTimeout(() => {
          onSuccess();
        }, 1200);
      } else {
        setError(data.error || 'পাসওয়ার্ড পরিবর্তন করতে সমস্যা হয়েছে।');
      }
    } catch {
      setError('সার্ভারের সাথে যোগাযোগ করা যাচ্ছে না।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Header with Shield Icon */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-14 h-14 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center shadow-inner border border-amber-200/60 dark:border-amber-800/60">
            <ShieldAlert size={28} />
          </div>
          <h2 className="text-lg sm:text-xl font-black text-slate-800 dark:text-slate-100">
            বাধ্যতামূলক পাসওয়ার্ড পরিবর্তন
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            আপনার অ্যাকাউন্টে বর্তমানে প্রাথমিক ডিফল্ট পাসওয়ার্ড (<span className="font-mono font-bold text-amber-600">123456</span>) সক্রিয় রয়েছে। নিরাপত্তার স্বার্থে এখনই একটি নতুন গোপন পাসওয়ার্ড সেট করুন।
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <AlertCircle size={16} className="shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
            <span>{success}</span>
          </div>
        )}

        {/* Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
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
                className="w-full pl-9 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              নতুন পাসওয়ার্ড নিশ্চিত করুন (Confirm Password)*
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
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>সংরক্ষণ করা হচ্ছে...</span>
              </>
            ) : (
              <span>পাসওয়ার্ড আপডেট ও ড্যাশবোর্ডে প্রবেশ করুন</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
