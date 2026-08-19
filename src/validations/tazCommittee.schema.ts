import { z } from 'zod';

export const tazCommitteeFormCreateSchema = z.object({
  formDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'তারিখ ফরম্যাট সঠিক নয় (YYYY-MM-DD)।' }),
  ref: z.string().optional().default(''),
  pacsId: z.string().optional().default(''),
  title: z.string().optional().default(''),
  purpose: z.string().optional().default(''),
  applicationName: z.string().optional().default(''),
  routineDetails: z.string().optional().default(''),
  subroutineDetails: z.string().optional().default(''),
  versionInfo: z.string().optional().default(''),
  needBackendAccess: z.string().optional().default('No'),
  needCoreFtpAccess: z.string().optional().default('No'),
  needBrowserAccess: z.string().optional().default('No'),
  browserPortChange: z.string().optional().default('No'),
  duringTxHour: z.string().optional().default('No'),
  numTeamMembers: z.union([z.number(), z.string()]).transform(v => typeof v === 'number' ? v : parseInt(v, 10) || 1).optional().default(1),
  approxScheduleStart: z.string().optional().default(''),
  approxScheduleEnd: z.string().optional().default(''),
  execScheduleStart: z.string().optional().default(''),
  execScheduleEnd: z.string().optional().default(''),
  impact: z.string().optional().default(''),
  requesterName: z.string().optional().default(''),
  requesterDesignation: z.string().optional().default(''),
  requesterOrganization: z.string().optional().default(''),
  implementersJson: z.string().min(1, { message: 'বাস্তবায়নকারী সদস্যদের তথ্য আবশ্যক।' })
});
