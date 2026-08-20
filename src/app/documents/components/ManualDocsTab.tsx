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
  FileSignature,
  FileSpreadsheet,
  Image,
  Archive,
  Printer
} from 'lucide-react';
import { ManualDoc, UserSession } from '../types';

interface ManualDocsTabProps {
  currentUser: UserSession | null;
  manualDocs: ManualDoc[];
  loadingManualDocs: boolean;
  error: string;
  successMsg: string;
  manualSelectedFile: File | null;
  setManualSelectedFile: (file: File | null) => void;
  manualCustomName: string;
  setManualCustomName: (name: string) => void;
  manualUploading: boolean;
  manualDragActive: boolean;
  setManualDragActive: (active: boolean) => void;
  manualIsVisibleToUsers: boolean;
  setManualIsVisibleToUsers: (visible: boolean) => void;
  manualFileInputRef: React.RefObject<HTMLInputElement | null>;
  manualDocsSearchQuery: string;
  setManualDocsSearchQuery: (query: string) => void;
  showManualFilters: boolean;
  setShowManualFilters: (show: boolean) => void;
  filterFileType: string;
  setFilterFileType: (type: string) => void;
  filterDateRange: string;
  setFilterDateRange: (range: string) => void;
  filterSize: string;
  setFilterSize: (size: string) => void;
  sortByManual: 'date-desc' | 'date-asc' | 'size-desc' | 'size-asc';
  setSortByManual: (sort: 'date-desc' | 'date-asc' | 'size-desc' | 'size-asc') => void;
  onManualUploadSubmit: (e: React.FormEvent) => void;
  onDeleteManualDoc: (id: number) => void;
  onOpenRenameModal: (doc: ManualDoc) => void;
  onToggleVisibility: (id: number, isVisible: boolean) => void;
}

