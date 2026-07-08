import { db } from '@/lib/db';
import { getShortDesignation, renderDatesInPairs, cleanBracketName } from '@/lib/print-helpers';
import { officeOrders } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth-wrapper';

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

const getFormattedDateList = (dates: string[]) => {
  return dates
    .sort()
    .map(d => {
      const [year, month, day] = d.split('-');
      return toBnDigits(`${day}-${month}-${year}`);
    })
    .join(', ');
};

const getPrintCategoryRates = (printCategory: 'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT') => {
  let transportRate = 200;
  let apyaonRate = 100;
  if (printCategory === 'HOLIDAY') {
    transportRate = 250;
    apyaonRate = 250;
  } else if (printCategory === 'NIGHT_SHIFT') {
    transportRate = 400;
    apyaonRate = 600;
  }
  return { transportRate, apyaonRate };
};

const getBanglaNumberWords = (num: number) => {
  if (num === 0) return 'শূন্য';
  
  const singleWords = ['', 'এক', 'দুই', 'তিন', 'চার', 'পাঁচ', 'ছয়', 'সাত', 'আট', 'নয়'];
  const teenWords = ['দশ', 'এগারো', 'বারো', 'তেরো', 'চৌদ্দ', 'পনেরো', 'ষোলো', 'সতেরো', 'আঠারো', 'উনিশ'];
  const doubleWords = ['', '', 'বিশ', 'ত্রিশ', 'চল্লিশ', 'পঞ্চাশ', 'ষাট', 'সত্তর', 'আশি', 'নব্বই'];

  const convertTens = (n: number): string => {
    if (n < 10) return singleWords[n];
    if (n >= 10 && n < 20) return teenWords[n - 10];
    const ten = Math.floor(n / 10);
    const unit = n % 10;
    return doubleWords[ten] + (unit > 0 ? ' ' + singleWords[unit] : '');
  };

  let wordStr = '';
  
  // Lac portion
  if (num >= 100000) {
    const lac = Math.floor(num / 100000);
    wordStr += convertTens(lac) + ' লক্ষ ';
    num %= 100000;
  }

  // Thousand portion
  if (num >= 1000) {
    const thousand = Math.floor(num / 1000);
    wordStr += convertTens(thousand) + ' হাজার ';
    num %= 1000;
  }
  
  // Hundred portion
  if (num >= 100) {
    const hundred = Math.floor(num / 100);
    wordStr += singleWords[hundred] + ' শত ';
    num %= 100;
  }
  
  // Tens portion
  if (num > 0) {
    wordStr += convertTens(num);
  }
  
  return wordStr.trim() + ' টাকা মাত্র';
};

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const idStr = searchParams.get('id');
    if (!idStr) {
      return new Response('Missing ID parameter', { status: 400 });
    }

    const orderId = Number(idStr);
    const records = await db.select().from(officeOrders).where(eq(officeOrders.id, orderId));
    const order = records[0];

    if (!order) {
      return new Response('Office order not found', { status: 404 });
    }

    const isBill = order.category.startsWith('BILL_');
    const content = order.contentJson ? JSON.parse(order.contentJson) : {};
    const duties = order.dutiesJson ? JSON.parse(order.dutiesJson) : [];

    let htmlContent = '';

    if (isBill) {
      const printCategory = order.category.replace(/^BILL_/, '') as 'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT';
      const { transportRate, apyaonRate } = getPrintCategoryRates(printCategory);

      const summariesHtml = duties.map((s: any, index: number) => {
        const empName = s.employeeName || s.name || '';
        const displayName = empName.replace(/\s*\([^)]*\)\s*$/, '').trim();
        const nameWithPrefix = displayName.startsWith('জনাব') ? displayName : `জনাব ${displayName}`;
        const shortDesignation = getShortDesignation(s.designation || '');
        const rawDates = s.datesFormatted || (s.dates ? getFormattedDateList(s.dates) : '');
        const pairedDates = renderDatesInPairs(rawDates);
        
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
              <p style="font-size: 11px; font-weight: bold; margin-top: 4px; line-height: 1.1;">মোট: ${toBnDigits(s.days || 0)} দিন</p>
            </td>
            <td>(${toBnDigits(Math.round(transportRate))}x${toBnDigits(s.days || 0)}) = ${toBnDigits(Math.round(s.totalTransport || 0))}/-</td>
            <td>(${toBnDigits(Math.round(apyaonRate))}x${toBnDigits(s.days || 0)}) = ${toBnDigits(Math.round(s.totalApyaon || 0))}/-</td>
            <td class="font-bold">${toBnDigits(Math.round(s.grandTotal || 0))}/-</td>
          </tr>
        `;
      }).join('');

      const totalDays = content.totalDays || 0;
      const totalTransport = content.totalTransport || 0;
      const totalApyaon = content.totalApyaon || 0;
      const grandTotal = content.grandTotal || 0;
      const grandTotalInWords = content.grandTotalInWords || getBanglaNumberWords(grandTotal);
      const totalTransportInWords = getBanglaNumberWords(totalTransport);
      const totalApyaonInWords = getBanglaNumberWords(totalApyaon);
      const representativeName = order.employeeName || '';
      const representativeDesignation = content.representativeDesignation || '';
      const subjectText = content.subjectText || '';
      const billDate = order.orderDate;
      const openingParagraph = content.openingParagraph || '';

      htmlContent = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Noto+Sans+Bengali:wght@400;700&display=swap" rel="stylesheet">
<link href="https://fonts.maateen.me/solaiman-lipi/font.css" rel="stylesheet">
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
    } else {
      const dutiesHtml = duties.map((d: any, index: number) => {
        const name = d.employeeName || d.employee?.name || d.name || '';
        const nameFormatted = name.startsWith('জনাব ') || name.startsWith('জনাব')
          ? name
          : `জনাব ${name}`;
        
        const designation = d.designation || d.employee?.designation || '';
        const datesFormatted = d.datesFormatted || (d.dates ? getFormattedDateList(d.dates) : '');
        return `
          <tr>
            <td class="text-center">${toBnDigits(index + 1)}</td>
            <td class="text-left"><strong>${nameFormatted}</strong></td>
            <td class="text-center">${designation}</td>
            <td class="text-left">${d.description || ''}</td>
            <td class="text-center">${datesFormatted}</td>
          </tr>
        `;
      }).join('');

      const signingOfficer = cleanBracketName(content.signingOfficer || '');
      const signingDesignation = content.signingDesignation || '';
      const orderText = content.orderText || '';
      const copies = content.copies || [];
      const headerMode = content.headerMode || 'with_header';

      const copiesHtml = copies && copies.length > 0
        ? `
          <div class="footer-copy">
            <strong>অনুলিপি সদয় অবগতি ও প্রয়োজনীয় ব্যবস্থা গ্রহণের জন্য প্রেরিত হলো:</strong>
            <ol>
              ${copies.map((copy: string) => `<li>${copy}</li>`).join('')}
            </ol>
          </div>
        `
        : '';

      htmlContent = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Noto+Sans+Bengali:wght@400;700&display=swap" rel="stylesheet">
<link href="https://fonts.maateen.me/solaiman-lipi/font.css" rel="stylesheet">
<style>
  *, *:before, *:after {
    box-sizing: border-box;
  }
  @page {
    size: A4;
    margin: 0.8in;
  }
  body {
    font-family: 'SolaimanLipi', 'Hind Siliguri', 'Noto Sans Bengali', system-ui, -apple-system, sans-serif;
    font-size: 12px;
    line-height: 1.5;
    color: #000;
    background: #fff;
    margin: 0;
    padding: 0;
  }
  .header-table {
    width: 100%;
    border-collapse: collapse;
    border-bottom: 2px solid #0b5e9e;
    padding-bottom: 4px;
    margin-bottom: 4px;
  }
  .header-table td {
    border: none;
    padding: 0;
    vertical-align: top;
  }
  .header-left {
    text-align: left;
  }
  .header-right {
    text-align: right;
  }
  .bank-title {
    font-size: 18pt;
    font-weight: bold;
    color: #0b5e9e;
    margin: 0;
    line-height: 1.0;
  }
  .bank-tagline {
    font-size: 9pt;
    font-weight: bold;
    color: #555555;
    margin: 2px 0 0 0;
    line-height: 1.0;
  }
  .dept-title {
    font-size: 12pt;
    font-weight: bold;
    color: #000000;
    margin: 5px 0 0 0;
    line-height: 1.0;
  }
  .ref-date-table {
    width: 100%;
    border-collapse: collapse;
    border-bottom: 1px solid rgba(0,0,0,0.1);
    padding-bottom: 4px;
    margin-bottom: 10px;
    margin-top: 4px;
    font-size: 9pt;
    font-weight: bold;
  }
  .ref-date-table td {
    border: none;
    padding: 2px 0;
  }
  .title-content {
    text-align: center;
    font-size: 18pt;
    font-weight: bold;
    text-decoration: underline;
    margin-bottom: 8px;
    margin-top: 8px;
  }
  .body-content {
    text-align: justify;
    font-size: 12pt;
    line-height: 1.5;
    margin-bottom: 10px;
    text-indent: 0.5in;
  }
  table.duty-table {
    width: 100% !important;
    min-width: 100% !important;
    border-collapse: collapse;
    margin-top: 8px;
    margin-bottom: 10px;
    font-size: 12px;
  }
  table.duty-table th, table.duty-table td {
    border: 1px solid #000;
    padding: 3px;
    vertical-align: middle;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }
  table.duty-table th {
    background-color: #f8fafc;
    font-size: 10.5pt;
    font-weight: bold;
    text-align: center;
  }
  table.duty-table td {
    font-size: 10.5pt;
  }
  table.duty-table td.text-center {
    text-align: center;
  }
  table.duty-table td.text-left {
    text-align: left;
    padding-left: 6px;
  }
  .signature-container {
    width: 100%;
    margin-top: 1.0in !important;
    font-size: 12pt;
    clear: both;
  }
  .signature-block {
    float: left;
    text-align: left;
    width: 50%;
    line-height: 1.2;
  }
  .sig-name {
    font-size: 12pt;
    font-weight: bold;
  }
  .footer-copy {
    clear: both;
    margin-top: 25px;
    font-size: 9pt;
    color: #333;
    border-top: 1px dashed #ccc;
    padding-top: 8px;
  }
  .footer-copy ol {
    margin: 4px 0 0 12px;
    padding: 0;
  }
</style>
</head>
<body>
  ${headerMode === 'with_header' ? `
  <table class="header-table">
    <tr>
      <td class="header-left" style="width: 60%;">
        <div style="display: inline-block; vertical-align: top; width: 44px; height: 44px;">
          <svg viewBox="0 0 512 512" style="width: 44px; height: 44px; color: #0b5e9e;" fill="none">
            <g>
              <path fill="#0b5e9e" d="M175.7,351.4c-53.1,0-96.4-43.3-96.4-96.4c0-24.9,9.5-48.6,26.6-66.5l8.2,7.9c-15.1,15.8-23.5,36.7-23.5,58.7c0,46.9,38.1,85.1,85,85.1c46.9,0,85.1-38.2,85.1-85.1v-97.7h11.4v97.7C272.1,308.1,228.9,351.4,175.7,351.4z"/>
              <path fill="#0b5e9e" d="M175.7,329.1c-41.3,0-74.9-33.6-74.9-74.9c0-19.4,7.3-37.7,20.7-51.7l8.2,7.9c-11.3,11.8-17.5,27.4-17.5,43.9c0,35.1,28.5,63.6,63.5,63.6c35.1,0,63.6-28.5,63.6-63.6v-96.9h11.4v96.9C250.7,295.4,217,329.1,175.7,329.1z"/>
              <path fill="#0b5e9e" d="M175.7,306.8c-29.5,0-53.4-24-53.4-53.5c0-13.8,5.2-26.9,14.8-36.9l8.2,7.9c-7.5,7.8-11.6,18.2-11.6,29c0,23.2,18.9,42.1,42.1,42.1c23.2,0,42.1-18.9,42.1-42.1v-96.1h11.4v96.1C229.2,282.8,205.2,306.8,175.7,306.8z"/>
              <path fill="#0b5e9e" d="M175.7,284.4c-17.6,0-32-14.3-32-32c0-8.3,3.1-16.1,8.8-22.1l8.2,7.9c-3.7,3.8-5.7,8.9-5.7,14.2c0,11.4,9.2,20.6,20.6,20.6c11.4,0,20.6-9.2,20.6-20.6v-95.2h11.4v95.2C207.7,270.1,193.3,284.4,175.7,284.4z"/>
              <path fill="#0b5e9e" d="M400.1,255.1c9.9-7.8,15.9-19.8,15.9-32.7c0-23-18.7-41.6-41.6-41.6h-85.1v11.7h85.1c16.5,0,29.9,13.4,29.9,29.9c0,11.8-7,22.5-17.8,27.3l-12.1,5.4l12.1,5.4c10.8,4.8,17.8,15.5,17.8,27.3c0,16.5-13.4,30-29.9,30H270.2c-2.7,4.1-5.8,8-9,11.7h113.1c23,0,41.6-18.7,41.6-41.7C416,274.8,410,262.8,400.1,255.1z"/>
              <path fill="#0b5e9e" d="M442.1,218.5c0-33.9-27.6-61.5-61.5-61.5h-91.4v11.4h91.4c27.7,0,50.2,22.5,50.2,50.2c0,12.1-4.4,23.8-12.3,32.8l-3.3,3.7l3.3,3.7c7.9,9.1,12.3,20.8,12.3,32.9c0,27.7-22.5,50.2-50.2,50.2h-132c-5,4.2-10.5,8-16.2,11.4h148.2c33.9,0,61.5-27.6,61.5-61.5c0-13.2-4.3-26-12.1-36.6C437.9,244.6,442.1,231.8,442.1,218.5z"/>
              <path fill="#0b5e9e" d="M362.7,204.7h-73.5v11.4h73.5c5.4,0,9.7,4.3,9.7,9.7c0,2.6-1,5-2.9,6.9c-1.8,1.8-4.2,2.8-6.8,2.8h-73.5v11.4h73.5c5.7,0,11-2.2,14.9-6.2c4-4,6.2-9.3,6.2-14.9C383.8,214.2,374.3,204.7,362.7,204.7z"/>
              <path fill="#0b5e9e" d="M362.7,263.3h-73.8c-0.3,3.8-0.8,7.6-1.4,11.4h75.2c5.4,0,9.7,4.4,9.7,9.7c0,2.6-1,5.1-2.9,6.9c-1.8,1.8-4.3,2.8-6.8,2.8h-80.4c-1.4,3.9-3.1,7.7-4.9,11.4h85.4c5.6,0,10.9-2.2,14.8-6.1c4-3.9,6.3-9.3,6.3-15C383.8,272.7,374.3,263.3,362.7,263.3z"/>
              <path fill="#0b5e9e" d="M255.8,420.3c-64.5,0-129-12.9-192.9-38.6l-2.7-1.1l-0.7-2.8c-24.7-97.3-24.7-177.2,0.2-244.3l0.9-2.4l2.3-0.9c128.4-51.4,258.3-51.4,386.2,0l2.7,1.1l0.7,2.8c24.7,97.3,24.7,177.2-0.2,244.3l-0.9,2.4-2.3,0.9C384.9,407.4,320.3,420.3,255.8,420.3z M69.8,372.2c123.4,48.9,248.8,48.9,372.7-0.1c22.9-63.7,22.8-139.8-0.3-232.3c-123.4-48.9-248.8-48.9-372.7,0.1C46.6,203.6,46.7,279.7,69.8,372.2z"/>
            </g>
          </svg>
        </div>
        <div style="display: inline-block; vertical-align: top; margin-left: 10px;">
          <h2 class="bank-title">জনতা ব্যাংক পিএলসি.</h2>
          <p class="bank-tagline">উন্নয়নে আপনার বিশ্বস্ত অংশীদার</p>
        </div>
      </td>
      <td class="header-right" style="width: 40%;">
        <h3 class="dept-title">অনলাইন ব্যাংকিং ডিপার্টমেন্ট</h3>
      </td>
    </tr>
  </table>
  ` : `
  <div style="height: 60px; border-bottom: 2px solid transparent; padding-bottom: 5px; margin-bottom: 5px;"></div>
  `}
  
  <table class="ref-date-table">
    <tr>
      <td style="text-align: left;">সূত্রঃ ${order.orderRef}</td>
      <td style="text-align: right;">তারিখঃ ${getBnDate(order.orderDate)} ইং</td>
    </tr>
  </table>
  
  <h2 class="title-content">অফিস নির্দেশ</h2>
  
  <div class="body-content">
    ${orderText}
  </div>
  
  <table class="duty-table" style="width: 100%; min-width: 100%;">
    <thead>
      <tr>
        <th style="width: 8%;" class="text-center">ক্রমিক নং</th>
        <th style="width: 28%;" class="text-left">নির্বাহী/ কর্মকর্তার নাম</th>
        <th style="width: 12%;" class="text-center">পদবী</th>
        <th style="width: 27%;" class="text-left">কাজের বিবরণ</th>
        <th style="width: 25%;" class="text-center">তারিখ</th>
      </tr>
    </thead>
    <tbody>
      ${dutiesHtml}
    </tbody>
  </table>
  
  <div class="signature-container">
    <div class="signature-block">
      <div class="sig-name">(${signingOfficer})</div>
      <div>${signingDesignation}</div>
    </div>
  </div>
  
  ${copiesHtml}
  
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
    }

    return new Response(htmlContent, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });

  } catch (error) {
    console.error('Error rendering raw document preview:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
