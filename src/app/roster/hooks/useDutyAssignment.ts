'use client';

import { useState, useEffect } from 'react';
import logger from '@/lib/logger';
import { toBanglaDigits } from '@/lib/bengali-converter';
import { 
  Employee, 
  Cell, 
  Holiday, 
  Duty, 
  OfficeOrder, 
  OrderDuty, 
  LeaveRecord,
  DutyAssignment,
  GroupedDuty,
  getNormalizedRef,
  getDefaultDescription,
  getShortDesignation,
  getFormattedDateList,
  checkIsWorkingDay
} from '../types';

interface UseDutyAssignmentProps {
  employees: Employee[];
  cells: Cell[];
  holidays: Holiday[];
  leaves: LeaveRecord[];
  duties: Duty[];
  loadDuties: () => Promise<void>;
  showToast: (message: string, type?: 'success' | 'error') => void;
  isEditingArchive: boolean;
  setIsEditingArchive: (val: boolean) => void;
  orderRef: string;
  originalOrderRef: string;
  printCategory: 'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT';
  setSelectedMonths: React.Dispatch<React.SetStateAction<string[]>>;
  setOpt1CellId: (val: string) => void;
  setFormCellFilter: (val: string) => void;
  setFormSearchQuery: (val: string) => void;
  setUserCustomOrderRef?: (val: string | null) => void;
  getGroupedDuties: () => GroupedDuty[];
  updateAssociatedBill: (orderRef: string, origRef?: string) => Promise<void>;
  copies: string[];
  signingOfficer: string;
  signingDesignation: string;
  headerMode: 'with_header' | 'without_header';
  orderDate: string;
  orderText: string;
  payeeEmployeeId: string;
  selectedCell: string;
}

