'use client';
import logger from '@/lib/logger';

import { useState, useEffect } from 'react';
import { 
  User, 
  CalendarRange, 
  CalendarCheck, 
  Receipt, 
  MapPin, 
  Phone, 
  Coins, 
  Clock, 
  TrendingUp, 
  Plus, 
  FileText, 
  AlertCircle, 
  CheckCircle2,
  Calendar,
  Layers,
  ChevronRight
} from 'lucide-react';
import { toBanglaDigits } from '@/lib/bengali-converter';

interface Employee {
  id: number;
  name: string;
  designation: string;
  bankId: string;
  cellId: number;
  cellName: string;
  mobile: string | null;
}

interface Duty {
  id: number;
  type: 'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT';
  date: string;
  description: string | null;
  allowance1: number;
  allowance2: number;
  totalBill: number;
  orderRef: string | null;
}

interface Leave {
  id: number;
  leaveType: 'CASUAL' | 'POST_FACTO' | 'STATION_LEAVE';
  startDate: string;
  endDate: string;
  applicationDate: string;
  leaveLocation: string;
  mobileNo: string;
  delegateId: string | null;
}

interface LeaveBalance {
  total: number;
  used: number;
  remaining: number;
}

interface MonthlyLedgerItem {
  month: string;
  allowance1: number;
  allowance2: number;
  totalBill: number;
}

interface CoveringOfficer {
  id: number;
  name: string;
  designation: string;
  bankId: string;
}

