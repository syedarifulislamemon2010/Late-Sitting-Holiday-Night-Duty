'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  PlusCircle, 
  Send, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  User,
  MessagesSquare,
  HelpCircle,
  AlertTriangle,
  Lightbulb,
  Zap,
  MinusCircle,
  HelpCircle as QuestionIcon,
  Trash2,
  Image
} from 'lucide-react';

interface FeedbackMessage {
  id: number;
  feedbackId: number;
  senderId: number;
  message: string;
  attachmentUrl?: string;
  createdAt: string;
  sender: {
    id: number;
    username: string;
    name: string;
    role: string;
  };
}

interface Feedback {
  id: number;
  title: string;
  category: 'SUGGESTION' | 'IMPROVEMENT' | 'REMOVE' | 'SIMPLIFY' | 'ISSUE';
  status: 'PENDING' | 'REVIEWED' | 'RESOLVED';
  userId: number;
  createdAt: string;
  updatedAt: string;
  user: {
    id: number;
    username: string;
    name: string;
    role: string;
  };
  messages: FeedbackMessage[];
}

const CATEGORIES = [
  { id: 'SUGGESTION', label: '💡 নতুন ফিচার প্রস্তাব', icon: Lightbulb, color: 'bg-blue-50 text-blue-700 border-blue-200/60 hover:bg-blue-50/70', activeColor: 'border-blue-600 ring-2 ring-blue-100 bg-blue-50/80 text-blue-900' },
  { id: 'IMPROVEMENT', label: '⚡ ফিচার ইম্প্রুভমেন্ট/উন্নয়ন', icon: Zap, color: 'bg-emerald-50 text-emerald-700 border-emerald-200/60 hover:bg-emerald-50/70', activeColor: 'border-emerald-600 ring-2 ring-emerald-100 bg-emerald-50/80 text-emerald-900' },
  { id: 'REMOVE', label: '➖ অপ্রয়োজনীয় ফিচার অপসারণ', icon: MinusCircle, color: 'bg-rose-50 text-rose-700 border-rose-200/60 hover:bg-rose-50/70', activeColor: 'border-rose-600 ring-2 ring-rose-100 bg-rose-50/80 text-rose-900' },
  { id: 'SIMPLIFY', label: '❓ সহজীকরণ প্রস্তাব', icon: QuestionIcon, color: 'bg-amber-50 text-amber-750 border-amber-200/60 hover:bg-amber-50/70', activeColor: 'border-amber-600 ring-2 ring-amber-100 bg-amber-50/80 text-amber-900' },
  { id: 'ISSUE', label: '⚠️ সমস্যা ও সমাধান/অভিযোগ', icon: AlertTriangle, color: 'bg-red-50 text-red-700 border-red-200/60 hover:bg-red-50/70', activeColor: 'border-red-600 ring-2 ring-red-100 bg-red-50/80 text-red-900' }
] as const;

