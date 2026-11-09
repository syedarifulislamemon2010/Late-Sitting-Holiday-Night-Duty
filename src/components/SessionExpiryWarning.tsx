'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Clock, RefreshCw, LogOut, ShieldAlert } from 'lucide-react';
import { signOut } from 'next-auth/react';
import logger from '@/lib/logger';

// 15 minutes total idle limit; 60 seconds warning before timeout
const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes (900,000 ms)
const WARNING_THRESHOLD_MS = 14 * 60 * 1000; // 14 minutes (840,000 ms)
const ACTIVITY_THROTTLE_MS = 3000; // Throttle storage writes to every 3s

export default function SessionExpiryWarning() {
  const [showModal, setShowModal] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [refreshing, setRefreshing] = useState(false);
  const isLoggingOutRef = useRef(false);

  // Reference to track in-memory last activity timestamp
  const lastActivityRef = useRef<number>(0);

  const handleLogout = async () => {
    if (isLoggingOutRef.current) return;
    isLoggingOutRef.current = true;
    try {
      sessionStorage.setItem('idle_logged_out', 'true');
      await signOut({ redirect: false });
      localStorage.removeItem('currentUser');
      localStorage.removeItem('last_user_activity');
      window.location.href = '/';
    } catch (err) {
      logger.error('Error logging out due to idle timeout:', err);
      window.location.href = '/';
    }
  };

  const handleExtendSession = async () => {
    try {
      setRefreshing(true);
      const now = Date.now();
      lastActivityRef.current = now;
      localStorage.setItem('last_user_activity', String(now));
      setShowModal(false);

      // Ping profile to refresh server session if needed
      await fetch('/api/profile');
    } catch (err) {
      logger.warn('Failed to ping server on session extend:', err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Initialize last_user_activity on mount if absent
    const initialTime = Date.now();
    const stored = Number(localStorage.getItem('last_user_activity') || 0);
    if (!stored || initialTime - stored > IDLE_TIMEOUT_MS) {
      localStorage.setItem('last_user_activity', String(initialTime));
      lastActivityRef.current = initialTime;
    } else {
      lastActivityRef.current = stored;
    }

    // User activity listeners
    let lastThrottleWrite = Date.now();
    const handleUserActivity = () => {
      const now = Date.now();
      lastActivityRef.current = now;

      // Only update localStorage if throttled period passed
      if (now - lastThrottleWrite > ACTIVITY_THROTTLE_MS) {
        lastThrottleWrite = now;
        localStorage.setItem('last_user_activity', String(now));
      }

      // If user acts while warning is shown, auto-extend
      setShowModal((prev) => {
        if (prev) {
          localStorage.setItem('last_user_activity', String(now));
          return false;
        }
        return false;
      });
    };

    const activityEvents = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    activityEvents.forEach((ev) => {
      window.addEventListener(ev, handleUserActivity, { passive: true });
    });

    // Throttled mousemove
    let mouseThrottle = 0;
    const handleMouseMove = () => {
      const now = Date.now();
      if (now - mouseThrottle > 5000) {
        mouseThrottle = now;
        handleUserActivity();
      }
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Multi-tab storage sync
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'last_user_activity' && e.newValue) {
        const remoteTime = Number(e.newValue);
        lastActivityRef.current = remoteTime;
        const elapsed = Date.now() - remoteTime;
        if (elapsed < WARNING_THRESHOLD_MS) {
          setShowModal(false);
        }
      }
      if (e.key === 'currentUser' && e.newValue === null) {
        window.location.href = '/';
      }
    };
    window.addEventListener('storage', handleStorage);

    // Active inspection interval every 1 second
    const interval = setInterval(() => {
      if (isLoggingOutRef.current) return;

      const now = Date.now();
      const storedLast = Number(localStorage.getItem('last_user_activity') || lastActivityRef.current);
      const effectiveLast = Math.max(lastActivityRef.current, storedLast);
      const elapsed = now - effectiveLast;

      if (elapsed >= IDLE_TIMEOUT_MS) {
        // Exceeded 15 minutes: Auto Logout
        clearInterval(interval);
        handleLogout();
      } else if (elapsed >= WARNING_THRESHOLD_MS) {
        // Within the final 60 seconds (14m - 15m)
        const remaining = Math.max(1, Math.ceil((IDLE_TIMEOUT_MS - elapsed) / 1000));
        setSecondsLeft(remaining);
        setShowModal(true);
      } else {
        setShowModal(false);
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      activityEvents.forEach((ev) => {
        window.removeEventListener(ev, handleUserActivity);
      });
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  if (!showModal) return null;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="session-warning-title"
      aria-describedby="session-warning-desc"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-in fade-in duration-200"
    >
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/80 rounded-3xl shadow-2xl p-6 sm:p-7 text-center space-y-4 animate-in zoom-in-95 duration-200">
        {/* Warning Icon Badge */}
        <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border-2 border-amber-300 dark:border-amber-700/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-inner animate-pulse">
          <Clock size={32} />
        </div>

        {/* Title & Description */}
        <div className="space-y-1.5">
          <h3
            id="session-warning-title"
            className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center justify-center gap-2"
          >
            <ShieldAlert size={18} className="text-amber-600 dark:text-amber-400" />
            সেশন সমাপ্তির সতর্কতা
          </h3>
          <p id="session-warning-desc" className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed px-2">
            আপনি দীর্ঘক্ষণ নিষ্ক্রিয় রয়েছেন। ব্যাংকিং নিরাপত্তার স্বার্থে আর{' '}
            <span className="font-mono font-extrabold text-amber-600 dark:text-amber-400 text-base">
              {secondsLeft}
            </span>{' '}
            সেকেন্ডের মধ্যে আপনার সেশন স্বয়ংক্রিয়ভাবে বন্ধ হয়ে যাবে।
          </p>
        </div>

        {/* Live Visual Countdown Badge */}
        <div className="flex items-center justify-center pt-1">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-full text-xs font-bold text-amber-800 dark:text-amber-300 font-mono shadow-xs">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
            </span>
            <span>অবশিষ্ট সময়: {secondsLeft} সেকেন্ড</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col-reverse sm:flex-row items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
          >
            <LogOut size={14} />
            <span>লগআউট করুন</span>
          </button>

          <button
            type="button"
            onClick={handleExtendSession}
            disabled={refreshing}
            autoFocus
            className="w-full sm:w-auto flex-1 px-5 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            <span>{refreshing ? 'নবায়ন হচ্ছে...' : 'সেশন চালু রাখুন'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
