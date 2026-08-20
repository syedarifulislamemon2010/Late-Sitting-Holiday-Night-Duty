export interface Implementer {
  name: string;
  designation: string;
  organization: string;
}

export interface TazForm {
  id: number;
  formDate: string;
  ref: string;
  pacsId: string;
  title: string;
  purpose: string;
  applicationName: string;
  routineDetails: string;
  subroutineDetails: string;
  versionInfo: string;
  needBackendAccess: string;
  needCoreFtpAccess: string;
  needBrowserAccess: string;
  browserPortChange: string;
  duringTxHour: string;
  numTeamMembers: number;
  approxScheduleStart: string;
  approxScheduleEnd: string;
  execScheduleStart: string;
  execScheduleEnd: string;
  impact: string;
  requesterName: string;
  requesterDesignation: string;
  requesterOrganization: string;
  implementersJson: string;
  createdAt: string;
}

export interface Holiday {
  date: string;
  name: string;
  isWorkingDay: boolean;
}

export interface Employee {
  id: number;
  name: string;
  designation: string;
  cellId: number;
  cell?: {
    id: number;
    name: string;
  };
}

export interface Cell {
  id: number;
  name: string;
}

export type TazFormData = Omit<TazForm, 'id' | 'createdAt' | 'implementersJson'> & {
  implementers: Implementer[];
};

export interface CalendarDatePickerProps {
  value: string;
  onChange: (date: string) => void;
  isNonWorkingDay: (dateStr: string) => boolean;
}
