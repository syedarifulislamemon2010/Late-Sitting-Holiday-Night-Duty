import logger from '@/lib/logger';
import React from 'react';
import Image from 'next/image';
import { FileText, Printer, X } from 'lucide-react';
import { toBanglaDigits, getBanglaNumberWords } from '@/lib/bengali-converter';
import { getShortDesignation, renderDatesInPairs, cleanBracketName } from '@/lib/print-helpers';

interface OfficeOrder {
  id: number;
  orderRef: string;
  orderDate: string;
  category: string;
  employeeName: string;
  cellName: string | null;
  status: string;
  dutiesJson?: string | null;
  duties?: any[];
  content?: {
    subjectText?: string;
    openingParagraph?: string;
    totalDays?: number;
    totalTransport?: number;
    totalApyaon?: number;
    grandTotal?: number;
    grandTotalInWords?: string;
    representativeDesignation?: string;
    signingOfficer?: string;
    signingDesignation?: string;
  } | null;
}

interface OrderDuty {
  employeeName: string;
  designation: string;
  datesFormatted?: string;
  dates?: string;
  days: number;
  totalTransport: number;
  totalApyaon: number;
  grandTotal: number;
}

interface DutyListEntry {
  employeeName?: string;
  name?: string;
  designation: string;
  bankId: string;
  datesFormatted?: string;
  date?: string;
  description?: string;
}

interface BulkBillPrintLayoutProps {
  viewingOrders: OfficeOrder[];
  onClose: () => void;
  fetchDutiesForBilling: () => void;
}

const getSeniorityRank = (designation: string): number => {
  if (!designation) return 99;
  const d = designation.toUpperCase();
  if (d.includes('এসপিও') || d.includes('SPO') || d.includes('সিনিয়র প্রিন্সিপাল') || d.includes('SENIOR PRINCIPAL')) {
    return 1;
  }
  if (d.includes('পিও') || d.includes('PO') || d.includes('প্রিন্সিপাল') || d.includes('PRINCIPAL')) {
    return 2;
  }
  if (d.includes('এসো-আইটি') || d.includes('SO-IT') || d.includes('সিনিয়র অফিসার') || d.includes('SENIOR OFFICER')) {
    return 3;
  }
  return 4;
};

