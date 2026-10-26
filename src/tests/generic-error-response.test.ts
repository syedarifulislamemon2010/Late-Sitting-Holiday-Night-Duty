import { describe, it, expect, vi } from 'vitest';
import * as billMemoRoute from '@/app/api/documents/generate-bill-memo/route';
import * as closingBillRoute from '@/app/api/documents/generate-closing-bill/route';
import * as employeeListRoute from '@/app/api/documents/generate-employee-list/route';
import * as lunchBillRoute from '@/app/api/documents/generate-lunch-bill/route';
import * as officeOrderRoute from '@/app/api/documents/generate-office-order/route';
import * as documentsRoute from '@/app/api/documents/route';
import * as trashRoute from '@/app/api/trash/route';
import * as authWrapper from '@/lib/auth-wrapper';

describe('Generic Error Response Hardening for Remaining Routes', () => {
  const dummyAdmin = {
    id: 1,
    username: 'admin',
    name: 'Admin User',
    role: 'ADMIN' as const,
    mobile: null,
    cells: []
  };

  it('generate-bill-memo returns generic error message and does not leak stack/SQL', async () => {
    vi.spyOn(authWrapper, 'getCurrentUser').mockResolvedValue(dummyAdmin);
    const req = new Request('http://localhost:3000/api/documents/generate-bill-memo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid-json'
    });

    const res = await billMemoRoute.POST(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe('failed_to_generate_bill_memo');
    expect(data.message).toBe('বিল মেমো তৈরি করতে ব্যর্থ হয়েছে।');
    expect(JSON.stringify(data)).not.toContain('node_modules');
    expect(JSON.stringify(data)).not.toContain('SyntaxError');
  });

  it('generate-closing-bill returns generic error message', async () => {
    vi.spyOn(authWrapper, 'getCurrentUser').mockResolvedValue(dummyAdmin);
    const req = new Request('http://localhost:3000/api/documents/generate-closing-bill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid-json'
    });

    const res = await closingBillRoute.POST(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe('failed_to_generate_closing_bill');
    expect(data.message).toBe('ক্লোজিং বিল তৈরি করতে ব্যর্থ হয়েছে।');
    expect(JSON.stringify(data)).not.toContain('SyntaxError');
  });

  it('generate-employee-list returns generic error message', async () => {
    vi.spyOn(authWrapper, 'getCurrentUser').mockResolvedValue(dummyAdmin);
    const req = new Request('http://localhost:3000/api/documents/generate-employee-list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid-json'
    });

    const res = await employeeListRoute.POST(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe('failed_to_generate_employee_list');
    expect(data.message).toBe('কর্মকর্তা তালিকা তৈরি করতে ব্যর্থ হয়েছে।');
  });

  it('generate-lunch-bill returns generic error message', async () => {
    vi.spyOn(authWrapper, 'getCurrentUser').mockResolvedValue(dummyAdmin);
    const req = new Request('http://localhost:3000/api/documents/generate-lunch-bill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid-json'
    });

    const res = await lunchBillRoute.POST(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe('failed_to_generate_lunch_bill');
    expect(data.message).toBe('লাঞ্চ বিল তৈরি করতে ব্যর্থ হয়েছে।');
  });

  it('generate-office-order returns generic error message', async () => {
    vi.spyOn(authWrapper, 'getCurrentUser').mockResolvedValue(dummyAdmin);
    const req = new Request('http://localhost:3000/api/documents/generate-office-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid-json'
    });

    const res = await officeOrderRoute.POST(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe('failed_to_generate_office_order');
    expect(data.message).toBe('অফিস আদেশ তৈরি করতে ব্যর্থ হয়েছে।');
  });

  it('documents route DELETE returns generic error message on unexpected error', async () => {
    vi.spyOn(authWrapper, 'getCurrentUser').mockResolvedValue(dummyAdmin);
    const req = new Request('http://localhost:3000/api/documents?id=9999', { method: 'DELETE' });

    const res = await documentsRoute.DELETE(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe('internal_error');
    expect(data.message).toBe('নথিপত্র প্রসেস করতে অভ্যন্তরীণ ত্রুটি হয়েছে।');
    expect(JSON.stringify(data)).not.toContain('/var/secrets/db.sock');
  });

  it('trash route returns generic error message', async () => {
    vi.spyOn(authWrapper, 'getCurrentUser').mockResolvedValue(dummyAdmin);
    const req = new Request('http://localhost:3000/api/trash', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid-json'
    });

    const res = await trashRoute.POST(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe('trash_action_failed');
    expect(data.message).toBe('ট্র্যাশ অ্যাকশন সম্পন্ন করতে ব্যর্থ হয়েছে।');
  });
});
