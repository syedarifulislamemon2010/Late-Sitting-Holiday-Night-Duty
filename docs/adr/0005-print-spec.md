# 5. Canonical Print Specification Alignment

## Status
Accepted

## Context
The application generates official banking documents across multiple interfaces:
1. Interactive preview in roster management (`OfficeOrderPrintPreview.tsx`).
2. Interactive preview in bill memo editing (`BillMemoEditorPrintView.tsx`).
3. Archive print previews in documents history (`OfficeOrderPrintModal.tsx`).
4. Server-rendered HTML generation endpoints (`api/office-orders/raw`, `api/documents/generate-office-order`, and `api/documents/generate-bill-memo`).

Over time, individual endpoints drifted in font sizes (11px vs 12px), sheet paddings (0.8in vs 1.0in for A4; 0.35in vs 0.5in for legal), header font sizes, and line-height values.

## Decision
We established `src/lib/print-spec.ts` as the single canonical source of truth:
- **Office Orders (A4)**: 1.0 inch page padding, 64px logo, 24px bank name, 18px department name, 14.5px category title, 12px body font (line-height 1.6), 11px table font, and 1.0in signature top margin.
- **Bill Memos (US-Legal 8.5x14in)**: 0.5in top/bottom, 1.4in left, 0.5in right margins. 18px header, 12px date/subject/body (line-height 1.1).
- All client modals and server route handlers must strictly conform to these constants.

## Consequences
- **Positive:** Guaranteed consistency between screen previews, printable dialogs, and exported PDF/HTML files.
- **Negative:** Existing snapshots required alignment to verify compliance.
