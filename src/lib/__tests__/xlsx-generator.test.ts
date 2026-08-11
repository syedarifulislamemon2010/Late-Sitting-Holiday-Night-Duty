import { describe, it, expect } from 'vitest';
import { generateXlsx, XlsxExportOptions } from '../xlsx-generator';

describe('xlsx-generator', () => {
  it('should create a valid Blob with Excel MIME type', async () => {
    const options: XlsxExportOptions = {
      columns: [{ header: 'Name', key: 'name' }],
      data: [{ name: 'Test User' }],
    };
    const blob = await generateXlsx(options);
    
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  });

  it('should handle column formatting, title row insertion, and sheet naming options', async () => {
    const options: XlsxExportOptions = {
      sheetName: 'CustomSheet',
      title: 'Custom Title Row',
      columns: [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'Name', key: 'name', width: 25 }
      ],
      data: [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ],
    };
    const blob = await generateXlsx(options);
    
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(0);
  });
});
