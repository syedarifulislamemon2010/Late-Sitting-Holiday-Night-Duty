import { z } from 'zod';

export const documentGenerateSchema = z.object({
  templateType: z.string().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
  month: z.string().optional(),
  year: z.union([z.string(), z.number()]).optional(),
  cellId: z.union([z.string(), z.number()]).optional(),
  orderRef: z.string().optional(),
  orderDate: z.string().optional(),
  category: z.string().optional(),
  employeeName: z.string().optional(),
  duties: z.array(z.record(z.string(), z.unknown())).optional()
}).passthrough();

export const billMemoGenerateSchema = z.object({
  openingParagraph: z.string().optional(),
  summaries: z.array(z.object({
    name: z.string().optional(),
    designation: z.string().optional(),
    datesFormatted: z.string().optional(),
    days: z.number().optional(),
    totalTransport: z.number().optional(),
    totalApyaon: z.number().optional(),
    grandTotal: z.number().optional()
  })).min(0),
  totalDays: z.number().optional(),
  totalApyaon: z.number().optional(),
  totalTransport: z.number().optional(),
  grandTotal: z.number().optional(),
  grandTotalInWords: z.string().optional(),
  representativeName: z.string().optional(),
  representativeDesignation: z.string().optional(),
  subjectText: z.string().optional(),
  billDate: z.string().optional(),
  transportRate: z.number().optional().default(200),
  apyaonRate: z.number().optional().default(100),
  totalTransportInWords: z.string().optional(),
  totalApyaonInWords: z.string().optional(),
  billRef: z.string().optional()
}).passthrough();

export const closingBillGenerateSchema = z.object({
  monthYear: z.string().optional(),
  cellId: z.union([z.string(), z.number()]).optional(),
  totalAmount: z.number().optional(),
  records: z.array(z.any()).optional()
}).passthrough();

export const employeeListGenerateSchema = z.object({
  cellId: z.union([z.string(), z.number()]).optional(),
  includeInactive: z.boolean().optional()
}).passthrough();

export const lunchBillGenerateSchema = z.object({
  month: z.string().optional(),
  cellId: z.union([z.string(), z.number()]).optional(),
  workingDays: z.union([z.string(), z.number()]).optional()
}).passthrough();

export const officeOrderGenerateSchema = z.object({
  orderRef: z.string().optional(),
  orderDate: z.string().optional(),
  cellName: z.string().optional(),
  category: z.string().optional(),
  duties: z.array(z.any()).optional()
}).passthrough();

export type BillMemoGenerateInput = z.infer<typeof billMemoGenerateSchema>;
export type ClosingBillGenerateInput = z.infer<typeof closingBillGenerateSchema>;
export type EmployeeListGenerateInput = z.infer<typeof employeeListGenerateSchema>;
export type LunchBillGenerateInput = z.infer<typeof lunchBillGenerateSchema>;
export type OfficeOrderGenerateInput = z.infer<typeof officeOrderGenerateSchema>;
