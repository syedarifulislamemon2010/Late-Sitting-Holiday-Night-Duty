'use client';

import React from 'react';

interface HardwarePrintSheetProps {
  requisitionDate: string;
  subjectLine: string;
  bodyParagraph: string;
  items: Array<{
    serialNo: string;
    officerNameSnapshot: string;
    officerDesignationSnapshot: string;
    hardwareLabel: string;
  }>;
  requesterName?: string;
  requesterDesignation?: string;
  getBnDateString: (dateStr: string) => string;
  cleanDesignation: (desig: string) => string;
}

export default function HardwarePrintSheet({
  requisitionDate,
  subjectLine,
  bodyParagraph,
  items,
  requesterName,
  requesterDesignation,
  getBnDateString,
  cleanDesignation
}: HardwarePrintSheetProps) {
  return (
    <div className="xl:col-span-8 w-full max-w-full overflow-x-auto flex justify-center pb-4 no-print-scrollbar">
      <div 
        id="printable-hardware-requisition-sheet" 
        className="w-[216mm] min-h-[355mm] bg-white text-black border border-slate-350 dark:border-slate-800 print:border-none shadow-[0_15px_50px_rgba(0,0,0,0.08)] print:shadow-none flex flex-col justify-start shrink-0"
        style={{
          paddingTop: '0.8in',
          paddingBottom: '1in',
          paddingLeft: '1.3in',
          paddingRight: '0.6in',
          boxSizing: 'border-box'
        }}
      >
        <div className="flex flex-col justify-start" contentEditable={true} suppressContentEditableWarning={true}>
          <div className="text-right space-y-1 font-bold pr-1">
            <h2 className="text-black" style={{ letterSpacing: 'normal', fontSize: '20pt', lineHeight: 'normal' }}>অনলাইন ব্যাংকিং ডিপার্টমেন্ট</h2>
            <p className="text-xs text-black" style={{ letterSpacing: 'normal' }}>
              তারিখঃ {getBnDateString(requisitionDate)} ইং
            </p>
          </div>

          <div className="text-left text-[13px] leading-relaxed text-black mt-4">
            <span className="font-bold">বিষয়ঃ </span>
            <span className="font-bold inline-block border-b border-black pb-0.5">
              {subjectLine.replace('বিষয়ঃ ', '').replace('विषয়ঃ ', '')}
            </span>
          </div>

          <p className="text-justify text-[13px] leading-relaxed text-black tracking-normal mt-4">
            {bodyParagraph}
          </p>

          <table className="w-full text-center border-collapse border border-black mt-4 mb-4 text-[13px]">
            <thead>
              <tr className="bg-slate-50/20 font-bold border-b border-black">
                <th className="border border-black px-2 py-1.5 text-center font-bold w-[12%]">ক্রমিক নং</th>
                <th className="border border-black px-3 py-1.5 text-center font-bold w-[35%]">কর্মকর্তার নাম</th>
                <th className="border border-black px-3 py-1.5 text-center font-bold w-[25%]">পদবী</th>
                <th className="border border-black px-3 py-1.5 text-center font-bold w-[28%]">প্রয়োজনীয় হার্ডওয়্যার</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx} className="border-b border-black">
                  <td className="border border-black px-2 py-2 text-center">{item.serialNo}</td>
                  <td className="border border-black px-3 py-2 text-left">{item.officerNameSnapshot}</td>
                  <td className="border border-black px-3 py-2 text-center">{item.officerDesignationSnapshot}</td>
                  <td className="border border-black px-3 py-2 text-center">{item.hardwareLabel}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="text-justify text-[13px] leading-relaxed text-black mt-4">
            এমতাবস্থায়, উপরে উল্লেখিত সমস্যা সমাধানের জন্য প্রয়োজনীয় ব্যবস্থা গ্রহণের অনুরোধ জানিয়ে নথিটি অত্র ডিপার্টমেন্টের <strong><em>হার্ডওয়্যার সেল</em></strong> বরাবর প্রেরণ করা যেতে পারে।
          </p>
        </div>

        <div className="mt-10 space-y-12" contentEditable={true} suppressContentEditableWarning={true}>
          <div className="flex justify-end">
            <div className="text-right space-y-1 pr-2">
              <p className="text-[13px]">({(requesterName || '[আবেদনকারীর নাম]').replace(/^জনাব\s+/, '')})</p>
              <p className="text-[13px]">{requesterDesignation ? cleanDesignation(requesterDesignation) : '[আবেদনকারীর পদবী]'}</p>
            </div>
          </div>

          <div className="space-y-16 pt-2 text-left text-[13px] leading-relaxed text-black">
            <p className="underline">এসপিও, (অনলাইন ব্যাংকিং ডিপার্টমেন্ট) সমীপেঃ</p>
            <p className="underline">এজিএম, (অনলাইন ব্যাংকিং ডিপার্টমেন্ট) সমীপেঃ</p>
            <p className="underline">ডিজিএম, (অনলাইন ব্যাংকিং ডিপার্টমেন্ট) সমীপেঃ</p>
          </div>
        </div>
      </div>
    </div>
  );
}
