export interface DutyConflictDetails {
  conflictType: import('@/lib/ai-explainer').ConflictType;
  cellName?: string;
  existingLeaveId?: number;
  date?: string;
  dates?: string[];
  employeeName?: string;
  existingLeaveStart?: string | Date;
  existingLeaveEnd?: string | Date;
  [key: string]: unknown;
}

export interface BillingFilterOptions {
  cellId?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  month?: string | null;
  year?: string | null;
  status?: string | null;
  [key: string]: unknown;
}

export interface LeaveApplicationFormState {
  bankId: string;
  startDate: string;
  endDate: string;
  leaveType: string;
  reason: string;
  delegateOfficerId?: string;
  [key: string]: unknown;
}

export interface DutyRecord {
  id?: number;
  date?: string;
  employeeId?: string | number;
  employeeName?: string;
  cellName?: string | null;
  [key: string]: unknown;
}

export interface OrderDuty {
  employeeId?: number;
  employeeName: string;
  designation: string;
  description?: string;
  dates?: string | string[];
  datesFormatted?: string;
  days?: number;
  totalTransport?: number;
  totalApyaon?: number;
  grandTotal?: number;
  [key: string]: unknown;
}

export interface OfficeOrderPayload {
  orderRef: string;
  date: string;
  category: string;
  cellName?: string;
  dutiesJson?: string;
  duties?: OrderDuty[];
  [key: string]: unknown;
}

export interface EmployeeRecord {
  id: number;
  bankId: string | null;
  name: string;
  nameEn?: string | null;
  designation: string;
  designationEn?: string | null;
  cellId: number;
  cellName?: string | null;
  mobile?: string | null;
  fileNo?: string | null;
  [key: string]: unknown;
}

export interface PayeeSummary {
  payeeName: string;
  designation: string;
  billCount: number;
  transportAllowance?: number;
  apyaonAllowance?: number;
  grandTotal: number;
}

export interface EmployeeBreakdownRecord {
  name: string;
  designation: string;
  cellName?: string;
  dutyDays: number;
  amount: number;
  deduction?: number;
  deductions?: number;
  netPayable: number;
}
