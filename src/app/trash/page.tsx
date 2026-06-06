'use client';

import { useState, useEffect } from 'react';
import AuthGuard from '@/components/AuthGuard';
import { 
  Trash2, 
  RefreshCw, 
  RotateCcw, 
  AlertTriangle,
  Search,
  Users,
  Layers,
  CalendarDays,
  UserCheck,
  FileText,
  Clock
} from 'lucide-react';

interface TrashItem {
  id: number;
  entityType: string;
  entityId: number;
  name: string;
  data: string;
  deletedAt: string;
}

export default function TrashPage() {
  const [trashItems, setTrashItems] = useState<TrashItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const fetchTrash = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/trash');
      if (res.ok) {
        const data = await res.json();
        setTrashItems(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching trash:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrash();
  }, []);

  // Clear selections on tab or search queries change for safety
  useEffect(() => {
    setSelectedIds([]);
  }, [activeTab, searchQuery]);

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredItems.map(item => item.id));
    }
  };

  const handleRestore = async (item: TrashItem) => {
    if (!confirm(`আপনি কি নিশ্চিতভাবে "${item.name}" পুনরুদ্ধার করতে চান?`)) return;

    try {
      setActionLoading(item.id);
      const res = await fetch('/api/trash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore', trashId: item.id })
      });

      const result = await res.json();

      if (res.ok) {
        alert('রেকর্ডটি সফলভাবে পুনরুদ্ধার করা হয়েছে!');
        fetchTrash();
      } else {
        alert(result.message || 'রেকর্ড পুনরুদ্ধার করতে ব্যর্থ হয়েছে।');
      }
    } catch (err: any) {
      console.error('Error restoring:', err);
      alert('পুনরুদ্ধার প্রক্রিয়া ব্যর্থ হয়েছে।');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePurge = async (item: TrashItem) => {
    if (!confirm(`সতর্কবার্তা: "${item.name}" স্থায়ীভাবে মুছে ফেলা হবে এবং এটি আর কখনো ফেরত আনা সম্ভব হবে না।\n\nআপনি কি নিশ্চিতভাবে স্থায়ীভাবে মুছতে চান?`)) return;

    try {
      setActionLoading(item.id);
      const res = await fetch('/api/trash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'purge', trashId: item.id })
      });

      if (res.ok) {
        alert('রেকর্ডটি স্থায়ীভাবে মুছে ফেলা হয়েছে!');
        fetchTrash();
      } else {
        const result = await res.json();
        alert(result.message || 'রেকর্ডটি স্থায়ীভাবে মুছতে ব্যর্থ হয়েছে।');
      }
    } catch (err) {
      console.error('Error purging:', err);
      alert('স্থায়ীভাবে মুছার প্রক্রিয়া ব্যর্থ হয়েছে।');
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkRestore = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`আপনি কি নিশ্চিতভাবে নির্বাচিত ${toBanglaDigits(selectedIds.length)}টি রেকর্ড পুনরুদ্ধার করতে চান?`)) return;

    try {
      setActionLoading(-1); // bulk indicator
      const res = await fetch('/api/trash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore', trashIds: selectedIds })
      });

      const result = await res.json();

      if (res.ok) {
        alert(result.message || 'রেকর্ডগুলো সফলভাবে পুনরুদ্ধার করা হয়েছে!');
        setSelectedIds([]);
        fetchTrash();
      } else {
        alert(result.message || 'রেকর্ড পুনরুদ্ধার করতে ব্যর্থ হয়েছে।');
      }
    } catch (err: any) {
      console.error('Error bulk restoring:', err);
      alert('পুনরুদ্ধার প্রক্রিয়া ব্যর্থ হয়েছে।');
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkPurge = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`সতর্কবার্তা: নির্বাচিত ${toBanglaDigits(selectedIds.length)}টি রেকর্ড স্থায়ীভাবে মুছে ফেলা হবে এবং এটি আর কখনো ফেরত আনা সম্ভব হবে না।\n\nআপনি কি নিশ্চিতভাবে স্থায়ীভাবে মুছতে চান?`)) return;

    try {
      setActionLoading(-1); // bulk indicator
      const res = await fetch('/api/trash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'purge', trashIds: selectedIds })
      });

      const result = await res.json();

      if (res.ok) {
        alert(result.message || 'রেকর্ডগুলো স্থায়ীভাবে মুছে ফেলা হয়েছে!');
        setSelectedIds([]);
        fetchTrash();
      } else {
        alert(result.message || 'রেকর্ডটি স্থায়ীভাবে মুছতে ব্যর্থ হয়েছে।');
      }
    } catch (err) {
      console.error('Error bulk purging:', err);
      alert('স্থায়ীভাবে মুছার প্রক্রিয়া ব্যর্থ হয়েছে।');
    } finally {
      setActionLoading(null);
    }
  };

  // Convert numbers to Bengali digits
  const toBanglaDigits = (numStr: string | number): string => {
    const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return numStr.toString().replace(/\d/g, (digit) => banglaDigits[parseInt(digit, 10)]);
  };

  const getRemainingDays = (deletedAtStr: string) => {
    const deletedAt = new Date(deletedAtStr);
    const expireTime = deletedAt.getTime() + 30 * 24 * 60 * 60 * 1000;
    const diff = expireTime - Date.now();
    const days = Math.ceil(diff / (24 * 60 * 60 * 1000));
    return days > 0 ? days : 0;
  };

  const tabs = [
    { id: 'ALL', label: 'সব রেকর্ড', icon: Trash2 },
    { id: 'EMPLOYEE', label: 'কর্মকর্তাবৃন্দ', icon: Users },
    { id: 'CELL', label: 'সেলসমূহ', icon: Layers },
    { id: 'DUTY', label: 'ডিউটি রোস্টার', icon: CalendarDays },
    { id: 'EXECUTIVE', label: 'নির্বাহী প্যানেল', icon: UserCheck },
    { id: 'DOCUMENT', label: 'পিডিএফ আর্কাইভ', icon: FileText }
  ];

  const filteredItems = trashItems.filter(item => {
    const matchesTab = activeTab === 'ALL' || item.entityType === activeTab;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.entityType.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const getCategoryBadgeColor = (type: string) => {
    switch (type) {
      case 'EMPLOYEE': return 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30';
      case 'CELL': return 'bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400 border border-teal-100 dark:border-teal-900/30';
      case 'DUTY': return 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30';
      case 'EXECUTIVE': return 'bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 border border-purple-100 dark:border-purple-900/30';
      case 'DOCUMENT': return 'bg-pink-50 text-pink-600 dark:bg-pink-950/40 dark:text-pink-400 border border-pink-100 dark:border-pink-900/30';
      case 'OFFICE_ORDER': return 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30';
      default: return 'bg-slate-50 text-slate-600 dark:bg-slate-950/40 dark:text-slate-400';
    }
  };

  const getCategoryName = (type: string) => {
    switch (type) {
      case 'EMPLOYEE': return 'কর্মকর্তা';
      case 'CELL': return 'সেল';
      case 'DUTY': return 'ডিউটি';
      case 'EXECUTIVE': return 'নির্বাহী';
      case 'DOCUMENT': return 'ডকুমেন্ট';
      case 'OFFICE_ORDER': return 'অফিস আদেশ/বিল';
      default: return type;
    }
  };

  return (
    <AuthGuard>
      <div className="space-y-6">
        {/* Top Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="app-page-title text-slate-800 dark:text-slate-100 font-sans tracking-wide">রিসাইকেল বিন</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">মুছে ফেলা সমস্ত রেকর্ড এখানে ৩০ দিনের জন্য জমা থাকবে। এর পর স্থায়ীভাবে স্বয়ংক্রিয়ভাবে মুছে যাবে।</p>
          </div>
          
          <button
            onClick={fetchTrash}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700/80 rounded-xl text-sm font-semibold transition-all shadow-sm"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            রিলোড করুন
          </button>
        </div>

        {/* Search and Tabs Panel */}
        <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Tab Filters */}
            <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 dark:bg-slate-950/40 rounded-xl border border-slate-200/50 dark:border-slate-800/80 w-fit">
              {tabs.map((tab) => {
                const TabIcon = tab.icon;
                const isSelected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                      isSelected 
                        ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm font-semibold' 
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <TabIcon size={14} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="relative w-full lg:w-72">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search size={15} />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="রেকর্ড খুঁজুন..."
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 rounded-xl text-sm focus:outline-none focus:border-indigo-500 font-sans"
              />
            </div>
          </div>

          {/* Alert Callout */}
          <div className="p-3.5 bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100/50 dark:border-amber-900/20 rounded-xl flex items-start gap-2.5">
            <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={16} />
            <div className="text-xs text-amber-700 dark:text-amber-400 font-semibold leading-relaxed">
              সতর্কতা: রিসাইকেল বিনের ফাইলগুলো ৩০ দিন অতিবাহিত হলে স্থায়ীভাবে স্বয়ংক্রিয়ভাবে মুছে যাবে। আপনি যদি কোনো অফিসারকে পুনরুদ্ধার করতে চান, তবে তার পূর্বে নিশ্চিত করুন কর্মকর্তাটির সংশ্লিষ্ট সেলটি ইতিমধ্যে ডাটাবেজে উপস্থিত রয়েছে।
            </div>
          </div>

          {/* Bulk Action Header bar */}
          {selectedIds.length > 0 && (
            <div className="flex items-center justify-between p-3.5 bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/30 rounded-xl animate-fade-in">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-pulse" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {toBanglaDigits(selectedIds.length)}টি রেকর্ড নির্বাচিত করা হয়েছে
                </span>
              </div>
              
              <div className="flex items-center gap-2.5">
                <button
                  onClick={handleBulkRestore}
                  disabled={actionLoading !== null}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <RotateCcw size={12} />
                  সব রিস্টোর করুন
                </button>
                {selectedIds.some(id => trashItems.find(x => x.id === id)?.entityType === 'OFFICE_ORDER') ? (
                  <button
                    disabled={true}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-xl text-xs font-bold transition-all border border-slate-200 dark:border-slate-700 cursor-not-allowed"
                    title="নির্বাচিত তালিকার মধ্যে অফিস আদেশ বা বিল রয়েছে যা স্থায়ীভাবে মুছে ফেলা নিষিদ্ধ।"
                  >
                    <Trash2 size={12} />
                    চিরতরে মুছা নিষিদ্ধ
                  </button>
                ) : (
                  <button
                    onClick={handleBulkPurge}
                    disabled={actionLoading !== null}
                    className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 size={12} />
                    সব চিরতরে মুছুন
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Trash List Table */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">রিসাইকেল বিন লোড হচ্ছে...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-16 bg-slate-50/30 dark:bg-slate-950/10 border border-dashed border-slate-200 dark:border-slate-800/80 rounded-xl space-y-3">
              <Trash2 className="mx-auto text-slate-300 dark:text-slate-700" size={40} />
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400">এই বিভাগে কোনো মুছে ফেলা রেকর্ড নেই</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 dark:bg-slate-950/40 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                    <th className="px-5 py-3.5 w-12 text-center">
                      <input 
                        type="checkbox" 
                        checked={filteredItems.length > 0 && selectedIds.length === filteredItems.length}
                        onChange={toggleSelectAll}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer h-4 w-4"
                      />
                    </th>
                    <th className="px-5 py-3.5">রেকর্ডের নাম ও বিবরণ</th>
                    <th className="px-5 py-3.5 w-32">ধরণ</th>
                    <th className="px-5 py-3.5 w-44">মুছে ফেলার তারিখ</th>
                    <th className="px-5 py-3.5 w-44">বাকি সময়</th>
                    <th className="px-5 py-3.5 w-56 text-right">পদক্ষেপ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredItems.map((item) => {
                    const remainingDays = getRemainingDays(item.deletedAt);
                    const delDate = new Date(item.deletedAt).toLocaleDateString('bn-BD', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    });
                    const delTime = new Date(item.deletedAt).toLocaleTimeString('bn-BD', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    });

                    const isBtnLoading = actionLoading === item.id || actionLoading === -1;
                    const isSelected = selectedIds.includes(item.id);

                    return (
                      <tr key={item.id} className={`hover:bg-slate-50/40 dark:hover:bg-slate-950/10 transition-colors ${isSelected ? 'bg-indigo-50/20 dark:bg-indigo-950/10' : ''}`}>
                        {/* Checkbox Column */}
                        <td className="px-5 py-4 w-12 text-center">
                          <input 
                            type="checkbox" 
                            checked={isSelected}
                            onChange={() => toggleSelect(item.id)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer h-4 w-4"
                          />
                        </td>

                        {/* Name Column */}
                        <td className="px-5 py-4">
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{item.name}</p>
                          <p className="text-[10px] text-slate-400 font-sans mt-0.5">ID: {item.entityId}</p>
                        </td>

                        {/* Category Badge Column */}
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${getCategoryBadgeColor(item.entityType)}`}>
                            {getCategoryName(item.entityType)}
                          </span>
                        </td>

                        {/* Deletion Date Column */}
                        <td className="px-5 py-4 text-xs font-semibold text-slate-600 dark:text-slate-350">
                          <div>{delDate}</div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium font-sans mt-0.5">{delTime}</div>
                        </td>

                        {/* Remaining Retention Days Column */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-500 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100/50 dark:border-amber-950/30 px-2 py-1 rounded-lg w-fit">
                            <Clock size={12} />
                            <span>{toBanglaDigits(remainingDays)} দিন বাকি</span>
                          </div>
                        </td>

                        {/* Action Buttons Column */}
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleRestore(item)}
                              disabled={isBtnLoading}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border border-emerald-200 hover:bg-emerald-50 text-emerald-600 dark:border-emerald-950 dark:hover:bg-emerald-950/30 dark:text-emerald-400 rounded-xl transition-all shadow-sm disabled:opacity-50"
                            >
                              <RotateCcw size={12} />
                              রিস্টোর
                            </button>
                            
                            {item.entityType !== 'OFFICE_ORDER' ? (
                              <button
                                type="button"
                                onClick={() => handlePurge(item)}
                                disabled={isBtnLoading}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border border-red-200 hover:bg-red-50 text-red-600 dark:border-red-950 dark:hover:bg-red-950/30 dark:text-red-400 rounded-xl transition-all shadow-sm disabled:opacity-50"
                              >
                                <Trash2 size={12} />
                                চিরতরে মুছুন
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                                স্থায়ী সংরক্ষণ
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
