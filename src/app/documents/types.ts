export interface DocumentFile {
  id: number;
  name: string;
  filePath: string;
  fileSize: number;
  uploadedAt: string;
}

export interface UserSession {
  id?: number;
  name?: string;
  username?: string;
  role?: string;
  cells?: { id?: number; name: string }[];
}

export interface OrderDuty {
  employeeId?: string | null;
  employeeName: string;
  designation: string;
  cellName?: string;
  days: number;
  apyaonRate: number;
  totalApyaon: number;
  totalTransport: number;
  grandTotal: number;
  dates: string[];
  datesFormatted?: string;
  description?: string;
}

export interface OfficeOrder {
  id: number;
  orderRef: string;
  originalOrderRef?: string;
  orderDate: string;
  category: string;
  employeeName: string;
  cellName: string | null;
  status: string;
  dutiesJson?: string | null;
  duties: OrderDuty[];
  content?: {
    subjectText?: string;
    openingParagraph?: string;
    signingOfficer?: string;
    signingDesignation?: string;
    representativeDesignation?: string;
    totalDays?: number;
    totalApyaon?: number;
    totalTransport?: number;
    grandTotal?: number;
    grandTotalInWords?: string;
    backingOrderId?: number | null;
    backingOrderRef?: string | null;
    backingOrderDate?: string | null;
    orderText?: string;
    copies?: string[];
  } | null;
}

export interface ManualDoc {
  id: number;
  name: string;
  filePath: string;
  fileSize: number;
  fileType: string;
  uploadedBy?: string | null;
  isVisibleToUsers?: boolean;
  uploadedAt: string;
}
