export type ConflictType =
  | "DUTY_DUPLICATE"
  | "LEAVE_OVERLAP"
  | "CELL_FORBIDDEN"
  | "BUDGET_EXCEEDED";

interface ConflictContext {
  type: ConflictType;
  employeeName?: string;
  dates?: string[];
  cellName?: string;
  existingLeaveStart?: string;
  existingLeaveEnd?: string;
  currentAmount?: number;
  limitAmount?: number;
}

export async function explainConflictInBengali(
  context: ConflictContext
): Promise<string> {
  const datesStr = context.dates && context.dates.length > 0 ? context.dates.join(', ') : 'নির্বাচিত তারিখে';

  switch (context.type) {
    case 'DUTY_DUPLICATE':
      return `${context.employeeName || 'এই কর্মকর্তার'} জন্য ${datesStr} ইতোমধ্যে ডিউটি নির্ধারিত আছে। একই দিনে একাধিক ডিউটি দেওয়া সম্ভব নয়।`;
    case 'LEAVE_OVERLAP':
      return `${context.employeeName || 'এই কর্মকর্তা'} ${context.existingLeaveStart ? `${context.existingLeaveStart} থেকে ${context.existingLeaveEnd || ''}` : datesStr} মেয়াদে অনুমোদিত ছুটিতে আছেন। ছুটি চলাকালীন ডিউটি দেওয়া সম্ভব নয়।`;
    case 'CELL_FORBIDDEN':
      return `আপনার অ্যাকাউন্টে ${context.cellName || 'এই সেলের'} রেকর্ড পরিবর্তন বা অনুমোদন করার অনুমতি নেই।`;
    case 'BUDGET_EXCEEDED':
      return `মোট বিলের পরিমাণ (৳${context.currentAmount || 0}) অনুমোদিত বাজেট সীমা (৳${context.limitAmount || 0}) অতিক্রম করেছে। বিলটি স্বয়ংক্রিয়ভাবে একাধিক অফিস অর্ডারে বিভক্ত হবে।`;
    default:
      return 'ডিউটি বা ছুটির তথ্যে অসঙ্গতি পাওয়া গেছে। অনুগ্রহ করে তথ্য যাচাই করুন।';
  }
}

