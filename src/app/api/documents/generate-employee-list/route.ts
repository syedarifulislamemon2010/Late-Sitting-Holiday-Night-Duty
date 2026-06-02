import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import { cookies } from 'next/headers';

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
    const cookieStore = await cookies();
    const sessionVal = cookieStore.get('session')?.value;
    if (!sessionVal) {
      return NextResponse.json({ error: 'unauthorized', message: 'অনুমতি নেই।' }, { status: 403 });
    }
    const userId = parseInt(sessionVal, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'unauthorized', message: 'সেশন অবৈধ।' }, { status: 403 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { cells: true }
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'unauthorized', message: 'ব্যবহারকারী খুঁজে পাওয়া যায়নি।' }, { status: 403 });
    }

    const isAdministrationCell = currentUser.cells?.some((c: any) => 
      c.name.includes('প্রশাসন') || 
      c.name.toLowerCase().includes('admin') || 
      c.name.toLowerCase().includes('administration')
    );
    const isAdminOrAdminCell = currentUser.role === 'ADMIN' || isAdministrationCell;

    const payload = await request.json();
    const { cellFilter } = payload; // 'all', 'select', 'executives', or string representing cellId

    let cellIds: number[] = [];
    if (!isAdminOrAdminCell) {
      // Normal user is restricted to their own primary cell
      const ownEmployee = await prisma.employee.findFirst({
        where: { bankId: currentUser.username }
      });
      const ownCellId = ownEmployee ? ownEmployee.cellId : (currentUser.cells[0]?.id || null);
      
      if (ownCellId) {
        cellIds = [ownCellId];
      } else {
        cellIds = [];
      }
    } else {
      if (cellFilter === 'select') {
        const ownEmployee = await prisma.employee.findFirst({
          where: { bankId: currentUser.username }
        });
        const ownCellId = ownEmployee ? ownEmployee.cellId : (currentUser.cells[0]?.id || null);
        if (ownCellId) {
          cellIds = [ownCellId];
        } else {
          cellIds = [];
        }
      } else if (cellFilter && cellFilter !== 'all' && cellFilter !== 'executives') {
        cellIds = [parseInt(cellFilter, 10)];
      }
    }

    // Define where condition
    const cellWhere = cellFilter === 'executives' ? { id: -1 } : (cellIds.length > 0 ? { id: { in: cellIds } } : {});
    
    // Fetch cells and their employees
    const cells = await prisma.cell.findMany({
      where: {
        ...cellWhere,
        name: { not: 'Combined Departmental Sheet' }
      },
      orderBy: { name: 'asc' },
      include: {
        employees: true
      }
    });

    let executives: any[] = [];
    if (isAdminOrAdminCell && cellFilter === 'executives') {
      const execList = await prisma.executive.findMany();
      // Filter out GMs strictly, leaving only DGMs and AGMs
      executives = execList.filter(e => {
        const d = e.designation.trim();
        return (
          d.includes('উপ-মহাব্যবস্থাপক') || 
          d.includes('সহকারী মহাব্যবস্থাপক') || 
          d.includes('ডিজিএম') || 
          d.includes('এজিএম') || 
          d.toLowerCase().includes('dgm') || 
          d.toLowerCase().includes('agm')
        ) && !(
          d.includes('মহাব্যবস্থাপক') && 
          !d.includes('উপ-') && 
          !d.includes('সহকারী')
        );
      });
    }

    const sortExecutives = (execs: any[]) => {
      return [...execs].sort((a, b) => {
        const priority = (desig: string) => {
          const d = desig.toLowerCase();
          if (d.includes('উপ-মহাব্যবস্থাপক') || d.includes('ডিজিএম') || d.includes('dgm')) return 1;
          if (d.includes('সহকারী মহাব্যবস্থাপক') || d.includes('এজিএম') || d.includes('agm')) return 2;
          return 3;
        };
        const pA = priority(a.designation);
        const pB = priority(b.designation);
        if (pA !== pB) return pA - pB;
        
        return (a.fileNo || '').localeCompare(b.fileNo || '', undefined, { numeric: true, sensitivity: 'base' });
      });
    };

    const sortedExecs = sortExecutives(executives);

    let execTableHtml = '';
    if (sortedExecs.length > 0) {
      let execRowsHtml = '';
      let dgmCount = 0;
      sortedExecs.forEach((exec, index) => {
        const isDGM = exec.designation.includes('উপ-মহাব্যবস্থাপক') || 
                      exec.designation.includes('ডিজিএম') || 
                      exec.designation.toLowerCase().includes('dgm');
        
        let textColor = '#db2777'; // AGMs default to pink
        
        if (isDGM) {
          dgmCount++;
          if (dgmCount === 1) {
            textColor = '#1e3a8a'; // Royal Blue for 1st DGM
          } else if (dgmCount === 2) {
            textColor = '#b45309'; // Amber/Orange for 2nd DGM
          } else {
            textColor = '#0f766e'; // Teal for subsequent DGMs
          }
        }

        execRowsHtml += `
          <tr style="color: ${textColor};">
            <td style="font-weight: bold;">${toBnDigits(index + 1)}</td>
            <td class="text-left font-bold" style="color: ${textColor};">${exec.name}</td>
            <td style="font-weight: bold; color: ${textColor};">${exec.designation}</td>
            <td class="font-mono" style="color: ${textColor};">${exec.bankId || '-'}</td>
            <td class="font-mono" style="color: ${textColor};">${exec.fileNo || '-'}</td>
            <td class="font-mono" style="color: ${textColor};">${exec.phone ? toBnDigits(exec.phone) : '-'}</td>
          </tr>
        `;
      });

      execTableHtml = `
        <div class="cell-block" style="margin-bottom: 20px; page-break-inside: avoid; border-left: 3px solid #db2777;">
          <div class="cell-header" style="background-color: #fdf2f8; color: #db2777; font-weight: bold;">
            <span>নির্বাহী প্যানেল (ডিজিএম ও এজিএম) (${toBnDigits(sortedExecs.length)} জন নির্বাহী কর্মকর্তা)</span>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 8%;">ক্রমিক</th>
                <th style="width: 25%; text-align: left; padding-left: 5px;">নির্বাহীর নাম</th>
                <th style="width: 25%;">পদবী</th>
                <th style="width: 14%;">ব্যাংক আইডি</th>
                <th style="width: 14%;">নথি নম্বর</th>
                <th style="width: 14%;">মোবাইল নম্বর</th>
              </tr>
            </thead>
            <tbody>
              ${execRowsHtml}
            </tbody>
          </table>
        </div>
      `;
    }

    const reportDate = new Date().toISOString().split('T')[0];
    const isExecReport = cellFilter === 'executives';
    const isAllReport = cellFilter === 'all';
    const cellTitle = isExecReport 
      ? 'নির্বাহী ডিরেক্টরি রিপোর্ট' 
      : (isAllReport ? 'কর্মকর্তা ডিরেক্টরি রিপোর্ট' : 'কর্মকর্তা সেল ডিরেক্টরি রিপোর্ট');
    const reportTitle = isExecReport 
      ? 'নির্বাহীদের তালিকা' 
      : 'কর্মকর্তাদের সেল-ভিত্তিক তালিকা';

    let tablesHtml = '';
    
    cells.forEach((cell) => {
      if (cell.employees.length === 0) return;

      const sortedEmployees = [...cell.employees].sort((a, b) => {
        // Simple priority sort by designation
        const priority: Record<string, number> = {
          'সিনিয়র প্রিন্সিপাল অফিসার (এসপিও)': 1,
          'প্রিন্সিপাল অফিসার (পিও)': 2,
          'সিনিয়র অফিসার-আইটি (এসও-আইটি)': 3,
          'অফিসার-আইটি (ও-আইটি)': 4
        };
        const prioA = priority[a.designation] || 5;
        const prioB = priority[b.designation] || 5;
        if (prioA !== prioB) return prioA - prioB;
        return a.id - b.id;
      });

      let rowsHtml = '';
      let hasFoundFirstSPO = false;
      sortedEmployees.forEach((emp, index) => {
        let isCellIncharge = false;
        if (emp.designation === 'সিনিয়র প্রিন্সিপাল অফিসার (এসপিও)' && !hasFoundFirstSPO) {
          isCellIncharge = true;
          hasFoundFirstSPO = true;
        }

        const textColor = isCellIncharge ? '#0f766e' : '#000000';
        const inchargeBadge = isCellIncharge ? ' <span style="font-size: 8px; font-weight: bold; background-color: #ccfbf1; color: #0f766e; padding: 1px 3px; border-radius: 4px; margin-left: 4px; display: inline-block; vertical-align: middle;">ইনচার্জ</span>' : '';

        rowsHtml += `
          <tr style="color: ${textColor};">
            <td style="font-weight: ${isCellIncharge ? 'bold' : 'normal'};">${toBnDigits(index + 1)}</td>
            <td class="text-left font-bold" style="color: ${textColor};">${emp.name}${inchargeBadge}</td>
            <td style="font-weight: ${isCellIncharge ? 'bold' : 'normal'};">${emp.designation}</td>
            <td class="font-mono" style="color: ${textColor};">${emp.bankId || '-'}</td>
            <td class="font-mono" style="color: ${textColor};">${emp.fileNo || '-'}</td>
            <td class="font-mono" style="color: ${textColor};">${emp.mobile ? toBnDigits(emp.mobile) : '-'}</td>
          </tr>
        `;
      });

      tablesHtml += `
        <div class="cell-block" style="margin-bottom: 20px; page-break-inside: avoid;">
          <div class="cell-header">
            <span>সেল: ${cell.name} (${toBnDigits(cell.employees.length)} জন কর্মকর্তা)</span>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 8%;">ক্রমিক</th>
                <th style="width: 25%; text-align: left; padding-left: 5px;">কর্মকর্তার নাম</th>
                <th style="width: 25%;">পদবী</th>
                <th style="width: 14%;">ব্যাংক আইডি</th>
                <th style="width: 14%;">নথি নম্বর</th>
                <th style="width: 14%;">মোবাইল নম্বর</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>
      `;
    });

    if (tablesHtml === '' && execTableHtml === '') {
      tablesHtml = `
        <div style="text-align: center; padding: 40px; font-weight: bold; font-size: 12px;">
          কোনো কর্মকর্তার তালিকা পাওয়া যায়নি।
        </div>
      `;
    }

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>কর্মকর্তা তালিকা</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    @page {
      size: a4 portrait;
      margin-top: 0.5in;
      margin-bottom: 0.5in;
      margin-left: 0.5in;
      margin-right: 0.5in;
    }
    body {
      font-family: "Noto Sans Bengali", "Kalpurush", sans-serif;
      font-size: 10px;
      line-height: 1.3;
      color: #000;
      background-color: #fff;
    }
    .report-meta {
      width: 100%;
      margin-bottom: 10px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      font-weight: bold;
      border-bottom: 1.2px solid #000;
      padding-bottom: 4px;
      font-size: 10px;
    }
    .cell-title {
      font-size: 11px;
      color: #111;
    }
    .report-date {
      font-size: 10px;
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
    .cell-header {
      background-color: #f1f5f9;
      padding: 5px 8px;
      font-weight: bold;
      border: 1px solid #000;
      border-bottom: none;
      font-size: 10px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 15px;
      font-size: 10px;
      page-break-inside: auto;
    }
    tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }
    th, td {
      border: 1px solid #000;
      padding: 5px 4px;
      text-align: center;
      vertical-align: middle;
    }
    th {
      background-color: #f8fafc;
      font-weight: bold;
    }
    .text-left {
      text-align: left;
      padding-left: 5px;
    }
    .font-bold {
      font-weight: bold;
    }
    .font-mono {
      font-family: monospace, sans-serif;
    }
  </style>
