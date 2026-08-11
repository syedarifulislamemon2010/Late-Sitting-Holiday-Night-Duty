'use client';
import logger from '@/lib/logger';

import { useState, useEffect } from 'react';
import { Database, Download, Upload, History, Shield, AlertTriangle, CheckCircle, Clock, Copy, Info } from 'lucide-react';
import AuthGuard from '@/components/AuthGuard';
import { useLanguage } from '@/context/LanguageContext';

export default function BackupPage() {
  const { lang, t } = useLanguage();
  const isEn = lang === 'en';
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [file, setFile] = useState<File | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [previewData, setPreviewData] = useState<any>(null);
  const [copied, setCopied] = useState(false);

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewData(null);
      setMessage({ text: '', type: '' });
      
      try {
        const text = await selectedFile.text();
        const parsed = JSON.parse(text);
        
        if (parsed.version === '1.0' && parsed.checksum) {
          setPreviewData({
            isManifest: true,
            checksum: parsed.checksum,
            recordCounts: parsed.recordCounts,
            tablesCount: parsed.tablesCount,
            timestamp: parsed.timestamp
          });
        } else {
          setPreviewData({
            isManifest: false,
            message: isEn ? 'Legacy format detected. No checksum verification available.' : 'পুরনো ফরম্যাট। কোনো চেকলিস্ট যাচাইকরণ উপলব্ধ নেই।'
          });
        }
      } catch (err) {
        setPreviewData(null);
        setMessage({ text: isEn ? 'Invalid JSON file structure.' : 'অবৈধ JSON ফাইল গঠন।', type: 'error' });
      }
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
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Restore failed');
      }
      
      let successMsg = isEn ? 'Database restored successfully!' : 'ডাটাবেস সফলভাবে পুনরুদ্ধার করা হয়েছে!';
      if (result.restoredRecords) {
        const total = Object.values(result.restoredRecords).reduce((a: any, b: any) => a + b, 0);
        successMsg += isEn ? ` Restored ~${total} records across tables.` : ` মোট ~${total} টি রেকর্ড পুনরুদ্ধার করা হয়েছে।`;
      }
      
      setMessage({ text: successMsg, type: 'success' });
      setFile(null);
      setPreviewData(null);
      if (document.getElementById('file-upload')) {
        (document.getElementById('file-upload') as HTMLInputElement).value = '';
      }
    } catch (error: any) {
      logger.error(error);
      setMessage({ text: error.message || (isEn ? 'Failed to restore database' : 'ডাটাবেস পুনরুদ্ধার ব্যর্থ হয়েছে'), type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const copyCronCommand = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const cmd = `curl -H "Authorization: Bearer YOUR_CRON_SECRET" ${origin}/api/backup/cron`;
    navigator.clipboard.writeText(cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

        {/* Health Indicator */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50 p-4 rounded-xl flex items-center gap-3">
            <Shield className="text-emerald-500" size={24} />
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">{isEn ? 'Integrity' : 'অখণ্ডতা'}</p>
              <p className="font-semibold text-emerald-700 dark:text-emerald-400">{isEn ? 'Verified via SHA-256' : 'SHA-256 দ্বারা যাচাইকৃত'}</p>
            </div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 p-4 rounded-xl flex items-center gap-3">
            <CheckCircle className="text-blue-500" size={24} />
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">{isEn ? 'Encryption' : 'এনক্রিপশন'}</p>
              <p className="font-semibold text-blue-700 dark:text-blue-400">{isEn ? 'Standard (In-transit)' : 'স্ট্যান্ডার্ড (পরিবহনকালীন)'}</p>
            </div>
          </div>
          <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 p-4 rounded-xl flex items-center gap-3">
            <Database className="text-indigo-500" size={24} />
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">{isEn ? 'Scope' : 'ব্যাপ্তি'}</p>
              <p className="font-semibold text-indigo-700 dark:text-indigo-400">{isEn ? 'All 17 Tables' : 'সকল ১৭ টি টেবিল'}</p>
            </div>
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
                {isEn ? 'Download a complete JSON export of all database tables including employees, duties, bills, and office orders. Data is secured with a SHA-256 checksum.' : 'কর্মকর্তা, ডিউটি, বিল এবং অফিস অর্ডার সহ সকল ডাটাবেস টেবিলের একটি সম্পূর্ণ JSON এক্সপোর্ট ডাউনলোড করুন। ডাটা SHA-256 চেকলিস্ট দ্বারা সুরক্ষিত।'}
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
              <label className="flex flex-col items-center justify-center w-full min-h-[6rem] border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl cursor-pointer bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium break-all">
                    {file ? file.name : (isEn ? 'Click to select JSON backup file' : 'JSON ব্যাকআপ ফাইল নির্বাচন করতে ক্লিক করুন')}
                  </p>
                </div>
                <input id="file-upload" type="file" accept=".json" className="hidden" onChange={handleFileChange} />
              </label>

              {previewData && (
                <div className="text-left bg-slate-100 dark:bg-slate-800 p-3 rounded-lg text-sm border border-slate-200 dark:border-slate-700">
                  {previewData.isManifest ? (
                    <div className="space-y-1">
                      <p className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1"><CheckCircle size={14}/> {isEn ? 'Manifest Validated' : 'ম্যানিফেস্ট যাচাইকৃত'}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate" title={previewData.checksum}><strong>SHA-256:</strong> {previewData.checksum}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        <strong>{isEn ? 'Tables:' : 'টেবিল:'}</strong> {previewData.tablesCount} | 
                        <strong> {isEn ? 'Generated:' : 'তৈরি:'}</strong> {new Date(previewData.timestamp).toLocaleString()}
                      </p>
                      <div className="mt-2 text-xs text-slate-500 max-h-20 overflow-y-auto">
                        {Object.entries(previewData.recordCounts || {}).map(([table, count]) => (
                          <span key={table} className="inline-block bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded m-0.5">
                            {table}: {String(count)}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-amber-600 dark:text-amber-400 flex items-center gap-1 text-xs">
                      <Info size={14} /> {previewData.message}
                    </p>
                  )}
                </div>
              )}

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

        {/* Cron Instructions Section */}
        <div className="glass-card p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-gray-800/50">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="text-indigo-500" size={24} />
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{isEn ? 'Automated Cron Backups' : 'স্বয়ংক্রিয় ক্রন ব্যাকআপ'}</h3>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            {isEn ? 'You can trigger automated backups using Vercel Cron, GitHub Actions, or a local server. Make sure to pass the ' : 'আপনি Vercel Cron, GitHub Actions বা লোকাল সার্ভার ব্যবহার করে স্বয়ংক্রিয় ব্যাকআপ নিতে পারেন। অবশ্যই '} 
            <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded text-xs text-rose-500">CRON_SECRET</code> 
            {isEn ? ' environment variable.' : ' পরিবেশ পরিবর্তনশীল পাস করবেন।'}
          </p>
          
          <div className="relative group">
            <div className="bg-slate-900 text-slate-300 p-4 rounded-xl font-mono text-xs md:text-sm overflow-x-auto">
              curl -H &quot;Authorization: Bearer YOUR_CRON_SECRET&quot; {typeof window !== 'undefined' ? window.location.origin : 'https://yourdomain.com'}/api/backup/cron
            </div>
            <button 
              onClick={copyCronCommand}
              className="absolute top-3 right-3 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-md transition-colors"
              title="Copy command"
            >
              {copied ? <CheckCircle size={16} className="text-emerald-400" /> : <Copy size={16} />}
            </button>
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
