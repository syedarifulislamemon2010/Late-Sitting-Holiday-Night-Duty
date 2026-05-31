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
    let totalStampAll = 0;
    let totalExtraAll = 0;

    // 1. Render cell groupings
    if (groupedData && Array.isArray(groupedData)) {
      groupedData.forEach((cellGroup: any) => {
        if (!cellGroup.records || cellGroup.records.length === 0) return;

        // Group Header
        rowsHtml += `
          <tr class="group-header-row">
            <td colspan="13" style="background-color: #f1f5f9; font-weight: bold; text-align: left; padding: 6px 12px; font-size: 11px;">
              ● সেল: ${cellGroup.cellName}
            </td>
          </tr>
        `;

        let cellStamp = 0;
        let cellExtra = 0;
        let cellClaim = 0;
        let cellGrand = 0;

        // Cell Officers Rows
        cellGroup.records.forEach((r: any) => {
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
          
          rowsHtml += `
            <tr>
              <td>${toBnDigits(globalIndex++)}</td>
              <td class="text-left font-bold">${r.employeeName}</td>
              <td>${r.designation}</td>
              <td>${toBnDigits(400)}/-</td>
              <td>${toBnDigits(r.absenceDays)}</td>
              <td>${toBnDigits(r.presentDays)}</td>
              <td class="font-bold">${toBnDigits(r.totalBill)}/-</td>
              <td>${toBnDigits(stamp)}/-</td>
              <td>${toBnDigits(additional)}/-</td>
              <td class="font-bold">${toBnDigits(totalDed)}/-</td>
              <td class="font-bold">${toBnDigits(r.netPayable)}/-</td>
              <td style="height: 32px; vertical-align: bottom;"><span style="font-size: 7.5px; color: #888; border-top: 0.5px dashed #bbb; width: 85%; display: block; margin: 0 auto 2px auto;">স্বাক্ষর</span></td>
              <td style="text-align: left; padding-left: 4px; font-size: 8px;">${r.remarks || ''}</td>
            </tr>
          `;
        });

        // Cell Sub-total Multi-rows (১ থেকে ৬ কলাম ও সেল ওয়াইজ আলাদা হিসেব)
        rowsHtml += `
          <!-- ১. মোট দাবী রো -->
          <tr style="background-color: #f8fafc; font-weight: bold; font-size: 9px;">
            <td colspan="6" style="text-align: right; padding-right: 12px;">সর্বমোট দাবী (১ থেকে ${toBnDigits(cellGroup.records.length)} নং কর্মকর্তা) =</td>
            <td class="font-bold">${toBnDigits(cellClaim)}/-</td>
            <td colspan="6">-</td>
          </tr>
          <!-- ২. রেভেনিউ স্ট্যাম্প রো -->
          <tr style="background-color: #fffdfd; font-weight: bold; font-size: 9px;">
            <td colspan="7" style="text-align: right; padding-right: 12px;">রেভেনিউ স্ট্যাম্প কর্তন (১৫/- টাকা হারে মোট ${toBnDigits(cellGroup.records.length)} জনের) =</td>
            <td style="color: #b45309;">৳${toBnDigits(cellStamp)}/-</td>
            <td colspan="5">-</td>
          </tr>
          <!-- ৩. অতিরিক্ত কর্তন রো -->
          <tr style="background-color: #fffdfd; font-weight: bold; font-size: 9px;">
            <td colspan="8" style="text-align: right; padding-right: 12px;">সর্বমোট অতিরিক্ত কর্তন =</td>
            <td style="color: #b45309;">৳${toBnDigits(cellExtra)}/-</td>
            <td colspan="4">-</td>
          </tr>
          <!-- ৪. মোট কর্তন রো -->
          <tr style="background-color: #f1f5f9; font-weight: bold; font-size: 9px;">
            <td colspan="9" style="text-align: right; padding-right: 12px;">সর্বমোট কর্তন =</td>
            <td style="color: #b91c1c;">৳${toBnDigits(cellStamp + cellExtra)}/-</td>
            <td colspan="3">-</td>
          </tr>
          <!-- ৫. প্রাপ্তব্য রো -->
          <tr style="background-color: #cbd5e1; font-weight: bold; font-size: 9.5px;">
            <td colspan="10" style="text-align: right; padding-right: 12px; font-weight: 900;">সর্বমোট প্রাপ্তব্য (${cellGroup.cellName}) =</td>
            <td style="color: #15803d; font-weight: 900;">৳${toBnDigits(cellGrand)}/-</td>
            <td colspan="2">-</td>
          </tr>
        `;
      });
    }

    // 2. Render DGM & AGM Executives
    if (executivesData && executivesData.records && executivesData.records.length > 0) {
      // Group Header
      rowsHtml += `
        <tr class="group-header-row">
          <td colspan="13" style="background-color: #fdf2f8; font-weight: bold; text-align: left; padding: 6px 12px; font-size: 11px; color: #db2777;">
            ● নির্বাহী প্যানেল (ডিজিএম ও এজিএম)
          </td>
        </tr>
      `;

      let execStamp = 0;
      let execExtra = 0;
      let execClaim = 0;
      let execGrand = 0;

      // Executive Rows
      executivesData.records.forEach((r: any) => {
        totalEmployeesCount++;
        const stamp = 15;
        const additional = r.additionalDeduction ?? 0;
        execStamp += stamp;
        execExtra += additional;
        execClaim += r.totalBill;
        execGrand += r.netPayable;

        totalStampAll += stamp;
        totalExtraAll += additional;

        const totalDed = stamp + additional;

        rowsHtml += `
          <tr style="background-color: #fffdfd;">
            <td>${toBnDigits(globalIndex++)}</td>
            <td class="text-left font-bold" style="color: #c2185b;">${r.employeeName}</td>
            <td style="color: #c2185b; font-weight: bold;">${r.designation}</td>
            <td>${toBnDigits(400)}/-</td>
            <td>${toBnDigits(r.absenceDays)}</td>
            <td>${toBnDigits(r.presentDays)}</td>
            <td class="font-bold">${toBnDigits(r.totalBill)}/-</td>
            <td>${toBnDigits(stamp)}/-</td>
            <td>${toBnDigits(additional)}/-</td>
            <td class="font-bold">${toBnDigits(totalDed)}/-</td>
            <td class="font-bold">${toBnDigits(r.netPayable)}/-</td>
            <td style="height: 32px; vertical-align: bottom;"><span style="font-size: 7.5px; color: #888; border-top: 0.5px dashed #bbb; width: 85%; display: block; margin: 0 auto 2px auto;">স্বাক্ষর</span></td>
            <td style="text-align: left; padding-left: 4px; font-size: 8px;">${r.remarks || ''}</td>
          </tr>
        `;
      });

      // Executive Sub-total Multi-rows
      rowsHtml += `
        <!-- ১. মোট দাবী রো -->
        <tr style="background-color: #fff1f2; font-weight: bold; font-size: 9px;">
          <td colspan="6" style="text-align: right; padding-right: 12px; color: #db2777;">সর্বমোট দাবী (নির্বাহী প্যানেল) =</td>
          <td class="font-bold" style="color: #db2777;">${toBnDigits(execClaim)}/-</td>
          <td colspan="6">-</td>
        </tr>
        <!-- ২. রেভেনিউ স্ট্যাম্প রো -->
        <tr style="background-color: #fffdfd; font-weight: bold; font-size: 9px;">
          <td colspan="7" style="text-align: right; padding-right: 12px; color: #db2777;">রেভেনিউ স্ট্যাম্প কর্তন (১৫/- টাকা হারে মোট ${toBnDigits(executivesData.records.length)} জনের) =</td>
          <td style="color: #b45309;">৳${toBnDigits(execStamp)}/-</td>
          <td colspan="5">-</td>
        </tr>
        <!-- ৩. অতিরিক্ত কর্তন রো -->
        <tr style="background-color: #fffdfd; font-weight: bold; font-size: 9px;">
          <td colspan="8" style="text-align: right; padding-right: 12px; color: #db2777;">সর্বমোট অতিরিক্ত কর্তন =</td>
          <td style="color: #b45309;">৳${toBnDigits(execExtra)}/-</td>
          <td colspan="4">-</td>
        </tr>
        <!-- ৪. মোট কর্তন রো -->
        <tr style="background-color: #fff1f2; font-weight: bold; font-size: 9px;">
          <td colspan="9" style="text-align: right; padding-right: 12px; color: #db2777;">সর্বমোট কর্তন =</td>
          <td style="color: #b91c1c;">৳${toBnDigits(execStamp + execExtra)}/-</td>
          <td colspan="3">-</td>
        </tr>
        <!-- ৫. প্রাপ্তব্য রো -->
        <tr style="background-color: #ffe4e6; font-weight: bold; font-size: 9.5px;">
          <td colspan="10" style="text-align: right; padding-right: 12px; font-weight: 900; color: #db2777;">সর্বমোট প্রাপ্তব্য (নির্বাহী প্যানেল) =</td>
          <td style="color: #db2777; font-weight: 900;">৳${toBnDigits(execGrand)}/-</td>
          <td colspan="2">-</td>
        </tr>
      `;
    }

    const finalTotalDeduction = totalStampAll + totalExtraAll;

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
    margin-top: 0.35in;
    margin-bottom: 0.4in;
    margin-left: 0.4in;
    margin-right: 0.35in;
  }
  body {
    font-family: "Noto Sans Bengali", "Kalpurush", sans-serif;
    font-size: 8px;
    line-height: 1.15;
    color: #000;
    background-color: #fff;
  }
  .header-container {
    width: 100%;
    margin-bottom: 10px;
    text-align: center;
    line-height: 1.25;
  }
  .header-main-title {
    font-size: 13px;
    font-weight: bold;
  }
  .header-sub-title {
    font-size: 9.5px;
    font-weight: bold;
    color: #333;
    margin-top: 1px;
  }
  .header-loc {
    font-size: 8px;
    color: #444;
  }
  .report-meta {
    width: 100%;
    margin-bottom: 6px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    font-weight: bold;
    border-bottom: 1.2px solid #000;
    padding-bottom: 3px;
  }
  .cell-title {
    font-size: 9.5px;
    color: #111;
  }
  .report-date {
    font-size: 7.5px;
  }
  .report-title-box {
    text-align: center;
    margin-bottom: 6px;
  }
  .report-title {
    font-size: 10px;
    font-weight: bold;
    text-decoration: underline;
    display: inline-block;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 4px 0;
    font-size: 7.5px;
  }
  th, td {
    border: 1px solid #000;
    padding: 3px 2px;
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
    margin-top: 6px;
    font-size: 8px;
    line-height: 1.4;
    text-align: justify;
  }
  .deductions-breakdown {
    margin-top: 6px;
    border: 1px solid #000;
    padding: 5px 8px;
    background-color: #f8fafc;
    border-radius: 4px;
    line-height: 1.35;
    font-size: 7.5px;
  }
  .signature-container {
    width: 100%;
    margin-top: 0.5in;
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
    margin-bottom: 3px;
    width: 80%;
    margin-left: auto;
    margin-right: auto;
  }
  .signature-title {
    font-weight: bold;
    font-size: 8px;
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
        <th style="width: 3.5%;">ক্রমিক</th>
        <th style="width: 15%; text-align: left; padding-left: 3px;">কর্মকর্তার নাম</th>
        <th style="width: 12%;">পদবী</th>
        <th style="width: 6.5%;">দৈনিক হার</th>
        <th style="width: 6.5%;">অনুপস্থিত দিন (CL)</th>
        <th style="width: 6.5%;">উপস্থিত দিন</th>
        <th style="width: 8.5%;">মোট দাবী</th>
        <th style="width: 7%;">রেভেনিউ স্ট্যাম্প</th>
        <th style="width: 7.5%;">অতিরিক্ত কর্তন</th>
        <th style="width: 7.5%;">মোট কর্তন</th>
        <th style="width: 8.5%;">প্রাপ্তব্য</th>
        <th style="width: 11%;">স্বাক্ষর</th>
        <th style="width: 11%;">মন্তব্য</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
      
      <!-- বিভাগীয় সর্বমোট সমন্বিত হিসাবসমূহ -->
      <tr style="background-color: #e2e8f0; font-weight: bold; font-size: 9.5px;">
        <td colspan="6" style="text-align: right; padding-right: 12px; font-weight: 900;">বিভাগীয় সর্বমোট সমন্বিত দাবী সমষ্টি =</td>
        <td class="font-bold" style="font-size: 10px;">৳${toBnDigits(totalClaimAll)}/-</td>
        <td>৳${toBnDigits(totalStampAll)}/-</td>
        <td>৳${toBnDigits(totalExtraAll)}/-</td>
        <td style="color: #b91c1c; font-weight: 900;">৳${toBnDigits(finalTotalDeduction)}/-</td>
        <td style="color: #15803d; font-weight: 900; font-size: 10px;">৳${toBnDigits(grandTotalAll)}/-</td>
        <td colspan="2">-</td>
      </tr>
    </tbody>
  </table>

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
    <p style="margin-top: 4px;">অনলাইন ব্যাংকিং ডিপার্টমেন্টের উপযুক্ত কর্মকর্তা ও নির্বাহীদের খাবার ভাতার বিল প্রস্তুত করা হলো এবং বিধি মোতাবেক কর্তন সম্পন্ন করে প্রাপ্তব্য টাকা প্রদানের জন্য সুপারিশ করা হলো।</p>
  </div>

  <div class="signature-container">
    <div class="signature-block">
      <div class="signature-line"></div>
      <p class="signature-title">প্রস্তুতকারী কর্মকর্তা</p>
      <p style="font-size: 7.5px; color: #444; margin-top: 2px;">অনলাইন ব্যাংকিং ডিপার্টমেন্ট</p>
    </div>
    <div class="signature-block">
      <div class="signature-line"></div>
      <p class="signature-title">যাচাইকারী কর্মকর্তা (এজিএম)</p>
      <p style="font-size: 7.5px; color: #444; margin-top: 2px;">অনলাইন ব্যাংকিং ডিপার্টমেন্ট</p>
    </div>
    <div class="signature-block">
      <div class="signature-line"></div>
      <p class="signature-title">উপ-মহাব্যবস্থাপক</p>
      <p style="font-size: 7.5px; color: #444; margin-top: 2px;">অনলাইন ব্যাংকিং ডিপার্টমেন্ট</p>
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
