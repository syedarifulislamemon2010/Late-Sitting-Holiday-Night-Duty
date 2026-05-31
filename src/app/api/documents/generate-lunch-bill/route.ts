import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

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
    const payload = await request.url.includes('generate-lunch-bill') ? await request.json() : {};
    const {
      monthName,
      groupedData, // Array of: { cellName, records, totalDays, totalClaim, totalDeduction, grandTotal }
      executivesData, // { records, totalDays, totalClaim, totalDeduction, grandTotal }
      workingDays,
      totalDaysAll,
      totalClaimAll,
      totalDeductionAll,
      grandTotalAll,
      grandTotalInWords,
      reportDate
    } = payload;

    let rowsHtml = '';
    let globalIndex = 1;
    let totalEmployeesCount = 0;
    let totalStampAllowances = 0;
    let totalExtraAllowances = 0;

    // 1. Render cell groupings
    if (groupedData && Array.isArray(groupedData)) {
      groupedData.forEach((cellGroup: any) => {
        if (!cellGroup.records || cellGroup.records.length === 0) return;

        // Group Header
        rowsHtml += `
          <tr class="group-header-row">
            <td colspan="8" style="background-color: #f1f5f9; font-weight: bold; text-align: left; padding: 6px 12px; font-size: 11px;">
              ● সেল: ${cellGroup.cellName}
            </td>
          </tr>
        `;

        // Cell Officers Rows
        cellGroup.records.forEach((r: any) => {
          totalEmployeesCount++;
          const stamp = 15;
          const additional = r.additionalDeduction ?? 0;
          totalExtraAllowances += additional;
          const totalDed = stamp + additional;
          
          rowsHtml += `
            <tr>
              <td>${toBnDigits(globalIndex++)}</td>
              <td class="text-left font-bold">${r.employeeName}</td>
              <td>${r.designation}</td>
              <td>${toBnDigits(400)}/-</td>
              <td>${toBnDigits(r.presentDays)}</td>
              <td class="font-bold">${toBnDigits(r.totalBill)}/-</td>
              <td class="font-bold">${toBnDigits(totalDed)}/-</td>
              <td class="font-bold">${toBnDigits(r.netPayable)}/-</td>
            </tr>
          `;
        });

        // Cell Sub-total Row
        rowsHtml += `
          <tr class="subtotal-row" style="background-color: #f8fafc; font-weight: bold; font-size: 10px;">
            <td colspan="4" style="text-align: right; padding-right: 12px;">সাব-টোটাল (${cellGroup.cellName}) =</td>
            <td>${toBnDigits(cellGroup.totalDays)}</td>
            <td>${toBnDigits(cellGroup.totalClaim)}/-</td>
            <td>${toBnDigits(cellGroup.totalDeduction)}/-</td>
            <td>${toBnDigits(cellGroup.grandTotal)}/-</td>
          </tr>
        `;
      });
    }

    // 2. Render DGM & AGM Executives
    if (executivesData && executivesData.records && executivesData.records.length > 0) {
      // Group Header
      rowsHtml += `
        <tr class="group-header-row">
          <td colspan="8" style="background-color: #fdf2f8; font-weight: bold; text-align: left; padding: 6px 12px; font-size: 11px; color: #db2777;">
            ● নির্বাহী প্যানেল (ডিজিএম ও এজিএম)
          </td>
        </tr>
      `;

      // Executive Rows
      executivesData.records.forEach((r: any) => {
        totalEmployeesCount++;
        const stamp = 15;
        const additional = r.additionalDeduction ?? 0;
        totalExtraAllowances += additional;
        const totalDed = stamp + additional;

        rowsHtml += `
          <tr style="background-color: #fffdfd;">
            <td>${toBnDigits(globalIndex++)}</td>
            <td class="text-left font-bold" style="color: #c2185b;">${r.employeeName}</td>
            <td style="color: #c2185b; font-weight: bold;">${r.designation}</td>
            <td>${toBnDigits(400)}/-</td>
            <td>${toBnDigits(r.presentDays)}</td>
            <td class="font-bold">${toBnDigits(r.totalBill)}/-</td>
            <td class="font-bold">${toBnDigits(totalDed)}/-</td>
            <td class="font-bold">${toBnDigits(r.netPayable)}/-</td>
          </tr>
        `;
      });

      // Executive Sub-total Row
      rowsHtml += `
        <tr class="subtotal-row" style="background-color: #fff1f2; font-weight: bold; font-size: 10px;">
          <td colspan="4" style="text-align: right; padding-right: 12px; color: #db2777;">সাব-টোটাল (নির্বাহী প্যানেল) =</td>
          <td>${toBnDigits(executivesData.totalDays)}</td>
          <td>${toBnDigits(executivesData.totalClaim)}/-</td>
          <td>${toBnDigits(executivesData.totalDeduction)}/-</td>
          <td>${toBnDigits(executivesData.grandTotal)}/-</td>
        </tr>
      `;
    }

    totalStampAllowances = totalEmployeesCount * 15;
    const finalTotalDeduction = totalStampAllowances + totalExtraAllowances;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;700&display=swap" rel="stylesheet">
