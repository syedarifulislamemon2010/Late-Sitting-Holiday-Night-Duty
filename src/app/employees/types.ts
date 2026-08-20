export interface Cell {
  id: number;
  name: string;
  description: string | null;
  _count?: {
    employees: number;
  };
}

export interface User {
  id: number;
  name: string;
  username: string;
  role: 'ADMIN' | 'USER';
  cells?: { id: number; name: string }[];
}

export interface Executive {
  id: number;
  name: string;
  designation: string;
  bankId: string | null;
  fileNo: string | null;
  phone: string | null;
}

export interface BulkEmployeeInput {
  name: string;
  designation: string;
  bankId: string | null;
  fileNo: string | null;
  mobile: string | null;
  cellName: string;
}

export interface Employee {
  id: number;
  name: string;
  nameEn?: string | null;
  designation: string;
  designationEn?: string | null;
  bankId: string | null;
  fileNo: string | null;
  mobile: string | null;
  cellId: number;
  cell: Cell;
  dutyType?: string;
}
