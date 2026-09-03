'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { User, CalendarRange, Settings, AlertCircle, FileText } from 'lucide-react';
import CalendarDatePicker from './CalendarDatePicker';
import LeaveSummaryCard from './LeaveSummaryCard';
import LeaveHistoryTable from './LeaveHistoryTable';
import { BANGLADESH_AREAS } from '../bangladesh_areas';
import { cleanDesignationForLeave } from '../hooks/useLeaveData';
import { Employee, Cell, UserSession, Leave } from '../types';
import { toBanglaDigits } from '@/lib/bengali-converter';

interface LeaveFormProps {
  currentUser: UserSession | null;
  activeTab: 'NEW' | 'ARCHIVE';
  setActiveTab: (tab: 'NEW' | 'ARCHIVE') => void;
  isProfileUnresolved: boolean;
  cells: Cell[];
  employees: Employee[];
  selectedCellId: number | '';
  setSelectedCellId: (id: number | '') => void;
  selectedApplicantEmp: Employee | null;
  setSelectedApplicantEmp: (emp: Employee | null) => void;
  applicantName: string;
  setApplicantName: (name: string) => void;
  designation: string;
  setDesignation: (desig: string) => void;
  bankId: string;
  setBankId: (id: string) => void;
  fileNo: string;
  setFileNo: (no: string) => void;
  mobileNo: string;
  setMobileNo: (mobile: string) => void;
  cellName: string;
  setCellName: (name: string) => void;
  leaveLocation: string;
  setLeaveLocation: (loc: string) => void;
  selectedDistrict: string;
  setSelectedDistrict: (dist: string) => void;
  showValidationErrors: boolean;
  setShowValidationErrors: (show: boolean) => void;
  leaveType: 'CASUAL' | 'POST_FACTO' | 'STATION_LEAVE' | '';
  setLeaveType: (type: 'CASUAL' | 'POST_FACTO' | 'STATION_LEAVE' | '') => void;
  durationMode: 'SINGLE' | 'MULTIPLE';
  setDurationMode: (mode: 'SINGLE' | 'MULTIPLE') => void;
  startDate: string;
  setStartDate: (date: string) => void;
  endDate: string;
  setEndDate: (date: string) => void;
  dateLimits: { min?: string; max?: string };
  isNonWorkingDay: (date: string) => boolean;
  delegateId: string;
  setDelegateId: (id: string) => void;
  eligibleCoveringOfficers: Employee[];
  isAutoBalance: boolean;
  setIsAutoBalance: (auto: boolean) => void;
  balanceLoading: boolean;
  casualTotal: number | string;
  setCasualTotal: (val: number | string) => void;
  casualUsed: number | string;
  setCasualUsed: (val: number | string) => void;
  ordinaryTotal: number | string;
  setOrdinaryTotal: (val: number | string) => void;
  ordinaryUsed: number | string;
  setOrdinaryUsed: (val: number | string) => void;
  specialTotal: number | string;
  setSpecialTotal: (val: number | string) => void;
  specialUsed: number | string;
  setSpecialUsed: (val: number | string) => void;
  leaveDetails: any;
  editingLeaveId: number | null;
  latestLeave: Leave | null;
  archivedLeaves: Leave[];
  onSaveToArchive: () => void;
  onLoadLeavePreview: (leave: Leave) => void;
  onEditLeave: (leave: Leave) => void;
  onDeleteLeave: (id: number) => void;
}

