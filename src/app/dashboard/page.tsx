'use client';

import { useLanguage } from '@/context/LanguageContext';
import { DashboardSkeleton } from '@/components/ui/Skeleton';
import { toBanglaDigits } from '@/lib/bengali-converter';

import { useDashboardData } from './hooks/useDashboardData';
import { MONTH_NAMES } from './types';
import MyDutySummaryCard from './components/MyDutySummaryCard';
import { DashboardHeader } from './components/DashboardHeader';
import { HolidayReminderBanner } from './components/HolidayReminderBanner';
import { QuickAccessSection } from './components/QuickAccessSection';
import { CalendarGridCard } from './components/CalendarGridCard';
import { UpcomingHolidaysCard } from './components/UpcomingHolidaysCard';
import { RatesGuidelineCard } from './components/RatesGuidelineCard';
import { AnalyticsDrillDownPanel } from './components/AnalyticsDrillDownPanel';
import { DutySelectionModal } from './components/DutySelectionModal';

export default function DashboardPage() {
  const { lang, formatNumber, formatMonthYear, getWeekdays } = useLanguage();
  const isEn = lang === 'en';

  const {
    holidays,
    loading,
    myDuties,
    showHolidayReminder,
    setShowHolidayReminder,
    isAdmin,
    selectedDates,
    setSelectedDates,
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
    finalUpcomingHolidays,
    slots,
    todayStr,
    checkIsHolidayOrWeekend,
    handleDateClick,
    handleSaveDutyForDate,
    selectedMonthHolidays
  } = useDashboardData();

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Title & Header Section */}
      <DashboardHeader recentModules={recentModules} />

      {/* Holiday Reminder Banner for Admins */}
      <HolidayReminderBanner
        isAdmin={isAdmin}
        holidays={holidays}
        showHolidayReminder={showHolidayReminder}
        setShowHolidayReminder={setShowHolidayReminder}
      />

      {/* Personal Summary Card Widget */}
      <MyDutySummaryCard />

      {/* Styled Quick Access Section */}
      <QuickAccessSection />

      {/* Main Interactive Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-stretch">
        {/* Left Section (Interactive Calendar & Month Picker) - Spans 2 columns */}
        <div className="xl:col-span-2 flex flex-col">
          <CalendarGridCard
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            formatMonthYear={formatMonthYear}
            formatNumber={formatNumber}
            getWeekdays={getWeekdays}
            isEn={isEn}
            slots={slots}
            selectedMonthHolidays={selectedMonthHolidays}
            todayStr={todayStr}
            myDuties={myDuties}
            selectedDates={selectedDates}
            handleDateClick={handleDateClick}
          />
        </div>

        {/* Right Section (Upcoming Holidays) - Spans 1 column */}
        <div className="flex flex-col">
          <UpcomingHolidaysCard finalUpcomingHolidays={finalUpcomingHolidays} />
        </div>
      </div>

      {/* Approved Janata Bank Rates Guideline Card Block (Full Width) */}
      <RatesGuidelineCard
        activeChart={activeChart}
        setActiveChart={setActiveChart}
      />

      {/* Drill-down Analytics Panel */}
      {activeChart && (
        <AnalyticsDrillDownPanel
          activeChart={activeChart}
          onClose={() => setActiveChart(null)}
          chartLoading={chartLoading}
          cellWiseData={cellWiseData}
          monthlyTrend={monthlyTrend}
        />
      )}

      {/* Premium Duty Selection Modal */}
      {selectedDates.length === 1 && (() => {
        const dateStr = selectedDates[0];
        const isHoliday = checkIsHolidayOrWeekend(dateStr);
        const existing = myDuties.filter(d => d.date === dateStr);
        
        // Find weekday name in Bangla
        const [y, m, d] = dateStr.split('-').map(Number);
        const dateObj = new Date(y, m - 1, d);
        const bnDayName = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'][dateObj.getDay()];
        const formattedDate = `${toBanglaDigits(d)} ${MONTH_NAMES[m - 1]} (${bnDayName})`;

        // Determine currently active selection in the modal
        const hasHoliday = existing.some(d => d.type === 'HOLIDAY');
        const hasNight = existing.some(d => d.type === 'NIGHT_SHIFT');
        const hasLate = existing.some(d => d.type === 'LATE_SITTING');
        
        let initialSelectedOption = '';
        if (hasHoliday && hasNight) initialSelectedOption = 'BOTH';
        else if (hasLate) initialSelectedOption = 'LATE_SITTING';
        else if (hasHoliday) initialSelectedOption = 'HOLIDAY';
        else if (hasNight) initialSelectedOption = 'NIGHT_SHIFT';

        return (
          <DutySelectionModal 
            dateStr={dateStr}
            formattedDate={formattedDate}
            isHoliday={isHoliday}
            existing={existing}
            initialOption={initialSelectedOption}
            onClose={() => setSelectedDates([])}
            onSave={(option) => handleSaveDutyForDate(dateStr, option)}
            saving={savingDuties}
            error={entryError}
          />
        );
      })()}
    </div>
  );
}
