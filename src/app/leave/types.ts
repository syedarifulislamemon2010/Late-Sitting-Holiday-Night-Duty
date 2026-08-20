export interface Employee {
  id: number;
  name: string;
  designation: string;
  bankId: string | null;
  fileNo: string | null;
  mobile: string | null;
  cellId: number;
  cell?: {
    id: number;
    name: string;
    description: string | null;
  };
}

export interface Cell {
  id: number;
  name: string;
  description: string | null;
}

export interface UserSession {
  id?: number;
  name?: string;
  username?: string;
  role?: string;
  cells?: { id?: number; name: string }[];
}

export interface Leave {
  id: number;
  leaveType: 'CASUAL' | 'POST_FACTO' | 'STATION_LEAVE';
  startDate: string;
  endDate: string;
  applicationDate: string;
  applicantName: string;
  designation: string;
  bankId: string;
  fileNo?: string | null;
  cellName: string;
  leaveLocation: string;
  mobileNo: string;
  selectedDistrict?: string | null;
  delegateId?: string | null;
  casualTotal: number;
  casualUsed: number;
  ordinaryTotal: number;
  ordinaryUsed: number;
  specialTotal: number;
  specialUsed: number;
}

export interface Holiday {
  date: string;
  name: string;
  isWorkingDay: boolean;
}
