'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { 
  UploadCloud, 
  FileText, 
  Trash2, 
  Search, 
  Eye, 
  AlertCircle, 
  Loader2, 
  Calendar, 
  HardDrive, 
  CheckCircle, 
  FileDown, 
  ArrowUpDown, 
  Filter, 
  FileSignature 
} from 'lucide-react';
import { DocumentFile, UserSession } from '../types';

interface FilesTabProps {
  currentUser: UserSession | null;
  documents: DocumentFile[];
  loading: boolean;
  error: string;
  successMsg: string;
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;
  customName: string;
  setCustomName: (name: string) => void;
  uploading: boolean;
  dragActive: boolean;
  setDragActive: (active: boolean) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortBy: 'date-desc' | 'date-asc' | 'size-desc' | 'size-asc';
  setSortBy: (sort: 'date-desc' | 'date-asc' | 'size-desc' | 'size-asc') => void;
  showFilesFilters: boolean;
  setShowFilesFilters: (show: boolean) => void;
  filesFilterOrigin: string;
  setFilesFilterOrigin: (origin: string) => void;
  filesFilterSize: string;
  setFilesFilterSize: (size: string) => void;
  onUploadSubmit: (e: React.FormEvent) => void;
  onDeleteDoc: (id: number) => void;
}

