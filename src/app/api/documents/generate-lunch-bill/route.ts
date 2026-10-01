import logger from '@/lib/logger';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { documents } from '@/db/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import { lunchBillGenerateSchema } from '@/validations/documentGeneration.schema';
import { handleApiError } from '@/lib/errors';
import { getBanglaNumberWords } from '@/lib/bengali-converter';

let cachedKalpurushBase64: string | null = null;
function getKalpurushBase64(): string {
  if (cachedKalpurushBase64 !== null) return cachedKalpurushBase64;
  try {
    const fontPath = path.join(process.cwd(), 'public', 'fonts', 'kalpurush.woff2');
    if (fs.existsSync(fontPath)) {
      cachedKalpurushBase64 = fs.readFileSync(fontPath).toString('base64');
      return cachedKalpurushBase64;
    }
  } catch (e) {
    logger.warn('Failed to read kalpurush.woff2 for embedding:', e);
  }
  cachedKalpurushBase64 = '';
  return cachedKalpurushBase64;
}

interface LunchBillRecord {
  employeeName: string;
  designation: string | null | undefined;
  bankId: string | null | undefined;
  presentDays: number;
  absenceDays: number;
  totalBill: number;
  netPayable: number;
  additionalDeduction?: number | null;
}

interface LunchBillGroup {
  cellName: string;
  records: LunchBillRecord[];
}

