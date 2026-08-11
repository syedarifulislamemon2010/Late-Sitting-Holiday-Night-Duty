import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-10 shadow-2xl animate-in fade-in zoom-in duration-500 flex flex-col items-center text-center">
        <h1 className="text-7xl font-black bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent mb-4">
          ৪০৪
        </h1>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
          পেজটি খুঁজে পাওয়া যায়নি
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mb-8 font-sans">
          আপনি যে পেজটি খুঁজছেন তা মুছে ফেলা হয়েছে, নাম পরিবর্তন করা হয়েছে অথবা সাময়িকভাবে অনুপলব্ধ।
        </p>
        <Link
          href="/dashboard"
          className="px-8 py-3.5 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium transition-colors shadow-lg shadow-primary/25"
        >
          ড্যাশবোর্ডে ফিরে যান
        </Link>
      </div>
    </div>
  );
}
