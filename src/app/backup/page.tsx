'use client';
import logger from '@/lib/logger';

import { useState, useEffect } from 'react';
import { Database, Download, Upload, History, Shield, AlertTriangle } from 'lucide-react';
import AuthGuard from '@/components/AuthGuard';
import { useLanguage } from '@/context/LanguageContext';

export default function BackupPage() {
  const { lang, t } = useLanguage();
  const isEn = lang === 'en';
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [file, setFile] = useState<File | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user?.role === 'ADMIN') {
        setIsAdmin(true);
      } else {
        window.location.href = '/dashboard';
      }
    }
  }, []);

  const handleBackup = async () => {
    try {
      setLoading(true);
      setMessage({ text: isEn ? 'Preparing backup...' : 'ব্যাকআপ প্রস্তুত করা হচ্ছে...', type: 'info' });
      
      const response = await fetch('/api/backup');
      if (!response.ok) throw new Error('Backup failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lhn_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      
      setMessage({ text: isEn ? 'Backup downloaded successfully!' : 'সফলভাবে ব্যাকআপ ডাউনলোড হয়েছে!', type: 'success' });
    } catch (error) {
      logger.error(error);
      setMessage({ text: isEn ? 'Failed to download backup' : 'ব্যাকআপ ডাউনলোড ব্যর্থ হয়েছে', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleRestore = async () => {
    if (!file) return;
    
    if (!window.confirm(isEn ? 'Warning: This will overwrite current database. Proceed?' : 'সতর্কতা: এটি বর্তমান ডাটাবেস প্রতিস্থাপন করবে। আপনি কি নিশ্চিত?')) {
      return;
    }
    
    try {
      setLoading(true);
      setMessage({ text: isEn ? 'Restoring database...' : 'ডাটাবেস পুনরুদ্ধার করা হচ্ছে...', type: 'info' });
      
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/backup', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Restore failed');
      
      setMessage({ text: isEn ? 'Database restored successfully!' : 'ডাটাবেস সফলভাবে পুনরুদ্ধার করা হয়েছে!', type: 'success' });
      setFile(null);
      if (document.getElementById('file-upload')) {
        (document.getElementById('file-upload') as HTMLInputElement).value = '';
      }
    } catch (error) {
      logger.error(error);
      setMessage({ text: isEn ? 'Failed to restore database' : 'ডাটাবেস পুনরুদ্ধার ব্যর্থ হয়েছে', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) return null;

  return (
    <AuthGuard>
      <div className="space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400">
            <Database size={28} />
          </div>
          <div>
            <h1 className="app-page-title text-slate-800 dark:text-slate-100">{isEn ? 'Database Backup & Restore' : 'ডাটাবেস ব্যাকআপ ও পুনরুদ্ধার'}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{isEn ? 'Export and import system data securely' : 'সিস্টেম ডাটা সুরক্ষিতভাবে এক্সপোর্ট এবং ইমপোর্ট করুন'}</p>
          </div>
        </div>

        {message.text && (
          <div className={`p-4 rounded-xl border flex items-center gap-3 ${
            message.type === 'error' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400' : 
            message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400' :
            'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400'
          }`}>
            <AlertTriangle size={20} />
            <span className="font-medium text-sm">{message.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Backup Section */}
          <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-xl shadow-blue-500/5 flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center">
              <Download size={32} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">{isEn ? 'Take Backup' : 'ব্যাকআপ নিন'}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                {isEn ? 'Download a complete JSON export of all database tables including employees, duties, bills, and office orders.' : 'কর্মকর্তা, ডিউটি, বিল এবং অফিস অর্ডার সহ সকল ডাটাবেস টেবিলের একটি সম্পূর্ণ JSON এক্সপোর্ট ডাউনলোড করুন।'}
              </p>
            </div>
            
            <button
              onClick={handleBackup}
              disabled={loading}
              className="mt-auto flex items-center justify-center gap-2 w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-all shadow-md shadow-indigo-500/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Download size={20} />
              )}
              {isEn ? 'Download Full Backup' : 'সম্পূর্ণ ব্যাকআপ ডাউনলোড করুন'}
            </button>
          </div>

          {/* Restore Section */}
          <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-xl shadow-blue-500/5 flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center">
              <Upload size={32} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">{isEn ? 'Restore Backup' : 'পুনরুদ্ধার করুন'}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                {isEn ? 'Upload a previously downloaded JSON backup file to restore the database to that state. This will overwrite current data.' : 'ডাটাবেস আগের অবস্থায় ফিরিয়ে নিতে পূর্বে ডাউনলোড করা JSON ব্যাকআপ ফাইল আপলোড করুন। এটি বর্তমান ডাটাকে প্রতিস্থাপন করবে।'}
              </p>
            </div>
            
            <div className="w-full mt-auto space-y-3">
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl cursor-pointer bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                    {file ? file.name : (isEn ? 'Click to select JSON backup file' : 'JSON ব্যাকআপ ফাইল নির্বাচন করতে ক্লিক করুন')}
                  </p>
                </div>
                <input id="file-upload" type="file" accept=".json" className="hidden" onChange={handleFileChange} />
              </label>

              <button
                onClick={handleRestore}
                disabled={loading || !file}
                className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold transition-all shadow-md shadow-amber-500/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Shield size={20} />
                )}
                {isEn ? 'Restore Database' : 'ডাটাবেস পুনরুদ্ধার করুন'}
              </button>
            </div>
          </div>
        </div>

        {/* Note section */}
        <div className="glass-card p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-start gap-3 bg-white/50 dark:bg-gray-800/50">
          <History size={20} className="text-slate-400 mt-0.5 shrink-0" />
          <div className="text-sm text-slate-600 dark:text-slate-400">
            <strong>{isEn ? 'Note:' : 'বিঃদ্রঃ'}</strong> {isEn ? 'It is highly recommended to take a fresh backup before attempting a restore operation. Restoring a database replaces all current information with the contents of the backup file.' : 'রিস্টোর অপারেশন করার আগে একটি নতুন ব্যাকআপ নেওয়া অত্যন্ত বাঞ্ছনীয়। ডাটাবেস রিস্টোর করলে বর্তমান সমস্ত তথ্য ব্যাকআপ ফাইলের কন্টেন্ট দিয়ে প্রতিস্থাপিত হয়।'}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
