import ExcelJS from 'exceljs';

export interface XlsxColumn {
  header: string;
  key: string;
  width?: number;
}

export interface XlsxExportOptions {
  sheetName?: string;
  title?: string;
  columns: XlsxColumn[];
  data: Record<string, unknown>[];
  headerStyle?: Partial<ExcelJS.Style>;
}

export async function generateXlsx(options: XlsxExportOptions): Promise<Blob> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Janata Bank LHN Portal';
  workbook.created = new Date();
  
  const sheet = workbook.addWorksheet(options.sheetName || 'Sheet1');
  
  // Add title row if provided
  if (options.title) {
    const titleRow = sheet.addRow([options.title]);
    titleRow.font = { bold: true, size: 14, name: 'Noto Sans Bengali' };
    sheet.mergeCells(1, 1, 1, options.columns.length);
    titleRow.alignment = { horizontal: 'center' };
    sheet.addRow([]); // blank row after title
  }
  
  // Configure columns
  sheet.columns = options.columns.map(col => ({
    header: col.header,
    key: col.key,
    width: col.width || 15,
  }));
  
  // Style header row
  const headerRowNum = options.title ? 3 : 1;
  const headerRow = sheet.getRow(headerRowNum);
  headerRow.font = { bold: true, size: 11, name: 'Noto Sans Bengali', color: { argb: 'FFFFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0B5E9E' } };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
  headerRow.height = 25;
  
  // Add data rows
  options.data.forEach(row => {
    const dataRow = sheet.addRow(options.columns.map(col => row[col.key] ?? ''));
    dataRow.font = { size: 10, name: 'Noto Sans Bengali' };
    dataRow.alignment = { vertical: 'middle' };
  });
  
  // Add borders to all cells with data
  const lastRow = sheet.lastRow?.number || 1;
  for (let r = headerRowNum; r <= lastRow; r++) {
    const row = sheet.getRow(r);
    for (let c = 1; c <= options.columns.length; c++) {
      const cell = row.getCell(c);
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    }
  }
  
  // Generate buffer and convert to Blob
  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

// Helper to trigger download
export function downloadXlsx(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
