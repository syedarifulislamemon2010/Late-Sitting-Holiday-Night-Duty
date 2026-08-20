import { Printer, Edit2, Trash2, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';

interface Leave {
  id: number;
  leaveType: 'CASUAL' | 'POST_FACTO' | 'STATION_LEAVE';
  applicationDate: string;
  startDate: string;
  endDate: string;
  applicantName: string;
  designation: string;
  bankId: string;
  cellName: string;
  leaveLocation: string;
  mobileNo: string;
}

interface LeaveHistoryTableProps {
  archivedLeaves: Leave[];
  toBanglaDigits: (num: number | string) => string;
  toDisplayDateStr: (dateStr: string) => string;
  handleLoadLeavePreview: (leave: any) => void;
  handleEditLeave: (leave: any) => void;
  handleDeleteLeave: (id: number) => void;
}

export default function LeaveHistoryTable({
  archivedLeaves,
  toBanglaDigits,
  toDisplayDateStr,
  handleLoadLeavePreview,
  handleEditLeave,
  handleDeleteLeave
}: LeaveHistoryTableProps) {
  return (
    <Card
      title="বিগত আবেদনসমূহ"
      actions={
        <span className="text-[10px] bg-slate-100 dark:bg-slate-900 text-slate-650 dark:text-slate-400 px-2 py-0.5 rounded-full font-bold">
          মোট: {toBanglaDigits(archivedLeaves.length)} টি
        </span>
      }
    >
      {archivedLeaves.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="কোনো ছুটির আবেদন নেই"
          description="আর্কাইভে বর্তমানে কোনো সংরক্ষিত ছুটির আবেদন পাওয়া যায়নি।"
          className="py-6"
        />
      ) : (
        <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
          {archivedLeaves.map((leave) => (
            <div key={leave.id} className="p-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 hover:border-indigo-300 dark:hover:border-indigo-900 transition-all">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-extrabold text-slate-905 dark:text-slate-100 text-xs">
                    {leave.leaveType === 'CASUAL' ? 'নৈমিত্তিক ছুটি' : leave.leaveType === 'POST_FACTO' ? 'ঘটনাত্তোর নৈমিত্তিক' : 'কর্মস্থল ত্যাগসহ নৈমিত্তিক'}
                  </p>
                  <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                    আবেদনের তারিখ: {toDisplayDateStr(leave.applicationDate)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleLoadLeavePreview(leave)}
                    title="প্রিভিউ ও প্রিন্ট"
                    className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg transition-all hover:scale-110 active:scale-95 cursor-pointer"
                  >
                    <Printer size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEditLeave(leave)}
                    title="এডিট"
                    className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-indigo-600 dark:text-indigo-400 rounded-lg transition-all hover:scale-110 active:scale-95 cursor-pointer"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteLeave(leave.id)}
                    title="ডিলিট"
                    className="p-1.5 hover:bg-rose-100 hover:text-rose-600 text-slate-400 dark:text-slate-500 rounded-lg transition-all hover:scale-110 active:scale-95 cursor-pointer"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              <div className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold bg-white dark:bg-slate-950 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                সময়কাল: <span className="font-bold text-slate-800 dark:text-slate-205">{toDisplayDateStr(leave.startDate)} হতে {toDisplayDateStr(leave.endDate)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
