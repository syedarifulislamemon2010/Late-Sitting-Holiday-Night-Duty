import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { documents } from '@/db/schema';
import fs from 'fs';
import path from 'path';

interface ClosingBillRecord {
  employeeName: string;
  designation: string | null | undefined;
  bankId: string | null | undefined;
}

interface ClosingBillGroup {
  cellName: string;
  records: ClosingBillRecord[];
}

interface ClosingBillPayload {
  monthName: string;
  groupedData: ClosingBillGroup[];
  executivesData?: {
    records: ClosingBillRecord[];
    totalClaim?: number;
    totalDeduction?: number;
    grandTotal?: number;
  };
  totalEmployeesCount: number;
  totalClaimAll: number;
  totalStampAll: number;
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
    const payload = (await request.json()) as ClosingBillPayload;
    const {
      monthName,
      groupedData, // Array of: { cellName, records, totalClaim, totalDeduction, grandTotal }
      executivesData, // { records, totalClaim, totalDeduction, grandTotal }
      totalEmployeesCount,
      totalClaimAll,
      totalStampAll,
      grandTotalAll,
      grandTotalInWords,
      reportDate
    } = payload;

    let tablesHtml = '';
    let globalIndex = 1;

    const tableHeaders = `
      <thead>
        <tr>
          <th style="width: 5%;">ক্রমিক</th>
          <th style="width: 25%; text-align: left; padding-left: 3px;">কর্মকর্তার নাম</th>
          <th style="width: 15%;">পদবী</th>
          <th style="width: 15%;">ব্যাংক আইডি</th>
          <th style="width: 13%;">ভাতার পরিমাণ</th>
          <th style="width: 13%;">রেভেনিউ স্ট্যাম্প</th>
          <th style="width: 14%;">প্রাপ্তব্য</th>
        </tr>
      </thead>
    `;

    // 1. Render DGM & AGM Executives
    if (executivesData && executivesData.records && executivesData.records.length > 0) {
      executivesData.records = [...executivesData.records].sort((a, b) => {
        const priority = (desig: string | null | undefined) => {
          if (!desig) return 3;
          const d = desig.toLowerCase();
          if (d.includes('উপ-মহাব্যবস্থাপক') || d.includes('ডিজিএম') || d.includes('dgm')) return 1;
          if (d.includes('সহকারী মহাব্যবস্থাপক') || d.includes('এজিএম') || d.includes('agm')) return 2;
          return 3;
        };
        const pA = priority(a.designation);
        const pB = priority(b.designation);
        if (pA !== pB) return pA - pB;
        return (a.bankId || '').localeCompare(b.bankId || '', undefined, { numeric: true, sensitivity: 'base' });
      });

      let execClaim = 0;
      let execStamp = 0;
      let execGrand = 0;
      let execRows = '';

      let dgmCount = 0;
      let agmCount = 0;
      executivesData.records.forEach((r) => {
        const lowerDesig = (r.designation || '').toLowerCase();
        if (lowerDesig.includes('ডিজিএম') || lowerDesig.includes('dgm') || lowerDesig.includes('উপ-মহাব্যবস্থাপক')) {
          dgmCount++;
        } else if (lowerDesig.includes('এজিএম') || lowerDesig.includes('agm') || lowerDesig.includes('সহকারী মহাব্যবস্থাপক')) {
          agmCount++;
        } else {
          agmCount++;
        }
      });
      const totalExec = dgmCount + agmCount;

      executivesData.records.forEach((r) => {
        execClaim += 2000;
        execStamp += 15;
        execGrand += 1985;

        execRows += `
          <tr style="background-color: #fffdfd;">
            <td style="width: 5%;">${toBnDigits(globalIndex++)}</td>
            <td class="text-left font-bold" style="color: #c2185b; width: 25%;">${r.employeeName}</td>
            <td style="color: #c2185b; font-weight: bold; width: 15%;">${abbreviateDesignation(r.designation)}</td>
            <td style="color: #c2185b; font-family: sans-serif; font-size: 12px; width: 15%;">${r.bankId || '-'}</td>
            <td style="width: 13%;">${toBnDigits(2000)}/-</td>
            <td style="width: 13%;">${toBnDigits(15)}/-</td>
            <td class="font-bold" style="width: 14%;">${toBnDigits(1985)}/-</td>
          </tr>
        `;
      });

      tablesHtml += `
        <div style="margin-bottom: 12px; page-break-inside: avoid;">
          <div style="background-color: #fdf2f8; font-weight: bold; text-align: left; padding: 5px 8px; font-size: 12px; border: 1px solid #000; border-bottom: none; color: #db2777;">
            ● নির্বাহী প্যানেল (ডিজিএম ${toBnDigits(dgmCount)} জন + এজিএম ${toBnDigits(agmCount)} জন = মোট ${toBnDigits(totalExec)} জন নির্বাহী)
          </div>
          <table style="margin-top: 0; margin-bottom: 0;">
            ${tableHeaders}
            <tbody>
              ${execRows}
              <tr style="background-color: #ffe4e6; font-weight: bold; font-size: 12px;">
                <td colspan="4" style="text-align: right; padding-right: 12px; font-weight: 900; color: #db2777; width: 60%;">সর্বমোট (নির্বাহী প্যানেল) =</td>
                <td class="font-bold" style="color: #db2777; width: 13%;">৳${toBnDigits(execClaim)}/-</td>
                <td style="color: #b45309; font-weight: bold; width: 13%;">৳${toBnDigits(execStamp)}/-</td>
                <td style="color: #db2777; font-weight: 900; width: 14%;">৳${toBnDigits(execGrand)}/-</td>
              </tr>
            </tbody>
          </table>
        </div>
      `;
    }

