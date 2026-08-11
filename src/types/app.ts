export interface DutyConflictDetails {
  conflictType: import('@/lib/ai-explainer').ConflictType;
  cellName?: string;
  existingLeaveId?: number;
  date?: string;
  dates?: string[];
  employeeName?: string;
  existingLeaveStart?: string | Date;
  existingLeaveEnd?: string | Date;
  [key: string]: any;
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

export interface OfficeOrderPayload {
  orderRef: string;
  date: string;
  category: string;
  cellName?: string;
  dutiesJson?: string;
  duties?: DutyRecord[];
  [key: string]: unknown;
}

export interface EmployeeRecord {
  id: number;
  bankId: string | null;
  name: string;
  designation?: string;
  cellId?: number;
  cellName?: string | null;
  [key: string]: unknown;
}
