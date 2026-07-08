import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { officeOrders } from '@/db/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import { getCurrentUser } from '@/lib/auth-wrapper';
import { logActivity } from '@/lib/audit';
import { getShortDesignation, renderDatesInPairs, cleanBracketName } from '@/lib/print-helpers';

interface BillSummaryItem {
  name: string;
  designation: string;
  datesFormatted: string;
  days: number;
  totalTransport: number;
  totalApyaon: number;
  grandTotal: number;
}

function toBnDigits(num: number | string | null | undefined): string {
  if (num === null || num === undefined) return '';
  const bnChars = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return num.toString().replace(/\d/g, (d) => bnChars[parseInt(d, 10)]);
}

function getBnDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [y, m, d] = parts;
  const bnD = toBnDigits(d.padStart(2, '0'));
  const bnM = toBnDigits(m.padStart(2, '0'));
  const bnY = toBnDigits(y);
  return `${bnD}-${bnM}-${bnY}`;
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const {
      openingParagraph,
      summaries,
      totalDays,
      totalApyaon,
      totalTransport,
      grandTotal,
      grandTotalInWords,
      representativeName,
      representativeDesignation,
      subjectText,
      billDate,
      transportRate = 200.0,
      apyaonRate = 100.0,
      totalTransportInWords = "",
      totalApyaonInWords = "",
      billRef
    } = payload;
    const summariesHtml = summaries.map((s: BillSummaryItem, index: number) => {
      const displayName = (s.name || '').replace(/\s*\([^)]*\)\s*$/, '').trim();
      const nameWithPrefix = displayName.startsWith('জনাব') ? displayName : `জনাব ${displayName}`;
      const shortDesignation = getShortDesignation(s.designation);
      const pairedDates = renderDatesInPairs(s.datesFormatted || '');
      
      const datesHtml = pairedDates.map((pair, pIdx) => {
        return `<span style="display: block; white-space: nowrap; line-height: 1.2;">${pair}</span>`;
      }).join('');

      return `
        <tr style="line-height: 1.15;">
          <td>${toBnDigits(index + 1)}</td>
          <td class="text-left" style="line-height: 1.2; padding-left: 12px; text-align: left;">
            <span>${nameWithPrefix} (${shortDesignation})</span>
          </td>
          <td style="font-size: 11px; line-height: 1.15; padding: 4px; text-align: center;">
            ${datesHtml}
            <p style="font-size: 11px; font-weight: bold; margin-top: 4px; line-height: 1.1;">মোট: ${toBnDigits(s.days)} দিন</p>
          </td>
          <td>(${toBnDigits(Math.round(transportRate))}x${toBnDigits(s.days)}) = ${toBnDigits(Math.round(s.totalTransport))}/-</td>
          <td>(${toBnDigits(Math.round(apyaonRate))}x${toBnDigits(s.days)}) = ${toBnDigits(Math.round(s.totalApyaon))}/-</td>
          <td class="font-bold">${toBnDigits(Math.round(s.grandTotal))}/-</td>
        </tr>
      `;
    }).join('');

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Noto+Sans+Bengali:wght@400;700&display=swap" rel="stylesheet">
<link href="https://fonts.maateen.me/solaiman-lipi/font.css" rel="stylesheet">
<script>
  (function() {
    try {
      const theme = localStorage.getItem('theme');
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (theme === 'dark' || (!theme && systemDark)) {
        document.documentElement.classList.add('dark');
      }
      window.addEventListener('storage', function(e) {
        if (e.key === 'theme') {
          if (e.newValue === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
      });
    } catch (e) {}
  })();
</script>
<style>
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    letter-spacing: normal !important;
  }
  @page {
    size: legal portrait;
    margin-top: 0.4in;
    margin-bottom: 0.75in;
    margin-left: 1.3in;
    margin-right: 0.5in;
  }
  body {
    font-family: 'SolaimanLipi', 'Hind Siliguri', 'Noto Sans Bengali', system-ui, -apple-system, sans-serif;
    font-size: 12px;
    line-height: 1.0;
    color: #000;
    background-color: #fff;
  }
  .header-container {
    width: 100%;
    margin-bottom: 16px;
    text-align: right;
    line-height: 1.0;
  }
  .header-title {
    font-size: 24px;
    font-weight: bold;
    margin: 0;
    line-height: 1.0;
  }
  .header-date {
    font-size: 12px;
    font-weight: bold;
    margin-top: 6px;
    line-height: 1.0;
  }
  .subject {
    font-size: 14px;
    font-weight: bold;
    text-decoration: underline;
    margin-bottom: 10px;
    line-height: 1.0;
  }
  .body-text {
    text-align: justify;
    margin-top: 10px;
    margin-bottom: 10px;
    line-height: 1.6;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 12px 0;
    font-size: 12px;
    line-height: 1.0;
  }
  th, td {
    border: 1px solid #000;
    padding: 3px 3px;
    text-align: center;
    vertical-align: middle;
    line-height: 1.0;
  }
  th {
    background-color: #f5f5f5;
    font-weight: bold;
  }
  .text-left {
    text-align: left;
    padding-left: 12px;
  }
  .font-bold {
    font-weight: bold;
  }
  .paragraphs {
    margin-top: 12px;
    text-align: justify;
    line-height: 1.15;
  }
  .paragraph-item {
    margin-bottom: 10px;
    line-height: 1.15;
  }
  .signature-container {
    width: 100%;
    margin-top: 0.5in;
    margin-bottom: 0.2in;
    text-align: right;
    line-height: 1.0;
  }
  .signature-block {
    display: inline-block;
    text-align: right;
    padding-right: 0.1in;
  }
  .signature-block p {
    margin: 0;
    line-height: 1.0;
  }
  .routing-list {
    margin-top: 24px;
    text-align: left;
    line-height: 1.0;
    font-size: 12px;
  }
  .routing-item {
    margin-bottom: 0.45in;
    line-height: 1.0;
  }
  .routing-text {
    display: inline-block !important;
    border-bottom: 1px solid #000 !important;
    padding-bottom: 5px !important;
    line-height: 1.0;
  }
  @media screen {
    html.dark body {
      background-color: #0b0f19 !important;
      color: #f8fafc !important;
    }
    html.dark th {
      background-color: #1e293b !important;
      color: #f8fafc !important;
      border-color: #334155 !important;
    }
    html.dark td, html.dark tr, html.dark table {
      border-color: #334155 !important;
    }
    html.dark .header-container *, 
    html.dark .header-title,
    html.dark .header-date,
    html.dark .subject, 
    html.dark .body-text, 
    html.dark h1, html.dark h2, html.dark h3, html.dark h4, 
    html.dark p, html.dark span, html.dark strong, html.dark b,
    html.dark td *, html.dark th *,
    html.dark .signature-block *, html.dark .routing-list *, html.dark .routing-text {
      color: #f8fafc !important;
      border-color: #334155 !important;
    }
  }
</style>
</head>
<body>
  <div class="header-container">
    <p class="header-title">অনলাইন ব্যাংকিং ডিপার্টমেন্ট</p>
    <p class="header-date">তারিখ: ${getBnDate(billDate)} ইং</p>
  </div>

  <div class="subject">
    বিষয়: ${subjectText || ''}
  </div>

  <div class="body-text">
    ${openingParagraph}
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 8%;">ক্রমিক</th>
        <th style="width: 28%; text-align: left; padding-left: 12px;">নাম ও পদবী</th>
        <th style="width: 25%;">তারিখ</th>
        <th style="width: 15%;">যাতায়াত</th>
        <th style="width: 15%;">আপ্যায়ন</th>
        <th style="width: 9%;">মোট</th>
      </tr>
    </thead>
    <tbody>
      ${summariesHtml}
      <tr class="font-bold">
        <td colspan="3" style="text-align: right; padding-right: 12px; line-height: 1.4;">
          <p>মোট দিন = ${toBnDigits(totalDays)} দিন</p>
          <p style="margin-top: 4px;">মোট টাকা = (${grandTotalInWords.replace(' টাকা মাত্র', ' টাকা')})</p>
        </td>
        <td>(${toBnDigits(Math.round(transportRate))}x${toBnDigits(totalDays)}) = ${toBnDigits(Math.round(totalTransport))}/-</td>
        <td>(${toBnDigits(Math.round(apyaonRate))}x${toBnDigits(totalDays)}) = ${toBnDigits(Math.round(totalApyaon))}/-</td>
        <td class="font-bold">${toBnDigits(Math.round(grandTotal))}/-</td>
      </tr>
    </tbody>
  </table>

  <div class="paragraphs">
    <div class="paragraph-item">
      ০২। আলোচ্য বিলটি সঠিক এবং পূর্বে পরিশোধ করা হয়নি।
    </div>
    <div class="paragraph-item">
      ০৩। ২০১৭ সালের আর্থিক ক্ষমতা অর্পন এর পৃষ্ঠা ১৫ এর অনুচ্ছেদ-২৬.০২ মোতাবেক যাতায়াত খাত (কোড-১৩৫৫১২০৫০০০০০০৩) অনুযায়ী প্রকৃত খরচ = <strong>${toBnDigits(Math.round(totalTransport))}/- (${totalTransportInWords.replace(' টাকা মাত্র', ' টাকা')})</strong> এবং পৃষ্ঠা ১৪ এর অনুচ্ছেদ-২২.০২ মোতাবেক আপ্যায়ন খাত (কোড-১৩৫৫১২০১০০০০০০২) অনুযায়ী প্রকৃত খরচ = <strong>${toBnDigits(Math.round(totalApyaon))}/- (${totalApyaonInWords.replace(' টাকা মাত্র', ' টাকা')})</strong> অনুমোদন ক্ষমতা উপ-মহাব্যবস্থাপক মহোদয়ের এখতিয়ারাধীন।
    </div>
    <div class="paragraph-item">
      ০৪। এমতাবস্থায়, বর্ণিত খরচ অনুমোদনপূর্বক যাতায়াত ও আপ্যায়ন খাত (প্রযোজ্য ক্ষেত্রে) বিকলন করতঃ মোট = <strong>${toBnDigits(Math.round(grandTotal))}/- (${grandTotalInWords.replace(' টাকা মাত্র', ' টাকা')})</strong> <strong>${representativeName || ''}, ${representativeDesignation || ''}</strong> এর নামে প্রদানের নিমিত্ত নিরীক্ষার অনুরোধ জানিয়ে বাজেট এন্ড এক্সপেন্ডিচার কন্ট্রোল ডিপার্টমেন্ট বরাবর এবং নিরীক্ষান্তে নথি একাউন্টস ডিপার্টমেন্ট বরাবর প্রেরণ করা যেতে পারে।
    </div>
  </div>

  <div class="signature-container">
    <div class="signature-block">
      <p class="font-bold">(${cleanBracketName((representativeName || '').replace(/\s*\([^)]*\)\s*$/, ''))})</p>
      <p style="margin-top: 5px; color: #333; font-weight: bold;">${representativeDesignation || ''}</p>
    </div>
  </div>

  <div class="routing-list">
    <div class="routing-item">
      <p class="routing-text">এসপিও, অনলাইন ব্যাংকিং ডিপার্টমেন্ট সমীপেঃ</p>
    </div>
    <div class="routing-item">
      <p class="routing-text">এজিএম, অনলাইন ব্যাংকিং ডিপার্টমেন্ট সমীপেঃ</p>
    </div>
    <div class="routing-item">
      <p class="routing-text">উপ-মহাব্যবস্থাপক, অনলাইন ব্যাংকিং ডিপার্টমেন্ট সমীপেঃ</p>
    </div>
    <div class="routing-item">
      <p class="routing-text">উপ-মহাব্যবস্থাপক, বাজেট অ্যান্ড এক্সপেন্ডিচার কন্ট্রোল ডিপার্টমেন্ট সমীপেঃ</p>
    </div>
  </div>
  
  <script>
    if (document.fonts) {
      document.fonts.ready.then(function() {
        setTimeout(function() {
          window.print();
        }, 250);
      });
    } else {
      window.onload = function() {
        setTimeout(function() {
          window.print();
        }, 500);
      }
    }
  </script>
