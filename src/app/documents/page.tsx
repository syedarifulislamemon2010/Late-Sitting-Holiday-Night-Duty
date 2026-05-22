'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  UploadCloud, 
  FileText, 
  Trash2, 
  Search, 
  Eye, 
  Download, 
  AlertCircle, 
  Loader2, 
  Calendar, 
  HardDrive,
  CheckCircle,
  FileDown,
  ArrowUpDown
} from 'lucide-react';

interface DocumentFile {
  id: number;
  name: string;
  filePath: string;
  fileSize: number;
  uploadedAt: string;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  // Form states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customName, setCustomName] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'size-desc' | 'size-asc'>('date-desc');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch all documents
  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/documents');
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      } else {
        setError('নথিপত্র লোড করতে ব্যর্থ হয়েছে।');
      }
    } catch (err) {
      setError('সার্ভারে যোগাযোগ করতে ব্যর্থ হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  // Format File Size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format Date in Bengali
  const formatDateBengali = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('bn-BD', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return dateStr;
    }
  };

  // Drag Handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateAndSetFile = (file: File) => {
    setError('');
    setSuccessMsg('');
    if (!file.name.endsWith('.pdf') && file.type !== 'application/pdf') {
      setError('শুধুমাত্র পিডিএফ (.pdf) ফরম্যাটের ফাইল আপলোড করা যাবে।');
      setSelectedFile(null);
      return;
    }
    
    setSelectedFile(file);
    // Auto populate file name without extension
    const baseName = file.name.replace(/\.pdf$/i, '');
    setCustomName(baseName);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  // Upload Document
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    setError('');
    setSuccessMsg('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('name', customName.trim());

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessMsg('ফাইলটি সফলভাবে আপলোড এবং সংরক্ষণ করা হয়েছে!');
        setSelectedFile(null);
        setCustomName('');
        if (fileInputRef.current) fileInputRef.current.value = '';
        fetchDocuments();
      } else {
        setError(data.message || 'ফাইল আপলোড করতে ব্যর্থ হয়েছে।');
      }
    } catch (err) {
      setError('সার্ভারে যোগাযোগ করতে ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।');
    } finally {
      setUploading(false);
    }
  };

  // Delete Document
  const handleDelete = async (id: number) => {
    if (!confirm('আপনি কি নিশ্চিত যে এই ফাইলটি মুছে ফেলতে চান? এটি স্থায়ীভাবে ডিলিট হয়ে যাবে।')) {
      return;
    }

    try {
      const res = await fetch('/api/documents', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        setSuccessMsg('নথিটি সফলভাবে মুছে ফেলা হয়েছে।');
        fetchDocuments();
      } else {
        setError('নথিটি মুছে ফেলা সম্ভব হয়নি।');
      }
    } catch (err) {
      setError('সার্ভারে যোগাযোগ করতে ব্যর্থ হয়েছে।');
    }
  };

  // Filtered & Sorted Documents
  const filteredDocuments = documents
    .filter(doc => doc.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'date-desc') {
        return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
      }
      if (sortBy === 'date-asc') {
        return new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
      }
      if (sortBy === 'size-desc') {
        return b.fileSize - a.fileSize;
      }
      if (sortBy === 'size-asc') {
        return a.fileSize - b.fileSize;
      }
      return 0;
    });

  return (
    <div className="space-y-8 font-sans max-w-7xl mx-auto pb-12">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            পিডিএফ ডকুমেন্ট আর্কাইভ
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-sm">
            অফিস আদেশ, গেজেট এবং আপ্যায়ন বিলের অনুমোদিত পিডিএফ কপি আপলোড ও সংরক্ষণাগার প্যানেল।
          </p>
        </div>
        <div className="flex items-center gap-2.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100/80 dark:border-indigo-950/30 rounded-2xl w-fit">
          <HardDrive size={16} className="text-indigo-500" />
          <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-400">
            সংরক্ষিত ফাইল: {documents.length} টি
          </span>
        </div>
      </div>

      {/* Main Grid: Upload Form (Left) & Document List (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Upload Panel */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-card rounded-3xl p-6 border border-white/10 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500" />
            
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
              <UploadCloud size={20} className="text-indigo-500" />
              নতুন ফাইল আপলোড
            </h2>

            {/* Error and Success Banners */}
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

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              {/* Drag & Drop Zone */}
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
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                      শুধুমাত্র পিডিএফ (.pdf) ফাইল, সর্বোচ্চ ১০ এমবি
                    </p>
                  </div>
                )}
              </div>

              {/* Document Custom Name Input */}
              {selectedFile && (
                <div className="space-y-1.5 animate-fadeIn">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    ফাইলের নাম (ঐচ্ছিক)
                  </label>
                  <input
                    type="text"
                    placeholder="নথির টাইটেল লিখুন"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-sm focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>
              )}

              {/* Action Buttons */}
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
          </div>
        </div>

        {/* Right Side: Document Archive List */}
        <div className="lg:col-span-8 space-y-6">
          <div className="glass-card rounded-3xl p-6 border border-white/10 shadow-xl min-h-[500px] flex flex-col justify-between">
            <div className="space-y-6">
              
              {/* Search and Sort controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Search Bar */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    placeholder="নথির নাম দিয়ে অনুসন্ধান করুন..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/30 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-500"
                  />
                </div>

                {/* Sort dropdown */}
                <div className="flex items-center gap-2">
                  <ArrowUpDown size={14} className="text-slate-400" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-3 py-2 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/30 text-xs font-semibold text-slate-600 dark:text-slate-300 focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
                  >
                    <option value="date-desc">আপলোড তারিখ (নতুন আগে)</option>
                    <option value="date-asc">আপলোড তারিখ (পুরাতন আগে)</option>
                    <option value="size-desc">সাইজ (বড় আগে)</option>
                    <option value="size-asc">সাইজ (ছোট আগে)</option>
                  </select>
                </div>
              </div>

              {/* List grid */}
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-3">
                  <Loader2 size={36} className="text-indigo-500 animate-spin" />
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">আর্কাইভ লোড হচ্ছে...</p>
                </div>
              ) : filteredDocuments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-400 dark:text-slate-600">
                    <AlertCircle size={28} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">কোন ফাইল পাওয়া যায়নি</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-[280px]">
                      {searchQuery ? 'আপনার অনুসন্ধানকৃত নাম অনুযায়ী কোনো ফাইল খুঁজে পাওয়া যায়নি।' : 'সংরক্ষণাগারটিতে এখনও কোনো অফিস আদেশ বা গেজেট ফাইল যুক্ত করা হয়নি।'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredDocuments.map((doc) => (
                    <div 
                      key={doc.id}
                      className="group border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-4 bg-white/30 dark:bg-slate-900/20 hover:bg-white dark:hover:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 flex flex-col justify-between gap-4 shadow-sm"
                    >
                      <div className="flex items-start gap-3">
                        {/* PDF Thumbnail Accent */}
                        <div className="w-10 h-10 rounded-xl bg-red-500/10 dark:bg-red-500/20 flex items-center justify-center text-red-500 shrink-0 border border-red-500/10">
                          <FileText size={20} />
                        </div>
                        <div className="min-w-0 space-y-1">
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-snug group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors truncate" title={doc.name}>
                            {doc.name}
                          </h4>
                          
                          <div className="flex flex-col gap-1 text-[10px] text-slate-400 dark:text-slate-500 font-medium">
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

                      {/* Interactive Buttons */}
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
                        </div>

                        <button 
                          onClick={() => handleDelete(doc.id)}
                          className="p-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/30 text-red-500 dark:text-red-400 rounded-lg transition-all"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Government Seal Badge at Bottom */}
            {!loading && filteredDocuments.length > 0 && (
              <div className="border-t border-slate-100 dark:border-slate-800/60 pt-4 mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] text-slate-400">
                <span className="font-semibold">ডিউটি বিল ও অফিস আদেশ নথি সংরক্ষণাগার</span>
                <span className="bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
                  নিরাপদ ক্লাউড স্টোরেজ
                </span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