</head>
<body>
  <div class="report-meta">
    <span class="cell-title">${cellTitle}</span>
    <div style="text-align: right;">
      <div style="font-size: 11px; font-weight: bold; margin-bottom: 2px;">অনলাইন ব্যাংকিং ডিপার্টমেন্ট</div>
      <span class="report-date">তারিখ: ${getBnDate(reportDate)} ইং</span>
    </div>
  </div>

  <div class="report-title-box">
    <p class="report-title">${reportTitle}</p>
  </div>

  ${execTableHtml}
  ${tablesHtml}

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

    const filename = `employee_directory_${Math.floor(Date.now() / 1000)}.html`;
    const filePathDisk = path.join(uploadsDir, filename);
    fs.writeFileSync(filePathDisk, htmlContent, 'utf-8');

    const relativePath = `/uploads/${filename}`;
    const fileSize = fs.statSync(filePathDisk).size;

    const doc = await prisma.document.create({
      data: {
        name: `${cellTitle} (${getBnDate(reportDate)})`,
        filePath: relativePath,
        fileSize: fileSize
      }
    });

    return NextResponse.json({
      success: true,
      filePath: relativePath,
      document: doc
    });

  } catch (error: any) {
    console.error('Error generating employee list document:', error);
    return NextResponse.json({ error: 'failed_to_generate_employee_list', message: error.message }, { status: 500 });
  }
}
