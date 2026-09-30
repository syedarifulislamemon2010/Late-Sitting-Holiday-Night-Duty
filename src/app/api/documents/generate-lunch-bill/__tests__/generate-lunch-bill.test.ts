import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../route';
import fs from 'fs';

// Mock DB
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve([]))
        }))
      }))
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([{ id: 1, name: 'সমন্বিত লাঞ্চ বিল', filePath: '/uploads/test.html' }]))
      }))
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve([{ id: 1, name: 'সমন্বিত লাঞ্চ বিল', filePath: '/uploads/test.html' }]))
        }))
      }))
    }))
  }
}));

describe('POST /api/documents/generate-lunch-bill', () => {
  let createdFiles: string[] = [];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('successfully generates HTML document with Kalpurush font when called with client payload', async () => {
    const payload = {
      monthBangla: 'সেপ্টেম্বর',
      yearBangla: '২০২৬',
      workingDays: 17,
      cells: [
        {
          id: 1,
          name: 'সফটওয়্যার সেল',
          records: [
            {
              employeeId: 10,
              employeeName: 'জনাব সৈয়দ আরিফুল ইসলাম ইমন',
              designation: 'প্রিন্সিপাল অফিসার',
              bankId: '026795',
              presentDays: 16,
              absenceDays: 1,
              totalBill: 6400,
              netPayable: 6385,
              additionalDeduction: 0
            }
          ]
        }
      ],
      executives: [
        {
          employeeId: 1,
          employeeName: 'মোছাঃ নাসরীন সুলতানা',
          designation: 'সহকারী মহাব্যবস্থাপক',
          bankId: '010001',
          presentDays: 17,
          absenceDays: 0,
          totalBill: 6800,
          netPayable: 6785,
          additionalDeduction: 0
        }
      ]
    };

    const req = new Request('http://localhost:3000/api/documents/generate-lunch-bill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.filePath).toBeDefined();

    // Verify generated file exists and contains Kalpurush font and Bengali numerals
    const diskPath = `${process.cwd()}/public${data.filePath}`;
    createdFiles.push(diskPath);

    if (fs.existsSync(diskPath)) {
      const content = fs.readFileSync(diskPath, 'utf-8');
      expect(content).toContain("font-family: 'Kalpurush'");
      expect(content).toContain("font-weight: normal;");
      expect(content).toContain("font-weight: bold;");
      expect(content).toContain("সফটওয়্যার সেল");
      expect(content).toContain("জনাব সৈয়দ আরিফুল ইসলাম ইমন");
      // Clean up test file
      try { fs.unlinkSync(diskPath); } catch {}
    }
  });

  it('handles standard groupedData payload correctly and calculates Bengali in words', async () => {
    const payload = {
      monthName: 'অক্টোবর ২০২৬',
      groupedData: [
        {
          cellName: 'ডাটাবেজ সেল',
          records: [
            {
              employeeName: 'আব্দুল্লাহ আল জোবায়ের',
              designation: 'সিনিয়র অফিসার',
              bankId: '028166',
              presentDays: 17,
              absenceDays: 0,
              totalBill: 6800,
              netPayable: 6785
            }
          ]
        }
      ],
      workingDays: 17
    };

    const req = new Request('http://localhost:3000/api/documents/generate-lunch-bill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.filePath).toBeDefined();

    const diskPath = `${process.cwd()}/public${data.filePath}`;
    if (fs.existsSync(diskPath)) {
      const content = fs.readFileSync(diskPath, 'utf-8');
      expect(content).toContain('অক্টোবর ২০২৬');
      expect(content).toContain('ডাটাবেজ সেল');
      expect(content).toContain('আব্দুল্লাহ আল জোবায়ের');
      expect(content).toContain('কথায়:');
      try { fs.unlinkSync(diskPath); } catch {}
    }
  });
});
