import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

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
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompts: Record<ConflictType, string> = {
    DUTY_DUPLICATE: `
      একটি ব্যাংকিং পোর্টালে ডিউটি অ্যাসাইনমেন্টে সংঘর্ষ হয়েছে।
      কর্মকর্তার নাম: ${context.employeeName || "উল্লেখিত কর্মকর্তা"}
      সংঘর্ষের তারিখ/তারিখগুলো: ${context.dates?.join(", ") || "নির্ধারিত তারিখ"}
      
      অনুগ্রহ করে বাংলায় একটি সংক্ষিপ্ত, বিনয়ী এবং পেশাদার বার্তা লিখুন (২ বাক্যের মধ্যে) যা ব্যাখ্যা করবে কেন এই তারিখে ডিউটি দেওয়া সম্ভব হয়নি। কারণ হলো ওই তারিখে ইতোমধ্যে ডিউটি নির্ধারিত আছে।
    `,
    LEAVE_OVERLAP: `
      একটি ব্যাংকিং পোর্টালে ডিউটি অ্যাসাইনমেন্টে ছুটির সংঘর্ষ হয়েছে।
      কর্মকর্তার নাম: ${context.employeeName || "উল্লেখিত কর্মকর্তা"}
      ছুটির সময়কাল: ${context.existingLeaveStart} থেকে ${context.existingLeaveEnd}
      প্রস্তাবিত ডিউটির তারিখ: ${context.dates?.join(", ") || "নির্ধারিত তারিখ"}
      
      অনুগ্রহ করে বাংলায় একটি সংক্ষিপ্ত, বিনয়ী এবং পেশাদার বার্তা লিখুন (২ বাক্যের মধ্যে) যা ব্যাখ্যা করবে কেন এই তারিখে ডিউটি দেওয়া সম্ভব হয়নি। কারণ হলো ওই সময়কালে কর্মকর্তা অনুমোদিত ছুটিতে আছেন।
    `,
    CELL_FORBIDDEN: `
      একটি ব্যাংকিং পোর্টালে একজন অপারেটর অন্য সেলের রেকর্ড পরিবর্তন করার চেষ্টা করেছেন।
      সেলের নাম: ${context.cellName || "অনুমোদিত সেল"}
      
      অনুগ্রহ করে বাংলায় একটি সংক্ষিপ্ত, বিনয়ী এবং পেশাদার বার্তা লিখুন (২ বাক্যের মধ্যে) যা ব্যাখ্যা করবে কেন এই কার্যক্রম অনুমোদিত নয়। কারণ হলো অপারেটরের এই সেলে প্রবেশাধিকার নেই।
    `,
    BUDGET_EXCEEDED: `
      একটি ব্যাংকিং বিলিং সিস্টেমে বাজেট সীমা অতিক্রম হয়েছে।
      বর্তমান পরিমাণ: ৳${context.currentAmount}
      সর্বোচ্চ সীমা: ৳${context.limitAmount}
      
      অনুগ্রহ করে বাংলায় একটি সংক্ষিপ্ত, তথ্যপূর্ণ বার্তা লিখুন (২ বাক্যের মধ্যে) যা জানাবে যে বিলটি স্বয়ংক্রিয়ভাবে বিভক্ত হয়ে একাধিক অফিস অর্ডার তৈরি হবে।
    `,
  };

  try {
    const result = await model.generateContent(prompts[context.type]);
    return result.response.text().trim();
  } catch (error) {
    // Fallback to static Bengali messages if AI fails
    const fallbacks: Record<ConflictType, string> = {
      DUTY_DUPLICATE: `${context.employeeName || "এই কর্মকর্তার"} জন্য নির্বাচিত তারিখে ইতোমধ্যে ডিউটি নির্ধারিত আছে। অনুগ্রহ করে ভিন্ন তারিখ নির্বাচন করুন।`,
      LEAVE_OVERLAP: `${context.employeeName || "এই কর্মকর্তা"} নির্বাচিত তারিখে অনুমোদিত ছুটিতে আছেন। ছুটি বাতিল না করে ডিউটি দেওয়া সম্ভব নয়।`,
      CELL_FORBIDDEN: `আপনার অ্যাকাউন্টে এই সেলের রেকর্ড পরিবর্তন করার অনুমতি নেই। সিস্টেম অ্যাডমিনিস্ট্রেটরের সাথে যোগাযোগ করুন।`,
      BUDGET_EXCEEDED: `মোট বিলের পরিমাণ ৳${context.limitAmount} সীমা অতিক্রম করেছে। বিলটি স্বয়ংক্রিয়ভাবে একাধিক অফিস অর্ডারে বিভক্ত হবে।`,
    };
    return fallbacks[context.type];
  }
}