    // 2. Render cell groupings
    if (groupedData && Array.isArray(groupedData)) {
      groupedData.forEach((cellGroup) => {
        if (!cellGroup.records || cellGroup.records.length === 0) return;

        let cellClaim = 0;
        let cellStamp = 0;
        let cellGrand = 0;
        let cellRows = '';

        cellGroup.records.forEach((r) => {
          cellClaim += 2000;
          cellStamp += 15;
          cellGrand += 1985;
          
          cellRows += `
            <tr>
              <td style="width: 5%;">${toBnDigits(globalIndex++)}</td>
              <td class="text-left font-bold" style="width: 25%;">${r.employeeName}</td>
              <td style="width: 15%;">${abbreviateDesignation(r.designation)}</td>
              <td style="width: 15%; font-family: sans-serif; font-size: 12px;">${r.bankId || '-'}</td>
              <td style="width: 13%;">${toBnDigits(2000)}/-</td>
              <td style="width: 13%;">${toBnDigits(15)}/-</td>
              <td class="font-bold" style="width: 14%;">${toBnDigits(1985)}/-</td>
            </tr>
          `;
        });

        tablesHtml += `
          <div style="margin-bottom: 12px; page-break-inside: avoid;">
            <div style="background-color: #f1f5f9; font-weight: bold; text-align: left; padding: 5px 8px; font-size: 12px; border: 1px solid #000; border-bottom: none;">
              ● সেল: ${cellGroup.cellName} (${toBnDigits(cellGroup.records.length)} জন কর্মকর্তা)
            </div>
            <table style="margin-top: 0; margin-bottom: 0;">
              ${tableHeaders}
              <tbody>
                ${cellRows}
                <tr style="background-color: #cbd5e1; font-weight: bold; font-size: 12px;">
                  <td colspan="4" style="text-align: right; padding-right: 12px; font-weight: 900; width: 60%;">সর্বমোট (${cellGroup.cellName}) =</td>
                  <td class="font-bold" style="width: 13%;">৳${toBnDigits(cellClaim)}/-</td>
                  <td style="color: #b45309; font-weight: bold; width: 13%;">৳${toBnDigits(cellStamp)}/-</td>
                  <td style="color: #15803d; font-weight: 900; width: 14%;">৳${toBnDigits(cellGrand)}/-</td>
                </tr>
              </tbody>
            </table>
          </div>
        `;
      });
    }

