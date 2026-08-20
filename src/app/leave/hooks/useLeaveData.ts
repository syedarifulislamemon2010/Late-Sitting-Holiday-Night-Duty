'use client';

import { useState, useEffect, useRef } from 'react';
import logger from '@/lib/logger';
import { 
  DEFAULT_2026_HOLIDAYS, 
  isNonWorkingDay as libIsNonWorkingDay, 
  getSucceedingContiguousHolidaysCount as libGetSucceedingContiguousHolidaysCount, 
  getCalculatedLeaveDetails as libGetCalculatedLeaveDetails 
} from '@/lib/leave-calculator';
import { sortEmployeesBySeniority } from '@/lib/seniority';
import { toBanglaDigits } from '@/lib/bengali-converter';
import { Employee, Cell, UserSession, Leave, Holiday } from '../types';

export const cleanDesignationForLeave = (desig: string): string => {
  if (!desig) return '';
  return desig.replace(/\s*\([^)]*\)/g, '').trim();
};

export function useLeaveData(currentUser: UserSession | null) {
  const [matchedEmp, setMatchedEmp] = useState<Employee | null>(null);
  const [selectedApplicantEmp, setSelectedApplicantEmp] = useState<Employee | null>(null);
  const [isProfileUnresolved, setIsProfileUnresolved] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [cells, setCells] = useState<Cell[]>([]);
  const [dbHolidays, setDbHolidays] = useState<Holiday[]>([]);
  const [selectedCellId, setSelectedCellId] = useState<number | ''>('');
  const [hasSyncedProfile, setHasSyncedProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showValidationErrors, setShowValidationErrors] = useState(false);

  // Leave Form States
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [durationMode, setDurationMode] = useState<'SINGLE' | 'MULTIPLE'>('SINGLE');
  const [applicationDate, setApplicationDate] = useState('');
  
  // Custom applicant details
  const [applicantName, setApplicantName] = useState('');
  const [designation, setDesignation] = useState('');
  const [bankId, setBankId] = useState('');
  const [fileNo, setFileNo] = useState('');
  const [cellName, setCellName] = useState('অনলাইন ব্যাংকিং ডিপার্টমেন্ট');
  const [leaveLocation, setLeaveLocation] = useState('ঢাকা');
  const [mobileNo, setMobileNo] = useState('');

  // Leave Archive & CRUD States
  const [leaveType, setLeaveType] = useState<'CASUAL' | 'POST_FACTO' | 'STATION_LEAVE' | ''>('');
  const [activeTab, setActiveTab] = useState<'NEW' | 'ARCHIVE'>('NEW');
  const [archivedLeaves, setArchivedLeaves] = useState<Leave[]>([]);
  const [latestLeave, setLatestLeave] = useState<Leave | null>(null);
  const lastLoadedBankIdRef = useRef('');
  const [editingLeaveId, setEditingLeaveId] = useState<number | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    isOpen: boolean;
    leaveId: number | null;
    isLoading: boolean;
  }>({
    isOpen: false,
    leaveId: null,
    isLoading: false
  });

  // Stayed Location State (District)
  const [selectedDistrict, setSelectedDistrict] = useState('');

  // Duty delegate officer
  const [delegateId, setDelegateId] = useState<string>('');
  
  // Leaves Table Balance Sheet States
  const [isAutoBalance, setIsAutoBalance] = useState(true);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [casualTotal, setCasualTotal] = useState<number | string>(20);
  const [casualUsed, setCasualUsed] = useState<number | string>(0);
  const [ordinaryTotal, setOrdinaryTotal] = useState<number | string>(120);
  const [ordinaryUsed, setOrdinaryUsed] = useState<number | string>('-');
  const [specialTotal, setSpecialTotal] = useState<number | string>('-');
  const [specialUsed, setSpecialUsed] = useState<number | string>('-');

  // Fetch all archived leaves for the current officer
  const fetchArchivedLeaves = async (targetBankId?: string) => {
    try {
      let url = '/api/leaves';
      if (targetBankId) {
        url += `?bankId=${encodeURIComponent(targetBankId)}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setArchivedLeaves(data);
        if (data.length > 0) {
          setLatestLeave(data[0]);
        } else {
          setLatestLeave(null);
        }
      }
    } catch (err) {
      logger.error('Error fetching archived leaves:', err);
    }
  };

  // Load archive on user/applicant change
  useEffect(() => {
    if (currentUser) {
      const activeBankId = selectedApplicantEmp?.bankId || (currentUser.role === 'ADMIN' ? '' : currentUser.username);
      let active = true;
      const getLeavesOnMount = async () => {
        try {
          let url = '/api/leaves';
          if (activeBankId) {
            url += `?bankId=${encodeURIComponent(activeBankId)}`;
          }
          const res = await fetch(url);
          if (res.ok && active) {
            const data = await res.json();
            setArchivedLeaves(data);
            if (data.length > 0) {
              setLatestLeave(data[0]);
            } else {
              setLatestLeave(null);
            }
          }
        } catch (err) {
          logger.error('Error fetching archived leaves:', err);
        }
      };
      getLeavesOnMount();
      return () => {
        active = false;
      };
    }
  }, [currentUser, selectedApplicantEmp]);

  // Initialize application date to today
  useEffect(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const date = String(today.getDate()).padStart(2, '0');
    const formatted = `${year}-${month}-${date}`;
    const timer = setTimeout(() => {
      setApplicationDate(formatted);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Fetch initial data (employees, holidays & cells)
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [empsRes, holidaysRes, cellsRes] = await Promise.all([
          fetch('/api/employees'),
          fetch('/api/holidays'),
          fetch('/api/cells')
        ]);

        if (empsRes.ok) {
          const empsData = await empsRes.json();
          setEmployees(Array.isArray(empsData) ? empsData : []);
        }

        if (holidaysRes.ok) {
          const holData = await holidaysRes.json();
          setDbHolidays(Array.isArray(holData) ? holData : []);
        }

        if (cellsRes.ok) {
          const cellsData = await cellsRes.json();
          setCells(Array.isArray(cellsData) ? cellsData : []);
        }
      } catch (err) {
        logger.error('Error fetching initial static leave data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Sync state once currentUser, employees and cells are loaded
  useEffect(() => {
    if (!currentUser || employees.length === 0 || hasSyncedProfile) return;

    let initialBankId = '';
    if (currentUser.role === 'ADMIN') {
      const firstNonAdminEmp = employees.find((e: Employee) => 
        e.bankId?.trim().toLowerCase() !== currentUser.username?.trim().toLowerCase()
      ) || employees[0];
      
      if (firstNonAdminEmp) {
        setSelectedApplicantEmp(firstNonAdminEmp);
        setSelectedCellId(firstNonAdminEmp.cellId);
        setApplicantName((firstNonAdminEmp.name || '').replace(/^জনাব\s+/, ''));
        setDesignation(cleanDesignationForLeave(firstNonAdminEmp.designation));
        setBankId(firstNonAdminEmp.bankId || '');
        setFileNo(firstNonAdminEmp.fileNo || '');
        setMobileNo(firstNonAdminEmp.mobile || '');
        if (firstNonAdminEmp.cell && firstNonAdminEmp.cell.name) {
          setCellName(firstNonAdminEmp.cell.name);
        }
        initialBankId = firstNonAdminEmp.bankId || '';
        setHasSyncedProfile(true);
      }
    } else {
      setApplicantName((currentUser.name || '').replace(/^জনাব\s+/, ''));
      setBankId(currentUser.username || '');
      initialBankId = currentUser.username || '';
      
      const foundEmp = employees.find((e: Employee) => 
        e.bankId && e.bankId.trim().toLowerCase() === currentUser.username?.trim().toLowerCase()
      );
      if (foundEmp) {
        setMatchedEmp(foundEmp);
        setSelectedApplicantEmp(foundEmp);
        setSelectedCellId(foundEmp.cellId);
        setApplicantName((foundEmp.name || '').replace(/^জনাব\s+/, ''));
        setDesignation(cleanDesignationForLeave(foundEmp.designation));
        if (foundEmp.fileNo) {
          setFileNo(foundEmp.fileNo);
        }
        setMobileNo(foundEmp.mobile || '');
        if (foundEmp.cell && foundEmp.cell.name) {
          setCellName(foundEmp.cell.name);
        }
        initialBankId = foundEmp.bankId || currentUser.username || '';
        setHasSyncedProfile(true);
      } else {
        setIsProfileUnresolved(true);
        fetch('/api/leaves/log-resolve-failed', { method: 'POST' }).catch(err => logger.error(err));
      }
    }

    if (initialBankId) {
      fetchArchivedLeaves(initialBankId);
    }
  }, [currentUser, employees, hasSyncedProfile]);

  // Prepopulate balance sheet editor when latestLeave changes
  useEffect(() => {
    if (!editingLeaveId) {
      const activeBankId = selectedApplicantEmp?.bankId || '';
      if (activeBankId !== lastLoadedBankIdRef.current) {
        if (latestLeave) {
          setCasualTotal(latestLeave.casualTotal ?? 20);
          setCasualUsed(latestLeave.casualUsed ?? 0);
          setOrdinaryTotal(latestLeave.ordinaryTotal || 120);
          setOrdinaryUsed(latestLeave.ordinaryUsed ?? 0);
          setSpecialTotal(latestLeave.specialTotal ?? 0);
          setSpecialUsed(latestLeave.specialUsed ?? 0);
        } else {
          setCasualTotal(20);
          setCasualUsed(0);
          setOrdinaryTotal(120);
          setOrdinaryUsed(0);
          setSpecialTotal(0);
          setSpecialUsed(0);
        }
        lastLoadedBankIdRef.current = activeBankId;
      }
    }
  }, [latestLeave, editingLeaveId, selectedApplicantEmp]);

  useEffect(() => {
    if (!isAutoBalance || !bankId) return;
    const fetchBalance = async () => {
      setBalanceLoading(true);
      try {
        const year = new Date().getFullYear();
        const res = await fetch(`/api/leaves/balance?bankId=${encodeURIComponent(bankId)}&year=${year}`);
        if (res.ok) {
          const data = await res.json();
          const cUsed = data.casualUsed ?? data.casual?.used;
          const cTotal = data.casualTotal ?? data.casual?.total;
          const oUsed = data.ordinaryUsed ?? data.ordinary?.used;
          const oTotal = data.ordinaryTotal ?? data.ordinary?.total;
          const sUsed = data.specialUsed ?? data.special?.used;
          const sTotal = data.specialTotal ?? data.special?.total;

          if (cTotal !== undefined) setCasualTotal(String(cTotal));
          if (cUsed !== undefined) setCasualUsed(String(cUsed));
          if (oTotal !== undefined) setOrdinaryTotal(String(oTotal));
          if (oUsed !== undefined) setOrdinaryUsed(String(oUsed));
          if (sTotal !== undefined) setSpecialTotal(String(sTotal));
          if (sUsed !== undefined) setSpecialUsed(String(sUsed));
        }
      } catch { /* silent */ }
      setBalanceLoading(false);
    };
    fetchBalance();
  }, [bankId, isAutoBalance, archivedLeaves]);

  // Date Check logic: public holiday or weekend
  const isNonWorkingDay = (dateStr: string): boolean => {
    return libIsNonWorkingDay(dateStr, dbHolidays);
  };

  const getSucceedingContiguousHolidaysCount = (startDateStr: string): number => {
    return libGetSucceedingContiguousHolidaysCount(startDateStr, dbHolidays);
  };

  const getCalculatedLeaveDetails = () => {
    return libGetCalculatedLeaveDetails(startDate, endDate, dbHolidays);
  };

  const leaveDetails = getCalculatedLeaveDetails();

  const todayVal = new Date();
  const getLocalDateStr = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const date = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${date}`;
  };

  const todayStr = getLocalDateStr(todayVal);
  const tomorrowVal = new Date(todayVal);
  tomorrowVal.setDate(tomorrowVal.getDate() + 1);
  const tomorrowStr = getLocalDateStr(tomorrowVal);

  const yesterdayVal = new Date(todayVal);
  yesterdayVal.setDate(yesterdayVal.getDate() - 1);
  const yesterdayStr = getLocalDateStr(yesterdayVal);

  const dateLimits = {
    min: (leaveType === 'CASUAL' || leaveType === 'STATION_LEAVE') ? tomorrowStr : undefined,
    max: leaveType === 'POST_FACTO' ? yesterdayStr : undefined
  };

  // Automatically determine leave type based on dates and location
  useEffect(() => {
    if (!startDate) return;

    if (startDate < todayStr) {
      setLeaveType('POST_FACTO');
    } else {
      if (selectedDistrict === 'ঢাকা' || !selectedDistrict) {
        setLeaveType('CASUAL');
      } else {
        setLeaveType('STATION_LEAVE');
      }
    }
  }, [startDate, selectedDistrict, todayStr]);

  const isSingleDay = Boolean(startDate && endDate && startDate === endDate);

  // Dropdown Validation Logic
  const getDropdownValidation = () => {
    const missing = [];
    if (currentUser?.role === 'ADMIN' && !selectedApplicantEmp) {
      missing.push('আবেদনকারী কর্মকর্তা');
    }
    if (!selectedDistrict) {
      missing.push('ছুটিতে থাকাকালীন অবস্থান (জেলা)');
    }
    if (!leaveType) {
      missing.push('ছুটির ধরণ');
    }
    if (!delegateId) {
      missing.push('দায়িত্ব পালনকারী কর্মকর্তা');
    }

    if (missing.length > 0) {
      return {
        isValid: false,
        message: `অনুগ্রহ করে নিচের ফিল্ডগুলো নির্বাচন করুন: ${missing.join(', ')}`
      };
    }
    return { isValid: true, message: '' };
  };

  // Handle Save / Update to Archive
  const handleSaveToArchive = async () => {
    if (!startDate || !endDate) {
      setErrorMsg('অনুগ্রহ করে ছুটির শুরুর এবং শেষের তারিখ নির্বাচন করুন।');
      setTimeout(() => setErrorMsg(''), 4000);
      return false;
    }

    const valResult = getDropdownValidation();
    if (!valResult.isValid) {
      setShowValidationErrors(true);
      setErrorMsg(valResult.message);
      setTimeout(() => setErrorMsg(''), 4000);
      return false;
    }

    const appliedDaysNum = (startDate || endDate) 
      ? (isSingleDay ? 1 : (leaveDetails.actualDeducted > 0 ? leaveDetails.actualDeducted : 1)) 
      : 0;
    const prevUsedNum = parseInt(String(casualUsed || 0), 10) || 0;
    const nextCasualUsedVal = (leaveType === 'CASUAL' || leaveType === 'POST_FACTO' || leaveType === 'STATION_LEAVE')
      ? (prevUsedNum + appliedDaysNum)
      : prevUsedNum;

    const payload = {
      leaveType,
      startDate,
      endDate,
      applicationDate,
      applicantName,
      designation,
      bankId,
      fileNo,
      cellName,
      leaveLocation,
      mobileNo,
      selectedDistrict,
      delegateId,
      casualTotal,
      casualUsed: nextCasualUsedVal,
      ordinaryTotal,
      ordinaryUsed,
      specialTotal,
      specialUsed
    };

    try {
      let res;
      if (editingLeaveId) {
        res = await fetch(`/api/leaves/${editingLeaveId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('/api/leaves', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        await res.json();
        setCasualUsed(nextCasualUsedVal);
        setSuccessMsg(editingLeaveId ? 'আবেদনটি সফলভাবে আপডেট করা হয়েছে।' : 'আবেদনটি সফলভাবে আর্কাইভে সংরক্ষণ করা হয়েছে।');
        setErrorMsg('');
        
        if (editingLeaveId) {
          setEditingLeaveId(null);
        }
        
        const activeBankId = selectedApplicantEmp?.bankId || (currentUser?.role === 'ADMIN' ? '' : currentUser?.username);
        await fetchArchivedLeaves(activeBankId);

        try {
          const empsRes = await fetch('/api/employees');
          if (empsRes.ok) {
            const empsData = await empsRes.json();
            const empsArray = Array.isArray(empsData) ? empsData : [];
            setEmployees(empsArray);
            
            if (selectedApplicantEmp?.bankId) {
              const updatedApplicant = empsArray.find((emp: { bankId?: string | null }) => emp.bankId === selectedApplicantEmp.bankId);
              if (updatedApplicant) {
                setSelectedApplicantEmp(updatedApplicant);
              }
            }
          }
        } catch (empsErr) {
          logger.error('Error refreshing employees list after leave save:', empsErr);
        }
        
        setActiveTab('ARCHIVE');
        setTimeout(() => setSuccessMsg(''), 5000);
        return true;
      } else {
        const errData = await res.json();
        let displayError = errData.message || errData.error || 'আর্কাইভে সংরক্ষণ করতে সমস্যা হয়েছে।';
        if (errData.details) {
          const detailMsgs = Object.entries(errData.details)
            .map(([field, msg]) => `${field}: ${msg}`)
            .join(', ');
          displayError = `ভ্যালিডেশন এরর (${detailMsgs})`;
        }
        setErrorMsg(displayError);
        setTimeout(() => setErrorMsg(''), 5000);
        return false;
      }
    } catch (err) {
      logger.error('Error saving leave application:', err);
      setErrorMsg('একটি নেটওয়ার্ক সমস্যা হয়েছে।');
      setTimeout(() => setErrorMsg(''), 4000);
      return false;
    }
  };

  const handleEditLeave = (leave: Leave) => {
    setEditingLeaveId(leave.id);
    setLeaveType(leave.leaveType);
    setStartDate(leave.startDate);
    setEndDate(leave.endDate);
    setDurationMode(leave.startDate === leave.endDate ? 'SINGLE' : 'MULTIPLE');
    setApplicationDate(leave.applicationDate);
    setApplicantName(leave.applicantName);
    setDesignation(cleanDesignationForLeave(leave.designation));
    setBankId(leave.bankId);
    setFileNo(leave.fileNo || '');
    setCellName(leave.cellName);
    setLeaveLocation(leave.leaveLocation);
    setMobileNo(leave.mobileNo);
    setSelectedDistrict(leave.selectedDistrict || '');
    setDelegateId(leave.delegateId || '');
    
    setCasualTotal(leave.casualTotal);
    setCasualUsed(leave.casualUsed);
    setOrdinaryTotal(leave.ordinaryTotal);
    setOrdinaryUsed(leave.ordinaryUsed);
    setSpecialTotal(leave.specialTotal);
    setSpecialUsed(leave.specialUsed);

    setActiveTab('NEW');
    setSuccessMsg('আর্কাইভের তথ্য এডিটর ফর্মে লোড করা হয়েছে। পরিবর্তন করে আপডেট করুন।');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleLoadLeavePreview = (leave: Leave) => {
    setLeaveType(leave.leaveType);
    setStartDate(leave.startDate);
    setEndDate(leave.endDate);
    setDurationMode(leave.startDate === leave.endDate ? 'SINGLE' : 'MULTIPLE');
    setApplicationDate(leave.applicationDate);
    setApplicantName(leave.applicantName);
    setDesignation(cleanDesignationForLeave(leave.designation));
    setBankId(leave.bankId);
    setFileNo(leave.fileNo || '');
    setCellName(leave.cellName);
    setLeaveLocation(leave.leaveLocation);
    setMobileNo(leave.mobileNo);
    setSelectedDistrict(leave.selectedDistrict || '');
    setDelegateId(leave.delegateId || '');
    
    setCasualTotal(leave.casualTotal);
    setCasualUsed(leave.casualUsed);
    setOrdinaryTotal(leave.ordinaryTotal);
    setOrdinaryUsed(leave.ordinaryUsed);
    setSpecialTotal(leave.specialTotal);
    setSpecialUsed(leave.specialUsed);
    
    setEditingLeaveId(null);
    setSuccessMsg('আবেদনের তথ্য প্রিন্ট প্রিভিউতে লোড করা হয়েছে।');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleDeleteLeave = (leaveId: number) => {
    setDeleteConfirmModal({
      isOpen: true,
      leaveId,
      isLoading: false
    });
  };

  const executeDeleteLeave = async () => {
    const leaveId = deleteConfirmModal.leaveId;
    if (!leaveId) return;

    try {
      setDeleteConfirmModal(prev => ({ ...prev, isLoading: true }));
      const res = await fetch(`/api/leaves/${leaveId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setSuccessMsg('আবেদনটি সফলভাবে ডিলিট করা হয়েছে।');
        setErrorMsg('');
        
        if (editingLeaveId === leaveId) {
          setEditingLeaveId(null);
        }

        const activeBankId = selectedApplicantEmp?.bankId || (currentUser?.role === 'ADMIN' ? '' : currentUser?.username);
        await fetchArchivedLeaves(activeBankId);

        setTimeout(() => setSuccessMsg(''), 4500);
      } else {
        const errData = await res.json();
        setErrorMsg(errData.error || 'ডিলিট করতে সমস্যা হয়েছে।');
        setTimeout(() => setErrorMsg(''), 4000);
      }
    } catch (err) {
      logger.error('Error deleting leave application:', err);
      setErrorMsg('একটি নেটওয়ার্ক সমস্যা হয়েছে।');
      setTimeout(() => setErrorMsg(''), 4000);
    } finally {
      setDeleteConfirmModal({ isOpen: false, leaveId: null, isLoading: false });
    }
  };

  const handleCancelEdit = () => {
    setEditingLeaveId(null);
    setSuccessMsg('এডিটিং বাতিল করা হয়েছে।');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const eligibleCoveringOfficers = sortEmployeesBySeniority(
    employees.filter((emp: Employee) => {
      const activeEmp = selectedApplicantEmp || matchedEmp;
      if (!activeEmp) return true;
      return emp.cellId === activeEmp.cellId && emp.id !== activeEmp.id;
    })
  );

  return {
    matchedEmp,
    setMatchedEmp,
    selectedApplicantEmp,
    setSelectedApplicantEmp,
    isProfileUnresolved,
    employees,
    cells,
    dbHolidays,
    selectedCellId,
    setSelectedCellId,
    loading,
    showValidationErrors,
    setShowValidationErrors,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    durationMode,
    setDurationMode,
    applicationDate,
    setApplicationDate,
    applicantName,
    setApplicantName,
    designation,
    setDesignation,
    bankId,
    setBankId,
    fileNo,
    setFileNo,
    cellName,
    setCellName,
    leaveLocation,
    setLeaveLocation,
    mobileNo,
    setMobileNo,
    leaveType,
    setLeaveType,
    activeTab,
    setActiveTab,
    archivedLeaves,
    latestLeave,
    editingLeaveId,
    successMsg,
    setSuccessMsg,
    errorMsg,
    setErrorMsg,
    deleteConfirmModal,
    setDeleteConfirmModal,
    selectedDistrict,
    setSelectedDistrict,
    delegateId,
    setDelegateId,
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
    eligibleCoveringOfficers,
    leaveDetails,
    isSingleDay,
    dateLimits,
    todayStr,
    fetchArchivedLeaves,
    isNonWorkingDay,
    getSucceedingContiguousHolidaysCount,
    handleSaveToArchive,
    handleEditLeave,
    handleLoadLeavePreview,
    handleDeleteLeave,
    executeDeleteLeave,
    handleCancelEdit,
    getDropdownValidation,
  };
}
