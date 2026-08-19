'use client';
import logger from '@/lib/logger';

import { useState, useEffect } from 'react';
import { toBanglaDigits } from '@/lib/bengali-converter';
import AuthGuard from '@/components/AuthGuard';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
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
  const [nowTime, setNowTime] = useState<number>(0);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {}
  });

  const fetchTrash = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/trash');
      if (res.ok) {
        const data = await res.json();
        setTrashItems(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      logger.error('Error fetching trash:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTrash();
      setNowTime(Date.now());
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSelectedIds([]);
    }, 0);
    return () => clearTimeout(timer);
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

  const handleRestore = (item: TrashItem) => {
    setConfirmModal({
      isOpen: true,
      title: 'রেকর্ড পুনরুদ্ধার',
      description: `আপনি কি নিশ্চিতভাবে "${item.name}" রেকর্ডটি পুনরুদ্ধার করতে চান?`,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          setActionLoading(item.id);
          const res = await fetch('/api/trash', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'restore', trashId: item.id })
          });

          if (res.ok) {
            fetchTrash();
          }
        } catch (err) {
          logger.error('Error restoring:', err);
        } finally {
          setActionLoading(null);
        }
      }
    });
  };

  const handleBulkRestore = () => {
    if (selectedIds.length === 0) return;
    setConfirmModal({
      isOpen: true,
      title: 'নির্বাচিত রেকর্ড পুনরুদ্ধার',
      description: `আপনি কি নিশ্চিতভাবে নির্বাচিত ${toBanglaDigits(selectedIds.length)}টি রেকর্ড পুনরুদ্ধার করতে চান?`,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          setActionLoading(-1);
          const res = await fetch('/api/trash', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'restore', trashIds: selectedIds })
          });

          if (res.ok) {
            setSelectedIds([]);
            fetchTrash();
          }
        } catch (err) {
          logger.error('Error bulk restoring:', err);
        } finally {
          setActionLoading(null);
        }
      }
    });
  };

  const getRemainingDays = (deletedAtStr: string) => {
    if (nowTime === 0) return 30;
    const deletedAt = new Date(deletedAtStr);
    const expireTime = deletedAt.getTime() + 30 * 24 * 60 * 60 * 1000;
    const diff = expireTime - nowTime;
    const days = Math.ceil(diff / (24 * 60 * 60 * 1000));
    return days > 0 ? days : 0;
  };

  const tabs = [
    { id: 'ALL', label: 'সব রেকর্ড', icon: Trash2 },
    { id: 'EMPLOYEE', label: 'কর্মকর্তাবৃন্দ', icon: Users },
    { id: 'CELL', label: 'সেলসমূহ', icon: Layers },
    { id: 'DUTY', label: 'ডিউটি রোস্টার', icon: CalendarDays },
    { id: 'EXECUTIVE', label: 'নির্বাহী প্যানেল', icon: UserCheck },
    { id: 'DOCUMENT', label: 'পিডিএফ আর্কাইভ', icon: FileText },
    { id: 'MANUAL_DOCUMENT', label: 'ম্যানুয়াল ডকুমেন্ট', icon: FileText }
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
      case 'MANUAL_DOCUMENT': return 'bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400 border border-sky-100 dark:border-sky-900/30';
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
      case 'MANUAL_DOCUMENT': return 'ম্যানুয়াল ডকুমেন্ট';
      case 'OFFICE_ORDER': return 'অফিস আদেশ/বিল';
      default: return type;
    }
  };

  return (
    <AuthGuard>
      <div className="space-y-6 font-sans">
        {/* Top Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="app-page-title text-slate-800 dark:text-slate-100 font-sans tracking-wide">রিসাইকেল বিন</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">মুছে ফেলা সমস্ত রেকর্ড এখানে ৩০ দিনের জন্য জমা থাকবে। এর পর স্থায়ীভাবে স্বয়ংক্রিয়ভাবে মুছে যাবে।</p>
          </div>
          
          <button
            onClick={fetchTrash}
            disabled={loading}
            aria-label="রিলোড করুন"
            className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700/80 rounded-xl text-sm font-semibold transition-all shadow-sm cursor-pointer"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            রিলোড করুন
          </button>
        </div>

        {/* Search and Tabs Panel */}
        <Card className="space-y-5">
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
                    aria-label={tab.label}
                    aria-pressed={isSelected}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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
                aria-label="মুছে ফেলা রেকর্ড খুঁজুন"
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
            <div className="flex items-center justify-between p-3.5 bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/30 rounded-xl animate-in fade-in">
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
                  aria-label="সব নির্বাচিত রেকর্ড রিস্টোর করুন"
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <RotateCcw size={12} />
                  সব রিস্টোর করুন
                </button>
              </div>
            </div>
          )}

          {/* Trash List Table */}
          {loading ? (
            <div className="space-y-3 py-4">
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          ) : filteredItems.length === 0 ? (
            <EmptyState
              title="এই বিভাগে কোনো মুছে ফেলা রেকর্ড নেই"
              description="রিসাইকেল বিনে বর্তমানে কোনো রেকর্ড জমা নেই।"
              icon={Trash2}
            />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 dark:bg-slate-950/40 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                    <th className="px-5 py-3.5 w-12 text-center">
                      <input 
                        type="checkbox" 
                        aria-label="সব রেকর্ড নির্বাচন করুন"
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
                        <td className="px-5 py-4 w-12 text-center">
                          <input 
                            type="checkbox" 
                            aria-label={`নির্বাচন করুন ${item.name}`}
                            checked={isSelected}
                            onChange={() => toggleSelect(item.id)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer h-4 w-4"
                          />
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{item.name}</p>
                          <p className="text-[10px] text-slate-400 font-sans mt-0.5">ID: {item.entityId}</p>
                        </td>

                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${getCategoryBadgeColor(item.entityType)}`}>
                            {getCategoryName(item.entityType)}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-xs font-semibold text-slate-600 dark:text-slate-350">
                          <div>{delDate}</div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium font-sans mt-0.5">{delTime}</div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-500 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100/50 dark:border-amber-950/30 px-2 py-1 rounded-lg w-fit">
                            <Clock size={12} />
                            <span>{toBanglaDigits(remainingDays)} দিন বাকি</span>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleRestore(item)}
                              disabled={isBtnLoading}
                              aria-label={`রিস্টোর করুন ${item.name}`}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border border-emerald-200 hover:bg-emerald-50 text-emerald-600 dark:border-emerald-950 dark:hover:bg-emerald-950/30 dark:text-emerald-400 rounded-xl transition-all shadow-sm disabled:opacity-50 cursor-pointer"
                            >
                              <RotateCcw size={12} />
                              রিস্টোর
                            </button>
                            
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                              স্থায়ী সংরক্ষণ
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <ConfirmDialog
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        description={confirmModal.description}
        confirmText="হ্যাঁ, পুনরুদ্ধার করুন"
        cancelText="বাতিল"
        variant="primary"
        isLoading={actionLoading !== null}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </AuthGuard>
  );
}
