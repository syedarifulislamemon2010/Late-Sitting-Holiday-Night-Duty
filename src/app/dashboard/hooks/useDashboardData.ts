import { useState, useEffect } from 'react';
import logger from '@/lib/logger';
import { DEFAULT_2026_HOLIDAYS } from '@/constants/holidays';
import { useToast } from '@/context/ToastContext';
import { Holiday, MONTH_NAMES, DAYS_IN_MONTH, MONTH_START_DAYS, CalendarSlot } from '../types';

export function useDashboardData() {
  const { showToast } = useToast();
  
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [employee, setEmployee] = useState<any>(null);
  const [isEmployee, setIsEmployee] = useState(false);
  const [myDuties, setMyDuties] = useState<any[]>([]);

  const [showHolidayReminder, setShowHolidayReminder] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
      if (user.role === 'ADMIN') setIsAdmin(true);
    } catch {}
  }, []);

  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [formDutyType, setFormDutyType] = useState('LATE_SITTING');
  const [savingDuties, setSavingDuties] = useState(false);
  const [entryError, setEntryError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number>(() => {
    const today = new Date();
    return today.getFullYear() === 2026 ? today.getMonth() : 0;
  });

  const [activeChart, setActiveChart] = useState<'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT' | null>(null);
  const [cellWiseData, setCellWiseData] = useState<{ name: string; count: number }[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<{ name: string; count: number }[]>([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [recentModules, setRecentModules] = useState<{ title: string; url: string }[]>([]);

  const loadRecentModules = () => {
    const stored = localStorage.getItem('recentModules');
    if (stored) {
      try {
        setRecentModules(JSON.parse(stored));
      } catch {
        setRecentModules([]);
      }
    } else {
      setRecentModules([]);
    }
  };

  useEffect(() => {
    loadRecentModules();
    window.addEventListener('storage', loadRecentModules);
    return () => window.removeEventListener('storage', loadRecentModules);
  }, []);

  useEffect(() => {
    if (!activeChart) return;

    async function fetchChartData() {
      setChartLoading(true);
      try {
        const res = await fetch(`/api/duties?type=${activeChart}`);
        if (res.ok) {
          const list = await res.json();
          
          const cellsMap: Record<string, number> = {};
          const monthlyCounts = Array(12).fill(0);

          list.forEach((duty: { employee?: { cell?: { name?: string } }; date?: string }) => {
            const cellName = duty.employee?.cell?.name || 'অন্যান্য';
            cellsMap[cellName] = (cellsMap[cellName] || 0) + 1;

            if (duty.date) {
              const monthIndex = new Date(duty.date).getMonth();
              if (monthIndex >= 0 && monthIndex < 12) {
                monthlyCounts[monthIndex]++;
              }
            }
          });

          const cellData = Object.keys(cellsMap).map(name => ({
            name,
            count: cellsMap[name]
          })).sort((a, b) => b.count - a.count);

          const trendData = MONTH_NAMES.map((name, idx) => ({
            name: name.substring(0, 3),
            count: monthlyCounts[idx]
          }));

          setCellWiseData(cellData);
          setMonthlyTrend(trendData);
        }
      } catch (err) {
        logger.error('Analytics aggregation error:', err);
      } finally {
        setChartLoading(false);
      }
    }

    fetchChartData();
  }, [activeChart]);

  useEffect(() => {
    async function loadStats() {
      try {
        const holidayRes = await fetch('/api/holidays');
        const holidaysData = await holidayRes.json();
        setHolidays(Array.isArray(holidaysData) ? holidaysData : []);

        const portalRes = await fetch('/api/my-portal');
        if (portalRes.ok) {
          const portalData = await portalRes.json();
          if (portalData.employee) {
            setEmployee(portalData.employee);
            setIsEmployee(true);
          }
          if (Array.isArray(portalData.duties)) {
            setMyDuties(portalData.duties);
          }
        }
      } catch (err) {
        logger.error('Error fetching dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  // Combine default 2026 holidays with any user-configured database holidays
  let allHolidays = [...DEFAULT_2026_HOLIDAYS];
  holidays.forEach((h: Holiday) => {
    if (h.isWorkingDay) {
      allHolidays = allHolidays.filter(dh => dh.date !== h.date);
    } else {
      if (h.date.startsWith('2026') && !allHolidays.some(dh => dh.date === h.date)) {
        allHolidays.push({ date: h.date, name: h.name });
      }
    }
  });
  allHolidays.sort((a, b) => a.date.localeCompare(b.date));

  // Determine upcoming holidays relative to today's date
  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingHolidaysList = allHolidays.filter(h => h.date >= todayStr).slice(0, 12);
  const finalUpcomingHolidays = upcomingHolidaysList.length > 0 ? upcomingHolidaysList : allHolidays.slice(0, 12);

  // Calculate calendar elements for the selected month of 2026
  const daysInMonth = DAYS_IN_MONTH[selectedMonth];
  const startDay = MONTH_START_DAYS[selectedMonth];
  
  const slots: CalendarSlot[] = [];
  
  // Empty padding cells before the 1st of the month
  for (let i = 0; i < startDay; i++) {
    slots.push({ day: null, dateStr: null, isHoliday: false, holidayName: null, isWeekend: false });
  }
  
  // Fill in active calendar slots
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `2026-${(selectedMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    
    // Check if weekend (Friday=5, Saturday=6 in Bangladesh)
    const d = new Date(2026, selectedMonth, day);
    const dayOfWeek = d.getDay();
    
    // Default weekends in Bangladesh (Friday and Saturday)
    let isWeekend = dayOfWeek === 5 || dayOfWeek === 6;
    
    // Override May 23rd (Saturday) to be a working day (not weekend)
    if (dateStr === '2026-05-23') {
      isWeekend = false;
    }
    
    // Override weekend if marked as working day in the database
    const dbHol = holidays.find(h => h.date === dateStr);
    if (dbHol && dbHol.isWorkingDay) {
      isWeekend = false;
    }
    
    const hol = allHolidays.find(h => h.date === dateStr);
    const isHoliday = !!hol;
    const holidayName = hol ? hol.name : null;
    
    slots.push({ day, dateStr, isHoliday, holidayName, isWeekend });
  }

  const checkIsHolidayOrWeekend = (dateStr: string): boolean => {
    const foundSlot = slots.find(s => s.dateStr === dateStr);
    if (foundSlot) {
      return foundSlot.isHoliday || foundSlot.isWeekend;
    }
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const dayOfWeek = dateObj.getDay();
    let isWeekend = dayOfWeek === 5 || dayOfWeek === 6;
    if (dateStr === '2026-05-23') {
      isWeekend = false;
    }
    const dbHol = holidays.find(h => h.date === dateStr);
    if (dbHol && dbHol.isWorkingDay) {
      isWeekend = false;
    }
    const hol = allHolidays.some(h => h.date === dateStr);
    return isWeekend || hol;
  };

  useEffect(() => {
    if (selectedDates.length > 0) {
      const isLateSittingDisabled = selectedDates.some(date => checkIsHolidayOrWeekend(date));
      const isHolidayDisabled = selectedDates.some(date => !checkIsHolidayOrWeekend(date));
      
      setFormDutyType(prev => {
        if (prev === 'LATE_SITTING' && isLateSittingDisabled) {
          return isHolidayDisabled ? 'NIGHT_SHIFT' : 'HOLIDAY';
        }
        if (prev === 'HOLIDAY' && isHolidayDisabled) {
          return isLateSittingDisabled ? 'NIGHT_SHIFT' : 'LATE_SITTING';
        }
        return prev;
      });
    }
  }, [selectedDates]);

  const handleDateClick = (dateStr: string) => {
    if (!isEmployee) {
      showToast('দুঃখিত, এই সুবিধাটি শুধুমাত্র কর্মকর্তা অ্যাকাউন্টের জন্য প্রযোজ্য। আপনার অ্যাকাউন্টের সাথে কোনো কর্মকর্তা রেকর্ড যুক্ত নেই।', 'error');
      return;
    }
    setSelectedDates(prev => {
      if (prev.includes(dateStr)) {
        return [];
      } else {
        return [dateStr];
      }
    });
  };

  const handleSaveDutyForDate = async (dateStr: string, selectedOption: string) => {
    if (!employee) return;
    setSavingDuties(true);
    setEntryError(null);
    try {
      const existing = myDuties.filter(d => d.date === dateStr);
      const dutiesToDelete = existing.map(d => d.id);

      if (selectedOption === 'DELETE') {
        // Delete all existing duties on this date
        for (const dId of dutiesToDelete) {
          const res = await fetch(`/api/duties/${dId}`, { method: 'DELETE' });
          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.message || 'ডিউটি মুছতে ব্যর্থ হয়েছে।');
          }
        }
        showToast('ডিউটি সফলভাবে মুছে ফেলা হয়েছে!', 'success');
      } else {
        // Prepare assignments based on option
        let assignments: Array<{ employeeId: number; date: string; type: string }> = [];
        if (selectedOption === 'LATE_SITTING') {
          assignments = [{ employeeId: employee.id, date: dateStr, type: 'LATE_SITTING' }];
        } else if (selectedOption === 'NIGHT_SHIFT') {
          assignments = [{ employeeId: employee.id, date: dateStr, type: 'NIGHT_SHIFT' }];
        } else if (selectedOption === 'HOLIDAY') {
          assignments = [{ employeeId: employee.id, date: dateStr, type: 'HOLIDAY' }];
        } else if (selectedOption === 'BOTH') {
          assignments = [
            { employeeId: employee.id, date: dateStr, type: 'HOLIDAY' },
            { employeeId: employee.id, date: dateStr, type: 'NIGHT_SHIFT' }
          ];
        }

        const res = await fetch('/api/duties', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            assignments,
            dutiesToDelete: dutiesToDelete.length > 0 ? dutiesToDelete : undefined
          })
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || 'ডিউটি এন্ট্রি করা সম্ভব হয়নি।');
        }
        showToast('ডিউটি সফলভাবে সংরক্ষণ করা হয়েছে!', 'success');
      }

      setSelectedDates([]); // Close modal
      setEntryError(null);
      
      // Refresh local states
      const portalRes = await fetch('/api/my-portal');
      if (portalRes.ok) {
        const portalData = await portalRes.json();
        if (Array.isArray(portalData.duties)) {
          setMyDuties(portalData.duties);
        }
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'ডিউটি সংরক্ষণে সমস্যা হয়েছে';
      setEntryError(errorMsg);
      showToast(errorMsg, 'error');
      throw err;
    } finally {
      setSavingDuties(false);
    }
  };

  // Filter holidays of the active month
  const selectedMonthHolidays = allHolidays.filter(h => {
    const parts = h.date.split('-');
    return parts[0] === '2026' && parseInt(parts[1], 10) === (selectedMonth + 1);
  });

  return {
    holidays,
    loading,
    employee,
    isEmployee,
    myDuties,
    showHolidayReminder,
    setShowHolidayReminder,
    isAdmin,
    selectedDates,
    setSelectedDates,
    formDutyType,
    setFormDutyType,
    savingDuties,
    entryError,
    selectedMonth,
    setSelectedMonth,
    activeChart,
    setActiveChart,
    cellWiseData,
    monthlyTrend,
    chartLoading,
    recentModules,
    allHolidays,
    finalUpcomingHolidays,
    slots,
    todayStr,
    checkIsHolidayOrWeekend,
    handleDateClick,
    handleSaveDutyForDate,
    selectedMonthHolidays
  };
}