export default function LeaveForm({
  currentUser,
  activeTab,
  setActiveTab,
  isProfileUnresolved,
  cells,
  employees,
  selectedCellId,
  setSelectedCellId,
  selectedApplicantEmp,
  setSelectedApplicantEmp,
  applicantName,
  setApplicantName,
  designation,
  setDesignation,
  bankId,
  setBankId,
  fileNo,
  setFileNo,
  mobileNo,
  setMobileNo,
  cellName,
  setCellName,
  leaveLocation,
  setLeaveLocation,
  selectedDistrict,
  setSelectedDistrict,
  showValidationErrors,
  setShowValidationErrors,
  leaveType,
  setLeaveType,
  durationMode,
  setDurationMode,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  dateLimits,
  isNonWorkingDay,
  delegateId,
  setDelegateId,
  eligibleCoveringOfficers,
  isAutoBalance,
  setIsAutoBalance,
  balanceLoading,
  casualTotal,
  setCasualTotal,
  casualUsed,
  setCasualUsed,
  ordinaryTotal,
  setOrdinaryTotal,
  ordinaryUsed,
  setOrdinaryUsed,
  specialTotal,
  setSpecialTotal,
  specialUsed,
  setSpecialUsed,
  leaveDetails,
  editingLeaveId,
  latestLeave,
  archivedLeaves,
  onSaveToArchive,
  onLoadLeavePreview,
  onEditLeave,
  onDeleteLeave,
}: LeaveFormProps) {
  const toDisplayDateStr = (dateStr: string): string => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${toBanglaDigits(parts[2])}/${toBanglaDigits(parts[1])}/${toBanglaDigits(parts[0])}`;
  };

  const validateAndSetTotal = (
    value: string,
    setter: (val: number | string) => void,
    currentUsed: number | string,
    setUsed: (val: number | string) => void
  ) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned === '') {
      setter('');
      return;
    }
    const num = Math.max(0, parseInt(cleaned, 10));
    setter(num);

    const usedValStr = String(currentUsed).trim();
    if (usedValStr !== '-' && usedValStr !== '') {
      const usedNum = parseInt(usedValStr, 10);
      if (!isNaN(usedNum) && usedNum > num) {
        setUsed(num);
      }
    }
  };

  const validateAndSetUsed = (
    value: string,
    setter: (val: number | string) => void,
    total: number | string
  ) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned === '') {
      setter('');
      return;
    }
    const num = Math.max(0, parseInt(cleaned, 10));

    const totalValStr = String(total).trim();
    if (totalValStr !== '-' && totalValStr !== '') {
      const totalNum = parseInt(totalValStr, 10);
      if (!isNaN(totalNum)) {
        if (num > totalNum) {
          setter(totalNum);
          return;
        }
      }
    }
    setter(num);
  };

  return (
    <div className="no-print xl:col-span-4 space-y-6">
      {/* Tab Switcher */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 pb-px">
        <button
          type="button"
          onClick={() => setActiveTab('NEW')}
          className={`flex-1 pb-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'NEW'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          নতুন আবেদন ফর্ম
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('ARCHIVE')}
          className={`flex-1 pb-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'ARCHIVE'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          আর্কাইভ ও বিগত আবেদনসমূহ
        </button>
      </div>

      {activeTab === 'NEW' ? (
        <div className="space-y-6">
          {isProfileUnresolved && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs font-bold rounded-xl flex items-center gap-3 shadow-sm animate-pulse">
              <AlertCircle size={18} className="text-rose-600 shrink-0" />
              <p>আপনার কর্মকর্তা প্রোফাইল সিস্টেমে খুঁজে পাওয়া যায়নি। অনুগ্রহ করে সিস্টেম অ্যাডমিনের সাথে যোগাযোগ করুন।</p>
            </div>
          )}
          
          {/* Box 1: Applicant information */}
          <Card
            className="overflow-visible relative z-20"
            title={
              <span className="flex items-center gap-2">
                <User size={16} className="text-indigo-600 dark:text-indigo-400" />
                আবেদনকারীর তথ্য
              </span>
            }
          >
            <div className="space-y-3.5 text-xs font-sans">
              {currentUser?.role === 'ADMIN' && (
                <>
                  <div className="space-y-1.5 pb-2">
                    <label htmlFor="selectedCellId" className="font-bold text-indigo-700 dark:text-indigo-400 block">শাখা/সেল নির্বাচন করুন:</label>
                    <select
                      id="selectedCellId"
                      value={selectedCellId}
                      onChange={(e) => {
                        const val = e.target.value ? parseInt(e.target.value, 10) : '';
                        setSelectedCellId(val);
                        setSelectedApplicantEmp(null);
                        setApplicantName('');
                        setDesignation('');
                        setBankId('');
                        setFileNo('');
                        setMobileNo('');
                        setCellName('');
                        setDelegateId('');
                      }}
                      className="w-full px-3 py-2 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900 rounded-xl outline-none focus:border-indigo-500 font-bold cursor-pointer text-indigo-900 dark:text-indigo-300"
                    >
                      <option value="">শাখা/সেল নির্বাচন করুন...</option>
                      {cells.map(cell => (
                        <option key={cell.id} value={cell.id}>{cell.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5 pb-2 border-b border-dashed border-indigo-100 dark:border-indigo-950">
                    <label htmlFor="selectedEmployeeId" className="font-bold text-indigo-700 dark:text-indigo-400 block">আবেদনকারী কর্মকর্তা নির্বাচন:</label>
                    <select
                      id="selectedEmployeeId"
                      value={selectedApplicantEmp?.id || ''}
                      disabled={!selectedCellId}
                      onChange={(e) => {
                        const empId = e.target.value;
                        const emp = employees.find(emp => String(emp.id) === empId);
                        if (emp) {
                          setSelectedApplicantEmp(emp);
                          setApplicantName((emp.name || '').replace(/^জনাব\s+/, ''));
                          setDesignation(cleanDesignationForLeave(emp.designation));
                          setBankId(emp.bankId || '');
                          setFileNo(emp.fileNo || '');
                          setMobileNo(emp.mobile || '');
                          if (emp.cell && emp.cell.name) {
                            setCellName(emp.cell.name);
                          }
                          setDelegateId('');
                        } else {
                          setSelectedApplicantEmp(null);
                          setApplicantName('');
                          setDesignation('');
                          setBankId('');
                          setFileNo('');
                          setMobileNo('');
                          setCellName('');
                          setDelegateId('');
                        }
                      }}
                      className="w-full px-3 py-2 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900 rounded-xl outline-none focus:border-indigo-500 font-bold cursor-pointer text-indigo-900 dark:text-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">কর্মকর্তা নির্বাচন করুন...</option>
                      {employees
                        .filter(emp => selectedCellId ? emp.cellId === selectedCellId : true)
                        .map(emp => (
                          <option key={emp.id} value={emp.id}>
                            {emp.name} ({cleanDesignationForLeave(emp.designation)})
                          </option>
                        ))}
                    </select>
                  </div>
                </>
              )}

              {/* Readonly/Editable fields */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="applicantName" className="font-bold text-slate-700 dark:text-slate-300">নাম:</label>
                  <input
                    id="applicantName"
                    type="text"
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                    placeholder="আবেদনকারীর নাম"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl outline-none focus:border-indigo-500 font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="designation" className="font-bold text-slate-700 dark:text-slate-300">পদবী:</label>
                  <input
                    id="designation"
                    type="text"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="পদবী"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl outline-none focus:border-indigo-500 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="bankId" className="font-bold text-slate-700 dark:text-slate-300">ব্যাংক আইডি:</label>
                  <input
                    id="bankId"
                    type="text"
                    value={bankId}
                    onChange={(e) => setBankId(e.target.value)}
                    placeholder="ব্যাংক আইডি"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl outline-none focus:border-indigo-500 font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="fileNo" className="font-bold text-slate-700 dark:text-slate-300">নথি নম্বর (File No):</label>
                  <input
                    id="fileNo"
                    type="text"
                    value={fileNo}
                    onChange={(e) => setFileNo(e.target.value)}
                    placeholder="নথি নম্বর"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl outline-none focus:border-indigo-500 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="cellName" className="font-bold text-slate-700 dark:text-slate-300">শাখা/সেল:</label>
                  <input
                    id="cellName"
                    type="text"
                    value={cellName}
                    onChange={(e) => setCellName(e.target.value)}
                    placeholder="শাখা/সেল"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl outline-none focus:border-indigo-500 font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="mobileNo" className="font-bold text-slate-700 dark:text-slate-300">মোবাইল নম্বর:</label>
                  <input
                    id="mobileNo"
                    type="text"
                    value={mobileNo}
                    onChange={(e) => setMobileNo(e.target.value)}
                    placeholder="০১XXXXXXXXX"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl outline-none focus:border-indigo-500 font-semibold font-sans"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="selectedDistrict" className="font-bold text-slate-700 dark:text-slate-300 block">ছুটিতে থাকাকালীন অবস্থান (জেলা):</label>
                <select
                  id="selectedDistrict"
                  value={selectedDistrict}
                  onChange={(e) => {
                    setSelectedDistrict(e.target.value);
                    if (e.target.value) {
                      setShowValidationErrors(false);
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-xl outline-none font-bold cursor-pointer transition-all ${
                    !selectedDistrict && showValidationErrors
                      ? 'border-red-500 focus:border-red-500 bg-red-50/50 dark:bg-red-950/20 text-red-900 dark:text-red-300'
                      : 'border-slate-200 dark:border-slate-800 focus:border-indigo-500 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100'
                  }`}
                >
                  <option value="">জেলা নির্বাচন করুন...</option>
                  {Object.entries(BANGLADESH_AREAS).map(([division, { districts }]) => (
                    <optgroup key={division} label={division}>
                      {Object.keys(districts).map(districtName => (
                        <option key={districtName} value={districtName}>{districtName}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          {/* Box 2: Leave dates and details */}
          <Card
            className="overflow-visible relative z-30"
            title={
              <span className="flex items-center gap-2">
                <CalendarRange size={16} className="text-indigo-600 dark:text-indigo-400" />
                ছুটির সময়কাল ও ধরণ
              </span>
            }
          >
            <div className="space-y-3.5 text-xs font-sans">
              <div className="space-y-1">
                <label htmlFor="leaveType" className="font-bold text-slate-700 dark:text-slate-300">ছুটির ধরণ:</label>
                <select
                  id="leaveType"
                  value={leaveType}
                  onChange={(e) => {
                    const newType = e.target.value as any;
                    setLeaveType(newType);
                    if (newType) {
                      setShowValidationErrors(false);
                    }
                    if ((newType === 'CASUAL' || newType === 'STATION_LEAVE') && dateLimits.min) {
                      if (startDate && startDate < dateLimits.min) {
                        setStartDate('');
                        setEndDate('');
                      }
                    } else if (newType === 'POST_FACTO' && dateLimits.max) {
                      if (startDate && startDate > dateLimits.max) {
                        setStartDate('');
                        setEndDate('');
                      }
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl outline-none focus:border-indigo-500 font-bold cursor-pointer"
                >
                  <option value="">ছুটির ধরণ নির্বাচন করুন...</option>
                  <option value="CASUAL">নৈমিত্তিক ছুটি (Casual Leave)</option>
                  <option value="POST_FACTO">ঘটনাত্তোর ছুটি (Post-facto Casual Leave)</option>
                  <option value="STATION_LEAVE">কর্মস্থল ত্যাগের অনুমতিসহ নৈমিত্তিক ছুটি (Station Leave)</option>
                </select>
              </div>

              {/* Duration Mode Radio Toggle */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">ছুটির ব্যপ্তিকাল:</label>
                <div className="flex gap-4 p-1 bg-slate-100 dark:bg-slate-900/60 rounded-xl p-1.5 border border-slate-200/60 dark:border-slate-800">
                  <label className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg cursor-pointer text-xs font-bold transition-all ${
                    durationMode === 'SINGLE' 
                      ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}>
                    <input 
                      type="radio" 
                      name="durationMode" 
                      value="SINGLE" 
                      checked={durationMode === 'SINGLE'} 
                      onChange={() => {
                        setDurationMode('SINGLE');
                        setEndDate(startDate);
                      }} 
                      className="hidden" 
                    />
                    <span>১ দিন (Single Day)</span>
                  </label>
                  
                  <label className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg cursor-pointer text-xs font-bold transition-all ${
                    durationMode === 'MULTIPLE' 
                      ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}>
                    <input 
                      type="radio" 
                      name="durationMode" 
                      value="MULTIPLE" 
                      checked={durationMode === 'MULTIPLE'} 
                      onChange={() => setDurationMode('MULTIPLE')} 
                      className="hidden" 
                    />
                    <span>একাধিক দিন (Multiple Days)</span>
                  </label>
                </div>
              </div>

              {/* Date Pickers */}
              {durationMode === 'SINGLE' ? (
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">ছুটির তারিখ:</label>
                  <CalendarDatePicker 
                    value={startDate}
                    onChange={(d) => {
                      setStartDate(d);
                      setEndDate(d);
                    }}
                    isNonWorkingDay={isNonWorkingDay}
                    toBanglaDigits={toBanglaDigits}
                    minDate={dateLimits.min}
                    maxDate={dateLimits.max}
                    placeholder="ছুটির তারিখ নির্বাচন..."
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">শুরুর তারিখ:</label>
                    <CalendarDatePicker 
                      value={startDate}
                      onChange={setStartDate}
                      isNonWorkingDay={isNonWorkingDay}
                      toBanglaDigits={toBanglaDigits}
                      minDate={dateLimits.min}
                      maxDate={dateLimits.max}
                      placeholder="শুরুর তারিখ নির্বাচন..."
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">শেষের তারিখ:</label>
                    <CalendarDatePicker 
                      value={endDate}
                      onChange={setEndDate}
                      isNonWorkingDay={isNonWorkingDay}
                      toBanglaDigits={toBanglaDigits}
                      minDate={startDate || dateLimits.min}
                      maxDate={dateLimits.max}
                      disabled={!startDate}
                      placeholder="শেষের তারিখ নির্বাচন..."
                    />
                  </div>
                </div>
              )}

              {/* Delegate Officer dropdown */}
              <div className="space-y-1">
                <label htmlFor="delegateId" className="font-bold text-slate-700 dark:text-slate-300">ছুটিতে দায়িত্ব পালনকারী কর্মকর্তা:</label>
                <select
                  id="delegateId"
                  value={delegateId}
                  onChange={(e) => {
                    setDelegateId(e.target.value);
                    if (e.target.value) {
                      setShowValidationErrors(false);
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-xl outline-none font-bold cursor-pointer transition-all ${
                    eligibleCoveringOfficers.length > 0 && !delegateId && showValidationErrors
                      ? 'border-red-500 focus:border-red-500 bg-red-50/50 dark:bg-red-950/20 text-red-900 dark:text-red-300'
                      : 'border-slate-200 dark:border-slate-800 focus:border-indigo-500 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100'
                  }`}
                >
                  <option value="">দায়িত্বপ্রাপ্ত কর্মকর্তা নির্বাচন করুন...</option>
                  {eligibleCoveringOfficers.map((emp: Employee) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({cleanDesignationForLeave(emp.designation)})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          {/* Box 3: editable balance grid */}
          <Card
            className="overflow-visible relative z-10"
            title={
              <span className="flex items-center gap-2">
                <Settings size={16} className="text-indigo-600 dark:text-indigo-400" />
                ছুটির ব্যালেন্স শিট এডিটর
              </span>
            }
          >
            <div className="space-y-3.5 text-xs font-sans">
              <div className="bg-gradient-to-r from-indigo-50/40 to-teal-50/40 dark:from-indigo-950/20 dark:to-teal-950/20 border border-indigo-100/50 dark:border-indigo-900/30 rounded-xl p-3 flex flex-col gap-2 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🔄</span>
                    <h4 className="font-bold text-indigo-900 dark:text-indigo-300 text-sm">অটো ব্যালেন্স ট্র্যাকিং</h4>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setIsAutoBalance(!isAutoBalance)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${isAutoBalance ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${isAutoBalance ? 'translate-x-4.5' : 'translate-x-1'}`} style={{ transform: isAutoBalance ? 'translateX(18px)' : 'translateX(4px)' }} />
                  </button>
                </div>
                <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">আবেদনকারীর ব্যাংক আইডি অনুযায়ী স্বয়ংক্রিয়ভাবে ভোগকৃত ছুটি হিসাব করা হয়েছে</p>
                {balanceLoading && (
                  <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded overflow-hidden">
                    <div className="h-full bg-indigo-500 w-1/3 rounded animate-pulse" />
                  </div>
                )}
              </div>

              {/* Row 1 Casual leaves config */}
              <div className="p-3 bg-indigo-50/20 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 rounded-xl space-y-2">
                <p className="font-extrabold text-indigo-900 dark:text-indigo-400">নৈমিত্তিক ছুটি ব্যালেন্স:</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label htmlFor="casualTotal" className="text-[10px] text-slate-500 dark:text-slate-300 font-bold">প্রাপ্তব্য:</label>
                    <input 
                      id="casualTotal"
                      type="text" 
                      value={casualTotal}
                      onChange={(e) => validateAndSetTotal(e.target.value, setCasualTotal, casualUsed, setCasualUsed)}
                      className="w-full px-2 py-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded outline-none font-bold focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="casualUsed" className="text-[10px] text-slate-500 dark:text-slate-300 font-bold">ভোগকৃত (আগের):</label>
                    <input 
                      id="casualUsed"
                      type="text" 
                      value={casualUsed}
                      onChange={(e) => validateAndSetUsed(e.target.value, setCasualUsed, casualTotal)}
                      className="w-full px-2 py-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded outline-none font-bold focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Row 2 Earned leaves config */}
              <div className="p-3 bg-teal-50/20 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/50 rounded-xl space-y-2">
                <p className="font-extrabold text-teal-900 dark:text-teal-400">সাধারণ ছুটি ব্যালেন্স:</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label htmlFor="ordinaryTotal" className="text-[10px] text-slate-500 dark:text-slate-300 font-bold">প্রাপ্তব্য:</label>
                    <input 
                      id="ordinaryTotal"
                      type="text" 
                      value={ordinaryTotal}
                      onChange={(e) => validateAndSetTotal(e.target.value, setOrdinaryTotal, ordinaryUsed, setOrdinaryUsed)}
                      className="w-full px-2 py-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded outline-none font-bold focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="ordinaryUsed" className="text-[10px] text-slate-500 dark:text-slate-300 font-bold">ভোগকৃত:</label>
                    <input 
                      id="ordinaryUsed"
                      type="text" 
                      value={ordinaryUsed}
                      onChange={(e) => validateAndSetUsed(e.target.value, setOrdinaryUsed, ordinaryTotal)}
                      className="w-full px-2 py-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded outline-none font-bold focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Row 3 Special leaves config */}
              <div className="p-3 bg-purple-50/20 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/50 rounded-xl space-y-2">
                <p className="font-extrabold text-purple-900 dark:text-purple-400">বিশেষ ছুটি ব্যালেন্স:</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label htmlFor="specialTotal" className="text-[10px] text-slate-500 dark:text-slate-300 font-bold">প্রাপ্তব্য:</label>
                    <input 
                      id="specialTotal"
                      type="text" 
                      value={specialTotal}
                      onChange={(e) => validateAndSetTotal(e.target.value, setSpecialTotal, specialUsed, setSpecialUsed)}
                      className="w-full px-2 py-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded outline-none font-bold focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="specialUsed" className="text-[10px] text-slate-500 dark:text-slate-300 font-bold">ভোগকৃত:</label>
                    <input 
                      id="specialUsed"
                      type="text" 
                      value={specialUsed}
                      onChange={(e) => validateAndSetUsed(e.target.value, setSpecialUsed, specialTotal)}
                      className="w-full px-2 py-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded outline-none font-bold focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Box 4: Sandwich leave details display */}
          <LeaveSummaryCard 
            leaveDetails={leaveDetails} 
            leaveType={leaveType} 
            toBanglaDigits={toBanglaDigits} 
          />

          {/* Save or Update Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={onSaveToArchive}
              disabled={isProfileUnresolved}
              className={`w-full py-3.5 px-4 rounded-xl text-xs font-bold text-white transition-all shadow-md text-center hover:scale-[1.01] active:scale-[0.99] ${
                isProfileUnresolved
                  ? 'bg-slate-400 cursor-not-allowed shadow-none hover:scale-100'
                  : editingLeaveId 
                    ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/10 hover:shadow-amber-500/20 cursor-pointer' 
                    : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/10 hover:shadow-indigo-500/20 cursor-pointer'
              }`}
            >
              {editingLeaveId ? 'আর্কাইভ আপডেট করুন (Update)' : 'আর্কাইভে সংরক্ষণ করুন (Save)'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Latest Application Box */}
          {latestLeave ? (
            <div className="glass-card p-4 rounded-2xl border border-indigo-150 dark:border-indigo-950 bg-indigo-50/5">
              <div className="flex justify-between items-center mb-2.5 border-b border-indigo-100/50 dark:border-indigo-950/50 pb-2">
                <h4 className="font-extrabold text-indigo-950 dark:text-indigo-400 text-xs flex items-center gap-1.5">
                  <FileText size={14} className="text-indigo-600" />
                  লাস্ট বা লেটেস্ট এপ্লিকেশন (সর্বশেষ আবেদন)
                </h4>
                <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-850 dark:text-indigo-300 px-2 py-0.5 rounded-full font-bold">
                  {toDisplayDateStr(latestLeave.applicationDate)}
                </span>
              </div>
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 space-y-1.5 mb-3 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                <p>ছুটির ধরণ: <span className="font-bold text-slate-900 dark:text-slate-100">
                  {latestLeave.leaveType === 'CASUAL' ? 'নৈমিত্তিক ছুটি' : latestLeave.leaveType === 'POST_FACTO' ? 'ঘটনাত্তোর নৈমিত্তিক ছুটি' : 'কর্মস্থল ত্যাগের অনুমতিসহ নৈমিত্তিক ছুটি'}
                </span></p>
                <p>সময়কাল: <span className="font-bold text-slate-900 dark:text-slate-100">{toDisplayDateStr(latestLeave.startDate)} হতে {toDisplayDateStr(latestLeave.endDate)}</span></p>
                <p>ভোগকৃত ছুটি দিন: <span className="font-bold text-slate-900 dark:text-slate-100">{toBanglaDigits(
                  latestLeave.startDate === latestLeave.endDate ? 1 : 
                  Math.round((new Date(latestLeave.endDate).getTime() - new Date(latestLeave.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
                )} দিন</span></p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onLoadLeavePreview(latestLeave)}
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all text-center cursor-pointer shadow-sm shadow-indigo-500/10 hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
                >
                  প্রিন্ট প্রিভিউ
                </button>
                <button
                  type="button"
                  onClick={() => onEditLeave(latestLeave)}
                  className="py-2 px-4 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold transition-all text-center cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
                >
                  এডিট করুন
                </button>
              </div>
            </div>
          ) : (
            <div className="glass-card p-6 text-center rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50">
              <p className="text-xs text-slate-500 font-bold">কোনো পূর্ববর্তী আবেদন পাওয়া যায়নি।</p>
            </div>
          )}

          {/* Past Applications List */}
          <LeaveHistoryTable 
            archivedLeaves={archivedLeaves} 
            toBanglaDigits={toBanglaDigits}
            toDisplayDateStr={toDisplayDateStr}
            handleLoadLeavePreview={onLoadLeavePreview}
            handleEditLeave={onEditLeave}
            handleDeleteLeave={onDeleteLeave}
          />
        </div>
      )}
    </div>
  );
}