export default function MyPortalPage() {
  const [activeTab, setActiveTab] = useState<'duties' | 'leaves' | 'allowances'>('duties');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Data State
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [dutiesList, setDutiesList] = useState<Duty[]>([]);
  const [leavesList, setLeavesList] = useState<Leave[]>([]);
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance | null>(null);
  const [monthlyLedger, setMonthlyLedger] = useState<MonthlyLedgerItem[]>([]);
  const [coveringOfficers, setCoveringOfficers] = useState<CoveringOfficer[]>([]);

  // Leave Form State
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [leaveType, setLeaveType] = useState<'CASUAL' | 'STATION_LEAVE' | 'POST_FACTO'>('CASUAL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [leaveLocation, setLeaveLocation] = useState('');
  const [mobileNo, setMobileNo] = useState('');
  const [delegateId, setDelegateId] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [formSubmitLoading, setFormSubmitLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/my-portal');
      if (!res.ok) {
        if (res.status === 404) {
          const data = await res.json();
          setError(data.message || 'আপনার ব্যাংক আইডির সাথে সংশ্লিষ্ট কোনো কর্মকর্তা রেকর্ড খুঁজে পাওয়া যায়নি।');
          return;
        }
        throw new Error('তথ্য লোড করতে ব্যর্থ হয়েছে');
      }
      const data = await res.json();
      setEmployee(data.employee);
      setDutiesList(data.duties);
      setLeavesList(data.leaves);
      setLeaveBalance(data.leaveBalance);
      setMonthlyLedger(data.monthlyLedger);
      setCoveringOfficers(data.coveringOfficers || []);
      if (data.employee?.mobile) {
        setMobileNo(data.employee.mobile);
      }
    } catch (err: unknown) {
      logger.error(err);
      setError(err instanceof Error ? err.message : 'সার্ভার থেকে তথ্য সংগ্রহ করা যাচ্ছে না।');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    
    if (!startDate || !endDate || !leaveLocation || !mobileNo) {
      setFormError('দয়া করে সব প্রয়োজনীয় ক্ষেত্র পূরণ করুন।');
      return;
    }

    setFormSubmitLoading(true);

    try {
      const todayStr = new Date().toISOString().split('T')[0];
      
      const payload = {
        leaveType,
        startDate,
        endDate,
        applicationDate: todayStr,
        applicantName: employee?.name || '',
        designation: employee?.designation || '',
        bankId: employee?.bankId || '',
        cellName: employee?.cellName || '',
        leaveLocation,
        mobileNo,
        selectedDistrict: selectedDistrict || null,
        delegateId: delegateId || null,
        casualTotal: leaveBalance?.total || 20,
        casualUsed: leaveBalance?.used || 0,
        ordinaryTotal: 0,
        ordinaryUsed: 0,
        specialTotal: 0,
        specialUsed: 0
      };

      const res = await fetch('/api/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'আবেদন জমা দিতে ব্যর্থ হয়েছে');
      }

      setFormSuccess('ছুটির আবেদনটি সফলভাবে জমা দেওয়া হয়েছে!');
      setStartDate('');
      setEndDate('');
      setLeaveLocation('');
      setDelegateId('');
      setSelectedDistrict('');
      
      // Reload portal data to refresh history and balance
      await loadData();

      setTimeout(() => {
        setShowApplyModal(false);
        setFormSuccess('');
      }, 2000);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'সার্ভার ত্রুটি!');
    } finally {
      setFormSubmitLoading(false);
    }
  };

  const getDutyTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'LATE_SITTING':
        return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      case 'HOLIDAY':
        return 'bg-sky-50 text-sky-700 border-sky-100';
      case 'NIGHT_SHIFT':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  const getDutyTypeLabel = (type: string) => {
    switch (type) {
      case 'LATE_SITTING':
        return 'লেট সিটিং';
      case 'HOLIDAY':
        return 'ছুটির দিন';
      case 'NIGHT_SHIFT':
        return 'রাত্রীকালীন শিফট';
      default:
        return type;
    }
  };

  const getLeaveTypeLabel = (type: string) => {
    switch (type) {
      case 'CASUAL':
        return 'নৈমিত্তিক ছুটি';
      case 'STATION_LEAVE':
        return 'স্টেশন ত্যাগসহ নৈমিত্তিক';
      case 'POST_FACTO':
        return 'ঘটনোত্তর নৈমিত্তিক';
      default:
        return type;
    }
  };

  const formatDateBn = (dateStr: string) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return toBanglaDigits(`${d}-${m}-${y}`);
  };

  const formatMonthBn = (monthStr: string) => {
    if (!monthStr) return '';
    const [y, m] = monthStr.split('-');
    const monthsBn = [
      'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
      'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
    ];
    const monthIdx = parseInt(m, 10) - 1;
    return `${monthsBn[monthIdx]} ${toBanglaDigits(y)}`;
  };

  if (loading && !employee) {
    return (
      <div className="min-h-[500px] w-full flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#0b5e9e] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-lg mx-auto bg-white/95 rounded-3xl shadow-xl border border-red-100 space-y-4 text-center mt-12">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-lg font-bold text-slate-800">পোর্টাল সংযোগ ব্যর্থ</h2>
        <p className="text-sm text-slate-500">{error}</p>
        <button 
          onClick={loadData}
          className="px-5 py-2 bg-[#0b5e9e] hover:bg-[#074778] text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
        >
          আবার চেষ্টা করুন
        </button>
      </div>
    );
  }

  // Calculate duty totals
  const totalDutiesCount = dutiesList.length;
  const totalDutiesAllowance = dutiesList.reduce((acc, d) => acc + d.totalBill, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      {/* 1. PROFILE HEADER CARD */}
      {employee && (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/30 rounded-full blur-3xl -z-10" />
          
          <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[#0b5e9e] flex items-center justify-center border border-blue-100">
              <User size={32} />
            </div>
            <div className="space-y-1">
              <h1 className="text-xl font-black text-slate-800">{employee.name}</h1>
              <p className="text-xs text-slate-500 font-medium">
                {employee.designation} | ব্যাংক আইডি: <span className="font-sans font-bold">@{employee.bankId}</span>
              </p>
              <div className="flex flex-wrap gap-2 pt-1 justify-center md:justify-start">
                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-[#0b5e9e]/10 text-[#0b5e9e] rounded-full">
                  <Layers size={10} />
                  {employee.cellName}
                </span>
                {employee.mobile && (
                  <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-sans">
                    <Phone size={10} />
                    {toBanglaDigits(employee.mobile)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-4 w-full md:w-auto shrink-0 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
            <div className="flex-1 md:flex-none text-center px-4 py-2 bg-blue-50/50 rounded-2xl border border-blue-100/50">
              <p className="text-[10px] text-slate-400 font-bold">ডিউটি সম্পাদন</p>
              <p className="text-lg font-black text-[#0b5e9e] font-sans mt-0.5">{toBanglaDigits(totalDutiesCount)}টি</p>
            </div>
            <div className="flex-1 md:flex-none text-center px-4 py-2 bg-emerald-50/50 rounded-2xl border border-emerald-100/50">
              <p className="text-[10px] text-slate-400 font-bold">মোট উপার্জিত ভাতা</p>
              <p className="text-lg font-black text-emerald-600 font-sans mt-0.5">৳{toBanglaDigits(totalDutiesAllowance.toLocaleString())}</p>
            </div>
          </div>
        </div>
      )}

      {/* 2. TABS NAVIGATION */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('duties')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 font-bold text-sm transition-all cursor-pointer ${
            activeTab === 'duties'
              ? 'border-[#0b5e9e] text-[#0b5e9e]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CalendarRange size={16} />
          আমার ডিউটি
        </button>
        <button
          onClick={() => setActiveTab('leaves')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 font-bold text-sm transition-all cursor-pointer ${
            activeTab === 'leaves'
              ? 'border-[#0b5e9e] text-[#0b5e9e]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CalendarCheck size={16} />
          আমার ছুটি
        </button>
        <button
          onClick={() => setActiveTab('allowances')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 font-bold text-sm transition-all cursor-pointer ${
            activeTab === 'allowances'
              ? 'border-[#0b5e9e] text-[#0b5e9e]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Receipt size={16} />
          বিলিং খতিয়ান
        </button>
      </div>

      {/* 3. TABS CONTENT */}
      <div className="min-h-[300px]">

        {/* TAB A: MY DUTIES */}
        {activeTab === 'duties' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {dutiesList.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-100 text-slate-400">
                <Clock size={48} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm font-semibold">আপনার কোনো ডিউটি রেকর্ড খুঁজে পাওয়া যায়নি।</p>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100">
                        <th className="p-4 pl-6">ক্রমিক</th>
                        <th className="p-4">তারিখ</th>
                        <th className="p-4">ডিউটির প্রকার</th>
                        <th className="p-4">বিবরণ</th>
                        <th className="p-4">আপ্যায়ন ভাতা</th>
                        <th className="p-4">যাতায়াত ভাতা</th>
                        <th className="p-4 text-right pr-6">সর্বমোট</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {dutiesList.map((duty, idx) => (
                        <tr key={duty.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4 pl-6 font-sans text-slate-400 font-bold">{toBanglaDigits(idx + 1)}</td>
                          <td className="p-4 font-bold text-slate-700">{formatDateBn(duty.date)}</td>
                          <td className="p-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getDutyTypeBadgeColor(duty.type)}`}>
                              {getDutyTypeLabel(duty.type)}
                            </span>
                          </td>
                          <td className="p-4 text-slate-500 font-medium text-xs max-w-xs truncate" title={duty.description || ''}>
                            {duty.description || '—'}
                          </td>
                          <td className="p-4 font-sans text-slate-600 font-semibold">৳{toBanglaDigits(duty.allowance1)}</td>
                          <td className="p-4 font-sans text-slate-600 font-semibold">৳{toBanglaDigits(duty.allowance2)}</td>
                          <td className="p-4 text-right pr-6 font-sans font-bold text-[#0b5e9e]">৳{toBanglaDigits(duty.totalBill)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB B: MY LEAVES */}
        {activeTab === 'leaves' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            
            {/* KPI Cards & Action Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 p-4 rounded-3xl border border-slate-100">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="px-4 py-2 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0b5e9e] flex items-center justify-center">
                    <Calendar size={16} />
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 font-bold">মোট নৈমিত্তিক বরাদ্দ</p>
                    <p className="text-sm font-black text-slate-800 font-sans mt-0.5">
                      {toBanglaDigits(leaveBalance?.total || 20)} দিন
                    </p>
                  </div>
                </div>
                
                <div className="px-4 py-2 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Clock size={16} />
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 font-bold">ভোগকৃত দিন</p>
                    <p className="text-sm font-black text-amber-600 font-sans mt-0.5">
                      {toBanglaDigits(leaveBalance?.used || 0)} দিন
                    </p>
                  </div>
                </div>

                <div className="px-4 py-2 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 size={16} />
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 font-bold">অবশিষ্ট ছুটি</p>
                    <p className="text-sm font-black text-emerald-600 font-sans mt-0.5">
                      {toBanglaDigits(leaveBalance?.remaining || 0)} দিন
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowApplyModal(true)}
                className="px-5 py-2.5 bg-gradient-to-r from-[#0b5e9e] to-[#074778] hover:from-[#074778] hover:to-[#053256] text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <Plus size={16} />
                নতুন ছুটির আবেদন
              </button>
            </div>

            {/* Leave History Table */}
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-slate-800">আমার ছুটির ইতিহাস</h2>
              
              {leavesList.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-3xl border border-slate-100 text-slate-400">
                  <Calendar size={48} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-semibold">আপনার কোনো ছুটির আবেদন রেকর্ড খুঁজে পাওয়া যায়নি।</p>
                </div>
              ) : (
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100">
                          <th className="p-4 pl-6">ক্রমিক</th>
                          <th className="p-4">আবেদনের তারিখ</th>
                          <th className="p-4">ছুটির প্রকার</th>
                          <th className="p-4">শুরুর তারিখ</th>
                          <th className="p-4">শেষের তারিখ</th>
                          <th className="p-4">ছুটিকালীন ঠিকানা</th>
                          <th className="p-4 pr-6">মোবাইল</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {leavesList.map((leave, idx) => (
                          <tr key={leave.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-4 pl-6 font-sans text-slate-400 font-bold">{toBanglaDigits(idx + 1)}</td>
                            <td className="p-4 text-slate-500 font-medium">{formatDateBn(leave.applicationDate)}</td>
                            <td className="p-4 font-bold text-slate-700">{getLeaveTypeLabel(leave.leaveType)}</td>
                            <td className="p-4 font-semibold text-slate-700">{formatDateBn(leave.startDate)}</td>
                            <td className="p-4 font-semibold text-slate-700">{formatDateBn(leave.endDate)}</td>
                            <td className="p-4 text-slate-500 font-medium text-xs max-w-xs truncate" title={leave.leaveLocation}>
                              {leave.leaveLocation}
                            </td>
                            <td className="p-4 pr-6 font-sans text-slate-500 font-semibold">{toBanglaDigits(leave.mobileNo)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* 2.1 NEW LEAVE APPLY MODAL */}
            {showApplyModal && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
                <div className="bg-white rounded-[32px] p-6 max-w-lg w-full shadow-2xl border border-slate-100 space-y-6 my-8 font-sans">
                  
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-base font-extrabold text-slate-800">নতুন ছুটির আবেদন করুন</h3>
                    <button 
                      onClick={() => {
                        setShowApplyModal(false);
                        setFormError('');
                        setFormSuccess('');
                      }}
                      className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      <Plus className="rotate-45" size={20} />
                    </button>
                  </div>

                  {formError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-2xl flex items-center gap-2 text-xs font-semibold">
                      <AlertCircle size={16} className="shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}

                  {formSuccess && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-2xl flex items-center gap-2 text-xs font-semibold">
                      <CheckCircle2 size={16} className="shrink-0" />
                      <span>{formSuccess}</span>
                    </div>
                  )}

                  <form onSubmit={handleApplyLeave} className="space-y-4">
                    
                    {/* Leave Type */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">ছুটির ধরণ</label>
                      <select
                        value={leaveType}
                        onChange={(e) => setLeaveType(e.target.value as 'CASUAL' | 'STATION_LEAVE' | 'POST_FACTO')}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-[#0b5e9e] transition-all"
                        required
                      >
                        <option value="CASUAL">নৈমিত্তিক ছুটি</option>
                        <option value="STATION_LEAVE">কর্মস্থল ত্যাগের অনুমতিসহ নৈমিত্তিক</option>
                        <option value="POST_FACTO">ঘটনোত্তর নৈমিত্তিক</option>
                      </select>
                    </div>

                    {/* Dates Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">শুরুর তারিখ</label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-[#0b5e9e] transition-all font-sans"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">শেষের তারিখ</label>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-[#0b5e9e] transition-all font-sans"
                          required
                        />
                      </div>
                    </div>

                    {/* District (Optional) */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">ছুটিকালীন জেলা (যদি প্রযোজ্য হয়)</label>
                      <input
                        type="text"
                        value={selectedDistrict}
                        onChange={(e) => setSelectedDistrict(e.target.value)}
                        placeholder="যেমন: কুমিল্লা"
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-[#0b5e9e] transition-all"
                      />
                    </div>

                    {/* Covering Officer (DelegateId) */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">দায়িত্ব পালনকারী কর্মকর্তা (Covering Officer)</label>
                      <select
                        value={delegateId}
                        onChange={(e) => setDelegateId(e.target.value)}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-[#0b5e9e] transition-all"
                      >
                        <option value="">কর্মকর্তা নির্বাচন করুন (ঐচ্ছিক)</option>
                        {coveringOfficers.map(officer => (
                          <option key={officer.id} value={officer.id}>
                            {officer.name} ({officer.designation})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Location & Mobile */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">ছুটিকালীন ঠিকানা / যোগাযোগস্থল</label>
                      <textarea
                        value={leaveLocation}
                        onChange={(e) => setLeaveLocation(e.target.value)}
                        placeholder="যেমন: গ্রাম- বানিয়াচং, ডাকঘর- বানিয়াচং, জেলা- হবিগঞ্জ।"
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-[#0b5e9e] transition-all min-h-[60px]"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">জরুরি যোগাযোগ নম্বর</label>
                      <input
                        type="text"
                        value={mobileNo}
                        onChange={(e) => setMobileNo(e.target.value)}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-[#0b5e9e] transition-all font-sans"
                        required
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={formSubmitLoading}
                      className="w-full py-3 bg-[#0b5e9e] hover:bg-[#074778] text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {formSubmitLoading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        'ছুটির আবেদন সাবমিট করুন'
                      )}
                    </button>

                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB C: ALLOWANCES LEDGER */}
        {activeTab === 'allowances' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {monthlyLedger.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-100 text-slate-400">
                <Receipt size={48} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm font-semibold">আপনার কোনো ভাতার ডাটা পাওয়া যায়নি।</p>
              </div>
            ) : (
              <div className="space-y-4">
                
                {/* Cumulative stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-white border border-slate-100 rounded-3xl shadow-sm flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-[10px] text-slate-400 font-bold">মোট আপ্যায়ন ভাতা</p>
                      <p className="text-lg font-black text-slate-800 font-sans">
                        ৳{toBanglaDigits(monthlyLedger.reduce((acc, row) => acc + row.allowance1, 0).toLocaleString())}
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <Clock size={18} />
                    </div>
                  </div>

                  <div className="p-4 bg-white border border-slate-100 rounded-3xl shadow-sm flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-[10px] text-slate-400 font-bold">মোট যাতায়াত ভাতা</p>
                      <p className="text-lg font-black text-slate-800 font-sans">
                        ৳{toBanglaDigits(monthlyLedger.reduce((acc, row) => acc + row.allowance2, 0).toLocaleString())}
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
                      <TrendingUp size={18} />
                    </div>
                  </div>

                  <div className="p-4 bg-[#0b5e9e] text-white rounded-3xl shadow-sm flex items-center justify-between border border-[#0b5e9e]">
                    <div className="space-y-0.5">
                      <p className="text-[10px] text-blue-200 font-bold">সর্বমোট উপার্জিত ভাতা</p>
                      <p className="text-lg font-black font-sans">
                        ৳{toBanglaDigits(monthlyLedger.reduce((acc, row) => acc + row.totalBill, 0).toLocaleString())}
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-2xl bg-white/10 text-white flex items-center justify-center">
                      <Coins size={18} />
                    </div>
                  </div>
                </div>

                {/* Monthly Ledger Table */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100">
                          <th className="p-4 pl-6">ক্রমিক</th>
                          <th className="p-4">মাস</th>
                          <th className="p-4">আপ্যায়ন ভাতা খরচ</th>
                          <th className="p-4">যাতায়াত ভাতা খরচ</th>
                          <th className="p-4 text-right pr-6">মোট বিল</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {monthlyLedger.map((row, idx) => (
                          <tr key={row.month} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-4 pl-6 font-sans text-slate-400 font-bold">{toBanglaDigits(idx + 1)}</td>
                            <td className="p-4 font-bold text-slate-700">{formatMonthBn(row.month)}</td>
                            <td className="p-4 font-sans text-slate-600 font-semibold">৳{toBanglaDigits(row.allowance1.toLocaleString())}</td>
                            <td className="p-4 font-sans text-slate-600 font-semibold">৳{toBanglaDigits(row.allowance2.toLocaleString())}</td>
                            <td className="p-4 text-right pr-6 font-sans font-bold text-[#0b5e9e]">৳{toBanglaDigits(row.totalBill.toLocaleString())}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}
          </div>
        )}

      </div>

    </div>
  );
}
