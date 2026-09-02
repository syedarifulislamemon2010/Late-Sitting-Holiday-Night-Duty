import logger from '@/lib/logger';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { officeOrders } from '@/db/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import { getCurrentUser } from '@/lib/auth-wrapper';
import { logActivity } from '@/lib/audit';
import { officeOrderGenerateSchema } from '@/validations/documentGeneration.schema';
import { renderDatesInPairs } from '@/lib/print-helpers';

interface DutyItem {
  employee: {
    name: string;
    designation: string;
    bankId: string;
  };
  datesFormatted: string;
  description: string;
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
    const rawPayload = await request.json();
    const validation = officeOrderGenerateSchema.safeParse(rawPayload);
    if (!validation.success) {
      return NextResponse.json({
        error: 'validation_error',
        message: validation.error.issues[0]?.message || 'অবৈধ অফিস আদেশ ডাটা',
        details: validation.error.format()
      }, { status: 400 });
    }

    const payload = rawPayload;
    const { orderRef, orderDate, orderText, duties, signingOfficer, signingDesignation, copies, headerMode = 'with_header' } = payload;

    if (!orderRef || !orderDate) {
      return NextResponse.json({ error: 'missing_required_fields' }, { status: 400 });
    }

    const rowsHtml = duties.map((duty: DutyItem, index: number) => {
      const pairedDates = renderDatesInPairs(duty.datesFormatted || '');
      const formattedDatesColumn = pairedDates.join('<br>');
      const displayName = duty.employee.name.replace(/\s*\([^)]*\)\s*$/, '').trim();
      const nameWithPrefix = displayName.startsWith('জনাব') ? displayName : `জনাব ${displayName}`;

      return `
        <tr>
          <td style="text-align: center; vertical-align: top; padding: 6px 4px;">${toBnDigits(index + 1)}</td>
          <td style="text-align: left; vertical-align: top; padding: 6px 8px; line-height: 1.25;">
            <span style="font-weight: 600; display: block;">${nameWithPrefix}</span>
            <span style="color: #4b5563; font-size: 11px; display: block; margin-top: 2px;">${duty.employee.designation}</span>
            ${duty.employee.bankId ? `<span style="color: #6b7280; font-size: 10px; display: block;">আইডি: ${toBnDigits(duty.employee.bankId)}</span>` : ''}
          </td>
          <td style="text-align: center; vertical-align: top; padding: 6px 4px; line-height: 1.4; font-size: 11px; white-space: nowrap;">
            ${formattedDatesColumn}
          </td>
          <td style="text-align: left; vertical-align: top; padding: 6px 8px; font-size: 11px; line-height: 1.3;">
            ${duty.description || '-'}
          </td>
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
<title>Office Order - ${orderRef}</title>
<style>
  @page {
    size: A4 portrait;
    margin: 15mm 15mm 15mm 15mm;
  }
  body {
    font-family: 'SolaimanLipi', 'Hind Siliguri', 'Noto Sans Bengali', sans-serif;
    color: #111827;
    margin: 0;
    padding: 0;
    background: #fff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .print-container {
    width: 100%;
    max-width: 190mm;
    margin: 0 auto;
  }
  .order-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 15px;
    margin-bottom: 20px;
  }
  .order-table th, .order-table td {
    border: 1px solid #374151;
    font-size: 12px;
  }
  .order-table th {
    background-color: #f3f4f6;
    padding: 6px 4px;
    font-weight: bold;
    text-align: center;
  }
</style>
</head>
<body>
<div class="print-container">
  ${headerMode === 'with_header' ? `
  <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #1f2937; padding-bottom: 10px;">
    <h2 style="margin: 0; font-size: 20px; font-weight: bold; color: #111827;">জনতা ব্যাংক পিএলসি</h2>
    <h4 style="margin: 4px 0 0 0; font-size: 14px; font-weight: normal; color: #374151;">তথ্য প্রযুক্তি বিভাগ (অপারেশন শাখা)</h4>
    <p style="margin: 2px 0 0 0; font-size: 11px; color: #4b5563;">প্রধান কার্যালয়, ঢাকা</p>
  </div>
  ` : '<div style="height: 35mm;"></div>'}

  <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 15px;">
    <div><strong>সূত্র:</strong> ${orderRef}</div>
    <div><strong>তারিখ:</strong> ${getBnDate(orderDate)}</div>
  </div>

  <div style="text-align: center; margin-bottom: 15px;">
    <h3 style="margin: 0; font-size: 15px; font-weight: bold; text-decoration: underline;">অফিস আদেশ</h3>
  </div>

  <div style="font-size: 12px; line-height: 1.6; text-align: justify; margin-bottom: 12px;">
    ${orderText || 'সংশ্লিষ্ট সকলের অবগতির জন্য জানানো যাচ্ছে যে, নিম্নবর্ণিত কর্মকর্তা/কর্মচারীবৃন্দকে নির্দেশিত তারিখ অনুযায়ী দায়িত্ব পালনের জন্য নির্দেশ প্রদান করা হলো:'}
  </div>

  <table class="order-table">
    <thead>
      <tr>
        <th style="width: 6%;">ক্রমিক</th>
        <th style="width: 32%;">কর্মকর্তার নাম ও পদবী</th>
        <th style="width: 28%;">ডিউটির তারিখ</th>
        <th style="width: 34%;">কার্যবিবরণী</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>

  <div style="margin-top: 40px; display: flex; justify-content: flex-end;">
    <div style="text-align: center; min-width: 200px;">
      <div style="height: 40px;"></div>
      <div style="border-top: 1px dashed #374151; padding-top: 5px; font-size: 12px; font-weight: bold;">
        ${signingOfficer || 'স্বাক্ষরিত'}
      </div>
      <div style="font-size: 11px; color: #374151;">${signingDesignation || 'বিভাগীয় প্রধান'}</div>
    </div>
  </div>

  ${copies ? `
  <div style="margin-top: 30px; font-size: 11px; line-height: 1.5; border-top: 1px solid #e5e7eb; padding-top: 10px;">
    <strong>অনুলিপি সদয় জ্ঞাতার্থে ও কার্যার্থে:</strong>
    <div style="margin-top: 4px; white-space: pre-line;">${copies}</div>
  </div>
  ` : ''}
</div>
</body>
</html>
    `;

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const safeRef = orderRef.replace(/\//g, '_').replace(/[^a-zA-Z0-9_\-\u0980-\u09FF]/g, '');
    const filename = `office_order_${safeRef}_${Date.now()}.html`;
    const filePathDisk = path.join(uploadsDir, filename);
    fs.writeFileSync(filePathDisk, htmlContent, 'utf-8');

    const relativePath = `/uploads/${filename}`;

    const currentUser = await getCurrentUser();
    if (currentUser) {
      const ipAddress = request.headers.get('x-forwarded-for') || '127.0.0.1';
      const userAgent = request.headers.get('user-agent') || 'Unknown';
      await logActivity({
        username: currentUser.username,
        action: 'PRINT_ORDER',
        entityType: 'OFFICE_ORDER',
        entityId: orderRef,
        userId: currentUser.id,
        bankId: currentUser.username,
        ipAddress,
        userAgent,
        details: `${currentUser.name} (@${currentUser.username}) অফিস আদেশ প্রিন্ট/জেনারেট করেছেন (সূত্র: ${orderRef})।`
      });
    }

    return NextResponse.json({
      success: true,
      filePath: relativePath
    });

  } catch (error) {
    logger.error('Error generating office order document:', error);
    return NextResponse.json({ error: 'failed_to_generate_office_order', message: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
}
