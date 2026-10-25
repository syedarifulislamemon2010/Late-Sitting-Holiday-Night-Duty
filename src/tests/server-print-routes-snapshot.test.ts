import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';

// Mock DB
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve([])),
          then: vi.fn((cb) => cb([]))
        })),
        then: vi.fn((cb) => cb([]))
      }))
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([{ id: 1, name: 'টেস্ট ডকুমেন্ট', filePath: '/uploads/test.html', fileSize: 1024 }]))
      }))
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve([{ id: 1 }]))
        }))
      }))
    }))
  }
}));

// Mock Auth
vi.mock('@/lib/auth-wrapper', () => ({
  getCurrentUser: vi.fn(() => Promise.resolve({
    id: 1,
    username: 'admin',
    name: 'Admin User',
    role: 'ADMIN',
    cells: []
  }))
}));

// Mock Audit
vi.mock('@/lib/audit', () => ({
  logActivity: vi.fn(() => Promise.resolve(true))
}));

describe('Server Print Routes HTML Snapshot Characterization', () => {
  const createdFiles: string[] = [];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const trackAndReadFile = (filePath: string) => {
    const diskPath = path.join(process.cwd(), 'public', filePath);
    createdFiles.push(diskPath);
    expect(fs.existsSync(diskPath)).toBe(true);
    return fs.readFileSync(diskPath, 'utf-8');
  };

  it('1. documents/generate-lunch-bill HTML output structure matches snapshot', async () => {
    const { POST } = await import('@/app/api/documents/generate-lunch-bill/route');
    const payload = {
      monthBangla: 'সেপ্টেম্বর',
      yearBangla: '২০২৬',
      workingDays: 17,
      cells: [
        {
          id: 1,
          name: 'সফটওয়্যার সেল',
          records: [
            {
              employeeId: 10,
              employeeName: 'জনাব সৈয়দ আরিফুল ইসলাম',
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
    const html = trackAndReadFile(data.filePath);

    // Snapshot characterization assertions for lunch-bill
    expect(html).toContain('সফটওয়্যার সেল');
    expect(html).toContain('জনাব সৈয়দ আরিফুল ইসলাম');
    expect(html).toContain('026795'); // Bank ID is rendered in Latin font family
    expect(html).toContain('৬৪০০/-'); // Bengali numeral bill
    expect(html).toContain('৬৩৮৫/-'); // Net payable
  });

  it('2. documents/generate-office-order HTML output structure matches snapshot', async () => {
    const { POST } = await import('@/app/api/documents/generate-office-order/route');
    const payload = {
      orderRef: 'জেবি/আইটিডি/অপারেশন/২০২৬-০১',
      orderDate: '2026-08-01',
      orderText: 'এতদ্বারা জানানো যাচ্ছে যে নিম্নলিখিত কর্মকর্তাগণ নির্ধারিত তারিখে ডিউটি পালন করবেন।',
      duties: [
        {
          employee: {
            name: 'জনাব আরিফুল ইসলাম',
            designation: 'প্রিন্সিপাল অফিসার',
            bankId: '026795'
          },
          datesFormatted: '01-08-2026, 02-08-2026',
          description: 'সফটওয়্যার ও ডেটাবেজ রক্ষণাবেক্ষণ'
        }
      ],
      signingOfficer: 'মোছাঃ নাসরীন সুলতানা',
      signingDesignation: 'সহকারী মহাব্যবস্থাপক',
      copies: ['১। সংশ্লিষ্ট নথি', '২। অফিস কপি'],
      headerMode: 'with_header'
    };

    const req = new Request('http://localhost:3000/api/documents/generate-office-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    const html = trackAndReadFile(data.filePath);

    expect(html).toContain('জনতা ব্যাংক পিএলসি');
    expect(html).toContain('জেবি/আইটিডি/অপারেশন/২০২৬-০১');
    expect(html).toContain('জনাব আরিফুল ইসলাম');
    expect(html).toContain('০১-০৮-২০২৬');
    expect(html).toContain('মোছাঃ নাসরীন সুলতানা');
    expect(html).toContain('সহকারী মহাব্যবস্থাপক');
    expect(html).toContain('১। সংশ্লিষ্ট নথি');
    expect(html).toContain('২। অফিস কপি');
  });

  it('3. documents/generate-bill-memo HTML output structure matches snapshot', async () => {
    const { POST } = await import('@/app/api/documents/generate-bill-memo/route');
    const payload = {
      billRef: 'জেবি/আইটিডি/বিল/২০২৬-০৫',
      billDate: '2026-08-05',
      subjectText: 'আগস্ট ২০২৬ মাসের অতিরিক্ত ডিউটি ভাতা বিল প্রসঙ্গে।',
      openingParagraph: 'আইটি অপারেশন শাখার কর্মকর্তা/কর্মচারীদের অতিরিক্ত ডিউটি ভাতা বিল নিম্নে উপস্থাপন করা হলো:',
      representativeName: 'জনাব আরিফুল ইসলাম',
      representativeDesignation: 'প্রিন্সিপাল অফিসার',
      transportRate: 250,
      apyaonRate: 250,
      totalDays: 2,
      totalTransport: 500,
      totalApyaon: 500,
      grandTotal: 1000,
      grandTotalInWords: 'এক হাজার টাকা মাত্র',
      totalTransportInWords: 'পাঁচশত টাকা মাত্র',
      totalApyaonInWords: 'পাঁচশত টাকা মাত্র',
      summaries: [
        {
          name: 'জনাব আরিফুল ইসলাম',
          designation: 'প্রিন্সিপাল অফিসার',
          datesFormatted: '01-08-2026, 02-08-2026',
          days: 2,
          totalTransport: 500,
          totalApyaon: 500,
          grandTotal: 1000
        }
      ]
    };

    const req = new Request('http://localhost:3000/api/documents/generate-bill-memo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    const html = trackAndReadFile(data.filePath);

    // Bill memo header uses অনলাইন ব্যাংকিং ডিপার্টমেন্ট
    expect(html).toContain('অনলাইন ব্যাংকিং ডিপার্টমেন্ট');
    expect(html).toContain('বিষয়: আগস্ট ২০২৬ মাসের অতিরিক্ত ডিউটি ভাতা বিল প্রসঙ্গে।');
    expect(html).toContain('জনাব আরিফুল ইসলাম');
    expect(html).toContain('১০০০/-');
    expect(html).toContain('(এক হাজার টাকা)');
  });

  it('4. documents/generate-closing-bill HTML output structure matches snapshot', async () => {
    const { POST } = await import('@/app/api/documents/generate-closing-bill/route');
    const payload = {
      monthName: 'জুন ২০২৬',
      reportDate: '2026-06-30',
      totalEmployeesCount: 1,
      totalClaimAll: 2000,
      totalStampAll: 15,
      grandTotalAll: 1985,
      grandTotalInWords: 'এক হাজার নয় শত পঁচাশি টাকা মাত্র',
      groupedData: [
        {
          cellName: 'সফটওয়্যার সেল',
          records: [
            {
              employeeName: 'জনাব আরিফুল ইসলাম',
              designation: 'প্রিন্সিপাল অফিসার',
              bankId: '026795'
            }
          ]
        }
      ]
    };

    const req = new Request('http://localhost:3000/api/documents/generate-closing-bill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    const html = trackAndReadFile(data.filePath);

    expect(html).toContain('অনলাইন ব্যাংকিং ডিপার্টমেন্ট');
    expect(html).toContain('ক্লোজিং বিল রিপোর্ট');
    expect(html).toContain('সফটওয়্যার সেল');
    expect(html).toContain('জনাব আরিফুল ইসলাম');
    expect(html).toContain('১৯৮৫/-');
    expect(html).toContain('এক হাজার নয় শত পঁচাশি টাকা মাত্র');
  });

  it('5. office-orders/raw HTML output matches snapshot via DB mock', async () => {
    const { db } = await import('@/lib/db');
    const mockOrder = {
      id: 99,
      orderRef: 'জেবি/আইটিডি/২০২৬-৯৯',
      orderDate: '2026-08-10',
      category: 'HOLIDAY',
      contentJson: JSON.stringify({
        subject: 'ছুটির দিনের ডিউটি প্রসঙ্গে',
        orderText: 'নিম্নবর্ণিত কর্মকর্তাগণ ছুটির দিনে উপস্থিত ছিলেন।',
        signingOfficer: 'মোছাঃ নাসরীন সুলতানা',
        signingDesignation: 'সহকারী মহাব্যবস্থাপক'
      }),
      dutiesJson: JSON.stringify([
        {
          employeeName: 'জনাব আরিফুল ইসলাম',
          designation: 'প্রিন্সিপাল অফিসার',
          datesFormatted: '01-08-2026',
          days: 1,
          totalTransport: 250,
          totalApyaon: 250,
          grandTotal: 500
        }
      ]),
      status: 'Active'
    };

    (db.select as any).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([mockOrder])
      })
    });

    const { GET } = await import('@/app/api/office-orders/raw/route');
    const req = new Request('http://localhost:3000/api/office-orders/raw?id=99');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const html = await res.text();

    expect(html).toContain('জনতা ব্যাংক পিএলসি');
    expect(html).toContain('জেবি/আইটিডি/২০২৬-৯৯');
    expect(html).toContain('জনাব আরিফুল ইসলাম');
    expect(html).toContain('মোছাঃ নাসরীন সুলতানা');
  });

  it('6. safely escapes HTML special characters (<, >, &, \") while preserving Bengali conjuncts', async () => {
    const { POST } = await import('@/app/api/documents/generate-office-order/route');
    const payload = {
      orderRef: 'জেবি/আইটিডি/<টেস্ট>&২০২৬"০১',
      orderDate: '2026-08-01',
      orderText: '<p>সফটওয়্যার & ডাটাবেজ <strong>রক্ষণাবেক্ষণ</strong></p>',
      duties: [
        {
          employee: {
            name: 'জনাব আরিফুল & সহযোগী <অফিসার>',
            designation: 'প্রিন্সিপাল অফিসার (পিও)',
            bankId: '026795'
          },
          datesFormatted: '01-08-2026',
          description: 'পরীক্ষা & নিরীক্ষা <script>alert(1)</script>'
        }
      ],
      signingOfficer: 'মোছাঃ নাসরীন সুলতানা & অন্যান্য',
      signingDesignation: 'সহকারী মহাব্যবস্থাপক (এজিএম)',
      copies: ['১। নথি & রেকর্ড <কপি>'],
      headerMode: 'with_header'
    };

    const req = new Request('http://localhost:3000/api/documents/generate-office-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    const html = trackAndReadFile(data.filePath);

    // Escaped entities verification
    expect(html).toContain('&lt;টেস্ট&gt;&amp;২০২৬&quot;০১');
    expect(html).toContain('জনাব আরিফুল &amp; সহযোগী &lt;অফিসার&gt;');
    expect(html).toContain('পরীক্ষা &amp; নিরীক্ষা &lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).toContain('মোছাঃ নাসরীন সুলতানা &amp; অন্যান্য');
    expect(html).toContain('১। নথি &amp; রেকর্ড &lt;কপি&gt;');
    // Bengali conjuncts integrity
    expect(html).toContain('সফটওয়্যার &amp; ডাটাবেজ');
    expect(html).toContain('<strong>রক্ষণাবেক্ষণ</strong>');
    expect(html).not.toContain('<script>alert(1)</script>');
  });
});