interface LunchBillPayload {
  monthName: string;
  groupedData: LunchBillGroup[];
  executivesData?: {
    records: LunchBillRecord[];
    totalDays?: number;
    totalClaim?: number;
    totalDeduction?: number;
    grandTotal?: number;
  };
  workingDays: number;
  totalDaysAll: number;
  totalClaimAll: number;
  totalDeductionAll: number;
  grandTotalAll: number;
  grandTotalInWords: string;
  reportDate: string;
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

function abbreviateDesignation(desig: string | null | undefined): string {
  if (!desig) return '';
  const d = desig.trim();
  const lower = d.toLowerCase();
  
  if (lower.includes('উপ-মহাব্যবস্থাপক') || lower.includes('ডিজিএম') || lower.includes('dgm')) {
    return 'ডিজিএম';
  }
  if (lower.includes('সহকারী মহাব্যবস্থাপক') || lower.includes('এজিএম') || lower.includes('agm')) {
    return 'এজিএম';
  }
  if (lower.includes('মহাব্যবস্থাপক') || lower.includes('জিএম') || lower.includes('gm')) {
    return 'জিএম';
  }
  if (lower.includes('সিনিয়র প্রিন্সিপাল') || lower.includes('এসপিও') || lower.includes('sspo') || lower.includes('spo')) {
    return 'এসপিও';
  }
  if (lower.includes('প্রিন্সিপাল অফিসার') || lower.includes('পিও') || lower.includes('snpo') || lower.includes('po')) {
    return 'পিও';
  }
  if (lower.includes('সিনিয়র অফিসার-আইটি') || lower.includes('সিনিয়র অফিসার (আইটি)') || lower.includes('এসও-আইটি') || lower.includes('so-it') || lower.includes('so_it')) {
    return 'এসও-আইটি';
  }
  if (lower.includes('অফিসার-আইটি') || lower.includes('অফিসার (আইটি)') || lower.includes('ও-আইটি') || lower.includes('o-it') || lower.includes('o_it') || lower.includes('officer-it') || lower.includes('officer (it)')) {
    return 'ও-আইটি';
  }
  return d;
}

export async function POST(request: Request) {
  try {
    const rawPayload = await request.json();
    const parseResult = lunchBillGenerateSchema.safeParse(rawPayload);
    if (!parseResult.success) {
      return handleApiError(parseResult.error);
    }
    const payload = (parseResult.data || {}) as Record<string, any>;

    // Normalize monthName
    const monthName: string = payload.monthName || 
      (payload.monthBangla ? `${payload.monthBangla} ${toBnDigits(payload.yearBangla || '')}`.trim() : '') ||
      'বর্তমান মাস';

    const workingDays: number = Number(payload.workingDays) || 17;
    const reportDate: string = payload.reportDate || new Date().toISOString().split('T')[0];

    // Normalize groupedData / cells
    let rawGroups: any[] = [];
    if (Array.isArray(payload.groupedData) && payload.groupedData.length > 0) {
      rawGroups = payload.groupedData;
    } else if (Array.isArray(payload.cells) && payload.cells.length > 0) {
      rawGroups = payload.cells;
    }

    let groupedData: LunchBillGroup[] = rawGroups.map((c: any) => {
      const cName = c.name || c.cellName || 'সেল';
      const isCbs = cName.includes('CBS');
      
      const records = (c.records || [])
        .filter((r: any) => !r.isExecutive)
        .filter((r: any) => {
          // Strictly exclude Md. Shahinur Rahman from CBS Integrated Development Cell
          if (isCbs && (r.bankId === '018273' || (r.employeeName && r.employeeName.includes('শাহিনুর')))) {
            return false;
          }
          return true;
        })
        .map((r: any) => ({
          employeeName: r.employeeName || r.name || '',
          designation: r.designation || '',
          bankId: r.bankId || '',
          presentDays: Number(r.presentDays) || 0,
          absenceDays: Number(r.absenceDays) || 0,
          totalBill: Number(r.totalBill) || (Number(r.presentDays || 0) * 400),
          netPayable: Number(r.netPayable) || Math.max(0, (Number(r.presentDays || 0) * 400) - (Number(r.presentDays || 0) > 0 ? 15 : 0) - (Number(r.additionalDeduction) || 0)),
          additionalDeduction: Number(r.additionalDeduction) || 0
        }));

      return {
        cellName: cName,
        records
      };
    }).filter((g: any) => g.records.length > 0);

    // Executives are excluded from Lunch Bill per requirements
    const allRecords: LunchBillRecord[] = groupedData.flatMap(g => g.records);

    const computedTotalClaim = allRecords.reduce((sum, r) => sum + (Number(r.totalBill) || 0), 0);
    const computedGrandTotal = allRecords.reduce((sum, r) => sum + (Number(r.netPayable) || 0), 0);

    const totalClaimAll: number = typeof payload.totalClaimAll === 'number' ? payload.totalClaimAll : computedTotalClaim;
    const grandTotalAll: number = typeof payload.grandTotalAll === 'number' ? payload.grandTotalAll : computedGrandTotal;
    const grandTotalInWords: string = payload.grandTotalInWords || getBanglaNumberWords(grandTotalAll);

    let tablesHtml = '';
    let globalIndex = 1;
    let totalEmployeesCount = 0;
    let totalStampAll = 0;
    let totalExtraAll = 0;

    const tableHeaders = `
      <thead>
        <tr>
          <th style="width: 4%;">ক্রমিক</th>
          <th style="width: 18%; text-align: left; padding-left: 3px;">কর্মকর্তার নাম</th>
          <th style="width: 10%;">পদবী</th>
          <th style="width: 10%;">ব্যাংক আইডি</th>
          <th style="width: 8%;">দৈনিক হার</th>
          <th style="width: 8%;">উপস্থিত দিন</th>
          <th style="width: 8%;">অনুপস্থিত দিন (CL)</th>
          <th style="width: 9%;">মোট দাবী</th>
          <th style="width: 8%;">রেভেনিউ স্ট্যাম্প</th>
          <th style="width: 8%;">অতিরিক্ত কর্তন</th>
          <th style="width: 8%;">মোট কর্তন</th>
          <th style="width: 9%;">প্রাপ্তব্য</th>
        </tr>
      </thead>
    `;

    // 1. Render cell groupings (Only cell officers are included)
    if (groupedData && Array.isArray(groupedData)) {
      groupedData.forEach((cellGroup) => {
        if (!cellGroup.records || cellGroup.records.length === 0) return;

        let cellStamp = 0;
        let cellExtra = 0;
        let cellClaim = 0;
        let cellGrand = 0;
        let cellRows = '';

        // Cell Officers Rows
        cellGroup.records.forEach((r) => {
          totalEmployeesCount++;
          const stamp = 15;
          const additional = r.additionalDeduction ?? 0;
          cellStamp += stamp;
          cellExtra += additional;
          cellClaim += r.totalBill;
          cellGrand += r.netPayable;

          totalStampAll += stamp;
          totalExtraAll += additional;

          const totalDed = stamp + additional;
          
          cellRows += `
            <tr>
              <td style="width: 4%;">${toBnDigits(globalIndex++)}</td>
              <td class="text-left font-bold" style="width: 18%;">${r.employeeName}</td>
              <td style="width: 10%;">${abbreviateDesignation(r.designation)}</td>
              <td style="width: 10%; font-family: sans-serif; font-size: 12px;">${r.bankId || '-'}</td>
              <td style="width: 8%;">${toBnDigits(400)}/-</td>
              <td style="width: 8%;">${toBnDigits(r.presentDays)}</td>
              <td style="width: 8%;">${toBnDigits(r.absenceDays)}</td>
              <td class="font-bold" style="width: 9%;">${toBnDigits(r.totalBill)}/-</td>
              <td style="width: 8%;">${toBnDigits(stamp)}/-</td>
              <td style="width: 8%;">${toBnDigits(additional)}/-</td>
              <td class="font-bold" style="width: 8%;">${toBnDigits(totalDed)}/-</td>
              <td class="font-bold" style="width: 9%;">${toBnDigits(r.netPayable)}/-</td>
            </tr>
          `;
        });

        // Add the table for this cell
        tablesHtml += `
          <div style="margin-bottom: 12px; page-break-inside: avoid;">
            <div style="background-color: #f1f5f9; font-weight: bold; text-align: left; padding: 5px 8px; font-size: 12px; border: 1px solid #000; border-bottom: none;">
              ● সেল: ${cellGroup.cellName} (মোট কার্যদিবস: ${toBnDigits(workingDays)} দিন, ${toBnDigits(cellGroup.records.length)} জন কর্মকর্তা)
            </div>
            <table style="margin-top: 0; margin-bottom: 0;">
              ${tableHeaders}
              <tbody>
                ${cellRows}
                <tr style="background-color: #cbd5e1; font-weight: bold; font-size: 12px;">
                  <td colspan="7" style="text-align: right; padding-right: 12px; font-weight: 900; width: 66%;">সর্বমোট (${cellGroup.cellName}) =</td>
                  <td class="font-bold" style="width: 9%;">৳${toBnDigits(cellClaim)}/-</td>
                  <td style="color: #b45309; font-weight: bold; width: 8%;">৳${toBnDigits(cellStamp)}/-</td>
                  <td style="color: #b45309; font-weight: bold; width: 8%;">৳${toBnDigits(cellExtra)}/-</td>
                  <td style="color: #b91c1c; font-weight: 900; width: 8%;">৳${toBnDigits(cellStamp + cellExtra)}/-</td>
                  <td style="color: #15803d; font-weight: 900; width: 9%;">৳${toBnDigits(cellGrand)}/-</td>
                </tr>
              </tbody>
            </table>
          </div>
        `;
      });
    }

    const finalTotalDeduction = totalStampAll + totalExtraAll;

    // 2. Render Departmental/Cell Total Summary at the bottom
    const isSingleCell = groupedData && groupedData.length === 1;
    const summaryLabel = isSingleCell
      ? `সেলের দাবীকৃত টাকার পরিমাণ = ৳${toBnDigits(totalClaimAll)}/-`
      : `সেলের মোট দাবীকৃত টাকার পরিমাণ = ৳${toBnDigits(totalClaimAll)}/-`;

    tablesHtml += `
      <div style="margin-top: 15px; margin-bottom: 12px; page-break-inside: avoid; border: 1.5px solid #000; padding: 10px 14px; background-color: #cbd5e1; text-align: center;">
        <p style="font-size: 13px; font-weight: 900; color: #000; margin: 0; line-height: 1.6;">
          <strong>${summaryLabel}</strong> &nbsp;&nbsp;&nbsp;&nbsp;
          <strong>রেভেনিউ স্ট্যাম্প = ৳${toBnDigits(totalStampAll)}/-</strong> &nbsp;&nbsp;&nbsp;&nbsp;
          <strong>অতিরিক্ত কর্তন = ৳${toBnDigits(totalExtraAll)}/-</strong> &nbsp;&nbsp;&nbsp;&nbsp;
          <strong>মোট কর্তন = ৳${toBnDigits(finalTotalDeduction)}/-</strong> &nbsp;&nbsp;&nbsp;&nbsp;
          <span style="font-size: 15px; color: #15803d; font-weight: 900;">প্রাপ্তব্য = ৳${toBnDigits(grandTotalAll)}/-</span>
        </p>
      </div>
    `;

    const cellDisplayName = isSingleCell ? groupedData[0].cellName : null;
    const pageReportTitle = isSingleCell 
      ? `${monthName} মাসের লাঞ্চ ভাতা বিল শিট - ${cellDisplayName} (মোট কার্যদিবস: ${toBnDigits(workingDays)} দিন)`
      : `${monthName} মাসের লাঞ্চ ভাতা বিল শিট (মোট কার্যদিবস: ${toBnDigits(workingDays)} দিন)`;
    const docRecordName = isSingleCell 
      ? `লাঞ্চ বিল: ${cellDisplayName} (${monthName})`
      : `সমন্বিত লাঞ্চ বিল: ${monthName}`;

    const kalpurushBase64 = getKalpurushBase64();

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${pageReportTitle}</title>
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
  @font-face {
    font-family: 'Kalpurush';
    src: local('Kalpurush'), ${kalpurushBase64 ? `url('data:font/woff2;charset=utf-8;base64,${kalpurushBase64}') format('woff2'), ` : ''}url('/fonts/kalpurush.woff2') format('woff2');
    font-weight: normal;
    font-style: normal;
    font-display: swap;
  }
  @font-face {
    font-family: 'Kalpurush';
    src: local('Kalpurush'), ${kalpurushBase64 ? `url('data:font/woff2;charset=utf-8;base64,${kalpurushBase64}') format('woff2'), ` : ''}url('/fonts/kalpurush.woff2') format('woff2');
    font-weight: bold;
    font-style: normal;
    font-display: swap;
  }
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: 'Kalpurush', 'SolaimanLipi', 'Hind Siliguri', 'Noto Sans Bengali', system-ui, -apple-system, sans-serif;
  }
  @page {
    size: legal portrait;
    margin-top: 0.5in;
    margin-bottom: 0.5in;
    margin-left: 0.5in;
    margin-right: 0.5in;
  }
  body {
    font-family: 'Kalpurush', 'SolaimanLipi', 'Hind Siliguri', 'Noto Sans Bengali', system-ui, -apple-system, sans-serif;
    font-size: 12px;
    line-height: 1.25;
    color: #000;
    background-color: #fff;
  }
  .header-container {
    width: 100%;
    margin-bottom: 12px;
    text-align: center;
    line-height: 1.3;
  }
  .header-main-title {
    font-size: 16px;
    font-weight: bold;
  }
  .header-sub-title {
    font-size: 14px;
    font-weight: bold;
    color: #333;
    margin-top: 1px;
  }
  .header-loc {
    font-size: 12px;
    color: #444;
  }
  .report-meta {
    width: 100%;
    margin-bottom: 8px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    font-weight: bold;
    border-bottom: 1.2px solid #000;
    padding-bottom: 4px;
    font-size: 10px;
  }
  .cell-title {
    font-size: 14px;
    color: #111;
  }
  .report-date {
    font-size: 12px;
  }
  .report-title-box {
    text-align: center;
    margin-bottom: 8px;
  }
  .report-title {
    font-size: 14px;
    font-weight: bold;
    text-decoration: underline;
    display: inline-block;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 6px 0;
    font-size: 12px;
  }
  th, td {
    border: 1px solid #000;
    padding: 4px 3px;
    text-align: center;
    vertical-align: middle;
  }
  th {
    background-color: #f1f5f9;
    font-weight: bold;
  }
  .text-left {
    text-align: left;
    padding-left: 3px;
  }
  .font-bold {
    font-weight: bold;
  }
  .total-row {
    font-weight: bold;
    background-color: #cbd5e1;
  }
  .bill-summary-text {
    margin-top: 8px;
    font-size: 12px;
    line-height: 1.4;
    text-align: justify;
  }
  .deductions-breakdown {
    margin-top: 8px;
    border: 1px solid #000;
    padding: 6px 10px;
    background-color: #f8fafc;
    border-radius: 4px;
    line-height: 1.4;
    font-size: 12px;
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
    html.dark .report-meta,
    html.dark .report-meta *,
    html.dark .cell-title,
    html.dark .report-title-box,
    html.dark .report-title,
    html.dark .bill-summary-text,
    html.dark .bill-summary-text * {
      color: #f8fafc !important;
      border-color: #334155 !important;
    }
    html.dark .total-row {
      background-color: #1e293b !important;
      color: #f8fafc !important;
    }
    /* Override inline style colors in dark mode for readable contrast */
    html.dark [style*="color: #000000"],
    html.dark [style*="color:#000000"],
    html.dark [style*="color: #000"],
    html.dark [style*="color:#000"] {
      color: #f8fafc !important;
    }
    html.dark [style*="color: #c2185b"],
    html.dark [style*="color:#c2185b"] {
      color: #f472b6 !important;
    }
    html.dark [style*="color: #db2777"],
    html.dark [style*="color:#db2777"] {
      color: #f472b6 !important;
    }
    html.dark [style*="color: #b45309"],
    html.dark [style*="color:#b45309"] {
      color: #fbbf24 !important;
    }
    html.dark [style*="color: #15803d"],
    html.dark [style*="color:#15803d"] {
      color: #4ade80 !important;
    }
  }
</style>
</head>
<body>
  <div class="header-container">
    <h1 class="header-main-title">জনতা ব্যাংক পিএলসি.</h1>
    <h2 class="header-sub-title">অনলাইন ব্যাংকিং ডিপার্টমেন্ট</h2>
    <p class="header-loc">প্রধান কার্যালয়, ঢাকা।</p>
  </div>

  <div class="report-meta">
    <span class="cell-title">${isSingleCell ? `লাঞ্চ বিল রিপোর্ট (${cellDisplayName})` : 'লাঞ্চ বিল রিপোর্ট'}</span>
    <span class="report-date">তারিখ: ${getBnDate(reportDate)} ইং</span>
  </div>

  <div class="report-title-box">
    <p class="report-title">${pageReportTitle}</p>
  </div>

  ${tablesHtml}

  <!-- Deductions detailed breakdown box -->
  <div class="deductions-breakdown">
    <p style="font-weight: bold; margin-bottom: 2px;">● কর্তনের বিস্তারিত বিবরণী:</p>
    <p style="margin-left: 12px;">- রেভেনিউ স্ট্যাম্প কর্তন (১৫/- টাকা হারে মোট ${toBnDigits(totalEmployeesCount)} জনের): <strong>৳${toBnDigits(totalStampAll)}/-</strong></p>
    <p style="margin-left: 12px;">- অতিরিক্ত কর্তন (ডিজিএম/নির্বাহী নির্দেশানুযায়ী): <strong>৳${toBnDigits(totalExtraAll)}/-</strong></p>
    <p style="margin-left: 12px; font-weight: bold; border-top: 1px dashed #000; padding-top: 2px; margin-top: 2px; width: fit-content;">
      = সর্বমোট কর্তন (RS+EXTRA): <strong>৳${toBnDigits(finalTotalDeduction)}/-</strong>
    </p>
  </div>

  <div class="bill-summary-text">
    <p>কথায়: <strong>${grandTotalInWords}</strong>।</p>
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

    const safeCellName = (cellDisplayName || 'cell').replace(/[^a-zA-Z0-9_\-\u0980-\u09FF]/g, '_');
    const safeMonthName = (monthName || 'month').replace(/[^a-zA-Z0-9_\-\u0980-\u09FF]/g, '_');
    const filePrefix = isSingleCell ? `lunch_bill_${safeCellName}` : `lunch_bill_combined`;
    const filename = `${filePrefix}_${safeMonthName}_${Math.floor(Date.now() / 1000)}.html`;
    const filePathDisk = path.join(uploadsDir, filename);
    fs.writeFileSync(filePathDisk, htmlContent, 'utf-8');

    const relativePath = `/uploads/${filename}`;
    const fileSize = fs.statSync(filePathDisk).size;

    // Check if a document with this file path already exists
    const docResult = await db.select().from(documents)
      .where(eq(documents.filePath, relativePath))
      .limit(1);
    let doc = docResult[0] || null;

    if (doc) {
      const [updated] = await db.update(documents)
        .set({
          fileSize: fileSize,
          uploadedAt: new Date()
        })
        .where(eq(documents.id, doc.id))
        .returning();
      doc = updated;
    } else {
      const [inserted] = await db.insert(documents).values({
        name: docRecordName,
        filePath: relativePath,
        fileSize: fileSize
      }).returning();
      doc = inserted;
    }

    return NextResponse.json({
      success: true,
      filePath: relativePath,
      document: doc
    });

  } catch (error) {
    logger.error('Error generating lunch bill document:', error);
    return NextResponse.json({ error: 'failed_to_generate_lunch_bill', message: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
}
