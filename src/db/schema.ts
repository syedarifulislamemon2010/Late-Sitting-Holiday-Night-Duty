import { pgTable, serial, text, integer, doublePrecision, boolean, timestamp, uniqueIndex, index, primaryKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ==========================================
// 1. CELL MODEL
// ==========================================
export const cells = pgTable('Cell', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description'),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
});

// ==========================================
// 2. USER MODEL
// ==========================================
export const users = pgTable('User', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  name: text('name').notNull(),
  role: text('role').default('USER').notNull(), // 'ADMIN' or 'USER'
  mobile: text('mobile'),
  cellDuties: text('cellDuties'),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
});

// ==========================================
// IMPLICIT MANY-TO-MANY RELATION TABLE FOR USER-CELL
// Prisma uses '_UserCells' with 'A' (Cell id) and 'B' (User id)
// Cell (C) comes first alphabetically, User (U) comes second.
// ==========================================
export const userCells = pgTable('_UserCells', {
  A: integer('A').notNull().references(() => cells.id, { onDelete: 'cascade' }),
  B: integer('B').notNull().references(() => users.id, { onDelete: 'cascade' }),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.A, table.B] }),
    idxA: index('_UserCells_AB_unique').on(table.A, table.B),
    idxB: index('_UserCells_B_index').on(table.B),
  };
});

// ==========================================
// 3. EMPLOYEE MODEL
// ==========================================
export const employees = pgTable('Employee', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  designation: text('designation').notNull(),
  bankId: text('bankId'),
  fileNo: text('fileNo'),
  mobile: text('mobile'),
  cellId: integer('cellId').notNull().references(() => cells.id, { onDelete: 'restrict' }),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
}, (table) => {
  return {
    cellIdIdx: index('Employee_cellId_idx').on(table.cellId),
    bankIdIdx: index('Employee_bankId_idx').on(table.bankId),
  };
});

// ==========================================
// 4. DUTY MODEL
// ==========================================
export const duties = pgTable('Duty', {
  id: serial('id').primaryKey(),
  employeeId: integer('employeeId').notNull().references(() => employees.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // LATE_SITTING, HOLIDAY, NIGHT_SHIFT
  date: text('date').notNull(), // YYYY-MM-DD
  description: text('description'),
  allowance1: doublePrecision('allowance1').notNull(),
  allowance2: doublePrecision('allowance2').notNull(),
  totalBill: doublePrecision('totalBill').notNull(),
  orderRef: text('orderRef'),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
}, (table) => {
  return {
    orderRefIdx: index('Duty_orderRef_idx').on(table.orderRef),
    employeeIdIdx: index('Duty_employeeId_idx').on(table.employeeId),
    dateIdx: index('Duty_date_idx').on(table.date),
    typeIdx: index('Duty_type_idx').on(table.type),
  };
});

// ==========================================
// 5. DOCUMENT MODEL
// ==========================================
export const documents = pgTable('Document', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  filePath: text('filePath').notNull(),
  fileSize: integer('fileSize').notNull(),
  uploadedAt: timestamp('uploadedAt', { mode: 'date' }).defaultNow().notNull(),
});

// ==========================================
// 6. OFFICE ORDER MODEL
// ==========================================
export const officeOrders = pgTable('OfficeOrder', {
  id: serial('id').primaryKey(),
  orderRef: text('orderRef').notNull().unique(),
  orderDate: text('orderDate').notNull(),
  category: text('category').notNull(),
  employeeName: text('employeeName').notNull(),
  cellName: text('cellName'),
  dutiesJson: text('dutiesJson').notNull(),
  contentJson: text('contentJson'),
  status: text('status').default('Printed').notNull(),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
}, (table) => {
  return {
    orderRefIdx: index('OfficeOrder_orderRef_idx').on(table.orderRef),
  };
});

// ==========================================
// 7. HOLIDAY MODEL
// ==========================================
export const holidays = pgTable('Holiday', {
  id: serial('id').primaryKey(),
  date: text('date').notNull().unique(), // YYYY-MM-DD
  name: text('name').notNull(),
  isWorkingDay: boolean('isWorkingDay').default(false).notNull(),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
});

// ==========================================
// 8. EXECUTIVE MODEL
// ==========================================
export const executives = pgTable('Executive', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  designation: text('designation').notNull(), // মহাব্যবস্থাপক (জিএম), উপ-মহাব্যবস্থাপক (ডিজিএম), সহকারী মহাব্যবস্থাপক (এজিএম)
  phone: text('phone'),
  email: text('email'),
  bankId: text('bankId'),
  fileNo: text('fileNo'),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
});

// ==========================================
// 9. TRASH MODEL
// ==========================================
export const trash = pgTable('Trash', {
  id: serial('id').primaryKey(),
  entityType: text('entityType').notNull(), // EMPLOYEE, CELL, DUTY, EXECUTIVE, DOCUMENT
  entityId: integer('entityId').notNull(),
  name: text('name').notNull(),
  data: text('data').notNull(), // Serialized JSON
  deletedBy: text('deletedBy'),
  deletedAt: timestamp('deletedAt', { mode: 'date' }).defaultNow().notNull(),
});

