'use client';

import { useState, useEffect, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import { 
  MessageSquare, 
  LifeBuoy, 
  Send, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  ChevronLeft,
  User,
  Activity,
  MessagesSquare,
  HelpCircle
} from 'lucide-react';

interface FeedbackMessage {
  id: number;
  feedbackId: number;
  senderId: number;
  message: string;
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
  category: 'FEEDBACK' | 'ISSUE';
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

export default function FeedbackPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [selectedFeedbackId, setSelectedFeedbackId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [replyLoading, setReplyLoading] = useState(false);
  
  // Filtering and Searching
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'FEEDBACK' | 'ISSUE'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'REVIEWED' | 'RESOLVED'>('ALL');

  // New Thread Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'FEEDBACK' | 'ISSUE'>('FEEDBACK');
  const [newDescription, setNewDescription] = useState('');

  // Chat Reply Input
  const [replyText, setReplyText] = useState('');
  
  // Mobile Responsiveness
  const [showMobileChat, setShowMobileChat] = useState(false);

  // Chat Auto Scroll
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load currentUser
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      try {
        setCurrentUser(JSON.parse(stored));
      } catch {
        setCurrentUser(null);
      }
    }

    fetchFeedbacks();
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
      const res = await fetch('/api/feedbacks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          category: newCategory,
          description: newDescription.trim()
        })
      });

      if (res.ok) {
        const newThread = await res.json();
        setFeedbacks(prev => [newThread, ...prev]);
        setSelectedFeedbackId(newThread.id);
        setIsModalOpen(false);
        setNewTitle('');
        setNewDescription('');
        setNewCategory('FEEDBACK');
        if (window.innerWidth < 1024) {
          setShowMobileChat(true);
        }
      }
    } catch (err) {
      console.error('Error creating feedback thread:', err);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handlePostReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedFeedbackId) return;

    try {
      setReplyLoading(true);
      const res = await fetch(`/api/feedbacks/${selectedFeedbackId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: replyText.trim() })
      });

      if (res.ok) {
        const newMsg = await res.json();
        
        // Update local feedbacks state
        setFeedbacks(prev => prev.map(fb => {
          if (fb.id === selectedFeedbackId) {
            // If admin replies and it was PENDING, auto change to REVIEWED
            let newStatus = fb.status;
            if (currentUser?.role === 'ADMIN' && fb.status === 'PENDING') {
              newStatus = 'REVIEWED';
            }
            return {
              ...fb,
              status: newStatus,
              updatedAt: new Date().toISOString(),
              messages: [...fb.messages, newMsg]
            };
          }
          return fb;
        }));
        
        setReplyText('');
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

  // Date formatter to premium Bengali style
  const formatToBengaliDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    
    const toBanglaDigits = (num: number) => {
      return String(num).split('').map(d => banglaDigits[parseInt(d, 10)] || d).join('');
    };

    const day = toBanglaDigits(date.getDate());
    const year = toBanglaDigits(date.getFullYear());
    
    const banglaMonths = [
      'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
      'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
    ];
    const month = banglaMonths[date.getMonth()];
    
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const minutesBangla = minutes.split('').map(d => banglaDigits[parseInt(d, 10)] || d).join('');
    
    const ampm = hours >= 12 ? 'অপরাহ্ন' : 'পূর্বাহ্ন';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const hoursBangla = toBanglaDigits(hours);

    return `${day} ${month}, ${year} ${ampm} ${hoursBangla}:${minutesBangla}`;
  };

  // Filter feedbacks
  const filteredFeedbacks = feedbacks.filter(fb => {
    const matchesSearch = fb.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          fb.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          fb.user.username.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === 'ALL' || fb.category === categoryFilter;
    const matchesStatus = statusFilter === 'ALL' || fb.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const selectedFeedback = feedbacks.find(fb => fb.id === selectedFeedbackId);

  // Stats for Admin
  const totalCount = feedbacks.length;
  const resolvedCount = feedbacks.filter(fb => fb.status === 'RESOLVED').length;
  const pendingIssues = feedbacks.filter(fb => fb.category === 'ISSUE' && fb.status === 'PENDING').length;
  const activeSuggestions = feedbacks.filter(fb => fb.category === 'FEEDBACK' && fb.status !== 'RESOLVED').length;
  const resolutionRate = totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 0;

  return (
    <div className="flex bg-slate-50 dark:bg-slate-900 min-h-screen text-slate-800 dark:text-slate-100 font-sans">
      <Sidebar />

      <main className="flex-1 lg:pl-72 flex flex-col h-screen overflow-hidden">
        {/* TOP NAVBAR */}
        <header className="no-print shrink-0 bg-white/70 backdrop-blur-md border-b border-slate-200/80 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 font-sans tracking-wide">
              <MessagesSquare size={20} className="text-indigo-650 animate-bounce" />
              ফিডব্যাক ও সহায়তা ডেস্ক
            </h2>
            <p className="text-[10px] text-slate-500 font-bold mt-0.5">
              অ্যাপ্লিকেশন সংক্রান্ত যেকোনো ফিডব্যাক, মতামত এবং সমস্যা সমাধান সেকশন।
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="hidden lg:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-indigo-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <Plus size={15} />
            নতুন থ্রেড শুরু করুন
          </button>
        </header>

        {/* WORKSPACE AREA */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0 bg-slate-50">
          
          {/* LEFT COLUMN: LIST OF FEEDBACK THREADS */}
          <section className={`w-full lg:w-[420px] shrink-0 border-r border-slate-200 bg-white flex flex-col h-full overflow-hidden ${showMobileChat ? 'hidden lg:flex' : 'flex'}`}>
            
            {/* Stats Dashboard Block (Only visible on larger viewports for Admin) */}
            {currentUser?.role === 'ADMIN' && (
              <div className="p-4 bg-slate-50/50 border-b border-slate-200/80 grid grid-cols-2 gap-2.5 shrink-0 select-none">
                <div className="bg-white border border-slate-150 p-2.5 rounded-xl shadow-xs flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-50 text-indigo-650 shrink-0">
                    <Activity size={15} />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-400">Resolution Rate</p>
                    <p className="text-base font-black text-indigo-900 leading-none mt-1">{resolutionRate}%</p>
                  </div>
                </div>
                <div className="bg-white border border-slate-150 p-2.5 rounded-xl shadow-xs flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-50 text-red-650 shrink-0">
                    <AlertCircle size={15} />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-400">Pending Issues</p>
                    <p className="text-base font-black text-red-600 leading-none mt-1">{pendingIssues} টি</p>
                  </div>
                </div>
              </div>
            )}

            {/* Filter controls and Search */}
            <div className="p-4 border-b border-slate-150 space-y-3 shrink-0">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input
                  type="text"
                  placeholder="বিষয় বা ইউজারনেম দিয়ে খুঁজুন..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 bg-slate-50/50 rounded-xl text-xs outline-none focus:border-indigo-500 focus:bg-white font-medium"
                />
              </div>

              {/* Suggestions vs Issues filters */}
              <div className="flex bg-slate-100 p-1 rounded-xl">
                {(['ALL', 'FEEDBACK', 'ISSUE'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${categoryFilter === cat ? 'bg-white text-indigo-650 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    {cat === 'ALL' ? 'সব থ্রেড' : cat === 'FEEDBACK' ? 'মতামত/পরামর্শ' : 'সমস্যা ও সমাধান'}
                  </button>
                ))}
              </div>

              {/* Status Select filter */}
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-bold text-slate-400 flex items-center gap-1">
                  <Filter size={11} />
                  স্ট্যাটাস ফিল্টারঃ
                </span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg outline-none font-bold text-slate-600 cursor-pointer"
                >
                  <option value="ALL">সব স্ট্যাটাস</option>
                  <option value="PENDING">অপেক্ষমান (Pending)</option>
                  <option value="REVIEWED">পর্যালোচিত (Reviewed)</option>
                  <option value="RESOLVED">সমাধানকৃত (Resolved)</option>
                </select>
              </div>
            </div>

            {/* List scrollable section */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 select-none">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-2">
                  <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-[10px] font-bold text-slate-400">লোডিং হচ্ছে...</p>
                </div>
              ) : filteredFeedbacks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                  <HelpCircle size={32} className="text-slate-300 mb-2" />
                  <p className="text-xs font-bold text-slate-500">কোনো থ্রেড পাওয়া যায়নি!</p>
                  <p className="text-[10px] text-slate-400 mt-1">নতুন কোনো মতামত বা সমস্যা জানাতে "নতুন থ্রেড শুরু করুন" বাটনে ক্লিক করুন।</p>
                </div>
              ) : (
                filteredFeedbacks.map((fb) => {
                  const isActive = fb.id === selectedFeedbackId;
                  const lastMessage = fb.messages[fb.messages.length - 1];
                  
                  return (
                    <div
                      key={fb.id}
                      onClick={() => {
                        setSelectedFeedbackId(fb.id);
                        if (window.innerWidth < 1024) {
                          setShowMobileChat(true);
                        }
                      }}
                      className={`p-4 hover:bg-slate-50/50 cursor-pointer transition-all ${isActive ? 'bg-indigo-50/40 hover:bg-indigo-50/40 border-l-4 border-indigo-600' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h4 className="text-xs font-extrabold text-slate-800 line-clamp-1 leading-snug flex-1">
                          {fb.title}
                        </h4>
                        <span className="text-[9px] font-bold text-slate-400 shrink-0 mt-0.5">
                          {fb.messages.length > 0 ? formatToBengaliDate(fb.updatedAt).split(',')[0] : ''}
                        </span>
                      </div>

                      {/* User who posted it (only visible to Admin) */}
                      {currentUser?.role === 'ADMIN' && (
                        <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 mt-1.5">
                          <User size={10} />
                          <span>{fb.user.name} (@{fb.user.username})</span>
                        </div>
                      )}

                      <p className="text-[10px] text-slate-500 line-clamp-1 mt-1.5 leading-relaxed">
                        {lastMessage ? lastMessage.message : 'বিবরণ নেই।'}
                      </p>

                      <div className="flex items-center gap-2 mt-3.5">
                        {/* Type badge */}
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold border leading-none ${fb.category === 'FEEDBACK' ? 'bg-blue-50 border-blue-200/50 text-blue-700' : 'bg-rose-50 border-rose-200/50 text-rose-700'}`}>
                          {fb.category === 'FEEDBACK' ? 'পরামর্শ' : 'সমস্যা'}
                        </span>

                        {/* Status badge */}
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold border leading-none flex items-center gap-1 ${fb.status === 'RESOLVED' ? 'bg-emerald-50 border-emerald-200/50 text-emerald-700' : fb.status === 'REVIEWED' ? 'bg-indigo-50 border-indigo-200/50 text-indigo-700' : 'bg-amber-50 border-amber-200/50 text-amber-700'}`}>
                          {fb.status === 'RESOLVED' ? (
                            <>
                              <CheckCircle size={8} />
                              সমাধানকৃত
                            </>
                          ) : fb.status === 'REVIEWED' ? (
                            <>
                              <Clock size={8} />
                              পর্যালোচিত
                            </>
                          ) : (
                            <>
                              <AlertCircle size={8} />
                              অপেক্ষমান
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Mobile New Ticket floating button */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 lg:hidden shrink-0">
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer active:scale-98 transition-all"
              >
                <Plus size={15} />
                নতুন থ্রেড শুরু করুন
              </button>
            </div>
          </section>

          {/* RIGHT COLUMN: INTERACTIVE CHAT SCREEN */}
          <section className={`flex-1 bg-slate-50 flex flex-col h-full overflow-hidden ${showMobileChat ? 'flex' : 'hidden lg:flex'}`}>
            {selectedFeedback ? (
              <div className="flex flex-col h-full overflow-hidden">
                
                {/* Chat Header details */}
                <div className="px-6 py-4 bg-white border-b border-slate-200/80 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={() => setShowMobileChat(false)}
                      className="lg:hidden p-1.5 hover:bg-slate-150 rounded-lg text-slate-500 mr-1"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <div className="min-w-0">
                      <h3 className="text-sm font-extrabold text-slate-800 truncate leading-snug">
                        {selectedFeedback.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold border leading-none ${selectedFeedback.category === 'FEEDBACK' ? 'bg-blue-50 border-blue-200/50 text-blue-700' : 'bg-rose-50 border-rose-200/50 text-rose-700'}`}>
                          {selectedFeedback.category === 'FEEDBACK' ? 'পরামর্শ ও মতামত' : 'সমস্যা ও সমাধান'}
                        </span>
                        <span className="text-[9px] font-semibold text-slate-400">
                          শুরু করেছেনঃ {selectedFeedback.user.name}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status controllers for Admin */}
                  <div className="flex items-center gap-2 shrink-0">
                    {currentUser?.role === 'ADMIN' ? (
                      <div className="flex items-center bg-slate-100 p-0.5 border border-slate-200 rounded-xl select-none">
                        {(['PENDING', 'REVIEWED', 'RESOLVED'] as const).map((st) => (
                          <button
                            key={st}
                            onClick={() => handleUpdateStatus(st)}
                            className={`px-3 py-1.5 text-[9px] font-bold rounded-lg cursor-pointer transition-all ${selectedFeedback.status === st ? 'bg-white text-indigo-650 shadow-xs' : 'text-slate-500 hover:text-slate-850'}`}
                          >
                            {st === 'PENDING' ? 'Pending' : st === 'REVIEWED' ? 'Reviewed' : 'Resolved'}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <span className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border leading-none flex items-center gap-1 shadow-xs ${selectedFeedback.status === 'RESOLVED' ? 'bg-emerald-50 border-emerald-200/60 text-emerald-700' : selectedFeedback.status === 'REVIEWED' ? 'bg-indigo-50 border-indigo-200/60 text-indigo-700' : 'bg-amber-50 border-amber-200/60 text-amber-700'}`}>
                        {selectedFeedback.status === 'RESOLVED' ? 'Resolved' : selectedFeedback.status === 'REVIEWED' ? 'Reviewed' : 'Pending'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Messages conversation area */}
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 bg-slate-50/50">
                  {selectedFeedback.messages.map((msg, index) => {
                    const isMyMessage = msg.senderId === currentUser?.id;
                    const isSenderAdmin = msg.sender.role === 'ADMIN';
                    
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMyMessage ? 'items-end' : 'items-start'}`}
                      >
                        {/* Sender info display above bubble */}
                        <span className="text-[9px] font-bold text-slate-400 mb-1 px-1 select-none">
                          {msg.sender.name} {isSenderAdmin && (
                            <span className="ml-1 text-[8px] px-1 py-0.5 rounded bg-indigo-50 border border-indigo-150/40 text-indigo-700 font-extrabold uppercase">
                              অ্যাডমিন
                            </span>
                          )}
                        </span>

                        {/* Telegram/WhatsApp Style bubble */}
                        <div
                          className={`max-w-[75%] px-4 py-3 rounded-2xl text-xs leading-relaxed shadow-sm font-sans whitespace-pre-wrap ${isMyMessage ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-tr-none' : 'bg-white border border-slate-200/80 text-slate-800 rounded-tl-none'}`}
                        >
                          {msg.message}
                          
                          <div className={`text-[8px] font-bold mt-2 select-none text-right ${isMyMessage ? 'text-indigo-200' : 'text-slate-400'}`}>
                            {formatToBengaliDate(msg.createdAt).split(' ')[3]} {formatToBengaliDate(msg.createdAt).split(' ')[4]} ({formatToBengaliDate(msg.createdAt).split(',')[0]})
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={chatBottomRef} />
                </div>

                {/* Bottom send reply text editor bar */}
                <div className="no-print p-4 bg-white border-t border-slate-200/80 shrink-0">
                  <form onSubmit={handlePostReply} className="flex gap-3 items-end">
                    <textarea
                      placeholder="আপনার বার্তা লিখুন..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handlePostReply(e);
                        }
                      }}
                      rows={2}
                      className="flex-1 px-3 py-2 border border-slate-250 rounded-xl outline-none focus:border-indigo-500 text-xs font-semibold resize-none bg-slate-50 focus:bg-white"
                      disabled={replyLoading}
                    />
                    <button
                      type="submit"
                      disabled={replyLoading || !replyText.trim()}
                      className="p-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 disabled:from-slate-200 disabled:to-slate-200 text-white disabled:text-slate-400 rounded-xl shadow-md hover:shadow-indigo-500/25 active:scale-95 transition-all shrink-0 cursor-pointer disabled:cursor-not-allowed"
                    >
                      {replyLoading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Send size={16} />
                      )}
                    </button>
                  </form>
                </div>

              </div>
            ) : (
              // Empty selection screen
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-50/50">
                <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-650 flex items-center justify-center shadow-inner mb-4 animate-pulse">
                  <MessagesSquare size={28} />
                </div>
                <h3 className="text-sm font-extrabold text-slate-800">থ্রেড বিস্তারিত</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm leading-relaxed">
                  বামদিকের তালিকা থেকে কোনো মতামত বা সমস্যা সিলেক্ট করুন বিস্তারিত পড়ার জন্য অথবা একটি নতুন টিকিট খুলুন।
                </p>
              </div>
            )}
          </section>

        </div>
      </main>

      {/* NEW TICKETS DIALOG OVERLAY MODAL */}
      {isModalOpen && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            onClick={() => setIsModalOpen(false)}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-200 flex flex-col">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <LifeBuoy className="text-indigo-650" size={18} />
              নতুন ফিডব্যাক/সমস্যা সাবমিট করুন
            </h3>

            <form onSubmit={handleCreateThread} className="space-y-4 mt-4 text-xs">
              {/* Category Picker Selector */}
              <div className="space-y-1">
                <label className="font-bold text-slate-500">ধরণ/ক্যাটাগরিঃ</label>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setNewCategory('FEEDBACK')}
                    className={`flex-1 py-2 font-bold rounded-lg transition-all cursor-pointer ${newCategory === 'FEEDBACK' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    ফিডব্যাক ও পরামর্শ
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewCategory('ISSUE')}
                    className={`flex-1 py-2 font-bold rounded-lg transition-all cursor-pointer ${newCategory === 'ISSUE' ? 'bg-white text-rose-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    সমস্যা ও সমাধান
                  </button>
                </div>
              </div>

              {/* Title input field */}
              <div className="space-y-1">
                <label className="font-bold text-slate-500">বিষয় / টাইটেলঃ</label>
                <input
                  type="text"
                  placeholder="যেমনঃ Roster এডিটিং প্যানেলে নতুন ফিল্টার যোগ করার পরামর্শ"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-250 bg-slate-50 rounded-xl outline-none focus:border-indigo-500 focus:bg-white font-semibold"
                  required
                />
              </div>

              {/* Description box */}
              <div className="space-y-1">
                <label className="font-bold text-slate-500">বিস্তারিত বিবরণঃ</label>
                <textarea
                  placeholder={newCategory === 'FEEDBACK' 
                    ? "এই এপ্লিকেশনে আর কি কি ফিচার এড করা যায়, কিংবা কোন ফিচার ইম্প্রুভ করা উচিত বা সহজ করার পরামর্শ..."
                    : "কোন সমস্যায় পড়েছেন? আপনার সমস্যার বিবরণ বিস্তারিত লিখুন..."}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-slate-250 bg-slate-50 rounded-xl outline-none focus:border-indigo-550 focus:bg-white font-semibold resize-none"
                  required
                />
              </div>

              {/* Action row buttons */}
              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 font-bold text-slate-600 rounded-xl transition-all cursor-pointer"
                >
                  বাতিল করুন
                </button>
                <button
                  type="submit"
                  disabled={submitLoading || !newTitle.trim() || !newDescription.trim()}
                  className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold rounded-xl shadow-md hover:shadow-indigo-500/25 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-300"
                >
                  {submitLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'সাবমিট করুন'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