export default function BulkBillPrintLayout({
  viewingOrders,
  onClose,
  fetchDutiesForBilling
}: BulkBillPrintLayoutProps) {
  
  const handlePrintAll = async () => {
    // Attempt to update all generated bills to Printed status
    for (const order of viewingOrders) {
      const isBill = order.category?.startsWith('BILL_');
      if (isBill && order.status === 'Generated') {
        try {
          await fetch(`/api/office-orders/${order.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderRef: order.orderRef,
              orderDate: order.orderDate,
              employeeName: order.employeeName,
              cellName: order.cellName,
              status: 'Printed'
            })
          });
        } catch (e) {
          logger.error(`Failed to update status for order: ${order.orderRef}`, e);
        }
      }
    }
    fetchDutiesForBilling();

    const isBill = viewingOrders[0]?.category?.startsWith('BILL_') || false;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    let htmlContent = `
      <html>
        <head>
          <title>অনলাইন ব্যাংকিং ডিপার্টমেন্ট বিল প্রিন্ট</title>
          <link rel="stylesheet" href="https://fonts.maateen.me/solaiman-lipi/font.css" />
          <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@300;400;500;600;700;800&family=Hind+Siliguri:wght@400;500;600;700&display=swap" />
          <style>
            @page {
              size: ${isBill ? 'legal portrait' : 'A4'};
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
              font-family: 'SolaimanLipi', 'Noto Sans Bengali', sans-serif !important;
              font-size: 11px;
              color: #000;
              background-color: #fff;
              line-height: 1.05;
              -webkit-font-smoothing: antialiased;
            }
            .whitespace-nowrap {
              white-space: nowrap !important;
            }
            .page-container {
              box-sizing: border-box !important;
              display: block !important;
              background-color: #fff !important;
              page-break-after: always;
              break-after: page;
            }
            .bill-page {
              width: 8.5in !important;
              height: auto !important;
              min-height: 14.0in !important;
              padding-top: 0.5in !important;
              padding-bottom: 0.5in !important;
              padding-left: 1.4in !important;
              padding-right: 0.5in !important;
            }
            .order-page {
              width: 210mm !important;
              height: auto !important;
              min-height: 297mm !important;
              padding-top: 0.6in !important;
              padding-bottom: 0.6in !important;
              padding-left: 0.8in !important;
              padding-right: 0.8in !important;
            }
            @media print {
              body {
                margin: 0 !important;
                padding: 0 !important;
              }
              .page-container {
                width: 100% !important;
                max-width: 100% !important;
                min-width: 100% !important;
                height: auto !important;
                min-height: auto !important;
                margin: 0 !important;
                box-sizing: border-box !important;
              }
              .bill-page {
                width: 100% !important;
                max-width: 100% !important;
                min-width: 100% !important;
                height: auto !important;
                min-height: auto !important;
                margin: 0 !important;
                padding-top: 0.5in !important;
                padding-bottom: 0.5in !important;
                padding-left: 1.4in !important;
                padding-right: 0.5in !important;
                box-sizing: border-box !important;
              }
              .order-page {
                width: 100% !important;
                max-width: 100% !important;
                min-width: 100% !important;
                height: auto !important;
                min-height: auto !important;
                margin: 0 !important;
                padding-top: 0.6in !important;
                padding-bottom: 0.6in !important;
                padding-left: 0.8in !important;
                padding-right: 0.8in !important;
                box-sizing: border-box !important;
              }
            }
            .print-block {
              display: block !important;
              height: auto !important;
            }
            .w-full { width: 100%; }
            .flex { display: flex; }
            .justify-between { justify-content: space-between; }
            .justify-end { justify-content: flex-end; }
            .items-start { align-items: flex-start; }
            .border-b-2 { border-bottom: 2px solid #0b5e9e; }
            .border-b { border-bottom: 1px solid #e2e8f0; }
            .pb-2 { padding-bottom: 8px; }
            .pt-1 { padding-top: 4px; }
            .pb-1 { padding-bottom: 4px; }
            .pt-2 { padding-top: 8px; }
            .pt-4 { padding-top: 16px; }
            .text-left { text-align: left; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .font-extrabold { font-weight: 800; }
            .text-center { text-align: center; }
            .leading-tight { line-height: 1.05; }
            .leading-relaxed { line-height: 1.1; }
            .leading-normal { line-height: 1.15; }
            .mt-0.5 { margin-top: 2px; }
            .mt-1 { margin-top: 4px; }
            .mt-2 { margin-top: 8px; }
            .mt-2.5 { margin-top: 10px; }
            .mt-3 { margin-top: 12px; }
            .mt-4 { margin-top: 16px; }
            .mt-6 { margin-top: 24px; }
            .mt-8 { margin-top: 32px; }
            .mb-1.5 { margin-bottom: 6px; }
            .pl-5 { padding-left: 20px; }
            .block { display: block; }
          </style>
        </head>
        <body>
    `;

    viewingOrders.forEach((order) => {
      const isBill = order.category?.startsWith('BILL_');
      let dutiesList: any[] = [];
      try {
        dutiesList = order.duties || JSON.parse(order.dutiesJson || '[]');
      } catch (e) {
        logger.error(e);
      }

      if (isBill) {
        const cat = order.category || '';
        const isHoliday = cat.includes('HOLIDAY');
        const isNight = cat.includes('NIGHT_SHIFT');
        const isLate = cat.includes('LATE_SITTING');
        const apyaonRate = isHoliday ? 250 : isNight ? 600 : 100;
        const transportRate = isHoliday ? 250 : isNight ? 400 : isLate ? 200 : 0;

        const sortedDuties = [...dutiesList].sort((a, b) => {
          const rankA = getSeniorityRank(a.designation);
          const rankB = getSeniorityRank(b.designation);
          if (rankA !== rankB) return rankA - rankB;
          return (b.grandTotal || 0) - (a.grandTotal || 0);
        });

        htmlContent += `
          <div class="page-container bill-page">
            <div class="print-block w-full">
              <!-- Header -->
              <div class="w-full flex justify-between items-start border-b-2 border-b-2 pb-2" style="border-bottom: 2px solid #0b5e9e;">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/e/e0/Janata_Bank_PLC_Logo.svg"
                  alt="Janata Bank Logo" 
                  style="height: 32px; flex-shrink: 0;"
                />
                <div class="text-right leading-tight">
                  <h2 style="font-size: 15pt; font-weight: 800; color: #0b5e9e; margin: 0; line-height: 1.15;">জনতা ব্যাংক পিএলসি.</h2>
                  <p style="font-size: 12pt; font-weight: bold; color: #64748b; margin: 2px 0 0 0; text-transform: uppercase;">অনলাইন ব্যাংকিং ডিপার্টমেন্ট</p>
                  <p style="font-size: 14px; font-weight: 500; color: #94a3b8; margin: 4px 0 0 0;">প্রধান কার্যালয়, ঢাকা</p>
                </div>
              </div>

              <!-- Date and Reference -->
              <div class="w-full flex justify-between items-start mt-4" style="font-size: 12pt;">
                <p class="font-bold" style="margin: 0;">স্মারক নং: ${order.orderRef}</p>
                <p class="font-bold" style="margin: 0;">তারিখ: ${toBanglaDigits(new Date(order.orderDate).toLocaleDateString('bn-BD', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-'))} ইং</p>
              </div>

              <div class="text-center font-bold underline mt-6" style="font-size: 14.5pt; text-decoration: underline; text-underline-offset: 4px;">
                ব্যক্তিগত যাতায়াত ও আপ্যায়ন ভাতা বিল বিবরণী
              </div>

              <!-- Content Subject and Opening -->
              <div class="mt-2" style="display: flex; flex-direction: column;">
                <h2 style="font-size: 14px; font-weight: bold; text-decoration: underline; text-underline-offset: 2px; margin: 8px 0 0 0;">
                  বিষয়: ${order.content?.subjectText || 'যাতায়াত ও আপ্যায়ন ভাতা প্রদান প্রসঙ্গে।'}
                </h2>
                <div class="mt-2.5">
                  <p style="font-size: 14px; line-height: 1.15; text-indent: 0.5in; text-align: justify; margin: 0;">
                    ${order.content?.openingParagraph || ''}
                  </p>
                </div>

                <!-- Table -->
                <table class="w-full text-center mt-3" style="font-size: 14px; border-collapse: collapse; border: 1px solid #000; width: 100%;">
                  <thead>
                    <tr style="background-color: #f8fafc; font-weight: bold; border-bottom: 1px solid #000;">
                      <th style="border: 1px solid #000; padding: 4px; width: 6%;">ক্রমিক</th>
                      <th style="border: 1px solid #000; padding: 4px; text-align: left; padding-left: 12px; width: 32%;">নাম ও পদবী</th>
                      <th style="border: 1px solid #000; padding: 4px; width: 26%;">তারিখ</th>
                      <th style="border: 1px solid #000; padding: 4px; width: 13%;">যাতায়াত</th>
                      <th style="border: 1px solid #000; padding: 4px; width: 13%;">আপ্যায়ন</th>
                      <th style="border: 1px solid #000; padding: 4px; width: 10%;">মোট</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${sortedDuties.map((s: OrderDuty, idx: number) => {
                      const displayName = s.employeeName.replace(/\s*\([^)]*\)\s*$/, '').trim();
                      const nameStr = displayName.startsWith('জনাব') ? displayName : `জনাব ${displayName}`;
                      const datesArr = renderDatesInPairs(s.datesFormatted || s.dates || '');
                      return `
                        <tr style="border-bottom: 1px solid #000;">
                          <td style="border: 1px solid #000; padding: 4px;">${toBanglaDigits(idx + 1)}</td>
                          <td style="border: 1px solid #000; padding: 4px; text-align: left; padding-left: 12px; line-height: 1.1; white-space: nowrap;">
                            <span style="display: block; white-space: nowrap;">${nameStr}</span>
                            <span style="display: block; font-size: 11px; color: #374151; margin-top: 2px;">(${getShortDesignation(s.designation)})</span>
                          </td>
                          <td style="border: 1px solid #000; padding: 4px; font-size: 11px;">
                            ${datesArr.map(pair => `<span style="display: block; white-space: nowrap;">${pair}</span>`).join('')}
                            <p style="font-size: 11px; color: #374151; margin: 2px 0 0 0; font-weight: 600;">মোট: ${toBanglaDigits(s.days)} দিন</p>
                          </td>
                          <td style="border: 1px solid #000; padding: 4px; vertical-align: middle; text-align: center;">
                            <span style="display: block; white-space: nowrap;">(${toBanglaDigits(transportRate)}x${toBanglaDigits(s.days)}) =</span>
                            <span style="display: block; white-space: nowrap; margin-top: 2px;">${toBanglaDigits(s.totalTransport)}/-</span>
                          </td>
                          <td style="border: 1px solid #000; padding: 4px; vertical-align: middle; text-align: center;">
                            <span style="display: block; white-space: nowrap;">(${toBanglaDigits(apyaonRate)}x${toBanglaDigits(s.days)}) =</span>
                            <span style="display: block; white-space: nowrap; margin-top: 2px;">${toBanglaDigits(s.totalApyaon)}/-</span>
                          </td>
                          <td style="border: 1px solid #000; padding: 4px; font-weight: bold;">
                            ${toBanglaDigits(s.grandTotal)}/-
                          </td>
                        </tr>
                      `;
                    }).join('')}
                    <tr style="font-weight: bold; background-color: #f8fafc;">
                      <td colSpan="2" style="border: 1px solid #000; padding: 4px; text-align: right; padding-right: 12px;">সর্বমোট:</td>
                      <td style="border: 1px solid #000; padding: 4px;">${toBanglaDigits(order.content?.totalDays || 0)} দিন</td>
                      <td style="border: 1px solid #000; padding: 4px;">${toBanglaDigits(order.content?.totalTransport || 0)}/-</td>
                      <td style="border: 1px solid #000; padding: 4px;">${toBanglaDigits(order.content?.totalApyaon || 0)}/-</td>
                      <td style="border: 1px solid #000; padding: 4px;">${toBanglaDigits(order.content?.grandTotal || 0)}/-</td>
                    </tr>
                  </tbody>
                </table>

                <!-- Bottom Text Details -->
                <div class="mt-2 leading-normal" style="font-size: 14px; text-align: justify; line-height: 0.95;">
                  <p class="font-bold" style="margin: 2px 0;">কথায়: ${(order.content?.grandTotalInWords || '').replace(/\s*মাত্র\s*$/, '')} মাত্র।</p>
                  <p style="margin: 2px 0;">০১। যাতায়াত বিলটি সঠিক এবং পূর্বে পরিশোধ করা হয়নি।</p>
                  <p style="margin: 2px 0;">
                    ০২। ২০১৭ সালের আর্থিক ক্ষমতা অর্পন এর পৃষ্ঠা ১৫ এর অনুচ্ছেদ-২৬.০২ মোতাবেক যাতায়াত খাত (কোড-১৩৫৫১২০৫০০০০০০৩) অনুযায়ী প্রকৃত খরচ = <strong>${toBanglaDigits(order.content?.totalTransport || 0)}/- (${getBanglaNumberWords(order.content?.totalTransport || 0).replace(' টাকা মাত্র', ' টাকা')})</strong> এবং পৃষ্ঠা ১৪ এর অনুচ্ছেদ-২২.০২ মোতাবেক আপ্যায়ন খাত (কোড-১৩৫৫১২০১০০০০০০২) অনুযায়ী প্রকৃত খরচ = <strong>${toBanglaDigits(order.content?.totalApyaon || 0)}/- (${getBanglaNumberWords(order.content?.totalApyaon || 0).replace(' টাকা মাত্র', ' টাকা')})</strong> অনুমোদন ক্ষমতা উপ-মহাব্যবস্থাপক মহোদয়ের এখতিয়ারাধীন।
                  </p>
                  <p style="margin: 2px 0;">
                    ০৩। এমতাবস্থায়, বর্ণিত খরচ অনুমোদনপূর্বক যাতায়াত ও আপ্যায়ন খাত (প্রযোজ্য ক্ষেত্রে) বিকলন করতঃ মোট = <strong>${toBanglaDigits(order.content?.grandTotal || 0)}/- (${getBanglaNumberWords(order.content?.grandTotal || 0).replace(' টাকা মাত্র', ' টাকা')})</strong> <strong>${order.employeeName.replace(/\s*\([^)]*\)\s*$/, '')}, ${order.content?.representativeDesignation || 'এসও-আইটি'}</strong> এর নামে প্রদানের নিমিত্ত নিরীক্ষার অনুরোধ জানিয়ে বাজেট এন্ড এক্সপেন্ডিচার কন্ট্রোল ডিপার্টমেন্ট বরাবর এবং নিরীক্ষান্তে নথি একাউন্টস ডিপার্টমেন্ট বরাবর প্রেরণ করা যেতে পারে।
                  </p>
                </div>
              </div>
            </div>

            <!-- Signatures -->
            <div class="w-full flex justify-end" style="margin-top: 0.25in; margin-bottom: 0.1in;">
              <div style="font-size: 14px; text-align: right; padding-right: 0.1in; line-height: 1.15;">
                <p class="font-extrabold" style="margin: 0; text-align: right !important; line-height: 1.15 !important;">(${cleanBracketName(order.employeeName.replace(/\s*\([^)]*\)\s*$/, '')).trim()})</p>
                <p style="color: #334155; margin: 0; margin-top: 3px; text-align: right !important; line-height: 1.15 !important;">${(order.content?.representativeDesignation || 'এসও-আইটি').trim()}</p>
              </div>
            </div>

            <!-- Routing List -->
            <div class="w-full text-left mt-4" style="font-size: 10.5px; line-height: 1.4;">
              <div style="margin-bottom: 0.7in;"><p style="display: inline-block !important; border-bottom: 1px solid #000 !important; padding-bottom: 5px !important; margin: 0 !important; line-height: 1.4 !important;">এসপিও, (অনলাইন ব্যাংকিং ডিপার্টমেন্ট) সমীপেঃ</p></div>
              <div style="margin-bottom: 0.7in;"><p style="display: inline-block !important; border-bottom: 1px solid #000 !important; padding-bottom: 5px !important; margin: 0 !important; line-height: 1.4 !important;">এজিএম, (অনলাইন ব্যাংকিং ডিপার্টমেন্ট) সমীপেঃ</p></div>
              <div style="margin-bottom: 0.7in;"><p style="display: inline-block !important; border-bottom: 1px solid #000 !important; padding-bottom: 5px !important; margin: 0 !important; line-height: 1.4 !important;">ডিজিএম, (অনলাইন ব্যাংকিং ডিপার্টমেন্ট) সমীপেঃ</p></div>
              <div style="margin-bottom: 0.7in;"><p style="display: inline-block !important; border-bottom: 1px solid #000 !important; padding-bottom: 5px !important; margin: 0 !important; line-height: 1.4 !important;">ডিজিএম, (বাজেট অ্যান্ড এক্সপেন্ডিচার কন্ট্রোল ডিপার্টমেন্ট) সমীপেঃ</p></div>
            </div>
          </div>
        `;
      } else {
        const sortedDuties = [...dutiesList];
        htmlContent += `
          <div class="page-container order-page">
            <div class="print-block" style="display: flex; flex-direction: column; height: 100%; justify-content: space-between;">
              <div>
                <!-- Header -->
                <div class="w-full flex justify-between items-start border-b-2 pb-1" style="border-bottom: 2px solid #0b5e9e;">
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/e/e0/Janata_Bank_PLC_Logo.svg"
                    alt="Janata Bank Logo" 
                    style="height: 32px; flex-shrink: 0;"
                  />
                  <div class="text-right leading-tight">
                    <h2 style="font-size: 15pt; font-weight: 800; color: #0b5e9e; margin: 0; line-height: 1.15;">জনতা ব্যাংক পিএলসি.</h2>
                    <p style="font-size: 12pt; font-weight: bold; color: #64748b; margin: 2px 0 0 0; text-transform: uppercase;">অনলাইন ব্যাংকিং ডিপার্টমেন্ট</p>
                    <p style="font-size: 14px; font-weight: 500; color: #94a3b8; margin: 4px 0 0 0;">প্রধান কার্যালয়, ঢাকা</p>
                  </div>
                </div>

                <!-- Title and Details -->
                <div class="w-full flex justify-between items-start mt-4" style="font-size: 12pt;">
                  <p class="font-bold" style="margin: 0;">স্মারক নং: ${order.orderRef}</p>
                  <p class="font-bold" style="margin: 0;">তারিখ: ${toBanglaDigits(new Date(order.orderDate).toLocaleDateString('bn-BD', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-'))} ইং</p>
                </div>

                <div class="text-center font-bold underline mt-6" style="font-size: 14.5pt; text-decoration: underline; text-underline-offset: 4px;">
                  অফিস নির্দেশ
                </div>

                <div class="mt-6">
                  <p style="font-size: 12pt; line-height: 1.5; text-indent: 0.5in; text-align: justify; margin: 0;">
                    ${order.content?.openingParagraph || 'অনলাইন ব্যাংকিং ডিপার্টমেন্টের স্বাভাবিক কার্যক্রম পরিচালনার জন্য নিম্নলিখিত কর্মকর্তাদের দায়িত্ব অর্পণ করা হইলঃ'}
                  </p>
                </div>

                <!-- Table -->
                <table class="w-full text-center mt-4" style="font-size: 14px; border-collapse: collapse; border: 1px solid #000; width: 100%;">
                  <thead>
                    <tr style="background-color: #f8fafc; font-weight: bold; border-bottom: 1px solid #000;">
                      <th style="border: 1px solid #000; padding: 4px; width: 8%;">ক্রমিক</th>
                      <th style="border: 1px solid #000; padding: 4px; text-align: left; padding-left: 6px; width: 28%;">নাম ও পদবী</th>
                      <th style="border: 1px solid #000; padding: 4px; text-align: left; padding-left: 6px; width: 12%;">কার্ড নং</th>
                      <th style="border: 1px solid #000; padding: 4px; width: 27%;">তারিখ</th>
                      <th style="border: 1px solid #000; padding: 4px; text-align: left; padding-left: 6px; width: 25%;">মন্তব্য</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${sortedDuties.map((d: DutyListEntry, idx: number) => {
                      const fullNm = d.employeeName || d.name || '';
                      const displayName = fullNm.replace(/\s*\([^)]*\)\s*$/, '').trim();
                      const nameStr = displayName.startsWith('জনাব') ? displayName : `জনাব ${displayName}`;
                      const datesArr = renderDatesInPairs(d.datesFormatted || d.date || '');
                      return `
                        <tr style="border-bottom: 1px solid #000;">
                          <td style="border: 1px solid #000; padding: 4px;">${toBanglaDigits(idx + 1)}</td>
                          <td style="border: 1px solid #000; padding: 4px; text-align: left; padding-left: 6px; line-height: 1.05;">
                            ${nameStr} (${getShortDesignation(d.designation)})
                          </td>
                          <td style="border: 1px solid #000; padding: 4px; text-align: left; padding-left: 6px; font-family: monospace;">
                            ${d.bankId}
                          </td>
                          <td style="border: 1px solid #000; padding: 4px; font-size: 11px;">
                            ${datesArr.map(pair => `<span style="display: block; white-space: nowrap;">${pair}</span>`).join('')}
                          </td>
                          <td style="border: 1px solid #000; padding: 4px; text-align: left; padding-left: 6px;">
                            ${d.description || ''}
                          </td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>

                <!-- Signatures -->
                <div class="w-full flex justify-between items-start mt-8 pt-4" style="font-size: 12pt; line-height: 1.6;">
                  <div style="width: 50%;">
                    <p style="text-decoration: underline; text-underline-offset: 2px; margin: 0;">অনুলিপি জ্ঞাতার্থে ও কার্যার্থে প্রেরিত হইলোঃ</p>
                    <ol class="list-decimal pl-5" style="margin-top: 8px; padding-left: 20px;">
                      <li>উপ-মহাব্যবস্থাপক মহোদয়ের ব্যক্তিগত নথি, অনলাইন ব্যাংকিং ডিপার্টমেন্ট;</li>
                      <li>সংশ্লিষ্ট কর্মকর্তা; এবং</li>
                      <li>নথি/অফিস কপি।</li>
                    </ol>
                  </div>
                  <div style="width: 50%; text-align: right; padding-right: 8px;">
                    <p style="font-weight: 800; margin: 0;">(${cleanBracketName(order.content?.signingOfficer || 'স্বাক্ষরিত')})</p>
                    <p style="color: #1e293b; margin: 4px 0 0 0;">${order.content?.signingDesignation || 'উপ-মহাব্যবস্থাপক'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;
      }
    });

    htmlContent += `
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Panel */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 text-primary rounded-lg">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">বাল্ক প্রিন্ট প্রিভিউ ({toBanglaDigits(viewingOrders.length)} টি)</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">একত্রে সকল বিল/অফিস আদেশ প্রিন্ট করার লেআউট</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintAll}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl font-medium text-sm transition-all duration-200 shadow-md shadow-primary/20 cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              একত্রে প্রিন্ট করুন
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 overflow-y-auto bg-slate-100 dark:bg-slate-950 p-8 flex flex-col items-center gap-8">
          {viewingOrders.map((order, idx) => {
            const isBill = order.category?.startsWith('BILL_');
            let dutiesList: any[] = [];
            try {
              dutiesList = order.duties || JSON.parse(order.dutiesJson || '[]');
            } catch (e) {
              logger.error(e);
            }

            return (
              <div key={order.id} className="relative shadow-xl hover:shadow-2xl transition-shadow duration-300">
                <div className="absolute -left-12 top-4 bg-slate-800 text-white rounded-lg px-2.5 py-1 text-xs font-bold font-mono">
                  #{idx + 1}
                </div>
                {isBill ? (
                  /* simulated Legal bill sheet */
                  <div 
                    className="w-[8.5in] h-[14.0in] bg-white text-black flex flex-col justify-between relative text-left font-sans leading-tight text-[11px] shrink-0"
                    style={{ color: '#000000', backgroundColor: '#ffffff', fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '11px', boxSizing: 'border-box', paddingTop: '0.35in', paddingBottom: '0.35in', paddingLeft: '1.4in', paddingRight: '0.5in' }}
                  >
                    <div className="flex flex-col h-full justify-between">
                      <div>
                        {/* Header */}
                        <div className="w-full flex justify-between items-start border-b-2 border-b-2 pb-2" style={{ borderBottom: '2px solid #0b5e9e' }}>
                          <Image 
                            src="https://upload.wikimedia.org/wikipedia/commons/e/e0/Janata_Bank_PLC_Logo.svg"
                            alt="Janata Bank Logo" 
                            width={120}
                            height={32}
                            className="h-8 shrink-0" 
                            unoptimized
                          />
                          <div className="text-right leading-tight">
                            <h2 className="text-[20px] font-extrabold text-[#0b5e9e]" style={{ fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '20px', lineHeight: '1.15' }}>জনতা ব্যাংক পিএলসি.</h2>
                            <p className="text-[20px] font-bold text-slate-500 uppercase mt-0.5" style={{ fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '20px', lineHeight: '1.0', letterSpacing: 'normal' }}>অনলাইন ব্যাংকিং ডিপার্টমেন্ট</p>
                            <p className="text-[11px] font-medium text-slate-400 leading-none mt-1" style={{ fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '11px', lineHeight: '1.0' }}>প্রধান কার্যালয়, ঢাকা</p>
                          </div>
                        </div>

                        {/* Date and Ref */}
                        <div className="w-full flex justify-between items-start mt-4 text-[11px]" style={{ fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '11px', lineHeight: '1.0' }}>
                          <p className="font-bold">স্মারক নং: {order.orderRef}</p>
                          <p className="font-bold">তারিখ: {toBanglaDigits(new Date(order.orderDate).toLocaleDateString('bn-BD', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-'))} ইং</p>
                        </div>

                        <div className="text-center font-bold text-[14px] underline decoration-black underline-offset-4 mt-6 leading-none" style={{ fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '14px', lineHeight: '1.0' }}>
                          ব্যক্তিগত যাতায়াত ও আপ্যায়ন ভাতা বিল বিবরণী
                        </div>

                        <div className="flex-1 flex flex-col justify-between mt-2">
                          <div>
                            <h2 className="text-left text-[11px] font-bold underline decoration-black underline-offset-2 leading-none" style={{ fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '11px', lineHeight: '1.0' }}>
                              বিষয়: {order.content?.subjectText || 'যাতায়াত ও আপ্যায়ন ভাতা প্রদান প্রসঙ্গে।'}
                            </h2>
                            <div className="mt-2.5">
                              <p className="text-justify leading-normal text-black text-[11px]" style={{ fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '11px', lineHeight: '1.15', textIndent: '0.5in', textAlign: 'justify' }}>
                                {order.content?.openingParagraph}
                              </p>
                            </div>

                            {/* Table */}
                            {(() => {
                              if (!dutiesList || dutiesList.length === 0) return null;
                              const cat = order.category || '';
                              const isHoliday = cat.includes('HOLIDAY');
                              const isNight = cat.includes('NIGHT_SHIFT');
                              const isLate = cat.includes('LATE_SITTING');
                              const apyaonRate = isHoliday ? 250 : isNight ? 600 : 100;
                              const transportRate = isHoliday ? 250 : isNight ? 400 : isLate ? 200 : 0;
                              
                              const sorted = [...dutiesList].sort((a, b) => {
                                const rankA = getSeniorityRank(a.designation);
                                const rankB = getSeniorityRank(b.designation);
                                if (rankA !== rankB) return rankA - rankB;
                                return (b.grandTotal || 0) - (a.grandTotal || 0);
                              });

                              return (
                                <table className="w-full border-collapse border border-black text-center mt-3 text-[12px]" style={{ fontFamily: 'SolaimanLipi', fontSize: '11px', lineHeight: '1.15', borderCollapse: 'collapse', border: '1px solid #000', width: '100%' }}>
                                  <thead>
                                    <tr className="bg-slate-50 font-bold border-b border-black text-[11px]" style={{ fontFamily: 'SolaimanLipi', fontSize: '11px', lineHeight: '1.15' }}>
                                      <th className="border border-black p-1.5 w-[6%] text-center" style={{ border: '1px solid #000', padding: '3px', width: '6%' }}>ক্রমিক</th>
                                      <th className="border border-black p-1.5 text-left pl-3 w-[32%]" style={{ border: '1px solid #000', padding: '3px', textAlign: 'left', paddingLeft: '12px', width: '32%' }}>নাম ও পদবী</th>
                                      <th className="border border-black p-1.5 text-center w-[26%]" style={{ border: '1px solid #000', padding: '3px', width: '26%' }}>তারিখ</th>
                                      <th className="border border-black p-1.5 text-center w-[13%]" style={{ border: '1px solid #000', padding: '3px', width: '13%' }}>যাতায়াত</th>
                                      <th className="border border-black p-1.5 text-center w-[13%]" style={{ border: '1px solid #000', padding: '3px', width: '13%' }}>আপ্যায়ন</th>
                                      <th className="border border-black p-1.5 text-center w-[10%]" style={{ border: '1px solid #000', padding: '3px', width: '10%' }}>মোট</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {sorted.map((s: OrderDuty, sIdx: number) => (
                                      <tr key={sIdx} className="text-black text-[11px]" style={{ fontFamily: 'SolaimanLipi', fontSize: '11px', lineHeight: '1.15' }}>
                                        <td className="border border-black p-1.5 text-center" style={{ border: '1px solid #000', padding: '3px' }}>{toBanglaDigits(sIdx + 1)}</td>
                                        <td className="border border-black p-1.5 text-left pl-3 font-normal whitespace-nowrap" style={{ border: '1px solid #000', padding: '3px', textAlign: 'left', paddingLeft: '12px', lineHeight: '1.1', whiteSpace: 'nowrap' }}>
                                          {(() => {
                                            const displayName = s.employeeName.replace(/\s*\([^)]*\)\s*$/, '').trim();
                                            const nameWithPrefix = displayName.startsWith('জনাব') ? displayName : `জনাব ${displayName}`;
                                            return (
                                              <>
                                                <span className="font-normal block whitespace-nowrap" style={{ display: 'block', whiteSpace: 'nowrap' }}>
                                                  {nameWithPrefix}
                                                </span>
                                                <span className="font-normal block text-slate-800 text-[11px] mt-0.5" style={{ display: 'block', fontSize: '11px', marginTop: '2px' }}>
                                                  ({getShortDesignation(s.designation)})
                                                </span>
                                              </>
                                            );
                                          })()}
                                        </td>
                                        <td className="border border-black p-1.5 text-center font-normal" style={{ border: '1px solid #000', padding: '3px', fontSize: '11px', lineHeight: '1.15' }}>
                                          {renderDatesInPairs(s.datesFormatted || s.dates || '').map((pair, pIdx) => (
                                            <span key={pIdx} className="block" style={{ display: 'block', whiteSpace: 'nowrap' }}>
                                              {pair}
                                            </span>
                                          ))}
                                          <p className="text-[10px] text-slate-700 mt-0.5 font-semibold">মোট: {toBanglaDigits(s.days)} দিন</p>
                                        </td>
                                        <td className="border border-black p-1.5 text-center font-normal" style={{ border: '1px solid #000', padding: '3px', verticalAlign: 'middle' }}>
                                          <span style={{ display: 'block', whiteSpace: 'nowrap' }}>({toBanglaDigits(transportRate)}x{toBanglaDigits(s.days)}) =</span>
                                          <span style={{ display: 'block', whiteSpace: 'nowrap', marginTop: '2px' }}>{toBanglaDigits(s.totalTransport)}/-</span>
                                        </td>
                                        <td className="border border-black p-1.5 text-center font-normal" style={{ border: '1px solid #000', padding: '3px', verticalAlign: 'middle' }}>
                                          <span style={{ display: 'block', whiteSpace: 'nowrap' }}>({toBanglaDigits(apyaonRate)}x{toBanglaDigits(s.days)}) =</span>
                                          <span style={{ display: 'block', whiteSpace: 'nowrap', marginTop: '2px' }}>{toBanglaDigits(s.totalApyaon)}/-</span>
                                        </td>
                                        <td className="border border-black p-1.5 font-extrabold text-center" style={{ border: '1px solid #000', padding: '3px', fontWeight: 'bold' }}>
                                          {toBanglaDigits(s.grandTotal)}/-
                                        </td>
                                      </tr>
                                    ))}
                                    <tr className="font-bold bg-slate-50/50 text-[12px]" style={{ border: '1px solid #000', fontWeight: 'bold' }}>
                                      <td colSpan={2} className="border border-black p-1.5 text-right pr-3" style={{ border: '1px solid #000', padding: '3px', textAlign: 'right', paddingRight: '12px' }}>সর্বমোট:</td>
                                      <td className="border border-black p-1.5 text-center" style={{ border: '1px solid #000', padding: '3px' }}>{toBanglaDigits(order.content?.totalDays)} দিন</td>
                                      <td className="border border-black p-1.5 text-center" style={{ border: '1px solid #000', padding: '3px' }}>{toBanglaDigits(order.content?.totalTransport)}/-</td>
                                      <td className="border border-black p-1.5 text-center" style={{ border: '1px solid #000', padding: '3px' }}>{toBanglaDigits(order.content?.totalApyaon)}/-</td>
                                      <td className="border border-black p-1.5 text-center font-extrabold" style={{ border: '1px solid #000', padding: '3px', fontWeight: 'bold' }}>{toBanglaDigits(order.content?.grandTotal)}/-</td>
                                    </tr>
                                  </tbody>
                                </table>
                              );
                            })()}

                            <div className="text-left pt-3 mt-3 space-y-1.5" style={{ fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '11px', lineHeight: '1.25' }}>
                              <p className="font-bold text-black text-[11px]" style={{ fontSize: '11px' }}>কথায়: {(order.content?.grandTotalInWords || '').replace(/\s*মাত্র\s*$/, '')} মাত্র।</p>
                              <p className="text-justify leading-normal text-black text-[11px]" style={{ fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '11px', lineHeight: '1.25', textAlign: 'justify' }}>
                                ০১। যাতায়াত বিলটি সঠিক এবং পূর্বে পরিশোধ করা হয়নি।
                              </p>
                              <p className="text-justify leading-normal text-black text-[11px]" style={{ fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '11px', lineHeight: '1.25', textAlign: 'justify' }}>
                                ০২। ২০১৭ সালের আর্থিক ক্ষমতা অর্পন এর পৃষ্ঠা ১৫ এর অনুচ্ছেদ-২৬.০২ মোতাবেক যাতায়াত খাত (কোড-১৩৫৫১২০৫০০০০০০৩) অনুযায়ী প্রকৃত খরচ = <strong>{toBanglaDigits(order.content?.totalTransport)}/- ({getBanglaNumberWords(order.content?.totalTransport || 0).replace(' টাকা মাত্র', ' টাকা')})</strong> এবং পৃষ্ঠা ১৪ এর অনুচ্ছেদ-২২.০২ মোতাবেক আপ্যায়ন খাত (কোড-১৩৫৫১২০১০০০০০০২) অনুযায়ী প্রকৃত খরচ = <strong>{toBanglaDigits(order.content?.totalApyaon)}/- ({getBanglaNumberWords(order.content?.totalApyaon || 0).replace(' টাকা মাত্র', ' টাকা')})</strong> অনুমোদন ক্ষমতা উপ-মহাব্যবস্থাপক মহোদয়ের এখতিয়ারাধীন।
                              </p>
                              <p className="text-justify leading-normal text-black text-[11px]" style={{ fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '11px', lineHeight: '1.25', textAlign: 'justify' }}>
                                ০৩। এমতাবস্থায়, বর্ণিত খরচ অনুমোদনপূর্বক যাতায়াত ও আপ্যায়ন খাত (প্রযোজ্য ক্ষেত্রে) বিকলন করতঃ মোট = <strong>{toBanglaDigits(order.content?.grandTotal)}/- ({getBanglaNumberWords(order.content?.grandTotal || 0).replace(' টাকা মাত্র', ' টাকা')})</strong> <strong>{order.employeeName.replace(/\s*\([^)]*\)\s*$/, '')}, {order.content?.representativeDesignation || 'এসও-আইটি'}</strong> এর নামে প্রদানের নিমিত্ত নিরীক্ষার অনুরোধ জানিয়ে বাজেট এন্ড এক্সপেন্ডিচার কন্ট্রোল ডিপার্টমেন্ট বরাবর এবং নিরীক্ষান্তে নথি একাউন্টস ডিপার্টমেন্ট বরাবর প্রেরণ করা যেতে পারে।
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Signature block */}
                      <div className="w-full flex justify-end text-right" style={{ marginTop: '0.25in', marginBottom: '0.1in' }}>
                        <div className="text-right leading-none" style={{ fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '11px', paddingRight: '0.1in' }}>
                          <p className="font-extrabold text-[11px]" style={{ margin: 0, padding: 0, lineHeight: '1.15', textAlign: 'right', fontSize: '11px' }}>({cleanBracketName(order.employeeName.replace(/\s*\([^)]*\)\s*$/, '')).trim()})</p>
                          <p className="text-[11px] font-bold text-slate-800" style={{ margin: 0, padding: 0, marginTop: '3px', lineHeight: '1.15', textAlign: 'right', fontSize: '11px' }}>{(order.content?.representativeDesignation || 'এসও-আইটি').trim()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* simulated A4 office order sheet */
                  <div 
                    className="w-[210mm] min-h-[297mm] bg-white border border-slate-200 text-black flex flex-col justify-between relative text-left font-sans leading-relaxed text-[11px] shrink-0"
                    style={{ color: '#000000', backgroundColor: '#ffffff', fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '12px', boxSizing: 'border-box', paddingTop: '0.8in', paddingBottom: '0.8in', paddingLeft: '0.8in', paddingRight: '0.8in' }}
                  >
                    <div className="flex flex-col h-full justify-between">
                      <div>
                        {/* Header */}
                        <div className="w-full flex justify-between items-start border-b-2 border-[#0b5e9e] pb-1.5">
                          <Image 
                            src="https://upload.wikimedia.org/wikipedia/commons/e/e0/Janata_Bank_PLC_Logo.svg"
                            alt="Janata Bank Logo" 
                            width={120}
                            height={32}
                            className="h-8 shrink-0" 
                            unoptimized
                          />
                          <div className="text-right leading-tight">
                            <h2 className="text-[20px] font-extrabold text-[#0b5e9e]" style={{ fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '20px', lineHeight: '1.15' }}>জনতা ব্যাংক পিএলসি.</h2>
                            <p className="text-[20px] font-bold text-slate-500 uppercase mt-0.5" style={{ fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '20px', lineHeight: '1.0', letterSpacing: 'normal' }}>অনলাইন ব্যাংকিং ডিপার্টমেন্ট</p>
                            <p className="text-[11px] font-medium text-slate-400 leading-none mt-1" style={{ fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '11px', lineHeight: '1.0' }}>প্রধান কার্যালয়, ঢাকা</p>
                          </div>
                        </div>

                        {/* Title and Memo details */}
                        <div className="w-full flex justify-between items-start mt-4 text-[11px]" style={{ fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '11px', lineHeight: '1.0' }}>
                          <p className="font-bold">স্মারক নং: {order.orderRef}</p>
                          <p className="font-bold">তারিখ: {toBanglaDigits(new Date(order.orderDate).toLocaleDateString('bn-BD', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-'))} ইং</p>
                        </div>

                        <div className="text-center font-bold text-[14px] underline decoration-black underline-offset-4 mt-6 leading-none" style={{ fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '14px', lineHeight: '1.0' }}>
                          অফিস নির্দেশ
                        </div>

                        <div className="mt-6">
                          <p className="text-justify leading-relaxed text-black text-[11px] text-indent-8" style={{ fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '11px', lineHeight: '1.5', textIndent: '0.5in', textAlign: 'justify' }}>
                            {order.content?.openingParagraph || 'অনলাইন ব্যাংকিং ডিপার্টমেন্টের স্বাভাবিক কার্যক্রম পরিচালনার জন্য নিম্নলিখিত কর্মকর্তাদের দায়িত্ব অর্পণ করা হইলঃ'}
                          </p>
                        </div>

                        {/* Table */}
                        {dutiesList.length > 0 ? (
                          <table className="w-full border-collapse border border-black text-center mt-4 text-[12px]" style={{ fontFamily: 'SolaimanLipi', fontSize: '11px', lineHeight: '1.15', borderCollapse: 'collapse', border: '1px solid #000', width: '100%' }}>
                            <thead>
                              <tr className="bg-slate-50 font-bold border-b border-black text-[11px]" style={{ fontFamily: 'SolaimanLipi', fontSize: '11px', lineHeight: '1.15' }}>
                                <th className="border border-black p-1 w-[8%] text-center" style={{ border: '1px solid #000', padding: '3px' }}>ক্রমিক</th>
                                <th className="border border-black p-1 text-left pl-2 w-[28%]" style={{ border: '1px solid #000', padding: '3px', textAlign: 'left', paddingLeft: '6px' }}>নাম ও পদবী</th>
                                <th className="border border-black p-1 text-left pl-2 w-[12%]" style={{ border: '1px solid #000', padding: '3px', textAlign: 'left', paddingLeft: '6px' }}>কার্ড নং</th>
                                <th className="border border-black p-1 text-center w-[27%]" style={{ border: '1px solid #000', padding: '3px' }}>তারিখ</th>
                                <th className="border border-black p-1 text-left pl-2 w-[25%]" style={{ border: '1px solid #000', padding: '3px', textAlign: 'left', paddingLeft: '6px' }}>মন্তব্য</th>
                              </tr>
                            </thead>
                            <tbody>
                              {dutiesList.map((d: DutyListEntry, dIdx: number) => {
                                const fullNm = d.employeeName || d.name || '';
                                const displayName = fullNm.replace(/\s*\([^)]*\)\s*$/, '').trim();
                                return (
                                  <tr key={dIdx} className="text-black text-[11px]" style={{ fontFamily: 'SolaimanLipi', fontSize: '11px', lineHeight: '1.15' }}>
                                    <td className="border border-black p-1 text-center" style={{ border: '1px solid #000', padding: '3px' }}>{toBanglaDigits(dIdx + 1)}</td>
                                    <td className="border border-black p-1 text-left pl-2 font-normal" style={{ border: '1px solid #000', padding: '3px', textAlign: 'left', paddingLeft: '6px', lineHeight: '1.1' }}>
                                      {(() => {
                                        const nameWithPrefix = displayName.startsWith('জনাব') ? displayName : `জনাব ${displayName}`;
                                        return (
                                          <>
                                            <span className="font-normal block whitespace-nowrap" style={{ display: 'block', whiteSpace: 'nowrap' }}>
                                              {nameWithPrefix}
                                            </span>
                                            <span className="font-normal block text-slate-800 text-[11px] mt-0.5" style={{ display: 'block', fontSize: '11px', marginTop: '2px' }}>
                                              ({getShortDesignation(d.designation)})
                                            </span>
                                          </>
                                        );
                                      })()}
                                    </td>
                                    <td className="border border-black p-1 text-left pl-2 font-normal" style={{ border: '1px solid #000', padding: '3px', textAlign: 'left', paddingLeft: '6px' }}>
                                      <span className="font-sans">{d.bankId}</span>
                                    </td>
                                    <td className="border border-black p-1 text-center leading-snug font-normal" style={{ border: '1px solid #000', padding: '3px', fontSize: '11px' }}>
                                      {renderDatesInPairs(d.datesFormatted || d.date || '').map((pair, pIdx) => (
                                        <span key={pIdx} className="block leading-snug" style={{ display: 'block', whiteSpace: 'nowrap' }}>
                                          {pair}
                                        </span>
                                      ))}
                                    </td>
                                    <td className="border border-black p-1 text-left pl-2 font-normal" style={{ border: '1px solid #000', padding: '3px', textAlign: 'left', paddingLeft: '6px' }}>
                                      {d.description || ''}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        ) : null}

                        {/* Signatures */}
                        <div className="w-full flex justify-between items-start mt-8 pt-4 leading-normal text-[11px]" style={{ fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif', fontSize: '11px', lineHeight: '1.6' }}>
                          <div className="w-[50%]">
                            <p className="underline underline-offset-2">অনুলিপি জ্ঞাতার্থে ও কার্যার্থে প্রেরিত হইলোঃ</p>
                            <ol className="list-decimal pl-5 mt-2 space-y-1" style={{ paddingLeft: '20px' }}>
                              <li>উপ-মহাব্যবস্থাপক মহোদয়ের ব্যক্তিগত নথি, অনলাইন ব্যাংকিং ডিপার্টমেন্ট;</li>
                              <li>সংশ্লিষ্ট কর্মকর্তা; এবং</li>
                              <li>নথি/অফিস কপি।</li>
                            </ol>
                          </div>
                          <div className="w-[50%] text-right pr-2">
                            <p className="font-extrabold">({cleanBracketName(order.content?.signingOfficer || 'স্বাক্ষরিত')})</p>
                            <p className="text-slate-800 mt-1">{order.content?.signingDesignation || 'উপ-মহাব্যবস্থাপক'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
