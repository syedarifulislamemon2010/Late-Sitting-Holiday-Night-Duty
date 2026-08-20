'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { UserCheck, Shield, Key, Save, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { UserProfile } from '@/context/ProfileContext';

interface UserProfileTabProps {
  currentUser: UserProfile | null | undefined;
  profileName: string;
  setProfileName: (v: string) => void;
  profileMobile: string;
  setProfileMobile: (v: string) => void;
  newPassword: string;
  setNewPassword: (v: string) => void;
  confirmPassword: string;
  setConfirmPassword: (v: string) => void;
  profileError: string;
  profileSuccess: string;
  updatingProfile: boolean;
  onUpdateProfile: (e: React.FormEvent) => void;
}

export default function UserProfileTab({
  currentUser,
  profileName,
  setProfileName,
  profileMobile,
  setProfileMobile,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  profileError,
  profileSuccess,
  updatingProfile,
  onUpdateProfile
}: UserProfileTabProps) {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {profileSuccess && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-2xl flex items-center gap-2.5 shadow-sm text-xs font-semibold animate-in fade-in duration-200">
          <CheckCircle size={16} className="text-emerald-600 shrink-0" />
          <span>{profileSuccess}</span>
        </div>
      )}

      {profileError && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 rounded-2xl flex items-center gap-2.5 shadow-sm text-xs font-semibold animate-in fade-in duration-200">
          <AlertCircle size={16} className="text-rose-600 shrink-0" />
          <span>{profileError}</span>
        </div>
      )}

      <Card className="p-6">
        <form onSubmit={onUpdateProfile} className="space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 rounded-2xl">
              <UserCheck size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">আমার প্রোফাইল সেটিংস</h3>
              <p className="text-xs text-slate-500 font-medium">ব্যক্তিগত তথ্য ও পাসওয়ার্ড পরিবর্তন করুন</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                ব্যবহারকারীর ইউজারনেম (লগইন আইডি)
              </label>
              <input
                type="text"
                disabled
                value={currentUser?.username || ''}
                className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                ব্যবহারকারীর ভূমিকা (Role)
              </label>
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300">
                <Shield size={14} className="text-indigo-600" />
                <span>{currentUser?.role === 'ADMIN' ? 'সিস্টেম অ্যাডমিনিস্ট্রেটর' : 'সাধারণ ব্যবহারকারী'}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                পূর্ণ নাম (Full Name)*
              </label>
              <input
                type="text"
                required
                value={profileName}
                onChange={e => setProfileName(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                মোবাইল নম্বর (Mobile No.)
              </label>
              <input
                type="text"
                value={profileMobile}
                onChange={e => setProfileMobile(e.target.value)}
                placeholder="01XXXXXXXXX"
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Password Update Section */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              <Key size={14} />
              <span>পাসওয়ার্ড পরিবর্তন (ঐচ্ছিক)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  নতুন পাসওয়ার্ড (New Password)
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="অপরিবর্তিত রাখতে খালি রাখুন"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  নতুন পাসওয়ার্ড নিশ্চিত করুন
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="পাসওয়ার্ড পুনরায় লিখুন"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="submit"
              disabled={updatingProfile}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-sm cursor-pointer"
            >
              {updatingProfile ? (
                <Loader2 size={16} className="animate-spin mr-1.5" />
              ) : (
                <Save size={16} className="mr-1.5" />
              )}
              প্রোফাইল সংরক্ষণ করুন
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