// ==========================================
// 10. LEAVE APPLICATION MODEL
// ==========================================
export const leaveApplications = pgTable('LeaveApplication', {
  id: serial('id').primaryKey(),
  leaveType: text('leaveType').notNull(), // "CASUAL", "POST_FACTO", "STATION_LEAVE"
  startDate: text('startDate').notNull(), // YYYY-MM-DD
  endDate: text('endDate').notNull(), // YYYY-MM-DD
  applicationDate: text('applicationDate').notNull(), // YYYY-MM-DD
  applicantName: text('applicantName').notNull(),
  designation: text('designation').notNull(),
  bankId: text('bankId').notNull(),
  fileNo: text('fileNo'),
  cellName: text('cellName').notNull(),
  leaveLocation: text('leaveLocation').notNull(),
  mobileNo: text('mobileNo').notNull(),
  selectedDistrict: text('selectedDistrict'),
  delegateId: text('delegateId'),
  casualTotal: integer('casualTotal').notNull(),
  casualUsed: integer('casualUsed').notNull(),
  ordinaryTotal: integer('ordinaryTotal').notNull(),
  ordinaryUsed: integer('ordinaryUsed').notNull(),
  specialTotal: integer('specialTotal').notNull(),
  specialUsed: integer('specialUsed').notNull(),
  userId: integer('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
}, (table) => {
  return {
    userIdIdx: index('LeaveApplication_userId_idx').on(table.userId),
    startDateIdx: index('LeaveApplication_startDate_idx').on(table.startDate),
    endDateIdx: index('LeaveApplication_endDate_idx').on(table.endDate),
    bankIdIdx: index('LeaveApplication_bankId_idx').on(table.bankId),
  };
});

// ==========================================
// 11. LUNCH BILL MODEL
// ==========================================
export const lunchBills = pgTable('LunchBill', {
  id: serial('id').primaryKey(),
  month: text('month').notNull(), // YYYY-MM
  cellId: integer('cellId').notNull().references(() => cells.id, { onDelete: 'cascade' }),
  workingDays: integer('workingDays').notNull(),
  recordsJson: text('recordsJson').notNull(),
  generatedBy: text('generatedBy').notNull(),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull(),
}, (table) => {
  return {
    monthCellIdUnique: uniqueIndex('LunchBill_month_cellId_key').on(table.month, table.cellId),
  };
});


// ==========================================
// 12. MANUAL DOCUMENT MODEL
// ==========================================
export const manualDocuments = pgTable('ManualDocument', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  filePath: text('filePath').notNull(),
  fileSize: integer('fileSize').notNull(),
  fileType: text('fileType').notNull(), // 'pdf', 'docx', 'xlsx', 'png', etc.
  uploadedBy: text('uploadedBy'),
  isVisibleToUsers: boolean('isVisibleToUsers').default(false).notNull(),
  uploadedAt: timestamp('uploadedAt', { mode: 'date' }).defaultNow().notNull(),
});

// ==========================================
// 13. AUDIT LOG MODEL
// ==========================================
export const auditLogs = pgTable('AuditLog', {
  id: serial('id').primaryKey(),
  username: text('username').notNull(),
  action: text('action').notNull(),
  entityType: text('entityType'),
  entityId: text('entityId'),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  details: text('details').notNull(),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
}, (table) => {
  return {
    usernameIdx: index('AuditLog_username_idx').on(table.username),
    createdAtIdx: index('AuditLog_createdAt_idx').on(table.createdAt),
  };
});


// ==========================================
// DRIZZLE RELATIONSHIPS
// ==========================================

export const cellsRelations = relations(cells, ({ many }) => ({
  employees: many(employees),
  lunchBills: many(lunchBills),
  userCells: many(userCells),
}));

export const usersRelations = relations(users, ({ many }) => ({
  leaveApplications: many(leaveApplications),
  userCells: many(userCells),
}));

export const userCellsRelations = relations(userCells, ({ one }) => ({
  cell: one(cells, { fields: [userCells.A], references: [cells.id] }),
  user: one(users, { fields: [userCells.B], references: [users.id] }),
}));

export const employeesRelations = relations(employees, ({ one, many }) => ({
  cell: one(cells, { fields: [employees.cellId], references: [cells.id] }),
  duties: many(duties),
}));

export const dutiesRelations = relations(duties, ({ one }) => ({
  employee: one(employees, { fields: [duties.employeeId], references: [employees.id] }),
}));

export const leaveApplicationsRelations = relations(leaveApplications, ({ one }) => ({
  user: one(users, { fields: [leaveApplications.userId], references: [users.id] }),
}));

export const lunchBillsRelations = relations(lunchBills, ({ one }) => ({
  cell: one(cells, { fields: [lunchBills.cellId], references: [cells.id] }),
}));
