import { describe, it, expect } from 'vitest';
import { OFFICE_ORDER_SPEC, BILL_MEMO_SPEC } from '../print-spec';

describe('print-spec constants integrity', () => {
  it('matches canonical Office Order specifications', () => {
    expect(OFFICE_ORDER_SPEC.pageSize).toBe('A4');
    expect(OFFICE_ORDER_SPEC.pageWidth).toBe('210mm');
    expect(OFFICE_ORDER_SPEC.padding).toBe('1.0in');
    expect(OFFICE_ORDER_SPEC.bodyFontSize).toBe('12px');
    expect(OFFICE_ORDER_SPEC.bodyLineHeight).toBe('1.6');
    expect(OFFICE_ORDER_SPEC.logoSize).toBe('64px');
    expect(OFFICE_ORDER_SPEC.bankTitleFontSize).toBe('24px');
    expect(OFFICE_ORDER_SPEC.deptTitleFontSize).toBe('18px');
    expect(OFFICE_ORDER_SPEC.orderTitleFontSize).toBe('14.5px');
    expect(OFFICE_ORDER_SPEC.tableFontSize).toBe('11px');
    expect(OFFICE_ORDER_SPEC.signatureFontSize).toBe('12px');
    expect(OFFICE_ORDER_SPEC.signatureMarginTop).toBe('1.0in');
  });

  it('matches canonical Bill Memo specifications', () => {
    expect(BILL_MEMO_SPEC.pageSize).toBe('legal portrait');
    expect(BILL_MEMO_SPEC.pageWidth).toBe('8.5in');
    expect(BILL_MEMO_SPEC.pageHeight).toBe('14.0in');
    expect(BILL_MEMO_SPEC.paddingTop).toBe('0.5in');
    expect(BILL_MEMO_SPEC.paddingBottom).toBe('0.5in');
    expect(BILL_MEMO_SPEC.paddingLeft).toBe('1.4in');
    expect(BILL_MEMO_SPEC.paddingRight).toBe('0.5in');
    expect(BILL_MEMO_SPEC.bodyFontSize).toBe('12px');
    expect(BILL_MEMO_SPEC.headerDeptFontSize).toBe('18px');
    expect(BILL_MEMO_SPEC.headerDateFontSize).toBe('12px');
  });
});
