/**
 * Official Banking Portal Print Specifications
 * 
 * DESIGN FREEZE & BUSINESS LOGIC FREEZE:
 * Canonical reference components:
 * 1. Office Order Reference: `src/app/roster/components/OfficeOrderPrintPreview.tsx`
 * 2. Bill Memo Reference: `src/app/billing/components/BillMemoEditorPrintView.tsx`
 */

export const OFFICE_ORDER_SPEC = {
  pageSize: 'A4',
  pageWidth: '210mm',
  pageHeight: '297mm',
  padding: '1.0in',
  fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif',
  bodyFontSize: '12px',
  bodyLineHeight: '1.6',
  logoSize: '64px',
  bankTitleFontSize: '24px',
  bankTitleLineHeight: '1.0',
  bankTaglineFontSize: '10px',
  deptTitleFontSize: '18px',
  deptTitleLineHeight: '1.0',
  orderTitleFontSize: '14.5px',
  refDateFontSize: '12px',
  tableFontSize: '11px',
  tableHeaderBg: '#f8fafc',
  tableBorderColor: '#000000',
  signatureFontSize: '12px',
  signatureMarginTop: '1.0in',
} as const;

export const BILL_MEMO_SPEC = {
  pageSize: 'legal portrait',
  pageWidth: '8.5in',
  pageHeight: '14.0in',
  paddingTop: '0.5in',
  paddingBottom: '0.5in',
  paddingLeft: '1.4in',
  paddingRight: '0.5in',
  fontFamily: '"SolaimanLipi", "Nikosh", "Noto Sans Bengali", sans-serif',
  bodyFontSize: '12px',
  bodyLineHeight: '1.1',
  headerDeptFontSize: '18px',
  headerDateFontSize: '12px',
  subjectFontSize: '12px',
  tableFontSize: '11px',
  tableBorderColor: '#000000',
  paragraphFontSize: '12px',
  routingFontSize: '11px',
} as const;
