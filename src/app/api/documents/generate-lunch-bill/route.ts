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
    const payload = await request.json();
    const {
      monthName,
      cellName,
      records,
      workingDays,
      totalDays,
      totalClaim,
      totalDeduction,
      grandTotal,
      grandTotalInWords,
      signingOfficer,
      signingDesignation,
      reportDate
    } = payload;

    const recordsHtml = records.map((r: any, index: number) => {
      const stamp = 15;
      const additional = r.additionalDeduction || 0;
      const totalDed = stamp + additional;
      return `
        <tr>
          <td>${toBnDigits(index + 1)}</td>
          <td class="text-left font-bold">${r.employeeName}</td>
          <td>${r.designation}</td>
          <td>${toBnDigits(400)}/-</td>
          <td>${toBnDigits(r.presentDays)}</td>
          <td class="font-bold">${toBnDigits(r.totalBill)}/-</td>
          <td>
            ${toBnDigits(totalDed)}/-
            <span style="font-size: 8px; color: #555; display: block; margin-top: 1px;">
              (স্ট্যাম্প: ১৫ + অতিরিক্ত: ${toBnDigits(additional)})
            </span>
          </td>
          <td class="font-bold">${toBnDigits(r.netPayable)}/-</td>
        </tr>
      `;
    }).join('');

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
    margin-top: 0.6in;
    margin-bottom: 0.75in;
    margin-left: 0.8in;
    margin-right: 0.5in;
  }
  body {
    font-family: "Noto Sans Bengali", "Kalpurush", sans-serif;
    font-size: 11px;
    line-height: 1.2;
    color: #000;
    background-color: #fff;
  }
  .header-container {
    width: 100%;
    margin-bottom: 24px;
    text-align: center;
    line-height: 1.3;
  }
  .header-main-title {
    font-size: 16px;
    font-weight: bold;
    letter-spacing: 0.5px;
  }
  .header-sub-title {
    font-size: 12px;
    font-weight: bold;
    color: #333;
    margin-top: 2px;
  }
  .header-loc {
    font-size: 10px;
    color: #444;
  }
  .report-meta {
    width: 100%;
    margin-bottom: 12px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    font-weight: bold;
    border-bottom: 2px solid #000;
    padding-bottom: 6px;
  }
  .cell-title {
    font-size: 14px;
    color: #111;
  }
  .report-date {
    font-size: 10px;
  }
  .report-title-box {
    text-align: center;
    margin-bottom: 16px;
  }
  .report-title {
    font-size: 13px;
    font-weight: bold;
    text-decoration: underline;
    display: inline-block;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 12px 0;
    font-size: 10.5px;
  }
  th, td {
    border: 1px solid #000;
    padding: 8px 6px;
    text-align: center;
    vertical-align: middle;
  }
  th {
    background-color: #f4f4f4;
    font-weight: bold;
  }
  .text-left {
    text-align: left;
    padding-left: 10px;
  }
  .font-bold {
    font-weight: bold;
  }
  .total-row {
    font-weight: bold;
    background-color: #fafafa;
  }
  .bill-summary-text {
    margin-top: 14px;
    font-size: 11px;
    line-height: 1.6;
    text-align: justify;
  }
  .signature-container {
    width: 100%;
    margin-top: 1.0in;
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
    margin-bottom: 6px;
    width: 80%;
    margin-left: auto;
    margin-right: auto;
  }
  .signature-title {
    font-weight: bold;
    font-size: 10px;
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
    <span class="cell-title">সেল: ${cellName}</span>
    <span class="report-date">তারিখ: ${getBnDate(reportDate)} ইং</span>
  </div>

  <div class="report-title-box">
    <p class="report-title">${monthName} মাসের লাঞ্চ ভাতা বিল শিট (মোট কার্যদিবস: ${toBnDigits(workingDays)} দিন)</p>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 7%;">ক্রমিক</th>
        <th style="width: 25%; text-align: left; padding-left: 10px;">কর্মকর্তার নাম</th>
        <th style="width: 12%;">পদবী</th>
        <th style="width: 12%;">দৈনিক হার</th>
        <th style="width: 10%;">উপস্থিতি</th>
        <th style="width: 12%;">মোট দাবী</th>
        <th style="width: 12%;">কর্তন</th>
        <th style="width: 10%;">প্রাপ্তব্য</th>
      </tr>
    </thead>
    <tbody>
      ${recordsHtml}
      <tr class="total-row">
        <td colspan="4" style="text-align: right; padding-right: 12px;">মোট =</td>
        <td>${toBnDigits(totalDays)}</td>
        <td>${toBnDigits(totalClaim)}/-</td>
        <td>${toBnDigits(totalDeduction)}/-</td>
        <td>${toBnDigits(grandTotal)}/-</td>
      </tr>
    </tbody>
  </table>

  <div class="bill-summary-text">
    <p>কথায়: <strong>${grandTotalInWords}</strong>।</p>
    <p style="margin-top: 6px;">উপযুক্ত কর্মকর্তাদের খাবার ভাতার বিল প্রস্তুত করা হলো এবং বিধি মোতাবেক কর্তন সম্পন্ন করে প্রাপ্তব্য টাকা প্রদানের জন্য সুপারিশ করা হলো।</p>
  </div>

  <div class="signature-container">
    <div class="signature-block">
      <div class="signature-line"></div>
      <p class="signature-title">প্রস্তুতকারী কর্মকর্তা</p>
      <p style="font-size: 9px; color: #444; margin-top: 2px;">অনলাইন ব্যাংকিং ডিপার্টমেন্ট</p>
    </div>
    <div class="signature-block">
      <div class="signature-line"></div>
      <p class="signature-title">যাচাইকারী কর্মকর্তা (এজিএম)</p>
      <p style="font-size: 9px; color: #444; margin-top: 2px;">অনলাইন ব্যাংকিং ডিপার্টমেন্ট</p>
    </div>
    <div class="signature-block">
      <div class="signature-line"></div>
      <p class="signature-title">${signingOfficer || 'উপ-মহাব্যবস্থাপক'}</p>
      <p style="font-size: 9px; color: #444; margin-top: 2px;">${signingDesignation || 'অনলাইন ব্যাংকিং ডিপার্টমেন্ট'}</p>
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

    const filename = `lunch_bill_${cellName.replace(/\s+/g, '_')}_${monthName.replace(/\s+/g, '_')}_${Math.floor(Date.now() / 1000)}.html`;
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
          name: `লাঞ্চ বিল: ${cellName} (${monthName})`,
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
