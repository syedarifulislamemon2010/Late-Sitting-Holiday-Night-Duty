'use client';

import { useState, useRef } from 'react';
import { 
  Clipboard, 
  Trash2, 
  Download, 
  Languages, 
  HelpCircle, 
  Check, 
  FileCode,
  ShieldCheck
} from 'lucide-react';
import { 
  detectEncoding, 
  convertBijoyToUnicode, 
  convertUnicodeToBijoy 
} from '@/lib/bengali-converter';

export default function BengaliConverterPage() {
  const [inputText, setInputText] = useState('');
  const [mode, setMode] = useState<'AUTO' | 'U2B' | 'B2U'>('AUTO');
  const [isCopied, setIsCopied] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Compute encoding/output text dynamically inline during rendering
  const detectedType = detectEncoding(inputText);
  
  let outputText = '';
  if (inputText.trim()) {
    if (mode === 'AUTO') {
      if (detectedType === 'UNICODE') {
        outputText = convertUnicodeToBijoy(inputText);
      } else {
        outputText = convertBijoyToUnicode(inputText);
      }
    } else if (mode === 'U2B') {
      outputText = convertUnicodeToBijoy(inputText);
    } else {
      outputText = convertBijoyToUnicode(inputText);
    }
  }

  // Copy to clipboard helper
  const handleCopy = async () => {
    if (!outputText) return;
    try {
      await navigator.clipboard.writeText(outputText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // Clear textareas
  const handleClear = () => {
    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Download converted text as .txt file
  const handleDownload = () => {
    if (!outputText) return;
    
    // Choose appropriate file name suffix based on target encoding
    const targetEncoding = mode === 'U2B' || (mode === 'AUTO' && detectedType === 'UNICODE')
      ? 'bijoy_ansi'
      : 'unicode';
      
    const element = document.createElement("a");
    const file = new Blob([outputText], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `converted_bangla_${targetEncoding}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Stats calculation
  const wordCount = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;
  const charCount = inputText.length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-[#0b5e9e]/10 flex items-center justify-center text-[#0b5e9e]">
              <Languages size={22} className="animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900">বাংলা ফন্ট ও এনকোডিং কনভার্টার</h1>
              <p className="text-xs text-slate-400 font-sans">
                জনতা ব্যাংক পিএলসি. | সিবিএস ইন্টিগ্রেটেড ডেভেলপমেন্ট সেল
              </p>
            </div>
          </div>
        </div>
        
        {/* Offline & Security Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-100">
            <ShieldCheck size={14} />
            <span>১০০% অফলাইন রূপান্তর</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 text-slate-600 text-xs font-semibold border border-slate-200">
            <FileCode size={14} />
            <span>৯৯.৯%+ বিশুদ্ধতা</span>
          </div>
          <button 
            onClick={() => setShowHelp(!showHelp)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors text-slate-700 text-xs font-semibold"
          >
            <HelpCircle size={14} />
            <span>ব্যবহার বিধি</span>
          </button>
        </div>
      </div>

      {/* Help Card */}
      {showHelp && (
        <div className="bg-[#0b5e9e]/5 border border-[#0b5e9e]/15 p-6 rounded-2xl text-slate-700 space-y-4 animate-fadeIn">
          <h3 className="font-extrabold text-[#0b5e9e] flex items-center gap-2 text-[15px]">
            <HelpCircle size={18} />
            কনভার্টার ব্যবহার বিধি ও নির্দেশনা
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div className="space-y-2.5">
              <h4 className="font-bold text-slate-900">১. স্বয়ংক্রিয় শনাক্তকরণ (Auto Detect):</h4>
              <p className="text-slate-600 leading-relaxed text-xs">
                কনভার্টারে কোনো লেখা পেস্ট বা টাইপ করার সাথে সাথে এটি নিজ থেকে লেখার ধরন শনাক্ত করতে পারে। 
                ইউনিকোড লেখা (যেমন অভ্র বা গুগল ইনপুট দিয়ে লেখা) পেস্ট করলে তা স্বয়ংক্রিয়ভাবে **বিজয় এএনএসআই (SutonnyMJ)** ফন্টে রূপান্তর হবে। আবার বিজয় লেখা পেস্ট করলে তা **ইউনিকোডে** রূপান্তরিত হবে।
              </p>
              <h4 className="font-bold text-slate-900">২. ফন্ট পরিবর্তন (SutonnyMJ):</h4>
              <p className="text-slate-600 leading-relaxed text-xs">
                বিজয় এএনএসআই-তে রূপান্তরিত আউটপুট কপি করে মাইক্রোসফট ওয়ার্ড (MS Word) বা এক্সেলে (MS Excel) পেস্ট করার পর ফন্ট হিসেবে **SutonnyMJ** সিলেক্ট করতে হবে। অন্যথায় লেখা ভেঙে যেতে পারে।
              </p>
            </div>
            <div className="space-y-2.5">
              <h4 className="font-bold text-slate-900">৩. সামঞ্জস্যতা (Compatibility):</h4>
              <p className="text-slate-600 leading-relaxed text-xs">
                এই কনভার্টারটি বিজয় বাহান্ন (Bijoy Bayanno), বিজয় একুশে (Bijoy Ekushey), সুতন্বীএমজে (SutonnyMJ) এবং প্রচলিত সকল এএনএসআই ফন্টের সাথে সামঞ্জস্যপূর্ণ।
              </p>
              <h4 className="font-bold text-slate-900">৪. নিরাপত্তা ও গোপনীয়তা:</h4>
              <p className="text-slate-600 leading-relaxed text-xs">
                এই কনভার্টারটি আপনার ব্রাউজারেই সরাসরি কাজ করে এবং কোনো ডেটা কোনো দূরবর্তী সার্ভারে পাঠায় না। ব্যাংকের গোপনীয় নথি ও প্রাতিষ্ঠানিক আদেশের ক্ষেত্রে এটি সম্পূর্ণ নিরাপদ ও ব্যবহারযোগ্য।
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Control panel and Mode Selection */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">রূপান্তর মোড:</span>
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
            <button
              onClick={() => setMode('AUTO')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${mode === 'AUTO' ? 'bg-[#0b5e9e] text-white' : 'text-slate-600 hover:text-slate-900'}`}
            >
              স্বয়ংক্রিয় (Auto Detect)
            </button>
            <button
              onClick={() => setMode('U2B')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${mode === 'U2B' ? 'bg-[#0b5e9e] text-white' : 'text-slate-600 hover:text-slate-900'}`}
            >
              ইউনিকোড → বিজয় (SutonnyMJ)
            </button>
            <button
              onClick={() => setMode('B2U')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${mode === 'B2U' ? 'bg-[#0b5e9e] text-white' : 'text-slate-600 hover:text-slate-900'}`}
            >
              বিজয় → ইউনিকোড
            </button>
          </div>
        </div>

        {/* Current status display */}
        {inputText.trim() && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">শনাক্তকৃত ফরম্যাট:</span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold border ${detectedType === 'UNICODE' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
              {detectedType === 'UNICODE' ? 'ইউনিকোড (Avro/Unicode)' : 'বিজয় এএনএসআই (SutonnyMJ)'}
            </span>
          </div>
        )}
      </div>

      {/* Main Translation Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[450px]">
        
        {/* Input Pane */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col overflow-hidden group focus-within:border-[#0b5e9e]/50 focus-within:shadow-md transition-all duration-300">
          <div className="bg-slate-50 px-5 py-3.5 border-b border-slate-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800 text-[13px] sm:text-[14px]">ইনপুট টেক্সট</span>
              {mode === 'AUTO' && (
                <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-bold uppercase tracking-wider font-sans">
                  Auto
                </span>
              )}
            </div>
            <button
              onClick={handleClear}
              disabled={!inputText}
              title="মুছে ফেলুন"
              className="text-slate-400 hover:text-red-500 disabled:opacity-30 disabled:hover:text-slate-400 p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 size={16} />
            </button>
          </div>
          
          <div className="flex-1 relative p-1">
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                mode === 'U2B'
                  ? "এখানে ইউনিকোড লেখা পেস্ট বা টাইপ করুন (যেমন: আমি বাংলায় কথা বলি)..."
                  : mode === 'B2U'
                  ? "এখানে সুতন্বীএমজে (SutonnyMJ) বা বিজয় এএনএসআই টেক্সট পেস্ট করুন (যেমন: Avwg evsjvq K_v ewj)..."
                  : "এখানে বাংলা লেখা পেস্ট বা টাইপ করুন (কনভার্টার স্বয়ংক্রিয়ভাবে রূপান্তর করে দেবে)..."
              }
              className="w-full h-full min-h-[350px] lg:min-h-[400px] p-5 text-slate-800 placeholder-slate-400 border-0 focus:ring-0 focus:outline-none resize-none leading-relaxed text-[15px] font-sans"
            />
          </div>
          
          <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400 shrink-0 font-sans">
            <div>
              <span>শব্দ: {wordCount}</span>
              <span className="mx-2">|</span>
              <span>বর্ণ: {charCount}</span>
            </div>
            {inputText.trim() && (
              <div className="flex items-center gap-1">
                <span>কনভার্ট হচ্ছে:</span>
                <span className="font-bold text-[#0b5e9e]">
                  {mode === 'AUTO' 
                    ? (detectedType === 'UNICODE' ? 'বিজয় এএনএসআই' : 'ইউনিকোড')
                    : (mode === 'U2B' ? 'বিজয় এএনএসআই' : 'ইউনিকোড')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Output Pane */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col overflow-hidden focus-within:border-slate-300 transition-all duration-300">
          <div className="bg-slate-50 px-5 py-3.5 border-b border-slate-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800 text-[13px] sm:text-[14px]">রূপান্তরিত টেক্সট</span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-extrabold font-sans ${
                (mode === 'U2B' || (mode === 'AUTO' && detectedType === 'UNICODE'))
                  ? 'bg-amber-50 text-amber-700 border border-amber-100'
                  : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
              }`}>
                {(mode === 'U2B' || (mode === 'AUTO' && detectedType === 'UNICODE')) ? 'বিজয় এএনএসআই' : 'ইউনিকোড'}
              </span>
            </div>
            
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleDownload}
                disabled={!outputText}
                title="টেক্সট ফাইল ডাউনলোড করুন"
                className="text-slate-500 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-30 disabled:hover:text-slate-500 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <Download size={16} />
              </button>
              <button
                onClick={handleCopy}
                disabled={!outputText}
                title="কপি করুন"
                className="text-slate-500 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-30 disabled:hover:text-slate-500 p-1.5 rounded-lg transition-colors relative flex items-center justify-center cursor-pointer"
              >
                {isCopied ? <Check size={16} className="text-emerald-500" /> : <Clipboard size={16} />}
              </button>
            </div>
          </div>
          
          <div className="flex-1 relative p-1 bg-slate-50/30">
            <textarea
              readOnly
              value={outputText}
              placeholder="রূপান্তরিত ফলাফল এখানে প্রদর্শিত হবে..."
              className="w-full h-full min-h-[350px] lg:min-h-[400px] p-5 text-slate-800 placeholder-slate-400 border-0 focus:ring-0 focus:outline-none bg-transparent resize-none leading-relaxed text-[15px] font-sans"
            />
          </div>
          
          <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400 shrink-0 font-sans">
            <div>
              <span>বর্ণ: {outputText.length}</span>
            </div>
            {(mode === 'U2B' || (mode === 'AUTO' && detectedType === 'UNICODE')) && outputText && (
              <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-100 animate-pulse">
                ওয়ার্ড/এক্সেলে এটি দেখতে &quot;SutonnyMJ&quot; ফন্ট ব্যবহার করুন।
              </span>
            )}
          </div>
        </div>

      </div>

      {/* Integration Card for Bank Automation */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h3 className="font-extrabold text-slate-800 text-[14px] sm:text-[15px]">ব্যাংক অটোমেশন ও ভবিষ্যত সংযুক্তি</h3>
          <p className="text-xs text-slate-500 leading-relaxed max-w-3xl">
            এই রূপান্তরকারী ইঞ্জিনটি ভবিষ্যৎ মডিউল যেমন **অফিস আদেশ জেনারেটর (Office Orders)**, **ছুটির দরখাস্ত (Leave Applications)**, **সারকপত্র (Memorandums)** এবং **ব্যাংকিং নথি স্ক্যানিং/ওসিআর ইমপোর্ট পাইপলাইন (OCR Import)**-এর সাথে সরাসরি ডেটা ইন্টিগ্রেশনের উপযোগী করে তৈরি করা হয়েছে।
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 px-4 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 font-sans">
          <span>ইঞ্জিন সংস্করণ: ২.০.০-অফলাইন</span>
        </div>
      </div>
    </div>
  );
}