export default function FilesTab({
  currentUser,
  documents,
  loading,
  error,
  successMsg,
  selectedFile,
  setSelectedFile,
  customName,
  setCustomName,
  uploading,
  dragActive,
  setDragActive,
  fileInputRef,
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
  showFilesFilters,
  setShowFilesFilters,
  filesFilterOrigin,
  setFilesFilterOrigin,
  filesFilterSize,
  setFilesFilterSize,
  onUploadSubmit,
  onDeleteDoc,
}: FilesTabProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDateBengali = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('bn-BD', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        setSelectedFile(file);
        const baseName = file.name.substring(0, file.name.lastIndexOf('.'));
        setCustomName(baseName);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        setSelectedFile(file);
        const baseName = file.name.substring(0, file.name.lastIndexOf('.'));
        setCustomName(baseName);
      }
    }
  };

  // Filter and Sort Documents
  const filteredDocuments = documents
    .filter(doc => {
      const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchesOrigin = true;
      if (filesFilterOrigin === 'generated_bill') {
        matchesOrigin = doc.name.includes('ভাতা') || doc.name.includes('বিল') || doc.name.includes('বিল_');
      } else if (filesFilterOrigin === 'lunch_bill') {
        matchesOrigin = doc.name.includes('লাঞ্চ') || doc.name.includes('Lunch');
      } else if (filesFilterOrigin === 'employee_list') {
        matchesOrigin = doc.name.includes('তালিকা') || doc.name.includes('কর্মকর্তা') || doc.name.includes('Employee');
      } else if (filesFilterOrigin === 'manual_pdf') {
        matchesOrigin = !doc.name.includes('ভাতা') && !doc.name.includes('লাঞ্চ') && !doc.name.includes('তালিকা');
      }

      let matchesSize = true;
      if (filesFilterSize === 'small') {
        matchesSize = doc.fileSize < 150 * 1024;
      } else if (filesFilterSize === 'medium') {
        matchesSize = doc.fileSize >= 150 * 1024 && doc.fileSize <= 1024 * 1024;
      } else if (filesFilterSize === 'large') {
        matchesSize = doc.fileSize > 1024 * 1024;
      }

      return matchesSearch && matchesOrigin && matchesSize;
    })
    .sort((a, b) => {
      if (sortBy === 'date-desc') return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
      if (sortBy === 'date-asc') return new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
      if (sortBy === 'size-desc') return b.fileSize - a.fileSize;
      if (sortBy === 'size-asc') return a.fileSize - b.fileSize;
      return 0;
    });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left Side: Upload Panel */}
      <div className="lg:col-span-4 space-y-6">
        <Card
          title={
            <span className="flex items-center gap-2">
              <UploadCloud size={20} className="text-indigo-600 dark:text-indigo-400" />
              নতুন ফাইল আপলোড
            </span>
          }
          topBorderAccent="primary"
        >
          {error && (
            <div className="mb-4 p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-2xl text-xs text-red-600 dark:text-red-400 flex items-center gap-2.5">
              <AlertCircle size={16} className="shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 rounded-2xl text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2.5">
              <CheckCircle size={16} className="shrink-0" />
              <span className="font-medium">{successMsg}</span>
            </div>
          )}

          <form onSubmit={onUploadSubmit} className="space-y-4">
            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center min-h-[180px] group ${
                dragActive 
                  ? 'border-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/20 scale-[1.01]' 
                  : selectedFile 
                    ? 'border-emerald-500/50 bg-emerald-50/10 dark:bg-emerald-950/10' 
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30'
              }`}
            >
              <input 
                ref={fileInputRef}
                type="file" 
                accept=".pdf" 
                className="hidden" 
                onChange={handleFileSelect}
              />

              {selectedFile ? (
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center mx-auto text-emerald-500 border border-emerald-500/20 animate-pulse">
                    <FileText size={24} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100 max-w-[200px] truncate mx-auto">
                      {selectedFile.name}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                      সাইজ: {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    সংযুক্ত করা হয়েছে
                  </span>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center mx-auto text-indigo-500 border border-indigo-500/20 group-hover:scale-110 transition-transform">
                    <UploadCloud size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      এখানে ড্রাগ করে ফাইলটি ফেলুন অথবা
                    </p>
                    <p className="text-[11px] text-indigo-500 font-semibold mt-1">
                      কম্পিউটার থেকে ব্রাউজ করুন
                    </p>
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-400 font-medium">
                    শুধুমাত্র পিডিএফ (.pdf) ফাইল, সর্বোচ্চ ১০ এমবি
                  </p>
                </div>
              )}
            </div>

            {selectedFile && (
              <div className="space-y-1.5 animate-fadeIn">
                <label htmlFor="customName" className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  ফাইলের নাম (ঐচ্ছিক)
                </label>
                <input
                  id="customName"
                  type="text"
                  placeholder="নথির টাইটেল লিখুন"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-sm focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>
            )}

            {selectedFile && (
              <div className="flex gap-2.5 pt-2">
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>আপলোড হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud size={14} />
                      <span>আর্কাইভে যুক্ত করুন</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setCustomName('');
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-semibold transition-all border border-slate-200 dark:border-slate-700"
                >
                  বাতিল
                </button>
              </div>
            )}
          </form>
        </Card>
      </div>

      {/* Right Side: Document List */}
      <div className="lg:col-span-8 space-y-6">
        <Card className="min-h-[500px] flex flex-col justify-between">
          <div className="space-y-6">
            
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    placeholder="নথির নাম দিয়ে অনুসন্ধান করুন..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/45 dark:bg-slate-900/30 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowFilesFilters(!showFilesFilters)}
                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      showFilesFilters || filesFilterOrigin !== 'ALL' || filesFilterSize !== 'ALL'
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-950/20 dark:border-indigo-900/30 dark:text-indigo-400 font-bold'
                        : 'bg-white/40 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-300'
                    }`}
                  >
                    <Filter size={14} />
                    <span>ফিল্টারসমূহ</span>
                    {(filesFilterOrigin !== 'ALL' || filesFilterSize !== 'ALL') && (
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-pulse" />
                    )}
                  </button>

                  <ArrowUpDown size={14} className="text-slate-400" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'date-desc' | 'date-asc' | 'size-desc' | 'size-asc')}
                    className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/30 text-xs font-semibold text-slate-600 dark:text-slate-300 focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
                  >
                    <option value="date-desc">আপলোড তারিখ (নতুন আগে)</option>
                    <option value="date-asc">আপলোড তারিখ (পুরাতন আগে)</option>
                    <option value="size-desc">সাইজ (বড় আগে)</option>
                    <option value="size-asc">সাইজ (ছোট আগে)</option>
                  </select>
                </div>
              </div>

              {showFilesFilters && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 border border-slate-200/50 dark:border-slate-800/60 rounded-2xl bg-slate-50/50 dark:bg-slate-900/20 animate-fadeIn">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">নথির উৎস</label>
                    <select
                      value={filesFilterOrigin}
                      onChange={(e) => setFilesFilterOrigin(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="ALL">সকল উৎস (All)</option>
                      <option value="generated_bill">সিস্টেম জেনারেটেড বিল</option>
                      <option value="lunch_bill">লাঞ্চ বিল</option>
                      <option value="employee_list">কর্মকর্তা তালিকা</option>
                      <option value="manual_pdf">ম্যানুয়াল আপলোডকৃত পিডিএফ</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">ফাইলের সাইজ</label>
                    <select
                      value={filesFilterSize}
                      onChange={(e) => setFilesFilterSize(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="ALL">সকল সাইজ (All)</option>
                      <option value="small">ছোট (&lt; ১৫০ KB)</option>
                      <option value="medium">মাঝারি (১৫০ KB - ১ MB)</option>
                      <option value="large">বড় (&gt; ১ MB)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {loading ? (
              <CardSkeleton count={4} />
            ) : filteredDocuments.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="কোনো ফাইল পাওয়া যায়নি"
                description={searchQuery ? 'আপনার অনুসন্ধানকৃত নাম অনুযায়ী কোনো ফাইল খুঁজে পাওয়া যায়নি।' : 'সংরক্ষণাগারটিতে এখনও কোনো অফিস আদেশ বা গেজেট ফাইল যুক্ত করা হয়নি।'}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredDocuments.map((doc) => (
                  <div 
                    key={doc.id}
                    className="group border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-4 bg-white/30 dark:bg-slate-900/20 hover:bg-white dark:hover:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 flex flex-col justify-between gap-4 shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-red-500/10 dark:bg-red-500/20 flex items-center justify-center text-red-500 shrink-0 border border-red-500/10">
                        <FileText size={20} />
                      </div>
                      <div className="min-w-0 space-y-1">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-snug group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors truncate" title={doc.name}>
                          {doc.name}
                        </h4>
                        
                        <div className="flex flex-col gap-1 text-[10px] text-slate-400 dark:text-slate-400 font-medium">
                          <span className="flex items-center gap-1">
                            <Calendar size={11} />
                            {formatDateBengali(doc.uploadedAt)}
                          </span>
                          <span className="flex items-center gap-1 font-sans">
                            <HardDrive size={11} />
                            {formatFileSize(doc.fileSize)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60 pt-3">
                      <div className="flex items-center gap-1.5">
                        <a 
                          href={doc.filePath} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:hover:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-bold transition-all"
                          title="ভিউ করুন"
                        >
                          <Eye size={12} />
                          <span>দেখুন</span>
                        </a>
                        
                        <a 
                          href={doc.filePath} 
                          download={doc.name + '.pdf'}
                          className="flex items-center justify-center p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 rounded-lg transition-all"
                          title="ডাউনলোড করুন"
                        >
                          <FileDown size={12} />
                        </a>

                        {doc.name.includes('লাঞ্চ বিল') && currentUser?.role !== 'USER' && (
                          <button 
                            onClick={() => window.location.href = `/lunch-bill`}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-extrabold transition-all border border-slate-200 dark:border-slate-700"
                            title="লাঞ্চ বিল শিটে ফিরে এডিট করুন"
                          >
                            <FileSignature size={12} />
                            <span>সম্পাদনা</span>
                          </button>
                        )}
                      </div>

                      {currentUser?.role !== 'USER' && (
                        <button 
                          onClick={() => onDeleteDoc(doc.id)}
                          className="p-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/30 text-red-500 dark:text-red-400 rounded-lg transition-all"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {!loading && filteredDocuments.length > 0 && (
            <div className="border-t border-slate-100 dark:border-slate-800/60 pt-4 mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] text-slate-400">
              <span className="font-semibold">ডিউটি বিল ও অফিস আদেশ নথি সংরক্ষণাগার</span>
              <span className="bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
                নিরাপদ স্টোরেজ
              </span>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
