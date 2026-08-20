'use client';
import logger from '@/lib/logger';

import { useState, useEffect } from 'react';
import { useProfile } from '@/context/ProfileContext';
import AuthGuard from '@/components/AuthGuard';
import { EmptyState } from '@/components/ui/EmptyState';
import { 
  Building2, 
  Plus, 
  Edit3, 
  Trash2, 
  Users, 
  AlertCircle, 
  ArrowLeft, 
  CheckCircle, 
  X,
  Layers
} from 'lucide-react';
import Link from 'next/link';

interface Cell {
  id: number;
  name: string;
  description: string | null;
  _count?: {
    employees: number;
  };
}

export default function CellsPage() {
  const { currentUser } = useProfile();
  const [cells, setCells] = useState<Cell[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCell, setEditingCell] = useState<Cell | null>(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchCells = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/cells');
      if (res.ok) {
        const data = await res.json();
        setCells(data);
      }
    } catch (err) {
      logger.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCells();
  }, []);

  const handleOpenAddModal = () => {
    setEditingCell(null);
    setFormName('');
    setFormDescription('');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cell: Cell) => {
    setEditingCell(cell);
    setFormName(cell.name);
    setFormDescription(cell.description || '');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!formName.trim()) {
      setErrorMsg('সেলের নাম বাধ্যতামূলক।');
      return;
    }

    setSubmitting(true);
    try {
      const url = editingCell ? `/api/cells/${editingCell.id}` : '/api/cells';
      const method = editingCell ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formName.trim(), description: formDescription.trim() })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error === 'cell_exists' ? 'এই নামের সেল ইতিমধ্যেই বিদ্যমান।' : 'সেল সংরক্ষণ ব্যর্থ হয়েছে।');
      }

      setSuccessMsg(editingCell ? 'সেল সফলভাবে সংশোধন করা হয়েছে।' : 'নতুন সেল সফলভাবে যুক্ত করা হয়েছে।');
      setIsModalOpen(false);
      fetchCells();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'সার্ভারে সমস্যা হয়েছে।');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (cell: Cell) => {
    if (cell._count && cell._count.employees > 0) {
      alert(`"${cell.name}" সেলে ${cell._count.employees} জন কর্মকর্তা কর্মরত রয়েছেন। ডিলিট করার আগে কর্মকর্তাদের সরিয়ে নিন।`);
      return;
    }
    if (!confirm(`আপনি কি নিশ্চিতভাবে "${cell.name}" সেলটি ডিলিট করতে চান?`)) return;

    try {
      const res = await fetch(`/api/cells/${cell.id}`, { method: 'DELETE' });
      if (res.ok) {
        setSuccessMsg('সেল সফলভাবে মুছে ফেলা হয়েছে।');
        fetchCells();
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        alert('সেল মুছে ফেলতে ব্যর্থ হয়েছে।');
      }
    } catch (err) {
      logger.error(err);
    }
  };

  return (
    <AuthGuard>
      <div className="space-y-6 min-h-screen bg-slate-50/50 dark:bg-transparent p-4 lg:p-8 font-sans">
        
        {/* Banner Alert */}
        {successMsg && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-2xl flex items-center justify-between text-xs font-bold shadow-sm animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle size={16} />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg('')} className="text-current hover:opacity-75">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/60 dark:border-slate-800/85 pb-5">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-all text-slate-500">
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Building2 className="text-indigo-600" size={22} />
                সেল ও ডিপার্টমেন্ট ইউনিট ম্যানেজমেন্ট
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                অনলাইন ব্যাংকিং ডিপার্টমেন্টের আওতাধীন সকল সেল (Cell Units) তৈরি, সম্পাদনা ও পর্যবেক্ষণ করুন।
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Plus size={16} />
              নতুন সেল যুক্ত করুন
            </button>
          </div>
        </div>

        {/* Cell Grid */}
        {loading ? (
          <div className="py-20 text-center text-xs font-bold text-slate-400 animate-pulse">
            সেল তালিকা লোড হচ্ছে...
          </div>
        ) : cells.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="কোনো সেল পাওয়া যায়নি"
            description="বর্তমানে কোনো সেল ইউনিট তৈরি করা নেই। নতুন সেল তৈরি করতে উপরের বাটনে চাপুন।"
            action={{
              label: 'নতুন সেল যুক্ত করুন',
              onClick: handleOpenAddModal,
              icon: Plus
            }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cells.map((cell) => (
              <div 
                key={cell.id} 
                className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800/80 hover:shadow-lg transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 rounded-xl">
                        <Layers size={18} />
                      </div>
                      <h3 className="font-extrabold text-slate-850 dark:text-slate-100 text-base">{cell.name}</h3>
                    </div>
                    <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold rounded-lg flex items-center gap-1">
                      <Users size={12} />
                      {cell._count?.employees || 0} জন
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                    {cell.description || 'অনলাইন ব্যাংকিং ডিপার্টমেন্টের আওতাধীন সেল উইনিট।'}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800/80">
                  <Link 
                    href={`/employees?cellId=${cell.id}`}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1"
                  >
                    কর্মকর্তা তালিকা দেখুন →
                  </Link>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditModal(cell)}
                      className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-all cursor-pointer"
                      title="সম্পাদনা করুন"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(cell)}
                      className="p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-500 transition-all cursor-pointer"
                      title="ডিলিট করুন"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal Form */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
            <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
                  {editingCell ? 'সেল সম্পাদনা' : 'নতুন সেল যুক্ত করুন'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {errorMsg && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-950/30 rounded-xl text-xs flex items-center gap-2">
                    <AlertCircle size={14} />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label htmlFor="cell_name_input" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">সেলের নাম *</label>
                  <input
                    id="cell_name_input"
                    type="text"
                    required
                    placeholder="যেমন: R9, R22, CBS Cell"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 rounded-xl text-sm font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="cell_desc_input" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">সেলের বিবরণ (ঐচ্ছিক)</label>
                  <textarea
                    id="cell_desc_input"
                    rows={3}
                    placeholder="সেলের কাজের ক্ষেত্র বা বিবরণ..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
                  >
                    {submitting ? 'সংরক্ষণ হচ্ছে...' : 'সেভ করুন'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
