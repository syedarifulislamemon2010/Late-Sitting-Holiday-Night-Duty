import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cells, employees, executives as executivesTable, documents } from '@/db/schema';
import { eq, and, ne, inArray, asc, SQL } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth-wrapper';
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
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'unauthorized', message: 'ব্যবহারকারী খুঁজে পাওয়া যায়নি।' }, { status: 403 });
    }

    const isAdmin = currentUser.role === 'ADMIN';

    const payload = await request.json();
    const { cellFilter } = payload; 

    if (cellFilter === 'select') {
      return NextResponse.json({ error: 'invalid_filter', message: 'অনুগ্রহ করে কোনো সেল নির্বাচন করুন।' }, { status: 400 });
    }

    let cellIds: number[] = [];
    if (!isAdmin) {
      const ownEmployeeResult = await db.select().from(employees)
        .where(eq(employees.bankId, currentUser.username))
        .limit(1);
      const ownEmployee = ownEmployeeResult[0] || null;
      const ownCellId = ownEmployee ? ownEmployee.cellId : (currentUser.cells[0]?.id || null);
      
      if (ownCellId) {
        cellIds = [ownCellId];
      } else {
        cellIds = [];
      }
    } else {
      if (cellFilter === 'select') {
        const ownEmployeeResult = await db.select().from(employees)
          .where(eq(employees.bankId, currentUser.username))
          .limit(1);
        const ownEmployee = ownEmployeeResult[0] || null;
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

    let cond: SQL | undefined = ne(cells.name, 'Combined Departmental Sheet');
    if (cellFilter === 'executives') {
      cond = eq(cells.id, -1);
    } else if (cellIds.length > 0) {
      cond = and(cond, inArray(cells.id, cellIds));
    }
    
    const cellsList = await db.query.cells.findMany({
      where: cond,
      orderBy: [asc(cells.name)],
      with: {
        employees: true
      }
    });

    const usersForExpansion = await db.query.users.findMany({
      with: {
        userCells: {
          with: {
            cell: true
          }
        }
      }
    });

    const userCellDutiesMap = new Map<string, Record<string, string>>();
    const userCellsMap = new Map<string, { id: number; name: string }[]>();
    usersForExpansion.forEach(u => {
      if (u.username) {
        const usernameKey = u.username.trim().toLowerCase();
        userCellsMap.set(
          usernameKey,
          u.userCells.map(uc => ({ id: uc.cell.id, name: uc.cell.name }))
        );
        
        let parsedDuties: Record<string, string> = {};
        if (u.cellDuties) {
          try {
            parsedDuties = JSON.parse(u.cellDuties);
          } catch (e) {
            console.warn('Failed to parse cellDuties for user', u.username, e);
          }
        }
        userCellDutiesMap.set(usernameKey, parsedDuties);
      }
    });

    const allEmployeesForExpansion = await db.select().from(employees);

    const cellsListWithEmployees = cellsList.map(cell => {
      const cellEmps: any[] = [];
      
      // 1. Process primary cell employees
      for (const emp of cell.employees) {
        let dutyType = 'PRIMARY';
        if (emp.bankId) {
          const duties = userCellDutiesMap.get(emp.bankId.trim().toLowerCase());
          if (duties && duties[String(cell.id)]) {
            dutyType = duties[String(cell.id)];
          } else if (emp.designation.includes('ইনচার্জ') || emp.designation.includes('Incharge')) {
            dutyType = 'INCHARGE';
          }
        } else if (emp.designation.includes('ইনচার্জ') || emp.designation.includes('Incharge')) {
          dutyType = 'INCHARGE';
        }
        
        cellEmps.push({
          ...emp,
          dutyType
        });
      }
      
      // 2. Process expanded cell employees (additional cells)
      for (const emp of allEmployeesForExpansion) {
        if (emp.cellId === cell.id) continue;
        
        if (emp.bankId) {
          const usernameKey = emp.bankId.trim().toLowerCase();
          const assignedCells = userCellsMap.get(usernameKey);
          if (assignedCells && assignedCells.some(c => c.id === cell.id)) {
            if (!cellEmps.some(e => e.id === emp.id)) {
              let dutyType = 'ADDITIONAL';
              const duties = userCellDutiesMap.get(usernameKey);
              if (duties && duties[String(cell.id)]) {
                dutyType = duties[String(cell.id)];
              }
              
              cellEmps.push({
                ...emp,
                dutyType
              });
            }
          }
        }
      }
      
      // 3. Apply the visibility filtering:
      // If dutyType is 'ADDITIONAL', and current user is not ADMIN, and it's not the employee themselves:
      const visibleEmps = cellEmps.filter(emp => {
        const isAdditional = emp.dutyType === 'ADDITIONAL';
        const isSelf = !!(emp.bankId && currentUser?.username && emp.bankId.trim() === currentUser.username.trim());
        if (isAdditional && currentUser?.role !== 'ADMIN' && !isSelf) {
          return false;
        }
        return true;
      });
      
      return {
        ...cell,
        employees: visibleEmps
      };
    });

    let executives: (typeof executivesTable.$inferSelect)[] = [];
    if (isAdmin && cellFilter === 'executives') {
      const execList = await db.select().from(executivesTable);
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

    const sortExecutives = (execs: (typeof executivesTable.$inferSelect)[]) => {
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
    
    cellsListWithEmployees.forEach((cell) => {
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
      sortedEmployees.forEach((emp: any, index) => {
        let isCellIncharge = emp.dutyType === 'INCHARGE';
        if (!emp.dutyType) {
          if (emp.designation === 'সিনিয়র প্রিন্সিপাল অফিসার (এসপিও)' && !hasFoundFirstSPO) {
            isCellIncharge = true;
            hasFoundFirstSPO = true;
          }
        }

        const textColor = isCellIncharge ? '#0f766e' : '#000000';
        
        let badgeHtml = '';
        if (isCellIncharge) {
          badgeHtml = ' <span style="font-size: 11px; font-weight: bold; background-color: #ccfbf1; color: #0f766e; padding: 1.5px 4px; border-radius: 4px; margin-left: 6px; display: inline-block; vertical-align: middle; border: 1px solid #99f6e4;">ইনচার্জ</span>';
        } else if (emp.dutyType === 'ADDITIONAL') {
          badgeHtml = ' <span style="font-size: 11px; font-weight: bold; background-color: #fef3c7; color: #92400e; padding: 1.5px 4px; border-radius: 4px; margin-left: 6px; display: inline-block; vertical-align: middle; border: 1px solid #fde68a;">অতিরিক্ত দায়িত্ব</span>';
        }

        rowsHtml += `
          <tr style="color: ${textColor};">
            <td style="font-weight: ${isCellIncharge ? 'bold' : 'normal'};">${toBnDigits(index + 1)}</td>
            <td class="text-left font-bold" style="color: ${textColor};">${emp.name}${badgeHtml}</td>
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
        <div style="text-align: center; padding: 40px; font-weight: bold; font-size: 14px;">
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
  <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Noto+Sans+Bengali:wght@400;700&display=swap" rel="stylesheet">
<link href="https://fonts.maateen.me/solaiman-lipi/font.css" rel="stylesheet">
<link href="https://fonts.maateen.me/solaiman-lipi/font.css" rel="stylesheet">
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
      font-size: 14px;
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
      font-size: 14px;
    }
    .cell-title {
      font-size: 14px;
      color: #111;
    }
    .report-date {
      font-size: 14px;
    }
    .report-title-box {
      text-align: center;
      margin-bottom: 12px;
    }
    .report-title {
      font-size: 14px;
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
      font-size: 14px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 15px;
      font-size: 14px;
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
      html.dark .cell-header {
        background-color: #1e293b !important;
        color: #38bdf8 !important;
        border-color: #334155 !important;
      }
      html.dark .cell-block {
        border-color: #1e293b !important;
      }
      html.dark .report-meta, html.dark .report-meta *, html.dark .cell-title, html.dark .report-title-box, html.dark .report-title {
        color: #f8fafc !important;
        border-color: #334155 !important;
      }
      /* Override inline style colors in dark mode for readable contrast */
      html.dark tr[style*="color: #000000"],
      html.dark tr[style*="color:#000000"],
      html.dark td[style*="color: #000000"],
      html.dark td[style*="color:#000000"] {
        color: #f8fafc !important;
      }
      html.dark tr[style*="color: #0f766e"],
      html.dark tr[style*="color:#0f766e"],
      html.dark td[style*="color: #0f766e"],
      html.dark td[style*="color:#0f766e"] {
        color: #2dd4bf !important;
      }
      /* Incharge Badge Dark Theme */
      html.dark span[style*="#ccfbf1"] {
        background-color: #0f2d29 !important;
        color: #2dd4bf !important;
        border-color: #0f766e !important;
      }
      /* Additional Duties Badge Dark Theme */
      html.dark span[style*="#fef3c7"] {
        background-color: #3b2a1a !important;
        color: #fbbf24 !important;
        border-color: #b45309 !important;
      }
    }
  </style>
</head>
<body>
  <div class="report-meta">
    <span class="cell-title">${cellTitle}</span>
    <div style="text-align: right;">
      <div style="font-size: 14px; font-weight: bold; margin-bottom: 2px;">অনলাইন ব্যাংকিং ডিপার্টমেন্ট</div>
      <span class="report-date">তারিখ: ${getBnDate(reportDate)} ইং</span>
    </div>
  </div>

  <div class="report-title-box">
    <p class="report-title">${reportTitle}</p>
  </div>

  ${execTableHtml}
  ${tablesHtml}

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

    const filename = `employee_directory_${Math.floor(Date.now() / 1000)}.html`;
    const filePathDisk = path.join(uploadsDir, filename);
    fs.writeFileSync(filePathDisk, htmlContent, 'utf-8');

    const relativePath = `/uploads/${filename}`;
    const fileSize = fs.statSync(filePathDisk).size;

    const [doc] = await db.insert(documents).values({
      name: `${cellTitle} (${getBnDate(reportDate)})`,
      filePath: relativePath,
      fileSize: fileSize
    }).returning();

    return NextResponse.json({
      success: true,
      filePath: relativePath,
      document: doc
    });

  } catch (error) {
    console.error('Error generating employee list document:', error);
    return NextResponse.json({ error: 'failed_to_generate_employee_list', message: (error instanceof Error ? error.message : String(error)) }, { status: 500 });
  }
}
