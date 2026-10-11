'use client';

import React, { useState } from 'react';
import { KeyRound, Smartphone, Loader2, CheckCircle2, AlertCircle, X, User, MessageSquare } from 'lucide-react';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ForgotPasswordModal({ isOpen, onClose, onSuccess }: ForgotPasswordModalProps) {
  const [bankId, setBankId] = useState('');
  const [mobile, setMobile] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [userName, setUserName] = useState('');

  if (!isOpen) return null;

  const handleResetForm = () => {
    setBankId('');
    setMobile('');
    setNote('');
    setError('');
    setSubmitted(false);
    setUserName('');
  };

  const handleClose = () => {
    handleResetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanBankId = bankId.trim();
    if (!cleanBankId) {
      setError('অনুগ্রহ করে আপনার ব্যাংক আইডি প্রদান করুন।');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bankId: cleanBankId,
          mobile: mobile.trim(),
          note: note.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSubmitted(true);
        if (data.name) setUserName(data.name);
        if (onSuccess) onSuccess();
      } else {
        setError(data.error || 'অনুরোধ পাঠাতে সমস্যা হয়েছে। সরাসরি সিস্টেম অ্যাডমিনের সাথে যোগাযোগ করুন।');
      }
    } catch {
      setError('সার্ভারের সাথে যোগাযোগ করতে ব্যর্থ হয়েছে। সরাসরি সিস্টেম অ্যাডমিনের সাথে যোগাযোগ করুন।');
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
          onClick={handleClose}
          className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center shadow-inner border border-indigo-200/60 dark:border-indigo-800/60">
            {submitted ? <CheckCircle2 size={24} className="text-emerald-600" /> : <KeyRound size={24} />}
          </div>
          <h2 className="text-lg sm:text-xl font-black text-slate-800 dark:text-slate-100">
            {submitted ? 'অনুরোধ সফলভাবে জমা হয়েছে' : 'পাসওয়ার্ড রিসেট অনুরোধ'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {submitted
              ? 'আপনার পাসওয়ার্ড রিসেটের অনুরোধ সিস্টেম অ্যাডমিনের নিকট প্রেরণ করা হয়েছে।'
              : 'পাসওয়ার্ড রিসেটের জন্য আপনার ব্যাংক আইডি প্রদান করে অনুরোধ জমা দিন। সিস্টেম অ্যাডমিন পাসওয়ার্ড রিসেট করে দিবেন।'}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <AlertCircle size={16} className="shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {submitted ? (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl text-xs space-y-2 text-slate-700 dark:text-slate-200">
              <p className="font-bold text-emerald-800 dark:text-emerald-300">
                ব্যাংক আইডি: <span className="font-mono">{bankId}</span>
                {userName ? ` (${userName})` : ''}
              </p>
              <p className="leading-relaxed text-slate-600 dark:text-slate-300">
                সিস্টেম অ্যাডমিন আপনার তথ্য যাচাই করে পাসওয়ার্ড রিসেট করে দিবেন। রিসেট সম্পন্ন হলে পূর্বনির্ধারিত বা নতুন পাসওয়ার্ড দিয়ে লগইন করতে পারবেন।
              </p>
              <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-800/40 text-[11px] text-slate-500 dark:text-slate-400">
                জরুরি প্রয়োজনে সরাসরি অনলাইন ব্যাংকিং ডিপার্টমেন্টের সিস্টেম অ্যাডমিনের সাথে যোগাযোগ করুন।
              </div>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              ঠিক আছে (লগইনে ফিরে যান)
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                ব্যাংক আইডি (Bank ID) *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User size={15} />
                </div>
                <input
                  type="text"
                  required
                  autoFocus
                  value={bankId}
                  onChange={(e) => setBankId(e.target.value)}
                  placeholder="যেমন: 026799 (ব্যাংক আইডি)"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                মোবাইল নম্বর (ঐচ্ছিক / Optional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Smartphone size={15} />
                </div>
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="যেমন: 017XXXXXXXX"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                মন্তব্য বা কারণ (ঐচ্ছিক)
              </label>
              <div className="relative">
                <div className="absolute top-2.5 left-3 pointer-events-none text-slate-400">
                  <MessageSquare size={15} />
                </div>
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="যেমন: পাসওয়ার্ড ভুলে গেছি / অ্যাকাউন্ট রিসেট প্রয়োজন"
                  className="w-full pl-9 pr-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-sans"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2.5 text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>অনুরোধ পাঠানো হচ্ছে...</span>
                  </>
                ) : (
                  <span>সিস্টেম অ্যাডমিনকে অনুরোধ পাঠান</span>
                )}
              </button>
            </div>
          </form>
        )}

        <div className="text-center pt-2 border-t border-slate-100 dark:border-slate-800">
          <p className="text-[10px] text-slate-400">
            অনলাইন ব্যাংকিং ডিপার্টমেন্ট, জনতা ব্যাংক পিএলসি.
          </p>
        </div>
      </div>
    </div>
  );
}