export default function FeedbackPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [selectedFeedbackId, setSelectedFeedbackId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Left Column Tab switching: 'LIST' or 'CREATE'
  const [activeLeftTab, setActiveLeftTab] = useState<'LIST' | 'CREATE'>('LIST');

  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'SUGGESTION' | 'IMPROVEMENT' | 'REMOVE' | 'SIMPLIFY' | 'ISSUE'>('SUGGESTION');
  const [newDescription, setNewDescription] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Reply State
  const [replyText, setReplyText] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);

  // Screenshot Upload State
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Clear staged image when switching threads or active tabs
  useEffect(() => {
    handleClearSelectedImage();
  }, [selectedFeedbackId, activeLeftTab]);

  const handleClearSelectedImage = () => {
    setSelectedImage(null);
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(null);
    }
  };

  // Helper to stage selected image file
  const stageImageFile = (file: File) => {
    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      alert('শুধুমাত্র ইমেজ (.png, .jpg, .jpeg, .webp, .gif) ফাইল স্ক্রিনশট হিসেবে আপলোড করা যাবে।');
      return;
    }
    // Set file and preview
    setSelectedImage(file);
    const url = URL.createObjectURL(file);
    setImagePreviewUrl(url);
  };

  // Shared file upload function (returns uploaded relative URL or null)
  const uploadScreenshotToServer = async (): Promise<string | null> => {
    if (!selectedImage) return null;
    try {
      const form = new FormData();
      form.append('file', selectedImage);
      const res = await fetch('/api/feedbacks/upload', {
        method: 'POST',
        body: form
      });
      if (res.ok) {
        const data = await res.json();
        return data.filePath;
      } else {
        const errData = await res.json();
        alert(errData.message || 'ইমেজ আপলোড করতে সমস্যা হয়েছে।');
        return null;
      }
    } catch (err) {
      console.error('Error uploading image:', err);
      alert('নেটওয়ার্ক সমস্যার কারণে ইমেজ আপলোড করা যায়নি।');
      return null;
    }
  };

  // Clipboard Paste Interception Handler
  const handleClipboardPaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          stageImageFile(file);
          e.preventDefault(); // Stop default text pasting
          break;
        }
      }
    }
  };

  // Drag & Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      stageImageFile(files[0]);
    }
  };

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadUser = () => {
      const stored = localStorage.getItem('currentUser');
      if (stored) {
        try {
          setCurrentUser(JSON.parse(stored));
        } catch {
          setCurrentUser(null);
        }
      } else {
        // Fallback to API if not in localStorage yet
        fetch('/api/auth')
          .then(res => res.json())
          .then(data => {
            if (data.authenticated) {
              setCurrentUser(data.user);
              localStorage.setItem('currentUser', JSON.stringify(data.user));
            }
          })
          .catch(() => setCurrentUser(null));
      }
    };

    loadUser();
    window.addEventListener('storage', loadUser);
    window.addEventListener('user-profile-updated', loadUser);

    fetchFeedbacks();

    return () => {
      window.removeEventListener('storage', loadUser);
      window.removeEventListener('user-profile-updated', loadUser);
    };
  }, []);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedFeedbackId, feedbacks]);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/feedbacks');
      if (res.ok) {
        const data = await res.json();
        setFeedbacks(Array.isArray(data) ? data : []);
        // Automatically select the first ticket if available and no ticket selected
        if (Array.isArray(data) && data.length > 0 && !selectedFeedbackId) {
          setSelectedFeedbackId(data[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching feedbacks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) return;

    try {
      setSubmitLoading(true);
      
      // 1. Upload screenshot if selected
      let attachmentUrl: string | null = null;
      if (selectedImage) {
        attachmentUrl = await uploadScreenshotToServer();
        if (!attachmentUrl) {
          setSubmitLoading(false);
          return;
        }
      }

      // 2. Post thread creation
      const res = await fetch('/api/feedbacks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          category: newCategory,
          description: newDescription.trim(),
          attachmentUrl
        })
      });

      if (res.ok) {
        const newThread = await res.json();
        setFeedbacks(prev => [newThread, ...prev]);
        setSelectedFeedbackId(newThread.id);
        setNewTitle('');
        setNewDescription('');
        setNewCategory('SUGGESTION');
        handleClearSelectedImage();
        setActiveLeftTab('LIST'); // Switch back to feedback list
      }
    } catch (err) {
      console.error('Error creating feedback:', err);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handlePostReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedFeedbackId) return;

    // Stop if resolved
    const activeFb = feedbacks.find(fb => fb.id === selectedFeedbackId);
    if (activeFb?.status === 'RESOLVED') return;

    try {
      setReplyLoading(true);
      
      // 1. Upload screenshot if selected
      let attachmentUrl: string | null = null;
      if (selectedImage) {
        attachmentUrl = await uploadScreenshotToServer();
        if (!attachmentUrl) {
          setReplyLoading(false);
          return;
        }
      }

      // 2. Post reply message
      const res = await fetch(`/api/feedbacks/${selectedFeedbackId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: replyText.trim(),
          attachmentUrl
        })
      });

      if (res.ok) {
        const newMsg = await res.json();
        setFeedbacks(prev => prev.map(fb => {
          if (fb.id === selectedFeedbackId) {
            let nextStatus = fb.status;
            if (currentUser?.role === 'ADMIN' && fb.status === 'PENDING') {
              nextStatus = 'REVIEWED'; // Auto-review on admin response
            }
            return {
              ...fb,
              status: nextStatus,
              updatedAt: new Date().toISOString(),
              messages: [...fb.messages, newMsg]
            };
          }
          return fb;
        }));
        setReplyText('');
        handleClearSelectedImage();
      }
    } catch (err) {
      console.error('Error posting reply:', err);
    } finally {
      setReplyLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: 'PENDING' | 'REVIEWED' | 'RESOLVED') => {
    if (!selectedFeedbackId || currentUser?.role !== 'ADMIN') return;

    try {
      const res = await fetch(`/api/feedbacks/${selectedFeedbackId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        const updatedFb = await res.json();
        setFeedbacks(prev => prev.map(fb => fb.id === selectedFeedbackId ? updatedFb : fb));
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  // Convert numbers and dates to premium Bengali local formats
  const toBanglaDigits = (num: number | string): string => {
    const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return String(num).split('').map(d => banglaDigits[parseInt(d, 10)] || d).join('');
  };

  const formatToBengaliDate = (dateStr: string): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const day = toBanglaDigits(date.getDate());
    const year = toBanglaDigits(date.getFullYear());
    const banglaMonths = [
      'মে', 'মে', 'মে', 'মে', 'মে', 'মে', 'মে', 'মে', 'মে', 'মে', 'মে', 'মে'
    ]; // Using standard months list
    const months = [
      'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
      'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
    ];
    const month = months[date.getMonth()];
    
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const minutesBangla = minutes.split('').map(d => toBanglaDigits(d)).join('');
    
    const ampm = hours >= 12 ? 'অপরাহ্ন' : 'পূর্বাহ্ন';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const hoursBangla = toBanglaDigits(hours);

    return `${day} ${month} ${year}, ${hoursBangla}:${minutesBangla} ${ampm}`;
  };

  // Category tags helper
  const getCategoryDetails = (catId: string) => {
    return CATEGORIES.find(c => c.id === catId) || { label: catId, color: 'bg-slate-100 text-slate-700 border-slate-200' };
  };

  // Filter feedbacks
  const filteredFeedbacks = feedbacks.filter(fb => {
    const matchesSearch = fb.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          fb.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (fb.user.username || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || fb.category === categoryFilter;
    const matchesStatus = statusFilter === 'ALL' || fb.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const selectedFeedback = feedbacks.find(fb => fb.id === selectedFeedbackId);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans select-none">
      
      {/* 1. TOP NEAT AND CLEAN BANNER */}
      <div className="relative bg-white border border-slate-200 p-6 md:p-8 rounded-2xl shadow-xs flex items-center justify-between">
        <div className="space-y-2.5 max-w-3xl relative z-10">
          <span className="text-[10px] font-bold tracking-wider bg-slate-100 px-3 py-1 rounded-full uppercase border border-slate-200 text-slate-600 font-sans">
            ⭐ ইউজার ফিডব্যাক ও সাহায্য কেন্দ্র
          </span>
          <h1 className="text-xl md:text-2xl font-black tracking-wide font-sans text-slate-800 mt-2">
            মতামত এবং সমস্যা ও সমাধান
          </h1>
          <p className="text-xs md:text-xs leading-relaxed text-slate-500 font-medium">
            লেট সিটিং-হলিডে-নাইট পোর্টালটি আরও সহজ, ব্যবহারকারী-বান্ধব এবং উন্নত করতে আপনার মূল্যবান মতামত জানান। নতুন ফিচার প্রস্তাব, বর্তমান ফিচারের উন্নয়ন, অপ্রয়োজনীয় ফিচার অপসারণের পরামর্শ অথবা সিস্টেমে যেকোনো সমস্যায় পড়লে সরাসরি আমাদের (অ্যাডমিন) কাছে অভিযোগ জমা দিতে পারেন।
          </p>
        </div>

        {/* Subtle Bubble Icon Outline */}
        <div className="absolute right-6 bottom-0 top-0 hidden md:flex items-center justify-center text-slate-150 opacity-20 select-none pointer-events-none">
          <MessagesSquare size={120} className="stroke-[1.2]" />
        </div>
      </div>

      {/* 2. SPLIT LAYOUT PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: LIST PANEL OR FORM (40% width on desktop) */}
        <div className="lg:col-span-5 space-y-5 flex flex-col">
          
          {/* TAB Toggler */}
          {currentUser?.role !== 'ADMIN' ? (
            <div className="bg-white border border-slate-200 p-1.5 rounded-2xl shadow-xs flex select-none shrink-0">
              <button
                onClick={() => setActiveLeftTab('LIST')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${activeLeftTab === 'LIST' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/10' : 'text-slate-500 hover:text-slate-900'}`}
              >
                <MessageSquare size={14} />
                আমার পাঠানো ফিডব্যাক
              </button>
              <button
                onClick={() => setActiveLeftTab('CREATE')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${activeLeftTab === 'CREATE' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/10' : 'text-slate-500 hover:text-slate-900'}`}
              >
                <PlusCircle size={14} />
                নতুন মতামত লিখুন
              </button>
            </div>
          ) : (
            <div className="bg-indigo-50/50 border border-indigo-150 p-3 rounded-2xl text-center text-xs font-extrabold text-indigo-900 shrink-0 select-none">
              🛡️ সিস্টেম অ্যাডমিন ফিডব্যাক ও সহায়তা ড্যাশবোর্ড
            </div>
          )}

          {/* TAB 1 CONTENT: FEEDBACK LIST */}
          {activeLeftTab === 'LIST' || currentUser?.role === 'ADMIN' ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4 flex flex-col min-h-[500px]">
              
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-100 pb-2.5 shrink-0">
                <MessageSquare size={16} className="text-indigo-650" />
                ফিডব্যাক ও সমস্যাসমূহ ({toBanglaDigits(filteredFeedbacks.length)})
              </h3>

              {/* Filtering block */}
              <div className="grid grid-cols-2 gap-3 shrink-0">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400">ক্যাটাগরি ফিল্টারঃ</label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold outline-none cursor-pointer"
                  >
                    <option value="ALL">সকল ক্যাটাগরি</option>
                    <option value="SUGGESTION">💡 নতুন ফিচার প্রস্তাব</option>
                    <option value="IMPROVEMENT">⚡ ফিচার ইম্প্রুভমেন্ট</option>
                    <option value="REMOVE">➖ অপ্রয়োজনীয় ফিচার অপসারণ</option>
                    <option value="SIMPLIFY">❓ সহজীকরণ প্রস্তাব</option>
                    <option value="ISSUE">⚠️ সমস্যা ও সমাধান/অভিযোগ</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400">স্ট্যাটাস ফিল্টারঃ</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold outline-none cursor-pointer"
                  >
                    <option value="ALL">সকল স্ট্যাটাস</option>
                    <option value="PENDING">Pending (অপেক্ষমান)</option>
                    <option value="REVIEWED">Reviewed (চলমান)</option>
                    <option value="RESOLVED">Resolved (সমাধানকৃত)</option>
                  </select>
                </div>
              </div>

              {/* Scrollable list card list */}
              <div className="flex-1 overflow-y-auto max-h-[520px] pr-1 space-y-3 divide-y divide-slate-50">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-2">
                    <div className="w-6 h-6 border-2 border-indigo-650 border-t-transparent rounded-full animate-spin" />
                    <p className="text-[10px] font-bold text-slate-400">লোড হচ্ছে...</p>
                  </div>
                ) : filteredFeedbacks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                    <HelpCircle size={36} className="text-slate-300 mb-2" />
                    <p className="text-xs font-bold text-slate-500">কোনো ফিডব্যাক পাওয়া যায়নি!</p>
                  </div>
                ) : (
                  filteredFeedbacks.map((fb) => {
                    const isActive = fb.id === selectedFeedbackId;
                    const cat = getCategoryDetails(fb.category);
                    const lastMsg = fb.messages[fb.messages.length - 1];
                    
                    return (
                      <div
                        key={fb.id}
                        onClick={() => setSelectedFeedbackId(fb.id)}
                        className={`p-3.5 rounded-2xl hover:bg-slate-50/50 cursor-pointer transition-all border mt-1.5 ${isActive ? 'bg-indigo-50/20 border-indigo-250 ring-1 ring-indigo-200 shadow-sm' : 'border-slate-100 bg-slate-50/20'}`}
                      >
                        {/* Badges block */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold border leading-none shrink-0 ${cat.color}`}>
                            {cat.label}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold border leading-none shrink-0 ${fb.status === 'RESOLVED' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : fb.status === 'REVIEWED' ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-slate-100 border-slate-200 text-slate-650'}`}>
                            {fb.status === 'RESOLVED' ? 'সমাধানকৃত' : fb.status === 'REVIEWED' ? 'চলমান' : 'অপেক্ষমান'}
                          </span>
                        </div>

                        {/* Title */}
                        <h4 className="text-xs font-extrabold text-slate-800 line-clamp-1 leading-snug">
                          {fb.title}
                        </h4>

                        {/* Snippet */}
                        <p className="text-[10px] text-slate-500 line-clamp-1 mt-1.5">
                          {lastMsg ? lastMsg.message : 'কোনো বার্তা নেই।'}
                        </p>

                        {/* Footer details */}
                        <div className="flex items-center justify-between mt-3 text-[9px] font-bold text-slate-400 border-t border-slate-100/50 pt-2 select-none">
                          <span>প্রেরকঃ {fb.user.name.split(' ').slice(-2).join(' ')}</span>
                          <span>{formatToBengaliDate(fb.updatedAt).split(',')[0]}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

            </div>
          ) : (
            // TAB 2 CONTENT: CREATE TICKET FORM
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4 flex flex-col min-h-[500px]">
              
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-100 pb-1.5">
                  <PlusCircle size={16} className="text-indigo-650" />
                  নতুন মতামত ও ফিডব্যাক লিখুন
                </h3>
                <p className="text-[9px] text-slate-400 font-bold mt-1">
                  অ্যাপ্লিকেশন সম্পর্কে আপনার সুচিন্তিত মতামত সরাসরি অ্যাডমিনের কাছে চলে যাবে।
                </p>
              </div>

              <form onSubmit={handleCreateThread} className="space-y-4 flex-1 flex flex-col text-xs font-sans">
                
                {/* Category Radio Cards Selection */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-500 block">ফিডব্যাকের ধরণ নির্বাচন করুনঃ</label>
                  <div className="space-y-1.5 max-h-[190px] overflow-y-auto pr-1">
                    {CATEGORIES.map((cat) => {
                      const isActive = newCategory === cat.id;
                      const Icon = cat.icon;
                      return (
                        <div
                          key={cat.id}
                          onClick={() => setNewCategory(cat.id)}
                          className={`flex items-center justify-between p-2.5 rounded-xl border text-[10px] font-bold cursor-pointer transition-all ${isActive ? cat.activeColor : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'}`}
                        >
                          <div className="flex items-center gap-2">
                            <Icon size={12} className="shrink-0" />
                            <span>{cat.label}</span>
                          </div>
                          <input 
                            type="radio" 
                            checked={isActive} 
                            onChange={() => setNewCategory(cat.id)}
                            className="w-3.5 h-3.5 accent-indigo-600 cursor-pointer"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">মতামতের শিরোনামঃ</label>
                  <input
                    type="text"
                    placeholder="সংক্ষেপে ফিডব্যাক বা সমস্যার নাম লিখুন (যেমন: ছুটির আবেদন প্রিন্ট সমস্যা)"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-250 rounded-xl outline-none focus:border-indigo-500 focus:bg-white font-semibold"
                    required
                  />
                </div>

                {/* Description Textarea with Drag and Drop / Paste support */}
                <div 
                  className={`space-y-1 flex-1 flex flex-col relative transition-all duration-205 rounded-xl p-0.5 ${isDragging ? 'ring-2 ring-indigo-500 bg-indigo-50/10' : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <label className="font-bold text-slate-500 flex items-center justify-between">
                    <span>বিস্তারিত বিবরণ ও প্রস্তাবনাঃ</span>
                    <span className="text-[9px] text-slate-400 font-normal">ইমেজ পেস্ট (Ctrl+V) বা ড্র্যাগ-ড্রপ করতে পারেন</span>
                  </label>

                  <textarea
                    placeholder="আপনার সুনির্দিষ্ট প্রস্তাবনা, ফিচার আইডিয়া, কি কি সমস্যা ফেস করছেন, অথবা কি উন্নত করা উচিত তা বিস্তারিত লিখুন..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    onPaste={handleClipboardPaste}
                    className="w-full flex-1 px-3 py-2 bg-slate-50 border border-slate-250 rounded-xl outline-none focus:border-indigo-550 focus:bg-white font-semibold resize-none min-h-[100px]"
                    required
                  />

                  {/* Drag and Drop Visual Overlay */}
                  {isDragging && (
                    <div className="absolute inset-0 bg-indigo-500/10 backdrop-blur-xs border-2 border-dashed border-indigo-500 rounded-xl flex items-center justify-center pointer-events-none z-10">
                      <p className="text-[10px] font-extrabold text-indigo-700 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-full shadow-xs">
                        স্ক্রিনশট ইমেজটি এখানে ছেড়ে দিন (Drop here)
                      </p>
                    </div>
                  )}

                  {/* Hidden File Picker Input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => {
                      const files = e.target.files;
                      if (files && files.length > 0) {
                        stageImageFile(files[0]);
                      }
                    }}
                    accept="image/*"
                    className="hidden"
                  />

                  {/* Image Picker Trigger & Screenshot Preview Area */}
                  <div className="pt-1 flex flex-col gap-2">
                    {!imagePreviewUrl ? (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-1.5 py-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-bold transition-all w-fit cursor-pointer border border-slate-200/60 hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <Image size={11} />
                        স্ক্রিনশট ফাইল যুক্ত করুন
                      </button>
                    ) : (
                      <div className="p-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between gap-3 shadow-inner">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img 
                            src={imagePreviewUrl} 
                            alt="Screenshot Preview" 
                            className="w-12 h-12 object-cover rounded-lg border border-slate-200 dark:border-slate-800 shrink-0" 
                          />
                          <div className="min-w-0 text-[10px] font-semibold text-slate-500">
                            <p className="truncate text-slate-800 dark:text-slate-200 font-extrabold">{selectedImage?.name || 'clipboard_screenshot.png'}</p>
                            <p>{selectedImage ? `${(selectedImage.size / 1024).toFixed(1)} KB` : ''}</p>
                          </div>
                        </div>
                        <button 
                          type="button" 
                          onClick={handleClearSelectedImage}
                          className="p-1.5 hover:bg-rose-100 hover:text-rose-600 text-slate-400 rounded-lg transition-all hover:scale-110 active:scale-95 cursor-pointer shrink-0"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit Button Block (Neat and Clean Solid Indigo) */}
                <div className="pt-2 shrink-0">
                  <button
                    type="submit"
                    disabled={submitLoading || !newTitle.trim() || !newDescription.trim()}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors duration-200 cursor-pointer disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 group"
                  >
                    {submitLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send size={12} className="transition-transform duration-300 group-hover:translate-x-0.5" />
                        মতামত সাবমিট করুন
                      </>
                    )}
                  </button>
                </div>

              </form>

            </div>
          )}

        </div>

        {/* RIGHT COLUMN: CHAT ROOM SCREEN (80% width on desktop) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden flex flex-col min-h-[575px]">
          {selectedFeedback ? (
            <div className="flex flex-col h-full flex-1 min-h-[575px]">
              
              {/* Header Info */}
              <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-200/80 flex items-center justify-between shrink-0 select-none">
                <div className="space-y-1.5 min-w-0">
                  <h3 className="text-xs font-black text-slate-800 truncate leading-snug">
                    {selectedFeedback.title}
                  </h3>
                  <div className="flex items-center gap-2 text-[8px] font-bold">
                    <span className={`px-2 py-0.5 rounded border leading-none ${getCategoryDetails(selectedFeedback.category).color}`}>
                      {getCategoryDetails(selectedFeedback.category).label}
                    </span>
                    <span className="bg-slate-100 border border-slate-200 text-slate-500 px-1.5 py-0.5 rounded leading-none">
                      ID: #{toBanglaDigits(selectedFeedback.id)}
                    </span>
                  </div>
                </div>

                {/* Status Toggle Box (Admin only) or label */}
                <div className="shrink-0 flex items-center gap-1.5">
                  {currentUser?.role === 'ADMIN' ? (
                    <div className="bg-slate-100 border border-slate-200 p-0.5 rounded-xl flex">
                      {(['PENDING', 'REVIEWED', 'RESOLVED'] as const).map((st) => (
                        <button
                          key={st}
                          onClick={() => handleUpdateStatus(st)}
                          className={`px-2.5 py-1 text-[8px] font-extrabold rounded-lg transition-all cursor-pointer ${selectedFeedback.status === st ? 'bg-white text-indigo-650 shadow-xs' : 'text-slate-400 hover:text-slate-800'}`}
                        >
                          {st === 'PENDING' ? 'Pending' : st === 'REVIEWED' ? 'Reviewed' : 'Resolved'}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <span className={`px-2.5 py-1 rounded-xl text-[9px] font-bold border leading-none flex items-center gap-1 shadow-xs ${selectedFeedback.status === 'RESOLVED' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : selectedFeedback.status === 'REVIEWED' ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-slate-50 border-slate-200 text-slate-650'}`}>
                      {selectedFeedback.status === 'RESOLVED' ? 'Resolved' : selectedFeedback.status === 'REVIEWED' ? 'Reviewed' : 'Pending'}
                    </span>
                  )}
                </div>
              </div>

              {/* Scrollable Conversation Bubbles */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 max-h-[385px] bg-slate-50/20">
                {selectedFeedback.messages.map((msg) => {
                  const isMyMessage = msg.senderId === currentUser?.id;
                  const senderInitial = msg.sender.name ? msg.sender.name.trim().charAt(0) : 'ইউ';
                  const isSenderAdmin = msg.sender.role === 'ADMIN';

                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 items-start ${isMyMessage ? 'flex-row-reverse' : ''}`}
                    >
                      {/* Avatar initial circle */}
                      <div className={`w-8 h-8 rounded-full font-bold flex items-center justify-center text-xs text-white shrink-0 shadow-xs uppercase select-none ${isSenderAdmin ? 'bg-indigo-600' : 'bg-blue-600'}`}>
                        {senderInitial}
                      </div>

                      <div className="space-y-1 max-w-[75%]">
                        {/* Sender Label */}
                        <div className={`text-[8px] font-bold text-slate-400 flex items-center gap-1 px-1 ${isMyMessage ? 'justify-end' : ''}`}>
                          <span>{msg.sender.name}</span>
                          <span className="text-[7px] text-slate-350">
                            ({msg.sender.role === 'ADMIN' ? 'অ্যাডমিন' : `@${msg.sender.username}`})
                          </span>
                        </div>

                        {/* Telegram bubble content */}
                        <div className={`px-4 py-2.5 rounded-2xl text-[11px] leading-relaxed shadow-xs whitespace-pre-wrap ${isMyMessage ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border border-slate-150 text-slate-800 rounded-tl-none'}`}>
                          {msg.attachmentUrl && (
                            <div className="mb-2.5 max-w-full rounded-lg overflow-hidden border border-slate-200/50 shadow-inner bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
                              <a 
                                href={msg.attachmentUrl} 
                                target="_blank" 
                                rel="noreferrer" 
                                title="ক্লিক করে বড় আকারে দেখুন" 
                                className="block relative cursor-zoom-in group"
                              >
                                <img 
                                  src={msg.attachmentUrl} 
                                  alt="Attachment Screenshot" 
                                  className="max-h-48 w-auto object-contain hover:opacity-90 transition-opacity" 
                                />
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] text-white font-bold transition-opacity">
                                  🔍 নতুন ট্যাবে দেখুন
                                </div>
                              </a>
                            </div>
                          )}
                          {msg.message}
                          <div className={`text-[7px] font-bold text-right mt-1.5 select-none ${isMyMessage ? 'text-indigo-200' : 'text-slate-400'}`}>
                            {formatToBengaliDate(msg.createdAt)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatBottomRef} />
              </div>

              {/* Bottom Send Reply Message Input box */}
              <div 
                className={`p-4 bg-white border-t border-slate-150 shrink-0 relative transition-all duration-200 rounded-b-3xl ${isDragging ? 'bg-indigo-50/10 border-indigo-300' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {/* Drag and drop overlay for reply area */}
                {isDragging && (
                  <div className="absolute inset-0 bg-indigo-500/10 backdrop-blur-xs border border-dashed border-indigo-500 rounded-b-3xl flex items-center justify-center pointer-events-none z-10">
                    <p className="text-[9px] font-black text-indigo-700 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-full shadow-xs">
                      স্ক্রিনশট ইমেজটি এখানে ছেড়ে দিন (Drop here)
                    </p>
                  </div>
                )}

                {/* Staged screenshot preview in reply box */}
                {imagePreviewUrl && (
                  <div className="mb-2.5 p-2 bg-indigo-50/20 dark:bg-slate-900/60 border border-indigo-100/50 dark:border-indigo-950/50 rounded-xl flex items-center justify-between gap-3 shadow-inner">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img 
                        src={imagePreviewUrl} 
                        alt="Reply Attachment" 
                        className="w-10 h-10 object-cover rounded-lg border border-slate-200 dark:border-slate-800 shrink-0" 
                      />
                      <div className="min-w-0 text-[9px] font-semibold text-slate-500">
                        <p className="truncate text-slate-800 dark:text-slate-200 font-extrabold">{selectedImage?.name || 'pasted_screenshot.png'}</p>
                        <p>{selectedImage ? `${(selectedImage.size / 1024).toFixed(1)} KB` : ''}</p>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={handleClearSelectedImage}
                      className="p-1 hover:bg-rose-100 hover:text-rose-600 text-slate-400 rounded-lg transition-all hover:scale-110 active:scale-95 cursor-pointer shrink-0"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}

                {selectedFeedback.status === 'RESOLVED' ? (
                  /* Reply Disabled UI when ticket is resolved */
                  <div className="bg-emerald-50/50 border border-emerald-150 rounded-xl p-3.5 text-center text-[10px] font-bold text-emerald-800 select-none">
                    এই ফিডব্যাক থ্রেডটি সমাধান করা হয়েছে, তাই নতুন কোনো উত্তর পাঠানো বন্ধ করা হয়েছে।
                  </div>
                ) : (
                  <form onSubmit={handlePostReply} className="flex gap-2 items-center">
                    {/* Hidden input sharing same file picker ref */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={(e) => {
                        const files = e.target.files;
                        if (files && files.length > 0) {
                          stageImageFile(files[0]);
                        }
                      }}
                      accept="image/*"
                      className="hidden"
                    />

                    {/* Screenshot attachment trigger button */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-xl transition-all flex items-center justify-center cursor-pointer shrink-0 border border-slate-200/50 hover:scale-[1.02] active:scale-[0.98]"
                      title="স্ক্রিনশট ফাইল আপলোড করুন"
                    >
                      <Image size={14} />
                    </button>

                    <input
                      type="text"
                      placeholder="এখানে আপনার উত্তর বা রিপ্লাই লিখুন... (Ctrl+V দিয়ে সরাসরি স্ক্রিনশট পেস্ট করুন)"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onPaste={handleClipboardPaste}
                      className="flex-1 px-4 py-2 border border-slate-200 bg-slate-50 focus:bg-white rounded-xl outline-none focus:border-indigo-500 text-xs font-semibold"
                      disabled={replyLoading}
                      required
                    />
                    <button
                      type="submit"
                      disabled={replyLoading || (!replyText.trim() && !selectedImage)}
                      className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-md hover:bg-indigo-700 active:scale-95 transition-all shrink-0 cursor-pointer disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 hover:scale-[1.02]"
                    >
                      {replyLoading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Send size={13} />
                      )}
                    </button>
                  </form>
                )}
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 min-h-[575px]">
              <div className="w-14 h-14 rounded-full bg-indigo-50 text-indigo-650 flex items-center justify-center shadow-inner mb-4 animate-pulse select-none">
                <MessagesSquare size={24} />
              </div>
              <h3 className="text-xs font-black text-slate-800">কোনো থ্রেড সিলেক্ট করা নেই</h3>
              <p className="text-[10px] text-slate-400 mt-1 max-w-xs leading-relaxed select-none">
                বামদিকের তালিকা থেকে মতামত বা সমস্যা সিলেক্ট করুন বিস্তারিত পড়ার জন্য অথবা একটি নতুন টিকিট খুলুন।
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