export default function ManualDocsTab({
  currentUser,
  manualDocs,
  loadingManualDocs,
  error,
  successMsg,
  manualSelectedFile,
  setManualSelectedFile,
  manualCustomName,
  setManualCustomName,
  manualUploading,
  manualDragActive,
  setManualDragActive,
  manualIsVisibleToUsers,
  setManualIsVisibleToUsers,
  manualFileInputRef,
  manualDocsSearchQuery,
  setManualDocsSearchQuery,
  showManualFilters,
  setShowManualFilters,
  filterFileType,
  setFilterFileType,
  filterDateRange,
  setFilterDateRange,
  filterSize,
  setFilterSize,
  sortByManual,
  setSortByManual,
  onManualUploadSubmit,
  onDeleteManualDoc,
  onOpenRenameModal,
  onToggleVisibility,
}: ManualDocsTabProps) {
  const getFileIcon = (fileType: string) => {
    const type = fileType.toLowerCase();
    if (type === 'pdf') {
      return <FileText size={20} className="text-red-500" />;
    }
    if (['doc', 'docx'].includes(type)) {
      return <FileText size={20} className="text-blue-500" />;
    }
    if (['xls', 'xlsx', 'csv'].includes(type)) {
      return <FileSpreadsheet size={20} className="text-emerald-500" />;
    }
    if (['jpg', 'jpeg', 'png', 'gif'].includes(type)) {
      return <Image size={20} className="text-purple-500" />;
    }
    if (['zip', 'rar'].includes(type)) {
      return <Archive size={20} className="text-amber-500" />;
    }
    return <FileText size={20} className="text-slate-500" />;
  };

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

  const handlePrintPreview = (id: number, filePath: string, name: string, fileType: string) => {
    const cleanType = fileType.trim().toLowerCase().replace(/^\./, '');
    const previewUrl = `/documents/preview?id=${id}&file=${encodeURIComponent(filePath)}&name=${encodeURIComponent(name)}&type=${cleanType}`;
    window.open(previewUrl, '_blank');
  };

  const handleManualDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setManualDragActive(true);
    } else if (e.type === "dragleave") {
      setManualDragActive(false);
    }
  };

  const validateAndSetManualFile = (file: File) => {
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png', '.gif', '.txt', '.csv', '.zip'];
    const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!allowedExtensions.includes(fileExt)) {
      alert('অসমর্থিত ফাইল ফরম্যাট। শুধুমাত্র PDF, Word, Excel, JPG, PNG, GIF, TXT, CSV, ZIP ফাইল আপলোড করা যাবে।');
      setManualSelectedFile(null);
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      alert('ফাইল সাইজ ১০ মেগাবাইটের বেশি হতে পারবে না।');
      setManualSelectedFile(null);
      return;
    }
    
    setManualSelectedFile(file);
    const baseName = file.name.substring(0, file.name.lastIndexOf('.'));
    setManualCustomName(baseName);
  };

  const handleManualDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setManualDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetManualFile(e.dataTransfer.files[0]);
    }
  };

  const handleManualFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetManualFile(e.target.files[0]);
    }
  };

  // Filter and Sort Manual Documents
  const filteredManualDocs = manualDocs
    .filter(doc => {
      const matchesSearch = doc.name.toLowerCase().includes(manualDocsSearchQuery.toLowerCase());
      
      let matchesFileType = true;
      if (filterFileType !== 'ALL') {
        const type = doc.fileType.toLowerCase();
        if (filterFileType === 'pdf') matchesFileType = type === 'pdf';
        else if (filterFileType === 'word') matchesFileType = ['doc', 'docx'].includes(type);
        else if (filterFileType === 'excel') matchesFileType = ['xls', 'xlsx', 'csv'].includes(type);
        else if (filterFileType === 'image') matchesFileType = ['jpg', 'jpeg', 'png', 'gif'].includes(type);
        else if (filterFileType === 'other') matchesFileType = !['pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'jpg', 'jpeg', 'png', 'gif'].includes(type);
      }

      let matchesDateRange = true;
      if (filterDateRange !== 'ALL') {
        const docDate = new Date(doc.uploadedAt).getTime();
        const now = new Date().getTime();
        const oneDay = 24 * 60 * 60 * 1000;
        if (filterDateRange === 'today') {
          matchesDateRange = now - docDate <= oneDay;
        } else if (filterDateRange === 'week') {
          matchesDateRange = now - docDate <= 7 * oneDay;
        } else if (filterDateRange === 'month') {
          matchesDateRange = now - docDate <= 30 * oneDay;
        }
      }

      let matchesSize = true;
      if (filterSize === 'small') {
        matchesSize = doc.fileSize < 1024 * 1024;
      } else if (filterSize === 'medium') {
        matchesSize = doc.fileSize >= 1024 * 1024 && doc.fileSize <= 5 * 1024 * 1024;
      } else if (filterSize === 'large') {
        matchesSize = doc.fileSize > 5 * 1024 * 1024;
      }

      return matchesSearch && matchesFileType && matchesDateRange && matchesSize;
    })
    .sort((a, b) => {
      if (sortByManual === 'date-desc') return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
      if (sortByManual === 'date-asc') return new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
      if (sortByManual === 'size-desc') return b.fileSize - a.fileSize;
      if (sortByManual === 'size-asc') return a.fileSize - b.fileSize;
      return 0;
    });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left Side: Upload Panel */}
      <div className="lg:col-span-4 space-y-6">
        <Card
          title={
            <span className="flex items-center gap-2">
              <UploadCloud size={20} className="text-emerald-600 dark:text-emerald-400" />
              নতুন ডকুমেন্ট আপলোড
            </span>
          }
          topBorderAccent="success"
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

          <form onSubmit={onManualUploadSubmit} className="space-y-4">
            <div 
              onDragEnter={handleManualDrag}
              onDragOver={handleManualDrag}
              onDragLeave={handleManualDrag}
              onDrop={handleManualDrop}
              onClick={() => manualFileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center min-h-[180px] group ${
                manualDragActive 
                  ? 'border-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/20 scale-[1.01]' 
                  : manualSelectedFile 
                    ? 'border-emerald-500/50 bg-emerald-50/10 dark:bg-emerald-950/10' 
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30'
              }`}
            >
              <input 
                ref={manualFileInputRef}
                type="file" 
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.txt,.csv,.zip" 
                className="hidden" 
                onChange={handleManualFileSelect}
              />

              {manualSelectedFile ? (
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center mx-auto text-emerald-500 border border-emerald-500/20 animate-pulse">
                    <FileText size={24} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100 max-w-[200px] truncate mx-auto">
                      {manualSelectedFile.name}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium font-sans">
                      সাইজ: {formatFileSize(manualSelectedFile.size)}
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
                    PDF, Word, Excel, JPG, PNG, GIF, ZIP (সর্বোচ্চ ১০ এমবি)
                  </p>
                </div>
              )}
            </div>

            {manualSelectedFile && (
              <div className="space-y-1.5 animate-fadeIn">
                <label htmlFor="manualCustomName" className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  ফাইলের নাম (ঐচ্ছিক)
                </label>
                <input
                  id="manualCustomName"
                  type="text"
                  placeholder="নথির টাইটেল লিখুন"
                  value={manualCustomName}
                  onChange={(e) => setManualCustomName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-sm focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>
            )}

            {currentUser?.role === 'ADMIN' && manualSelectedFile && (
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/40 px-3.5 py-2.5 rounded-xl border border-slate-100 dark:border-slate-800 animate-fadeIn">
                <input
                  id="manualIsVisibleToUsers"
                  type="checkbox"
                  checked={manualIsVisibleToUsers}
                  onChange={(e) => setManualIsVisibleToUsers(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer h-4 w-4"
                />
                <label htmlFor="manualIsVisibleToUsers" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                  অন্যান্য ইউজারদের দেখার অনুমতি দিন
                </label>
              </div>
            )}

            {manualSelectedFile && (
              <div className="flex gap-2.5 pt-2">
                <button
                  type="submit"
                  disabled={manualUploading}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                >
                  {manualUploading ? (
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
                    setManualSelectedFile(null);
                    setManualCustomName('');
                    if (manualFileInputRef.current) manualFileInputRef.current.value = '';
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

      {/* Right Side: Manual Document List */}
      <div className="lg:col-span-8 space-y-6">
        <Card className="min-h-[500px] flex flex-col justify-between">
          <div className="space-y-6">
            
            {/* Search and Filters */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    placeholder="নথির নাম দিয়ে অনুসন্ধান করুন..."
                    value={manualDocsSearchQuery}
                    onChange={(e) => setManualDocsSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/30 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowManualFilters(!showManualFilters)}
                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      showManualFilters || filterFileType !== 'ALL' || filterDateRange !== 'ALL' || filterSize !== 'ALL'
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-950/20 dark:border-indigo-900/30 dark:text-indigo-400 font-bold'
                        : 'bg-white/40 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Filter size={14} />
                    <span>ফিল্টারসমূহ</span>
                    {(filterFileType !== 'ALL' || filterDateRange !== 'ALL' || filterSize !== 'ALL') && (
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-pulse" />
                    )}
                  </button>

                  <ArrowUpDown size={14} className="text-slate-400" />
                  <select
                    value={sortByManual}
                    onChange={(e) => setSortByManual(e.target.value as 'date-desc' | 'date-asc' | 'size-desc' | 'size-asc')}
                    className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/30 text-xs font-semibold text-slate-600 dark:text-slate-300 focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
                  >
                    <option value="date-desc">আপলোড তারিখ (নতুন আগে)</option>
                    <option value="date-asc">আপলোড তারিখ (পুরাতন আগে)</option>
                    <option value="size-desc">সাইজ (বড় আগে)</option>
                    <option value="size-asc">সাইজ (ছোট আগে)</option>
                  </select>
                </div>
              </div>

              {showManualFilters && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 border border-slate-200/50 dark:border-slate-800/60 rounded-2xl bg-slate-50/50 dark:bg-slate-900/20 animate-fadeIn">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">ফাইলের ধরণ</label>
                    <select
                      value={filterFileType}
                      onChange={(e) => setFilterFileType(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="ALL">সকল ফরম্যাট (All)</option>
                      <option value="pdf">PDF (.pdf)</option>
                      <option value="word">Word Document (.docx, .doc)</option>
                      <option value="excel">Excel Spreadsheet (.xlsx, .xls, .csv)</option>
                      <option value="image">ছবি / Images (.png, .jpg, .jpeg, .gif)</option>
                      <option value="other">অন্যান্য / Others</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">আপলোডের সময়</label>
                    <select
                      value={filterDateRange}
                      onChange={(e) => setFilterDateRange(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="ALL">সকল সময় (All Time)</option>
                      <option value="today">আজকে (Today)</option>
                      <option value="week">গত ৭ দিন (Last 7 Days)</option>
                      <option value="month">গত ৩০ দিন (Last 30 Days)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">ফাইলের সাইজ</label>
                    <select
                      value={filterSize}
                      onChange={(e) => setFilterSize(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="ALL">সকল সাইজ (All)</option>
                      <option value="small">ছোট (&lt; ১ MB)</option>
                      <option value="medium">মাঝারি (১ MB - ৫ MB)</option>
                      <option value="large">বড় (&gt; ৫ MB)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {loadingManualDocs ? (
              <CardSkeleton count={4} />
            ) : filteredManualDocs.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="কোনো ফাইল পাওয়া যায়নি"
                description={
                  manualDocsSearchQuery || filterFileType !== 'ALL' || filterDateRange !== 'ALL' || filterSize !== 'ALL' 
                    ? 'আপনার ফিল্টার বা অনুসন্ধানকৃত নাম অনুযায়ী কোনো ফাইল খুঁজে পাওয়া যায়নি।' 
                    : 'সংরক্ষণাগারটিতে এখনও কোনো ফাইল আপলোড করে যুক্ত করা হয়নি।'
                }
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredManualDocs.map((doc) => (
                  <div 
                    key={doc.id}
                    className="group border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-4 bg-white/30 dark:bg-slate-900/20 hover:bg-white dark:hover:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 flex flex-col justify-between gap-4 shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/5 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0 border border-slate-100 dark:border-slate-800">
                        {getFileIcon(doc.fileType)}
                      </div>
                      <div className="min-w-0 space-y-1 flex-1">
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
                            {formatFileSize(doc.fileSize)} ({doc.fileType.toUpperCase()})
                          </span>
                          {doc.uploadedBy && (
                            <span className="flex items-center gap-1">
                              <span className="font-bold">আপলোডকারী:</span>
                              <span className="bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-md text-[9px] font-sans">
                                @{doc.uploadedBy}
                              </span>
                            </span>
                          )}
                          
                          {/* Visibility status */}
                          {currentUser?.role === 'ADMIN' && (
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="font-bold text-slate-400">দৃশ্যমানতা:</span>
                              <button
                                onClick={() => onToggleVisibility(doc.id, !doc.isVisibleToUsers)}
                                className={`px-2 py-0.5 rounded-full text-[9px] font-bold transition-all border cursor-pointer ${
                                  doc.isVisibleToUsers
                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30'
                                    : 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800'
                                }`}
                                title="দৃশ্যমানতা পরিবর্তন করতে ক্লিক করুন"
                              >
                                {doc.isVisibleToUsers ? 'সকলের জন্য উন্মুক্ত' : 'ব্যক্তিগত'}
                              </button>
                            </div>
                          )}
                          {currentUser?.role !== 'ADMIN' && doc.isVisibleToUsers && (
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 px-2 py-0.5 rounded-full text-[9px] font-bold">
                                অ্যাডমিন কর্তৃক শেয়ারকৃত
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60 pt-3">
                      <div className="flex items-center gap-1.5">
                        {['pdf', 'jpg', 'jpeg', 'png', 'gif'].includes(doc.fileType.trim().toLowerCase().replace(/^\./, '')) ? (
                          <button 
                            type="button"
                            onClick={() => handlePrintPreview(doc.id, doc.filePath, doc.name, doc.fileType)}
                            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:hover:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl text-[10px] font-bold transition-all cursor-pointer border border-indigo-100/50 dark:border-indigo-950/30"
                            title="প্রিন্ট প্রিভিউ"
                          >
                            <Printer size={12} />
                            <span>প্রিন্ট প্রিভিউ</span>
                          </button>
                        ) : (
                          <a 
                            href={doc.filePath} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:hover:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl text-[10px] font-bold transition-all border border-indigo-100/50"
                            title="ভিউ করুন"
                          >
                            <Eye size={12} />
                            <span>দেখুন</span>
                          </a>
                        )}
                        
                        <a 
                          href={doc.filePath} 
                          download={`${doc.name}.${doc.fileType}`}
                          className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-[10px] font-bold transition-all border border-slate-200/50 dark:border-slate-700"
                          title="ডাউনলোড করুন"
                        >
                          <FileDown size={12} />
                          <span>ডাউনলোড</span>
                        </a>

                        {(currentUser?.role === 'ADMIN' || doc.uploadedBy === currentUser?.username) && (
                          <button 
                            onClick={() => onOpenRenameModal(doc)}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-bold transition-all border border-slate-200 dark:border-slate-700"
                            title="রিনেইম করুন"
                          >
                            <FileSignature size={12} />
                            <span>রিনেইম</span>
                          </button>
                        )}
                      </div>

                      {(currentUser?.role === 'ADMIN' || doc.uploadedBy === currentUser?.username) && (
                        <button 
                          onClick={() => onDeleteManualDoc(doc.id)}
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

          {!loadingManualDocs && filteredManualDocs.length > 0 && (
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