export function useDutyAssignment({
  employees,
  cells,
  holidays,
  leaves,
  duties,
  loadDuties,
  showToast,
  isEditingArchive,
  setIsEditingArchive,
  orderRef,
  originalOrderRef,
  printCategory,
  setSelectedMonths,
  setOpt1CellId,
  setFormCellFilter,
  setFormSearchQuery,
  setUserCustomOrderRef,
  getGroupedDuties,
  updateAssociatedBill,
  copies,
  signingOfficer,
  signingDesignation,
  headerMode,
  orderDate,
  orderText,
  payeeEmployeeId,
  selectedCell
}: UseDutyAssignmentProps) {
  const [entryMode, setEntryMode] = useState<'EMPLOYEE_WISE' | 'DATE_WISE'>('EMPLOYEE_WISE');
  
  const [assignmentForm, setAssignmentForm] = useState({
    selectedEmployeeIds: [] as number[],
    type: '' as 'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT' | '',
    date: new Date().toISOString().split('T')[0],
    description: ''
  });

  const [opt1Assignments, setOpt1Assignments] = useState<Record<number, string[]>>({});
  const [opt1ViewedMonths, setOpt1ViewedMonths] = useState<Record<number, string>>({});

  const [editingDuty, setEditingDuty] = useState<Duty | null>(null);
  const [editingDuties, setEditingDuties] = useState<Duty[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [preConflicts, setPreConflicts] = useState<Array<{ date: string; type: string; message: string }>>([]);
  const [conflictModalData, setConflictModalData] = useState<{
    message: string;
    details?: unknown;
    assignments: DutyAssignment[];
  } | null>(null);
  const [selectedDutyIds, setSelectedDutyIds] = useState<number[]>([]);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);

  // Live debounce conflict check
  useEffect(() => {
    const handler = setTimeout(async () => {
      const conflicts: Array<{ date: string; type: string; message: string }> = [];
      const type = assignmentForm.type;
      if (!type) return setPreConflicts([]);

      if (entryMode === 'DATE_WISE') {
        const { date, selectedEmployeeIds } = assignmentForm;
        if (!date || selectedEmployeeIds.length === 0) return setPreConflicts([]);
        for (const empId of selectedEmployeeIds) {
          try {
            const res = await fetch('/api/duties/check-conflicts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ employeeId: empId, dates: [date], type })
            });
            const data = await res.json();
            if (data.conflicts && data.conflicts.length > 0) {
              conflicts.push(...data.conflicts);
            }
          } catch (e) {}
        }
      } else {
        const entries = Object.entries(opt1Assignments);
        if (entries.length === 0) return setPreConflicts([]);
        for (const [empId, dates] of entries) {
          if (!dates || dates.length === 0) continue;
          try {
            const res = await fetch('/api/duties/check-conflicts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ employeeId: Number(empId), dates, type })
            });
            const data = await res.json();
            if (data.conflicts && data.conflicts.length > 0) {
              conflicts.push(...data.conflicts);
            }
          } catch (e) {}
        }
      }
      setPreConflicts(conflicts);
    }, 500);

    return () => clearTimeout(handler);
  }, [assignmentForm.date, assignmentForm.selectedEmployeeIds, assignmentForm.type, opt1Assignments, entryMode]);

  const handleBulkDutyImport = async (entries: { bankId: string; employeeName: string; dates: string[] }[]) => {
    const assignmentsToImport: DutyAssignment[] = [];
    const targetType = assignmentForm.type || 'LATE_SITTING';
    
    for (const entry of entries) {
      const emp = employees.find(e => e.bankId && e.bankId.trim() === entry.bankId.trim());
      if (emp) {
        const cellName = emp.cell?.name || '';
        for (const date of entry.dates) {
          assignmentsToImport.push({
            employeeId: emp.id,
            type: targetType,
            date: date,
            description: getDefaultDescription(emp.name, targetType, cellName)
          });
        }
      }
    }

    if (assignmentsToImport.length === 0) {
      alert('দুঃখিত, স্ক্যান করা কোনো কর্মকর্তার ব্যাংক আইডি প্রজেক্টের কর্মকর্তাদের তালিকার সাথে মেলেনি।');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage('');
      const res = await fetch('/api/duties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          assignments: assignmentsToImport
        })
      });

      if (!res.ok) {
        const err = await res.json();
        if (res.status === 409) {
          setErrorMessage(err.message || 'ডিউটি সংঘর্ষ বা ছুটি ওভারল্যাপ হয়েছে।');
          showToast(err.message || 'ডিউটি সংঘর্ষ বা ছুটি ওভারল্যাপ হয়েছে।', 'error');
        } else {
          setErrorMessage(err.error || 'ডিউটি ইম্পোর্ট করতে ব্যর্থ হয়েছে।');
          alert(err.error || 'ডিউটি ইম্পোর্ট করতে ব্যর্থ হয়েছে।');
        }
      } else {
        alert('রোস্টার ডিউটি সফলভাবে ইম্পোর্ট ও সংরক্ষণ করা হয়েছে!');
        loadDuties();
      }
    } catch (err) {
      logger.error(err);
      alert('ডিউটি ইম্পোর্ট করতে সমস্যা হয়েছে।');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOverwriteAndSave = async () => {
    if (!conflictModalData || !conflictModalData.assignments) return;
    try {
      setSubmitting(true);
      const assignments = conflictModalData.assignments;
      setConflictModalData(null);

      const res = await fetch('/api/duties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          assignments,
          overwriteConflicts: true,
          orderRef: isEditingArchive ? orderRef : undefined,
          originalOrderRef: isEditingArchive ? originalOrderRef : undefined
        })
      });

      if (res.ok) {
        showToast('কনফ্লিক্টিং ডাটা প্রতিস্থাপন করে নতুন ডাটা সফলভাবে সংরক্ষিত হয়েছে!', 'success');
        if (entryMode === 'EMPLOYEE_WISE') {
          setOpt1Assignments({});
        } else {
          setAssignmentForm(prev => ({ ...prev, selectedEmployeeIds: [] }));
        }
        await loadDuties();
      } else {
        const err = await res.json();
        setErrorMessage(err.message || err.error || 'ডাটা সেভ করতে সমস্যা হয়েছে।');
      }
    } catch (err) {
      logger.error(err);
      setErrorMessage('একটি নেটওয়ার্ক সমস্যা হয়েছে।');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRedirectToConflictingDuties = () => {
    setConflictModalData(null);
    const tableEl = document.getElementById('duties-table-container');
    if (tableEl) {
      tableEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleBulkDeleteDuties = () => {
    if (selectedDutyIds.length === 0) return;
    setIsBulkDeleteConfirmOpen(true);
  };

  const executeBulkDeleteDuties = async () => {
    try {
      setSubmitting(true);
      await Promise.all(selectedDutyIds.map(id => fetch(`/api/duties/${id}`, { method: 'DELETE' })));
      showToast('নির্বাচিত ডিউটিগুলো সফলভাবে মুছে ফেলা হয়েছে।', 'success');
      setSelectedDutyIds([]);
      await loadDuties();
    } catch (err) {
      logger.error(err);
      showToast('ডিউটি মুছে ফেলতে সমস্যা হয়েছে।', 'error');
    } finally {
      setSubmitting(false);
      setIsBulkDeleteConfirmOpen(false);
    }
  };

  const deleteGroupedDuties = async (dutiesToDelete: Duty[]) => {
    if (!confirm(`আপনি কি নিশ্চিতভাবে এই কর্মকর্তার ${toBanglaDigits(dutiesToDelete.length)} টি ডিউটি রেকর্ড মুছে ফেলতে চান?`)) return;
    try {
      await Promise.all(
        dutiesToDelete.map(d => fetch(`/api/duties/${d.id}`, { method: 'DELETE' }))
      );
      loadDuties();
      alert('ডিউটি রেকর্ডসমূহ সফলভাবে মুছে ফেলা হয়েছে।');
    } catch (err) {
      logger.error('Error deleting duties:', err);
      alert('ডিউটি রেকর্ড মুছতে ব্যর্থ হয়েছে।');
    }
  };

  const handleCancelEdit = () => {
    setEditingDuty(null);
    setEditingDuties([]);
    setErrorMessage('');
    
    setAssignmentForm({
      selectedEmployeeIds: [],
      type: 'LATE_SITTING',
      date: new Date().toISOString().split('T')[0],
      description: ''
    });
    setOpt1Assignments({});
    setOpt1ViewedMonths({});
    setFormCellFilter('all');
    setFormSearchQuery('');
  };

  const handleCancelRosterEdit = () => {
    setIsEditingArchive(false);
    if (setUserCustomOrderRef) {
      setUserCustomOrderRef(null);
    }
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from') || '/documents';
    const redirectUrl = from.includes('?') ? `${from}&msg=cancel` : `${from}?msg=cancel`;
    window.location.assign(redirectUrl);
  };

  const handleStartEdit = async (dutiesList: Duty[]) => {
    if (!dutiesList || dutiesList.length === 0) return;
    const representative = dutiesList[0];
    setEditingDuty(representative);
    
    try {
      const res = await fetch(`/api/duties?employeeId=${representative.employeeId}&type=${representative.type}`);
      const fetchedDuties = await res.json();
      const pendingDutiesOfEmp = Array.isArray(fetchedDuties)
        ? fetchedDuties.filter((d: Duty) => !d.orderRef)
        : [];
      
      const dutiesToUse = pendingDutiesOfEmp.length > 0 ? pendingDutiesOfEmp : dutiesList;
      setEditingDuties(dutiesToUse);
      
      setAssignmentForm(prev => ({
        ...prev,
        type: representative.type,
        date: representative.date,
        selectedEmployeeIds: [representative.employeeId],
        description: representative.description || ''
      }));

      setEntryMode('EMPLOYEE_WISE');
      setOpt1CellId(representative.employee.cellId.toString());
      const allDates = dutiesToUse.map(d => d.date);
      setOpt1Assignments({
        [representative.employeeId]: allDates
      });
      const ym = representative.date.substring(0, 7);
      setOpt1ViewedMonths({
        [representative.employeeId]: ym
      });
    } catch (err) {
      logger.error('Error loading edit duties:', err);
      setEditingDuties(dutiesList);
      
      setAssignmentForm(prev => ({
        ...prev,
        type: representative.type,
        date: representative.date,
        selectedEmployeeIds: [representative.employeeId],
        description: representative.description || ''
      }));

      setEntryMode('EMPLOYEE_WISE');
      setOpt1CellId(representative.employee.cellId.toString());
      const allDates = dutiesList.map(d => d.date);
      setOpt1Assignments({
        [representative.employeeId]: allDates
      });
      const ym = representative.date.substring(0, 7);
      setOpt1ViewedMonths({
        [representative.employeeId]: ym
      });
    }

    setFormCellFilter(representative.employee.cellId.toString());
    setFormSearchQuery('');
    setErrorMessage('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAssignmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    
    if (editingDuty) {
      let assignments: {
        employeeId: number;
        type: 'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT';
        date: string;
        description: string;
      }[] = [];

      if (entryMode === 'EMPLOYEE_WISE') {
        const activeEmployeeIds = Object.keys(opt1Assignments).map(Number);
        for (const empId of activeEmployeeIds) {
          const empDates = opt1Assignments[empId] || [];
          if (empDates.length > 0) {
            const emp = employees.find(e => e.id === empId);
            const cellName = emp?.cell?.name || '';
            empDates.forEach(dateStr => {
              assignments.push({
                employeeId: empId,
                type: assignmentForm.type as 'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT',
                date: dateStr,
                description: assignmentForm.description.trim() || getDefaultDescription(emp?.name, assignmentForm.type as 'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT', cellName)
              });
            });
          }
        }
      } else {
        const employeeId = assignmentForm.selectedEmployeeIds[0];
        const emp = employees.find(e => e.id === employeeId);
        const cellName = emp?.cell?.name || '';
        assignments = [{
          employeeId,
          type: assignmentForm.type as 'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT',
          date: assignmentForm.date,
          description: assignmentForm.description.trim() || getDefaultDescription(emp?.name, assignmentForm.type as 'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT', cellName)
        }];
      }

      const preservedOrderRef = editingDuties.find(d => d.orderRef)?.orderRef || null;

      for (const assign of assignments) {
        const emp = employees.find(e => e.id === assign.employeeId);
        if (emp && emp.bankId) {
          const conflict = leaves.find(l => 
            l.bankId === emp.bankId && 
            l.startDate <= assign.date && 
            l.endDate >= assign.date
          );
          if (conflict) {
            const leaveTypeBn = conflict.leaveType === 'CASUAL' ? 'নৈমিত্তিক ছুটি' : 
                                conflict.leaveType === 'POST_FACTO' ? 'ঘটনাত্তোর নৈমিত্তিক' : 
                                'কর্মস্থল ত্যাগসহ নৈমিত্তিক';
            const formattedDate = assign.date.split('-').reverse().join('-');
            setErrorMessage(`দুঃখিত, ${emp.name} কর্মকর্তাটি ${toBanglaDigits(formattedDate)} তারিখে ছুটিতে (${leaveTypeBn}) আছেন। ওই তারিখে তার জন্য ডিউটি বরাদ্দ করা সম্ভব নয়।`);
            return;
          }
        }
      }

      try {
        setSubmitting(true);

        const res = await fetch('/api/duties', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            assignments,
            dutiesToDelete: editingDuties.map(d => d.id),
            orderRef: preservedOrderRef || undefined
          })
        });

        if (!res.ok) {
          const err = await res.json();
          let msg = 'ডিউটি আপডেট করতে ব্যর্থ হয়েছে।';
          if (res.status === 409) {
            msg = err.message || 'ডিউটি সংঘর্ষ বা ছুটি ওভারল্যাপ হয়েছে।';
            showToast(msg, 'error');
          } else if (err.error === 'late_sitting_on_holiday') {
            msg = 'ছুটির দিনে লেট সিটিং ডিউটি দেওয়া সম্ভব নয়।';
          } else if (err.error === 'holiday_duty_on_working_day') {
            msg = 'কার্যদিবসে সরকারি ছুটির ডিউটি দেওয়া সম্ভব নয়।';
          } else if (err.error === 'late_sitting_night_shift_conflict') {
            msg = 'একই কার্যদিবসে লেট সিটিং ও নাইট শিফট ডিউটি একসাথে বরাদ্দ করা সম্ভব নয়।';
          } else if (err.error === 'duplicate_duty_on_date') {
            msg = err.message || 'এই তারিখের মধ্যে কোনো কোনো কর্মকর্তার জন্য ইতিমধ্যে অন্য ডিউটি বা লেট সিটিং বরাদ্দ আছে। ডুপ্লিকেট এন্ট্রি করা সম্ভব নয়।';
          } else if (err.error === 'leave_conflict') {
            msg = 'উক্ত কর্মকর্তা ওই তারিখে ছুটিতে আছেন। ছুটিতে থাকাকালীন ডিউটি বরাদ্দ করা সম্ভব নয়।';
          } else if (err.error === 'duty_not_found') {
            msg = 'ডিউটি রেকর্ডটি খুঁজে পাওয়া যায়নি।';
          }
          setErrorMessage(msg);
          setSubmitting(false);
          return;
        }

        const submittedMonths = Array.from(new Set(assignments.map(a => a.date.substring(0, 7))));
        setSelectedMonths(prev => {
          const next = [...prev];
          submittedMonths.forEach(m => {
            if (!next.includes(m)) {
              next.push(m);
            }
          });
          return next;
        });

        handleCancelEdit();
        loadDuties();
        alert('ডিউটি সফলভাবে আপডেট করা হয়েছে!');
      } catch (err) {
        logger.error('Error updating duty:', err);
        setErrorMessage('সার্ভার কানেকশন ব্যর্থ হয়েছে।');
      } finally {
        setSubmitting(false);
      }
      return;
    }
    
    let assignments: {
      employeeId: number;
      type: 'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT';
      date: string;
      description: string;
    }[] = [];

    if (isEditingArchive) {
      if (duties.length === 0) {
        setErrorMessage('ডিউটি বরাদ্দ করার জন্য অন্তত একটি তারিখ ও কর্মকর্তা নির্বাচন করুন।');
        return;
      }
      assignments = duties.map(d => ({
        employeeId: d.employeeId,
        type: printCategory,
        date: d.date,
        description: d.description || getDefaultDescription(d.employee?.name, printCategory, d.employee?.cell?.name)
      }));
    } else {
      if (entryMode === 'EMPLOYEE_WISE') {
        const activeEmployeeIds = Object.keys(opt1Assignments).map(Number);
        if (activeEmployeeIds.length === 0) {
          setErrorMessage('ডিউটি বরাদ্দ করার জন্য অন্তত একজন কর্মকর্তা নির্বাচন করুন।');
          return;
        }

        let hasDates = false;
        for (const empId of activeEmployeeIds) {
          if (opt1Assignments[empId] && opt1Assignments[empId].length > 0) {
            hasDates = true;
            const emp = employees.find(e => e.id === empId);
            const cellName = emp?.cell?.name || '';
            opt1Assignments[empId].forEach(dateStr => {
              assignments.push({
                employeeId: empId,
                type: assignmentForm.type as 'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT',
                date: dateStr,
                description: getDefaultDescription(emp?.name, assignmentForm.type as 'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT', cellName)
              });
            });
          }
        }

        if (!hasDates) {
          setErrorMessage('নির্বাচিত কর্মকর্তাদের জন্য অন্তত একটি তারিখ নির্বাচন করুন।');
          return;
        }
      } else {
        if (assignmentForm.selectedEmployeeIds.length === 0) {
          setErrorMessage('ডিউটি বরাদ্দ করার জন্য অন্তত একজন কর্মকর্তা নির্বাচন করুন।');
          return;
        }
        
        if (!assignmentForm.date) {
          setErrorMessage('ডিউটির তারিখ নির্বাচন করুন।');
          return;
        }

        assignments = assignmentForm.selectedEmployeeIds.map(empId => {
          const emp = employees.find(e => e.id === empId);
          const cellName = emp?.cell?.name || '';
          return {
            employeeId: empId,
            type: assignmentForm.type as 'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT',
            date: assignmentForm.date,
            description: getDefaultDescription(emp?.name, assignmentForm.type as 'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT', cellName)
          };
        });
      }
    }

    for (const assign of assignments) {
      const emp = employees.find(e => e.id === assign.employeeId);
      if (emp && emp.bankId) {
        const conflict = leaves.find(l => 
          l.bankId === emp.bankId && 
          l.startDate <= assign.date && 
          l.endDate >= assign.date
        );
        if (conflict) {
          const leaveTypeBn = conflict.leaveType === 'CASUAL' ? 'নৈমিত্তিক ছুটি' : 
                              conflict.leaveType === 'POST_FACTO' ? 'ঘটনাত্তোর নৈমিত্তিক' : 
                              'কর্মস্থল ত্যাগসহ নৈমিত্তিক';
          const formattedDate = assign.date.split('-').reverse().join('-');
          setErrorMessage(`দুঃখিত, ${emp.name} কর্মকর্তাটি ${toBanglaDigits(formattedDate)} তারিখে ছুটিতে (${leaveTypeBn}) আছেন। ওই তারিখে তার জন্য ডিউটি বরাদ্দ করা সম্ভব নয়।`);
          return;
        }
      }
    }

    try {
      setSubmitting(true);

      const res = await fetch('/api/duties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          assignments,
          orderRef: isEditingArchive ? orderRef : undefined,
          originalOrderRef: isEditingArchive ? originalOrderRef : undefined
        })
      });

      if (!res.ok) {
        const err = await res.json();
        if (res.status === 409) {
          setConflictModalData({
            message: err.message || 'এই তারিখের মধ্যে কোনো কোনো কর্মকর্তার জন্য ইতিমধ্যে অন্য ডিউটি বা লেট সিটিং বরাদ্দ আছে।',
            details: err.details,
            assignments
          });
          setSubmitting(false);
          return;
        } else if (err.error === 'late_sitting_on_holiday') {
          setErrorMessage('ছুটির দিনে লেট সিটিং ডিউটি দেওয়া সম্ভব নয়।');
        } else if (err.error === 'holiday_duty_on_working_day') {
          setErrorMessage('কার্যদিবসে সরকারি ছুটির ডিউটি দেওয়া সম্ভব নয়।');
        } else if (err.error === 'late_sitting_night_shift_conflict') {
          setErrorMessage('একই কার্যদিবসে লেট সিটিং ও নাইট শিফট ডিউটি একসাথে বরাদ্দ করা সম্ভব নয়।');
        } else if (err.error === 'leave_conflict') {
          setErrorMessage('সংশ্লিষ্ট কর্মকর্তা উক্ত তারিখে ছুটিতে আছেন। ছুটিতে থাকা অবস্থায় ডিউটি বরাদ্দ করা সম্ভব নয়।');
        } else {
          setErrorMessage(err.error || 'রোস্টার সংরক্ষণ করতে ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।');
        }
        setSubmitting(false);
        return;
      }

      if (isEditingArchive) {
        const emp = employees.find(e => e.id.toString() === payeeEmployeeId);
        const payeeName = emp ? emp.name : 'Unknown';
        
        const matchedCellObj = cells.find(c => c.id.toString() === selectedCell);
        const cellName = matchedCellObj ? matchedCellObj.name : 'IT Department';
        
        const printTableDuties = getGroupedDuties();
        const payload = {
          orderRef: orderRef,
          originalOrderRef: isEditingArchive ? originalOrderRef : undefined,
          orderDate: orderDate,
          category: printCategory,
          employeeName: payeeName,
          cellName: cellName,
          duties: printTableDuties.map(group => ({
            employeeId: group.employee.id,
            employeeName: group.employee.name,
            designation: group.employee.designation,
            dates: group.dates,
            description: group.description
          })),
          dutyIds: [],
          content: {
            orderText: orderText,
            signingOfficer: signingOfficer,
            signingDesignation: signingDesignation,
            copies: copies,
            cellName: cellName
          }
        };

        const ooRes = await fetch('/api/office-orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (ooRes.ok) {
          const pdfPayload = {
            orderRef: orderRef,
            orderDate: orderDate,
            orderText: orderText,
            duties: printTableDuties.map(group => ({
              employee: {
                name: group.employee.name,
                designation: getShortDesignation(group.employee.designation),
                bankId: group.employee.bankId || ''
              },
              datesFormatted: getFormattedDateList(group.dates),
              description: group.description
            })),
            signingOfficer: signingOfficer,
            signingDesignation: signingDesignation,
            copies: copies,
            headerMode: headerMode
          };

          await fetch('/api/documents/generate-office-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pdfPayload)
          });
        }

        await updateAssociatedBill(orderRef, originalOrderRef);

        setIsEditingArchive(false);
        const params = new URLSearchParams(window.location.search);
        const from = params.get('from') || '/documents';
        const redirectUrl = from.includes('?') ? `${from}&msg=success` : `${from}?msg=success`;
        window.location.href = redirectUrl;
        return;
      }

      const submittedMonths = Array.from(new Set(assignments.map(a => a.date.substring(0, 7))));
      setSelectedMonths(prev => {
        const next = [...prev];
        submittedMonths.forEach(m => {
          if (!next.includes(m)) {
            next.push(m);
          }
        });
        return next;
      });

      if (entryMode === 'EMPLOYEE_WISE') {
        setOpt1Assignments({});
        setOpt1ViewedMonths({});
      } else {
        setAssignmentForm(prev => ({
          ...prev,
          selectedEmployeeIds: [],
          description: ''
        }));
      }
      
      loadDuties();
      alert('ডিউটি রোস্টার সফলভাবে সংরক্ষণ করা হয়েছে!');
    } catch (err) {
      logger.error('Error assigning roster:', err);
      const errorMsg = err instanceof Error ? err.message : String(err);
      if (errorMsg === 'duplicate_duty_on_date') {
        setErrorMessage('এই তারিখের মধ্যে কোনো কোনো কর্মকর্তার জন্য ইতিমধ্যে অন্য ডিউটি বা লেট সিটিং বরাদ্দ আছে। ডুপ্লিকেট এন্ট্রি করা সম্ভব নয়।');
        alert('এই তারিখের মধ্যে কোনো কোনো কর্মকর্তার জন্য ইতিমধ্যে অন্য ডিউটি বা লেট সিটিং বরাদ্দ আছে। ডুপ্লিকেট এন্ট্রি করা সম্ভব নয়।');
      } else if (errorMsg === 'late_sitting_on_holiday') {
        setErrorMessage('ছুটির দিনে লেট সিটিং ডিউটি দেওয়া সম্ভব নয়।');
      } else if (errorMsg === 'holiday_duty_on_working_day') {
        setErrorMessage('কার্যদিবসে সরকারি ছুটির ডিউটি দেওয়া সম্ভব নয়।');
      } else if (errorMsg === 'leave_conflict') {
        setErrorMessage('সংশ্লিষ্ট কর্মকর্তা উক্ত তারিখে ছুটিতে আছেন। ছুটিতে থাকা অবস্থায় ডিউটি বরাদ্দ করা সম্ভব নয়।');
      } else {
        setErrorMessage('রোস্টার সংরক্ষণ করতে ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const isSubmitDisabled = () => {
    if (!assignmentForm.type) return true;
    if (editingDuty) {
      if (entryMode === 'EMPLOYEE_WISE') {
        const activeEmployeeIds = Object.keys(opt1Assignments).map(Number);
        if (activeEmployeeIds.length === 0) return true;
        
        let hasDates = false;
        const isLateSitting = assignmentForm.type === 'LATE_SITTING';
        const isHoliday = assignmentForm.type === 'HOLIDAY';
        for (const empId of activeEmployeeIds) {
          const empDates = opt1Assignments[empId] || [];
          if (empDates.length > 0) {
            hasDates = true;
            for (const date of empDates) {
              const isWorking = checkIsWorkingDay(date, holidays);
              if ((isLateSitting && !isWorking) || (isHoliday && isWorking)) {
                return true;
              }
            }
          }
        }
        return !hasDates;
      } else {
        if (!assignmentForm.date) return true;
        if (assignmentForm.selectedEmployeeIds.length === 0) return true;
        
        const isWorking = checkIsWorkingDay(assignmentForm.date, holidays);
        const isLateSitting = assignmentForm.type === 'LATE_SITTING';
        const isHoliday = assignmentForm.type === 'HOLIDAY';
        if ((isLateSitting && !isWorking) || (isHoliday && isWorking)) {
          return true;
        }
      }
      return false;
    }

    if (entryMode === 'EMPLOYEE_WISE') {
      const activeEmployeeIds = Object.keys(opt1Assignments).map(Number);
      if (activeEmployeeIds.length === 0) return true;
      let hasDates = false;
      for (const empId of activeEmployeeIds) {
        if (opt1Assignments[empId] && opt1Assignments[empId].length > 0) {
          hasDates = true;
          break;
        }
      }
      return !hasDates;
    } else {
      if (!assignmentForm.date) return true;
      const isWorking = checkIsWorkingDay(assignmentForm.date, holidays);
      const isLateSitting = assignmentForm.type === 'LATE_SITTING';
      const isHoliday = assignmentForm.type === 'HOLIDAY';
      if ((isLateSitting && !isWorking) || (isHoliday && isWorking)) {
        return true;
      }
      if (assignmentForm.selectedEmployeeIds.length === 0) {
        return true;
      }
      return false;
    }
  };

  return {
    entryMode,
    setEntryMode,
    assignmentForm,
    setAssignmentForm,
    opt1Assignments,
    setOpt1Assignments,
    opt1ViewedMonths,
    setOpt1ViewedMonths,
    editingDuty,
    setEditingDuty,
    editingDuties,
    setEditingDuties,
    submitting,
    setSubmitting,
    errorMessage,
    setErrorMessage,
    preConflicts,
    setPreConflicts,
    conflictModalData,
    setConflictModalData,
    selectedDutyIds,
    setSelectedDutyIds,
    isBulkDeleteConfirmOpen,
    setIsBulkDeleteConfirmOpen,
    handleAssignmentSubmit,
    handleBulkDutyImport,
    handleStartEdit,
    handleCancelEdit,
    handleCancelRosterEdit,
    deleteGroupedDuties,
    handleBulkDeleteDuties,
    executeBulkDeleteDuties,
    handleOverwriteAndSave,
    handleRedirectToConflictingDuties,
    isSubmitDisabled
  };
}