    // 3. Render Grand Departmental Total Summary at the bottom
    tablesHtml += `
      <div style="margin-top: 15px; margin-bottom: 12px; page-break-inside: avoid; border: 1.5px solid #000; padding: 10px 14px; background-color: #cbd5e1; text-align: center;">
        <p style="font-size: 14px; font-weight: 900; color: #000; margin: 0; line-height: 1.6;">
          <strong>সেলের প্রাপ্তব্য টাকার পরিমাণ = ৳${toBnDigits(totalClaimAll)}/-</strong> &nbsp;&nbsp;&nbsp;&nbsp;
          <strong>রেভেনিউ স্ট্যাম্প = ৳${toBnDigits(totalStampAll)}/-</strong> &nbsp;&nbsp;&nbsp;&nbsp;
          <span style="font-size: 16px; color: #15803d; font-weight: 900;">প্রাপ্তব্য = ৳${toBnDigits(grandTotalAll)}/-</span>
        </p>
      </div>
    `;

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
  }
  @page {
    size: legal portrait;
    margin-top: 0.5in;
    margin-bottom: 0.5in;
    margin-left: 0.5in;
    margin-right: 0.5in;
  }
  body {
    font-family: 'SolaimanLipi', 'Hind Siliguri', 'Noto Sans Bengali', system-ui, -apple-system, sans-serif;
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
    html.dark .deductions-breakdown {
      background-color: #1e293b !important;
      border-color: #334155 !important;
      color: #f8fafc !important;
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
  <div class="report-meta" style="margin-top: 10px;">
    <span class="cell-title">ক্লোজিং বিল রিপোর্ট</span>
    <div style="text-align: right;">
      <div style="font-size: 14px; font-weight: bold; margin-bottom: 2px;">অনলাইন ব্যাংকিং ডিপার্টমেন্ট</div>
      <span class="report-date">তারিখ: ${getBnDate(reportDate)} ইং</span>
    </div>
  </div>

  <div class="report-title-box">
    <p class="report-title">${monthName} মাসের ক্লোজিং ভাতা বিল শিট</p>
  </div>

  ${tablesHtml}

  <!-- Deductions detailed breakdown box -->
  <div class="deductions-breakdown">
    <p style="font-weight: bold; margin-bottom: 2px;">● কর্তনের বিস্তারিত বিবরণী:</p>
    <p style="margin-left: 12px;">- রেভেনিউ স্ট্যাম্প কর্তন (১৫/- টাকা হারে মোট ${toBnDigits(totalEmployeesCount)} জনের): <strong>৳${toBnDigits(totalStampAll)}/-</strong></p>
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
    const filename = `closing_bill_combined_${monthName.replace(/\s+/g, '_')}_${Math.floor(Date.now() / 1000)}.html`;
    const filePathDisk = path.join(uploadsDir, filename);
    fs.writeFileSync(filePathDisk, htmlContent, 'utf-8');

    const relativePath = `/uploads/${filename}`;
    const fileSize = fs.statSync(filePathDisk).size;

    // Save under the Document archive
    const [doc] = await db.insert(documents).values({
      name: `সমন্বিত ক্লোজিং বিল: ${monthName}`,
      filePath: relativePath,
      fileSize: fileSize
    }).returning();

    return NextResponse.json({
      success: true,
      filePath: relativePath,
      document: doc
    });
  } catch (error) {
    console.error('Error generating closing bill document:', error);
    return NextResponse.json({ error: 'failed_to_generate_closing_bill', message: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
}
