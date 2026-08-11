'use client';
import logger from '@/lib/logger';

import { useEffect } from 'react';
import Link from 'next/link';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    logger.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-2xl animate-in fade-in zoom-in duration-500 flex flex-col items-center text-center">
        <div className="w-20 h-20 bg-rose-100 dark:bg-rose-950/50 rounded-full flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-rose-600 dark:text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
          দুঃখিত, একটি সমস্যা হয়েছে!
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mb-8 font-sans">
          আমাদের সিস্টেমে একটি অপ্রত্যাশিত ত্রুটি ঘটেছে। অনুগ্রহ করে আবার চেষ্টা করুন অথবা হোমপেজে ফিরে যান।
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full">
          <button
            onClick={() => reset()}
            className="flex-1 px-4 py-3 bg-primary/10 hover:bg-primary/20 text-primary dark:bg-primary-900/30 dark:hover:bg-primary-900/50 dark:text-primary-400 rounded-xl font-medium transition-colors"
          >
            আবার চেষ্টা করুন
          </button>
          <Link
            href="/dashboard"
            className="flex-1 px-4 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium transition-colors"
          >
            হোমপেজে যান
          </Link>
        </div>
      </div>
    </div>
  );
}