</body>
</html>
    `;

    // Ensure uploads directory exists in public/
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Save to HTML file
    let filename = `bill_memo_${Math.floor(Date.now() / 1000)}.html`;
    if (billRef) {
      const safeRef = billRef.replace(/\//g, "_").replace(/[^a-zA-Z0-9_\-\u0980-\u09FF]/g, "");
      filename = `bill_memo_${safeRef}.html`;
    }
    const filePathDisk = path.join(uploadsDir, filename);
    fs.writeFileSync(filePathDisk, htmlContent, 'utf-8');

    const relativePath = `/uploads/${filename}`;
    // Transition status to 'Generated & Printed' in OfficeOrder table only if print/download action is requested
    const logAction = payload.actionType || 'PRINT_BILL';
    if (billRef && (logAction === 'PRINT_BILL' || logAction === 'DOWNLOAD_BILL_PDF')) {
      await db.update(officeOrders)
        .set({ status: 'Generated & Printed' })
        .where(eq(officeOrders.orderRef, billRef));
    }

    // Audit trail
    const currentUser = await getCurrentUser();
    if (currentUser) {
      const orderRecordList = await db.select().from(officeOrders).where(eq(officeOrders.orderRef, billRef)).limit(1);
      const orderRecord = orderRecordList[0];
      const ipAddress = request.headers.get('x-forwarded-for') || '127.0.0.1';
      const userAgent = request.headers.get('user-agent') || 'Unknown';
      await logActivity({
        username: currentUser.username,
        action: logAction,
        entityType: 'OFFICE_ORDER',
        entityId: orderRecord ? String(orderRecord.id) : 'Unknown',
        userId: currentUser.id,
        bankId: currentUser.username,
        ipAddress: ipAddress,
        userAgent: userAgent,
        details: `${currentUser.name} (@${currentUser.username}) বিল মেমো প্রিন্ট/ডাউনলোড করেছেন (সূত্র: ${billRef})।`
      });
    }

    return NextResponse.json({
      success: true,
      filePath: relativePath
    });

  } catch (error) {
    console.error('Error generating bill memo document:', error);
    return NextResponse.json({ error: 'failed_to_generate_bill_memo', message: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
}
