'use client';

import { useState, useMemo } from 'react';
import { HelpCircle, Keyboard, BookOpen, Info, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function HelpPage() {
  const { lang } = useLanguage();
  const isEn = lang === 'en';
  const [searchFaq, setSearchFaq] = useState('');

  const faqs = [
    {
      q: 'কিভাবে নতুন ডিউটি যোগ করব?',
      a: 'ডিউটি যোগ করতে হলে প্রথমে "কর্মকর্তাবৃন্দ" মেনু থেকে কর্মকর্তা নির্বাচন করুন, তারপর "নতুন ডিউটি যোগ করুন" বাটনে ক্লিক করে ডিউটির বিবরণ ও তারিখ দিন।'
    },
    {
      q: 'কিভাবে অফিস অর্ডার তৈরি করব?',
      a: '"লেট হলি নাইট অর্ডার" মেনুতে যান, সেখানে নতুন অর্ডার তৈরির অপশন পাবেন। প্রয়োজনীয় কর্মকর্তাদের সিলেক্ট করে অর্ডার জেনারেট করুন।'
    },
    {
      q: 'কিভাবে বিল প্রিন্ট করব?',
      a: '"বিল প্রস্তুতকরণ" বা "লাঞ্চ বিল শিট" মেনুতে গিয়ে নির্দিষ্ট মাসের বিল প্রিন্ট করতে পারবেন। প্রতিটি রেকর্ডের পাশে প্রিন্ট আইকন থাকে।'
    },
    {
      q: 'কিভাবে ছুটির আবেদন করব?',
      a: '"ছুটির আবেদন" মেনুতে গিয়ে "নতুন আবেদন" বাটনে ক্লিক করুন। ফর্মটি পূরণ করে সাবমিট করুন।'
    },
    {
      q: 'কিভাবে রোস্টার আপলোড করব?',
      a: '"লেট হলি নাইট অর্ডার" অংশে গিয়ে আপনি মাসের ডিউটি রোস্টার তৈরি করতে পারবেন।'
    },
    {
      q: 'কিভাবে ডকুমেন্ট আর্কাইভ করব?',
      a: '"নথিপত্র আর্কাইভ" মেনুতে গিয়ে প্রয়োজনীয় ডকুমেন্ট আপলোড করে রাখতে পারবেন।'
    },
    {
      q: 'ডার্ক মোড কিভাবে চালু করব?',
      a: 'আপনার ডিভাইসের থিম অনুযায়ী স্বয়ংক্রিয়ভাবে ডার্ক মোড কাজ করবে, তবে নেভিগেশন বারের সুইচ দিয়েও ডার্ক/লাইট মোড পরিবর্তন করা যায়।'
    },
    {
      q: 'ভাষা পরিবর্তন কিভাবে করব?',
      a: 'অ্যাপের নেভিগেশন বারে থাকা "BN | EN" বাটন থেকে বাংলা ও ইংরেজি পরিবর্তন করা যায়।'
    }
  ];

  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const filteredFaqs = useMemo(() => {
    if (!searchFaq.trim()) return faqs;
    const query = searchFaq.toLowerCase();
    return faqs.filter(f => f.q.toLowerCase().includes(query) || f.a.toLowerCase().includes(query));
  }, [searchFaq, faqs]);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400">
          <HelpCircle size={28} />
        </div>
        <div>
          <h1 className="app-page-title text-slate-800 dark:text-slate-100">{isEn ? 'Help & Guide' : 'সাহায্য ও নির্দেশিকা'}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{isEn ? 'System usage instructions, FAQs and keyboard shortcuts' : 'সিস্টেম ব্যবহারের নির্দেশিকা, সাধারণ জিজ্ঞাসা এবং শর্টকাট'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* FAQ Section */}
          <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-xl shadow-blue-500/5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <h2 className="app-section-title flex items-center gap-2 text-slate-800 dark:text-slate-100">
                <BookOpen size={20} className="text-indigo-500" />
                {isEn ? 'Frequently Asked Questions (FAQ)' : 'সচরাচর জিজ্ঞাসা (FAQ)'}
              </h2>
              
              <div className="relative w-full sm:w-60">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchFaq}
                  onChange={(e) => setSearchFaq(e.target.value)}
                  placeholder="প্রশ্ন খুঁজুন..."
                  aria-label="FAQ খুঁজুন"
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            
            <div className="space-y-3">
              {filteredFaqs.map((faq, index) => {
                const isOpen = openFaq === index;
                return (
                  <div 
                    key={index} 
                    className={`border rounded-xl transition-all duration-300 overflow-hidden ${
                      isOpen 
                        ? 'border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-900/10' 
                        : 'border-slate-200 dark:border-slate-700 hover:border-indigo-100 dark:hover:border-indigo-800'
                    }`}
                  >
                    <button
                      onClick={() => toggleFaq(index)}
                      aria-expanded={isOpen}
                      aria-label={faq.q}
                      className="flex justify-between items-center w-full p-4 text-left font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                    >
                      <span className="text-sm">{faq.q}</span>
                      {isOpen ? (
                        <ChevronUp size={18} className="text-indigo-500 shrink-0" />
                      ) : (
                        <ChevronDown size={18} className="text-slate-400 shrink-0" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 text-xs sm:text-sm text-slate-600 dark:text-slate-350 leading-relaxed border-t border-slate-100 dark:border-slate-800/80 pt-3">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Feature Guide */}
          <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-xl shadow-blue-500/5">
            <h2 className="app-section-title flex items-center gap-2 mb-6 text-slate-800 dark:text-slate-100">
              <Info size={20} className="text-teal-500" />
              {isEn ? 'Feature Guide' : 'ফিচার গাইড'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-2">{isEn ? 'Dashboard' : 'ড্যাশবোর্ড'}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {isEn 
                    ? 'View complete summary of all duties, holidays, and pending actions.' 
                    : 'ডিউটি, ছুটি এবং অন্যান্য প্রয়োজনীয় বিষয়ের সারসংক্ষেপ দেখুন।'}
                </p>
              </div>
              <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-2">{isEn ? 'Bill Preparation' : 'বিল প্রস্তুতকরণ'}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {isEn 
                    ? 'Generate PDF bills for Late Sitting, Night Shift and Holidays.' 
                    : 'লেট সিটিং, নাইট শিফট ও ছুটির দিনের ডিউটির পিডিএফ বিল তৈরি করুন।'}
                </p>
              </div>
              <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-2">{isEn ? 'Employees' : 'কর্মকর্তাবৃন্দ'}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {isEn 
                    ? 'Manage employee details and their respective cells.' 
                    : 'কর্মকর্তাদের তথ্য এবং তাদের নিজ নিজ সেল পরিচালনা করুন।'}
                </p>
              </div>
              <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-2">{isEn ? 'Documents Archive' : 'নথিপত্র আর্কাইভ'}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {isEn 
                    ? 'Upload and store important notices and guidelines.' 
                    : 'প্রয়োজনীয় নোটিশ এবং নির্দেশিকাসমূহ আপলোড করে সংরক্ষণ করুন।'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Keyboard Shortcuts */}
          <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-xl shadow-blue-500/5">
            <h2 className="app-section-title flex items-center gap-2 mb-6 text-slate-800 dark:text-slate-100">
              <Keyboard size={20} className="text-amber-500" />
              {isEn ? 'Keyboard Shortcuts' : 'কীবোর্ড শর্টকাট'}
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{isEn ? 'Global Search' : 'গ্লোবাল সার্চ'}</span>
                <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-md text-xs font-mono text-slate-600 dark:text-slate-400">Ctrl + K</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{isEn ? 'Save / Submit' : 'সংরক্ষণ / সাবমিট'}</span>
                <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-md text-xs font-mono text-slate-600 dark:text-slate-400">Ctrl + S</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{isEn ? 'Print Page' : 'পেজ প্রিন্ট'}</span>
                <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-md text-xs font-mono text-slate-600 dark:text-slate-400">Ctrl + P</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{isEn ? 'Go Back' : 'পূর্ববর্তী পেজ'}</span>
                <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-md text-xs font-mono text-slate-600 dark:text-slate-400">Alt + ←</kbd>
              </div>
            </div>
          </div>

          {/* Version Info */}
          <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-xl shadow-blue-500/5 text-center space-y-2">
            <h2 className="font-bold text-slate-800 dark:text-slate-100">{isEn ? 'System Information' : 'সিস্টেম তথ্য'}</h2>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              <p>{isEn ? 'Version' : 'সংস্করণ'}: 1.0.0 (Release)</p>
              <p>{isEn ? 'Last Updated' : 'সর্বশেষ আপডেট'}: {new Date().toLocaleDateString(isEn ? 'en-US' : 'bn-BD')}</p>
            </div>
            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-400">
              <p>Developed for Janata Bank PLC.</p>
              <p>Online Banking Department</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
