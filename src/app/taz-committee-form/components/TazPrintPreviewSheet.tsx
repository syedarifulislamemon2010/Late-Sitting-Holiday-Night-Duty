'use client';

import React from 'react';

interface Implementer {
  name: string;
  designation: string;
  organization: string;
}

interface TazPrintPreviewSheetProps {
  formDate: string;
  refCode: string;
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
  implementers: Implementer[];
  formatDateToDMY: (dateStr: string) => string;
  formatDateTimeForPrint: (dtStr: string) => string;
}

export default function TazPrintPreviewSheet({
  formDate,
  refCode,
  title,
  purpose,
  applicationName,
  routineDetails,
  subroutineDetails,
  versionInfo,
  needBackendAccess,
  needCoreFtpAccess,
  needBrowserAccess,
  browserPortChange,
  duringTxHour,
  numTeamMembers,
  approxScheduleStart,
  approxScheduleEnd,
  execScheduleStart,
  execScheduleEnd,
  impact,
  requesterName,
  requesterDesignation,
  requesterOrganization,
  implementers,
  formatDateToDMY,
  formatDateTimeForPrint
}: TazPrintPreviewSheetProps) {
  return (
    <div 
      id="taz-print-area" 
      className="w-[210mm] min-h-[297mm] bg-white dark:bg-slate-950 text-black dark:text-slate-200 p-[15mm] border-2 border-slate-350 dark:border-slate-800 rounded-3xl print:border-none print:rounded-none print:shadow-none shadow-[0_15px_50px_rgba(0,0,0,0.06)] relative flex flex-col justify-start shrink-0 font-serif text-[11px] leading-relaxed space-y-4"
    >
      {/* Header */}
      <div className="text-center space-y-1">
        <h1 className="text-[20px] font-bold text-black dark:text-white tracking-wide">Janata Bank PLC.</h1>
        <h2 className="text-[12px] font-bold text-black dark:text-slate-300 uppercase tracking-wider">Central Data Center (CDC)</h2>
        <div className="inline-block border-b border-black dark:border-slate-700 pb-0.5">
          <h3 className="text-[11px] font-bold text-black dark:text-slate-300 italic">
            Data Extraction/Change/Update Request Form for <span className="bg-black dark:bg-slate-800 text-white dark:text-slate-100 px-1.5 py-0.5 not-italic font-mono font-bold">T24 Live</span> Area
          </h3>
        </div>
      </div>

      {/* Form Date */}
      <div className="text-right font-bold text-black dark:text-slate-300 mt-2">
        Date: {formatDateToDMY(formDate)}
      </div>

      {/* Ref & PACS Table */}
      <table className="w-full border-collapse border border-black dark:border-slate-700 border-b-0 text-left">
        <tbody>
          <tr>
            <td className="border border-black dark:border-slate-700 px-2 py-1 font-bold w-[65%]">
              Ref: <span className="font-normal font-mono">{refCode}</span>
            </td>
            <td className="border border-black dark:border-slate-700 px-2 py-1 font-bold w-[15%]">PACS ID :</td>
            <td className="border border-black dark:border-slate-700 px-2 py-1 w-[20%]"></td>
          </tr>
        </tbody>
      </table>

      {/* Main Parameters Table Grid */}
      <table className="w-full border-collapse border border-black dark:border-slate-700 text-left mt-0">
        <colgroup>
          <col style={{ width: '30%' }} />
          <col style={{ width: '20%' }} />
          <col style={{ width: '30%' }} />
          <col style={{ width: '20%' }} />
        </colgroup>
        <tbody>
          <tr>
            <td className="border border-black dark:border-slate-700 px-2 py-1 font-bold">Title</td>
            <td colSpan={3} className="border border-black dark:border-slate-700 px-2 py-1 break-words">{title}</td>
          </tr>
          <tr>
            <td className="border border-black dark:border-slate-700 px-2 py-1 font-bold">Purpose</td>
            <td colSpan={3} className="border border-black dark:border-slate-700 px-2 py-1 break-words">{purpose}</td>
          </tr>
          <tr>
            <td className="border border-black dark:border-slate-700 px-2 py-1 font-bold">Application Name</td>
            <td colSpan={3} className="border border-black dark:border-slate-700 px-2 py-1 break-words">{applicationName}</td>
          </tr>
          <tr>
            <td className="border border-black dark:border-slate-700 px-2 py-1 font-bold">Routine Details</td>
            <td colSpan={3} className="border border-black dark:border-slate-700 px-2 py-1 whitespace-pre-wrap break-words">{routineDetails}</td>
          </tr>
          <tr>
            <td className="border border-black dark:border-slate-700 px-2 py-1 font-bold">Subroutine Details</td>
            <td colSpan={3} className="border border-black dark:border-slate-700 px-2 py-1 whitespace-pre-wrap break-words">{subroutineDetails}</td>
          </tr>
          <tr>
            <td className="border border-black dark:border-slate-700 px-2 py-1 font-bold">Version (Routine, Subroutine)</td>
            <td colSpan={3} className="border border-black dark:border-slate-700 px-2 py-1 break-words">{versionInfo}</td>
          </tr>
          
          {/* Access Flags Checklist Grid */}
          <tr>
            <td className="border border-black dark:border-slate-700 px-2 py-1 font-bold text-[10px]">Need Backend Access? (Yes/No)</td>
            <td className="border border-black dark:border-slate-700 px-2 py-1 text-center font-mono font-bold">{needBackendAccess}</td>
            <td className="border border-black dark:border-slate-700 px-2 py-1 font-bold text-[10px]">Need Core FTP Access? (Yes/No)</td>
            <td className="border border-black dark:border-slate-700 px-2 py-1 text-center font-mono font-bold">{needCoreFtpAccess}</td>
          </tr>
          <tr>
            <td className="border border-black dark:border-slate-700 px-2 py-1 font-bold text-[10px]">Need Browser access? (Yes/No)</td>
            <td className="border border-black dark:border-slate-700 px-2 py-1 text-center font-mono font-bold">{needBrowserAccess}</td>
            <td className="border border-black dark:border-slate-700 px-2 py-1 font-bold text-[10px]">Browser Port Change? (Yes/No)</td>
            <td className="border border-black dark:border-slate-700 px-2 py-1 text-center font-mono font-bold">{browserPortChange}</td>
          </tr>
          <tr>
            <td className="border border-black dark:border-slate-700 px-2 py-1 font-bold text-[10px]">During Transaction hour? (Yes/No)</td>
            <td className="border border-black dark:border-slate-700 px-2 py-1 text-center font-mono font-bold">{duringTxHour}</td>
            <td className="border border-black dark:border-slate-700 px-2 py-1 font-bold text-[10px]">Number of Team Member</td>
            <td className="border border-black dark:border-slate-700 px-2 py-1 text-center font-mono font-bold">{String(numTeamMembers).padStart(2, '0')}</td>
          </tr>

          {/* Schedule Ranges */}
          <tr>
            <td className="border border-black dark:border-slate-700 px-2 py-1 font-bold">Approximated Schedule</td>
            <td className="border border-black dark:border-slate-700 px-2 py-1 text-center font-bold font-mono">Date</td>
            <td colSpan={2} className="border border-black dark:border-slate-700 px-2 py-1 font-mono text-center font-bold whitespace-nowrap">
              {formatDateTimeForPrint(approxScheduleStart)} {approxScheduleEnd ? ` – ${formatDateTimeForPrint(approxScheduleEnd)}` : ''}
            </td>
          </tr>
          <tr>
            <td className="border border-black dark:border-slate-700 px-2 py-1 font-bold">Execution Schedule</td>
            <td className="border border-black dark:border-slate-700 px-2 py-1 text-center font-bold font-mono">Date</td>
            <td colSpan={2} className="border border-black dark:border-slate-700 px-2 py-1 font-mono text-center font-bold whitespace-nowrap">
              {formatDateTimeForPrint(execScheduleStart)} {execScheduleEnd ? ` – ${formatDateTimeForPrint(execScheduleEnd)}` : ''}
            </td>
          </tr>
          <tr>
            <td className="border border-black dark:border-slate-700 px-2 py-1 font-bold">Impact *</td>
            <td colSpan={3} className="border border-black dark:border-slate-700 px-2 py-1 break-words">{impact}</td>
          </tr>
        </tbody>
      </table>

      {/* Requester Info Section */}
      <div className="space-y-1">
        <h4 className="font-bold underline text-black dark:text-white">Requester Details:</h4>
        <table className="w-full border-collapse border border-black dark:border-slate-700 text-center">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800/80 font-bold">
              <th className="border border-black dark:border-slate-700 px-2 py-1 w-[30%]">Requester Name</th>
              <th className="border border-black dark:border-slate-700 px-2 py-1 w-[25%]">Designation</th>
              <th className="border border-black dark:border-slate-700 px-2 py-1 w-[25%]">Organization</th>
              <th className="border border-black dark:border-slate-700 px-2 py-1 w-[20%]">Sign</th>
            </tr>
          </thead>
          <tbody>
            <tr className="h-10">
              <td className="border border-black dark:border-slate-700 px-2 py-1 font-bold">{requesterName}</td>
              <td className="border border-black dark:border-slate-700 px-2 py-1">{requesterDesignation}</td>
              <td className="border border-black dark:border-slate-700 px-2 py-1">{requesterOrganization}</td>
              <td className="border border-black dark:border-slate-700 px-2 py-1"></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Implementer Details Table */}
      <div className="space-y-1">
        <h4 className="font-bold underline text-black dark:text-white">Implementer Details:</h4>
        <table className="w-full border-collapse border border-black dark:border-slate-700 text-center">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800/80 font-bold">
              <th className="border border-black dark:border-slate-700 px-2 py-1 w-[10%]">SL</th>
              <th className="border border-black dark:border-slate-700 px-2 py-1 w-[30%]">Implementer Name</th>
              <th className="border border-black dark:border-slate-700 px-2 py-1 w-[25%]">Designation</th>
              <th className="border border-black dark:border-slate-700 px-2 py-1 w-[20%]">Organization</th>
              <th className="border border-black dark:border-slate-700 px-2 py-1 w-[15%]">Sign</th>
            </tr>
          </thead>
          <tbody>
            {implementers.map((impl, idx) => (
              <tr key={idx} className="h-8">
                <td className="border border-black dark:border-slate-700 px-2 py-1 font-mono">{idx + 1}</td>
                <td className="border border-black dark:border-slate-700 px-2 py-1 font-bold">{impl.name}</td>
                <td className="border border-black dark:border-slate-700 px-2 py-1">{impl.designation}</td>
                <td className="border border-black dark:border-slate-700 px-2 py-1">{impl.organization}</td>
                <td className="border border-black dark:border-slate-700 px-2 py-1"></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
