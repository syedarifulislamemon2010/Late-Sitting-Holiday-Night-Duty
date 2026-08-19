import { describe, it, expect } from 'vitest';
import {
  parseNumberStr,
  getDesignationRank,
  sortEmployeesBySeniority
} from '../seniority';

describe('Seniority Utility Engine', () => {
  it('parses English and Bengali numeric strings correctly', () => {
    expect(parseNumberStr('12345')).toBe(12345);
    expect(parseNumberStr('১২৩৪৫')).toBe(12345);
    expect(parseNumberStr('ID-০২১৭৪৩')).toBe(21743);
    expect(parseNumberStr('')).toBeNaN();
    expect(parseNumberStr(null)).toBeNaN();
  });

  it('ranks designations in correct hierarchy: SPO (1) > PO (2) > SO (3) > Officer (4)', () => {
    expect(getDesignationRank('সিনিয়র প্রিন্সিপাল অফিসার (এসপিও)')).toBe(1);
    expect(getDesignationRank('SPO')).toBe(1);
    expect(getDesignationRank('প্রিন্সিপাল অফিসার (পিও)')).toBe(2);
    expect(getDesignationRank('PO')).toBe(2);
    expect(getDesignationRank('সিনিয়র অফিসার (এসও)')).toBe(3);
    expect(getDesignationRank('SO-IT')).toBe(3);
    expect(getDesignationRank('অফিসার (আইটি)')).toBe(4);
    expect(getDesignationRank('General Employee')).toBe(99);
  });

  it('sorts employees primarily by rank, then bankId, then fileNo', () => {
    const rawList = [
      { name: 'Officer D (SO-IT)', designation: 'SO-IT', bankId: '045000', fileNo: '10' },
      { name: 'Officer A (SPO)', designation: 'SPO', bankId: '020000', fileNo: '05' },
      { name: 'Officer C (PO)', designation: 'PO', bankId: '030000', fileNo: '02' },
      { name: 'Officer B (SPO Junior ID)', designation: 'SPO', bankId: '025000', fileNo: '01' },
      { name: 'Officer E (PO Lower ID)', designation: 'PO', bankId: '028000', fileNo: '09' },
    ];

    const sorted = sortEmployeesBySeniority(rawList);

    expect(sorted[0].name).toBe('Officer A (SPO)'); // Rank 1, BankId 20000
    expect(sorted[1].name).toBe('Officer B (SPO Junior ID)'); // Rank 1, BankId 25000
    expect(sorted[2].name).toBe('Officer E (PO Lower ID)'); // Rank 2, BankId 28000
    expect(sorted[3].name).toBe('Officer C (PO)'); // Rank 2, BankId 30000
    expect(sorted[4].name).toBe('Officer D (SO-IT)'); // Rank 3, BankId 45000
  });

  it('handles bank ID ties or missing bank ID by falling back to File No', () => {
    const list = [
      { name: 'Officer Y', designation: 'PO', bankId: null, fileNo: '500' },
      { name: 'Officer X', designation: 'PO', bankId: null, fileNo: '200' },
      { name: 'Officer Z (Has ID)', designation: 'PO', bankId: '030000', fileNo: '900' },
    ];

    const sorted = sortEmployeesBySeniority(list);
    expect(sorted[0].name).toBe('Officer Z (Has ID)'); // BankId present goes first
    expect(sorted[1].name).toBe('Officer X'); // FileNo 200 < 500
    expect(sorted[2].name).toBe('Officer Y'); // FileNo 500
  });
});
