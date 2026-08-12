'use client';

import React, { useState, useEffect } from 'react';
import { Clock, RefreshCw, X } from 'lucide-react';

export default function SessionExpiryWarning() {
  const [showWarning, setShowWarning] = useState(false);
  const [minutesLeft, setMinutesLeft] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const checkSessionExpiry = async () => {
      try {
        const res = await fetch('/api/profile');
        if (res.ok) {
          const user = await res.json();
          // NextAuth JWT session is 8 hours by default. We check remaining cookie age if present or track active session timestamp
          const lastActivity = Number(localStorage.getItem('last_auth_refresh') || Date.now());
          const maxSessionDurationMs = 8 * 60 * 60 * 1000; // 8 hours
          const elapsedMs = Date.now() - lastActivity;
          const remainingMs = maxSessionDurationMs - elapsedMs;
          const remainingMins = Math.floor(remainingMs / (1000 * 60));

          // If remaining time is less than 15 minutes (or 5 minutes), show warning
          if (remainingMins <= 15 && remainingMins > 0) {
            setMinutesLeft(remainingMins);
            setShowWarning(true);
          } else {
            setShowWarning(false);
          }
        }
      } catch {
        // Silent catch
      }
    };

    // Initialize timestamp if missing
    if (!localStorage.getItem('last_auth_refresh')) {
      localStorage.setItem('last_auth_refresh', String(Date.now()));
    }

    // Check every 2 minutes
    const interval = setInterval(checkSessionExpiry, 2 * 60 * 1000);
    checkSessionExpiry();

    return () => clearInterval(interval);
  }, []);

  const handleRefreshSession = async () => {
    try {
      setRefreshing(true);
      const res = await fetch('/api/profile');
      if (res.ok) {
        localStorage.setItem('last_auth_refresh', String(Date.now()));
        setShowWarning(false);
      }
    } catch {
      // Silent error handling
    } finally {
      setRefreshing(false);
    }
  };

  if (!showWarning || minutesLeft === null) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md bg-amber-50 dark:bg-amber-950/90 border border-amber-300 dark:border-amber-700 shadow-2xl rounded-2xl p-4 text-amber-900 dark:text-amber-100 backdrop-blur-md animate-in slide-in-from-bottom-5 duration-300">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-amber-500/20 rounded-xl text-amber-600 dark:text-amber-400 shrink-0">
          <Clock size={22} />
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-xs sm:text-sm text-amber-900 dark:text-amber-200">
              সেশন মেয়াদ উত্তীর্ণের সসংকেত!
            </h4>
            <button
              onClick={() => setShowWarning(false)}
              className="text-amber-500 hover:text-amber-700 dark:hover:text-amber-300 p-0.5 rounded-lg"
            >
              <X size={16} />
            </button>
          </div>
          <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
            আপনার লগইন সেশনের প্রায় <strong>{minutesLeft} মিনিট</strong> বাকি রয়েছে। অসম্পূর্ণ ড্রাফট বা ফর্ম ডাটা সংরক্ষণ করতে এখনই সেশন নবায়ন করুন।
          </p>
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              onClick={handleRefreshSession}
              disabled={refreshing}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'নবায়ন হচ্ছে...' : 'সেশন নবায়ন করুন'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