<style>
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  @page {
    size: A4 portrait;
    margin-top: 0.5in;
    margin-bottom: 0.6in;
    margin-left: 0.6in;
    margin-right: 0.4in;
  }
  body {
    font-family: "Noto Sans Bengali", "Kalpurush", sans-serif;
    font-size: 10px;
    line-height: 1.2;
    color: #000;
    background-color: #fff;
  }
  .header-container {
    width: 100%;
    margin-bottom: 16px;
    text-align: center;
    line-height: 1.3;
  }
  .header-main-title {
    font-size: 15px;
    font-weight: bold;
  }
  .header-sub-title {
    font-size: 11px;
    font-weight: bold;
    color: #333;
    margin-top: 1px;
  }
  .header-loc {
    font-size: 9px;
    color: #444;
  }
  .report-meta {
    width: 100%;
    margin-bottom: 8px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    font-weight: bold;
    border-bottom: 1.5px solid #000;
    padding-bottom: 4px;
  }
  .cell-title {
    font-size: 12px;
    color: #111;
  }
  .report-date {
    font-size: 9px;
  }
  .report-title-box {
    text-align: center;
    margin-bottom: 12px;
  }
  .report-title {
    font-size: 12px;
    font-weight: bold;
    text-decoration: underline;
    display: inline-block;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 8px 0;
    font-size: 9.5px;
  }
  th, td {
    border: 1px solid #000;
    padding: 6px 4px;
    text-align: center;
    vertical-align: middle;
  }
  th {
    background-color: #f1f5f9;
    font-weight: bold;
  }
  .text-left {
    text-align: left;
    padding-left: 8px;
  }
  .font-bold {
    font-weight: bold;
  }
  .total-row {
    font-weight: bold;
    background-color: #cbd5e1;
  }
  .bill-summary-text {
    margin-top: 12px;
    font-size: 10px;
    line-height: 1.5;
    text-align: justify;
  }
  .deductions-breakdown {
    margin-top: 12px;
    border: 1px solid #000;
    padding: 8px 12px;
    background-color: #f8fafc;
    border-radius: 6px;
    line-height: 1.5;
    font-size: 9.5px;
  }
  .signature-container {
    width: 100%;
    margin-top: 0.8in;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }
  .signature-block {
    text-align: center;
    width: 30%;
  }
  .signature-line {
    border-top: 1px solid #000;
    margin-bottom: 4px;
    width: 80%;
    margin-left: auto;
    margin-right: auto;
  }
  .signature-title {
    font-weight: bold;
    font-size: 9.5px;
  }
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
</style>
</head>
<body>
  <div class="header-container">
    <p class="header-main-title">অনলাইন ব্যাংকিং ডিপার্টমেন্ট</p>
    <p class="header-sub-title">জনতা ব্যাংক পিএলসি.</p>
    <p class="header-loc">প্রধান কার্যালয়, ঢাকা।</p>
  </div>

  <div class="report-meta">
    <span class="cell-title">সমন্বিত বিভাগীয় লাঞ্চ বিল রিপোর্ট</span>
    <span class="report-date">তারিখ: ${getBnDate(reportDate)} ইং</span>
  </div>

  <div class="report-title-box">
    <p class="report-title">${monthName} মাসের লাঞ্চ ভাতা বিল শিট (মোট কার্যদিবস: ${toBnDigits(workingDays)} দিন)</p>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 6%;">ক্রমিক</th>
        <th style="width: 25%; text-align: left; padding-left: 8px;">কর্মকর্তার নাম</th>
        <th style="width: 14%;">পদবী</th>
        <th style="width: 11%;">দৈনিক হার</th>
        <th style="width: 10%;">উপস্থিতি</th>
        <th style="width: 12%;">মোট দাবী</th>
        <th style="width: 12%;">RS+EXTRA কর্তন</th>
        <th style="width: 10%;">প্রাপ্তব্য</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
      
      <!-- ১. সর্বমোট দাবী রো -->
      <tr style="background-color: #f1f5f9; font-weight: bold; font-size: 10px;">
        <td colspan="4" style="text-align: right; padding-right: 12px;">সর্বমোট দাবী (১ থেকে ${toBnDigits(totalEmployeesCount)} নং কলামের কর্মকর্তা ও নির্বাহী) =</td>
        <td>${toBnDigits(totalDaysAll)}</td>
        <td>${toBnDigits(totalClaimAll)}/-</td>
        <td>-</td>
        <td>-</td>
      </tr>
      <!-- ২. রেভেনিউ স্ট্যাম্প কর্তন রো -->
      <tr style="background-color: #fffdfd; font-weight: bold; font-size: 10px;">
        <td colspan="6" style="text-align: right; padding-right: 12px;">রেভেনিউ স্ট্যাম্প কর্তন (১৫/- টাকা হারে মোট ${toBnDigits(totalEmployeesCount)} জনের) =</td>
        <td style="color: #b45309; font-weight: bold;">৳${toBnDigits(totalStampAllowances)}/-</td>
        <td>-</td>
      </tr>
      <!-- ৩. অতিরিক্ত কর্তন রো -->
      <tr style="background-color: #fffdfd; font-weight: bold; font-size: 10px;">
        <td colspan="6" style="text-align: right; padding-right: 12px;">অতিরিক্ত কর্তন (ডিজিএম/নির্বাহী নির্দেশানুযায়ী) =</td>
        <td style="color: #b45309; font-weight: bold;">৳${toBnDigits(totalExtraAllowances)}/-</td>
        <td>-</td>
      </tr>
      <!-- ৪. সর্বমোট কর্তন ও সর্বমোট প্রাপ্তব্য রো -->
      <tr style="background-color: #cbd5e1; font-weight: 900; font-size: 11px;">
        <td colspan="6" style="text-align: right; padding-right: 12px; font-weight: bold;">সর্বমোট কর্তন ও সর্বমোট প্রাপ্তব্য সমষ্টি (Grand Total) =</td>
        <td style="color: #b91c1c; font-weight: bold;">৳${toBnDigits(finalTotalDeduction)}/-</td>
        <td style="color: #15803d; font-weight: bold;">৳${toBnDigits(grandTotalAll)}/-</td>
      </tr>
    </tbody>
  </table>

  <!-- Deductions detailed breakdown box -->
  <div class="deductions-breakdown">
    <p style="font-weight: bold; margin-bottom: 2px;">● কর্তনের বিস্তারিত বিবরণী:</p>
    <p style="margin-left: 12px;">- রেভেনিউ স্ট্যাম্প কর্তন (১৫/- টাকা হারে মোট ${toBnDigits(totalEmployeesCount)} জনের): <strong>৳${toBnDigits(totalStampAllowances)}/-</strong></p>
    <p style="margin-left: 12px;">- অতিরিক্ত কর্তন (ডিজিএম/নির্বাহী নির্দেশানুযায়ী): <strong>৳${toBnDigits(totalExtraAllowances)}/-</strong></p>
    <p style="margin-left: 12px; font-weight: bold; border-top: 1px dashed #000; padding-top: 2px; margin-top: 2px; width: fit-content;">
      = সর্বমোট কর্তন (RS+EXTRA): <strong>৳${toBnDigits(finalTotalDeduction)}/-</strong>
    </p>
  </div>

  <div class="bill-summary-text">
    <p>কথায়: <strong>${grandTotalInWords}</strong>।</p>
    <p style="margin-top: 4px;">অনলাইন ব্যাংকিং ডিপার্টমেন্টের উপযুক্ত কর্মকর্তা ও নির্বাহীদের খাবার ভাতার বিল প্রস্তুত করা হলো এবং বিধি মোতাবেক কর্তন সম্পন্ন করে প্রাপ্তব্য টাকা প্রদানের জন্য সুপারিশ করা হলো।</p>
  </div>

  <div class="signature-container">
    <div class="signature-block">
      <div class="signature-line"></div>
      <p class="signature-title">প্রস্তুতকারী কর্মকর্তা</p>
      <p style="font-size: 8px; color: #444; margin-top: 2px;">অনলাইন ব্যাংকিং ডিপার্টমেন্ট</p>
    </div>
    <div class="signature-block">
      <div class="signature-line"></div>
      <p class="signature-title">যাচাইকারী কর্মকর্তা (এজিএম)</p>
      <p style="font-size: 8px; color: #444; margin-top: 2px;">অনলাইন ব্যাংকিং ডিপার্টমেন্ট</p>
    </div>
    <div class="signature-block">
      <div class="signature-line"></div>
      <p class="signature-title">উপ-মহাব্যবস্থাপক</p>
      <p style="font-size: 8px; color: #444; margin-top: 2px;">অনলাইন ব্যাংকিং ডিপার্টমেন্ট</p>
    </div>
  </div>
  
  <script>
    window.onload = function() {
      window.print();
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

    const filename = `lunch_bill_combined_${monthName.replace(/\s+/g, '_')}_${Math.floor(Date.now() / 1000)}.html`;
    const filePathDisk = path.join(uploadsDir, filename);
    fs.writeFileSync(filePathDisk, htmlContent, 'utf-8');

    const relativePath = `/uploads/${filename}`;
    const fileSize = fs.statSync(filePathDisk).size;

    // Check if a document with this file path already exists
    let doc = await prisma.document.findFirst({
      where: { filePath: relativePath }
    });

    if (doc) {
      doc = await prisma.document.update({
        where: { id: doc.id },
        data: {
          fileSize: fileSize,
          uploadedAt: new Date()
        }
      });
    } else {
      doc = await prisma.document.create({
        data: {
          name: `সমন্বিত লাঞ্চ বিল: ${monthName}`,
          filePath: relativePath,
          fileSize: fileSize
        }
      });
    }

    return NextResponse.json({
      success: true,
      filePath: relativePath,
      document: doc
    });

  } catch (error: any) {
    console.error('Error generating lunch bill document:', error);
    return NextResponse.json({ error: 'failed_to_generate_lunch_bill', message: error.message }, { status: 500 });
  }
}
