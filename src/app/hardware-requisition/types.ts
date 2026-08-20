export interface HardwareItem {
  id: string;
  itemType: string;
  itemDescription: string;
  quantity: number;
  unit: string;
  remarks: string;
}

export interface HardwareRequisition {
  id: number;
  reqNumber: string;
  requisitionDate: string;
  applicantName: string;
  applicantDesignation: string;
  applicantCell: string;
  applicantId?: string | null;
  requisitionType: string;
  reason: string;
  status: string;
  itemsJson: string;
  createdAt: string;
}

export interface Employee {
  id: number;
  name: string;
  designation: string;
  bankId: string | null;
  fileNo: string | null;
  cellId: number;
  mobile: string | null;
  cell?: {
    id: number;
    name: string;
    description: string | null;
  };
}

export interface Cell {
  id: number;
  name: string;
}

export interface Executive {
  id: number;
  name: string;
  designation: string;
}

export const DEFAULT_HARDWARE_ITEMS = [
  'Desktop Computer',
  'Laptop',
  'Monitor',
  'Keyboard & Mouse',
  'UPS',
  'Printer / Scanner',
  'SSD / Hard Disk Drive',
  'RAM Module',
  'Network Cable / RJ45',
  'Power Supply Unit (PSU)',
  'Toner / Cartridge',
  'Other Hardware Accessories'
];
