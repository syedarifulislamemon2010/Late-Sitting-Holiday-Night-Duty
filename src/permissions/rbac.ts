export type UserRole = 'ADMIN' | 'USER' | 'EMPLOYEE';

export type PermissionAction =
  | 'CREATE_EMPLOYEE'
  | 'UPDATE_EMPLOYEE'
  | 'DELETE_EMPLOYEE'
  | 'CREATE_DUTY'
  | 'UPDATE_DUTY'
  | 'DELETE_DUTY'
  | 'CREATE_OFFICE_ORDER'
  | 'UPDATE_OFFICE_ORDER'
  | 'DELETE_OFFICE_ORDER'
  | 'MANAGE_USERS'
  // Audit-only extended actions matching observed route behavior
  | 'VIEW_USERS'
  | 'VIEW_AUDIT'
  | 'VIEW_BACKUP'
  | 'MANAGE_BACKUP'
  | 'VIEW_CELLS'
  | 'MANAGE_CELLS'
  | 'GENERATE_DOCUMENTS'
  | 'VIEW_DOCUMENTS'
  | 'DELETE_DOCUMENTS'
  | 'VIEW_DUTIES'
  | 'VIEW_EMPLOYEES'
  | 'VIEW_EXECUTIVES'
  | 'MANAGE_EXECUTIVES'
  | 'VIEW_HARDWARE_REQUISITIONS'
  | 'MANAGE_HARDWARE_REQUISITIONS'
  | 'VIEW_HOLIDAYS'
  | 'MANAGE_HOLIDAYS'
  | 'VIEW_LEAVES'
  | 'MANAGE_LEAVES'
  | 'VIEW_LUNCH_BILLS'
  | 'MANAGE_LUNCH_BILLS'
  | 'VIEW_MANUAL_DOCUMENTS'
  | 'MANAGE_MANUAL_DOCUMENTS'
  | 'VIEW_MY_PORTAL'
  | 'VIEW_NOTIFICATIONS'
  | 'VIEW_OFFICE_ORDERS'
  | 'VIEW_PROFILE'
  | 'UPDATE_PROFILE'
  | 'SEARCH_RECORDS'
  | 'VIEW_TAZ_COMMITTEE_FORMS'
  | 'MANAGE_TAZ_COMMITTEE_FORMS'
  | 'VIEW_TRASH'
  | 'MANAGE_TRASH'
  | 'VIEW_ANALYTICS';

/**
 * Observed Role Permissions mapping.
 * Reflects actual authorization checks present in routes/services as of October 2026.
 */
export const ROLE_PERMISSIONS: Record<UserRole, Set<PermissionAction>> = {
  ADMIN: new Set<PermissionAction>([
    'CREATE_EMPLOYEE',
    'UPDATE_EMPLOYEE',
    'DELETE_EMPLOYEE',
    'CREATE_DUTY',
    'UPDATE_DUTY',
    'DELETE_DUTY',
    'CREATE_OFFICE_ORDER',
    'UPDATE_OFFICE_ORDER',
    'DELETE_OFFICE_ORDER',
    'MANAGE_USERS',
    'VIEW_USERS',
    'VIEW_AUDIT',
    'VIEW_BACKUP',
    'MANAGE_BACKUP',
    'VIEW_CELLS',
    'MANAGE_CELLS',
    'VIEW_EXECUTIVES',
    'MANAGE_EXECUTIVES',
    'GENERATE_DOCUMENTS',
    'VIEW_DOCUMENTS',
    'DELETE_DOCUMENTS',
    'VIEW_MANUAL_DOCUMENTS',
    'MANAGE_MANUAL_DOCUMENTS',
    'VIEW_DUTIES',
    'VIEW_EMPLOYEES',
    'VIEW_OFFICE_ORDERS',
    'VIEW_HOLIDAYS',
    'MANAGE_HOLIDAYS',
    'VIEW_LEAVES',
    'MANAGE_LEAVES',
    'VIEW_LUNCH_BILLS',
    'MANAGE_LUNCH_BILLS',
    'VIEW_HARDWARE_REQUISITIONS',
    'MANAGE_HARDWARE_REQUISITIONS',
    'VIEW_TAZ_COMMITTEE_FORMS',
    'MANAGE_TAZ_COMMITTEE_FORMS',
    'VIEW_TRASH',
    'MANAGE_TRASH',
    'VIEW_PROFILE',
    'UPDATE_PROFILE',
    'VIEW_ANALYTICS',
    'VIEW_MY_PORTAL',
    'VIEW_NOTIFICATIONS',
    'SEARCH_RECORDS'
  ]),

  USER: new Set<PermissionAction>([
    // Duties & office orders
    'CREATE_DUTY',
    'UPDATE_DUTY',
    'CREATE_OFFICE_ORDER',
    'UPDATE_OFFICE_ORDER',
    'VIEW_DUTIES',
    'VIEW_OFFICE_ORDERS',
    'GENERATE_DOCUMENTS',
    // Employee records (self update, cell list view)
    'UPDATE_EMPLOYEE',
    'VIEW_EMPLOYEES',
    // Reference data
    'VIEW_CELLS',
    'VIEW_EXECUTIVES',
    'VIEW_HOLIDAYS',
    // Lunch bills & manual documents
    'VIEW_LUNCH_BILLS',
    'MANAGE_LUNCH_BILLS',
    'VIEW_MANUAL_DOCUMENTS',
    'MANAGE_MANUAL_DOCUMENTS',
    // Leaves
    'VIEW_LEAVES',
    'MANAGE_LEAVES',
    // Hardware & TAZ
    'VIEW_HARDWARE_REQUISITIONS',
    'MANAGE_HARDWARE_REQUISITIONS',
    'VIEW_TAZ_COMMITTEE_FORMS',
    'MANAGE_TAZ_COMMITTEE_FORMS',
    // Trash
    'VIEW_TRASH',
    'MANAGE_TRASH',
    // Profile & common features
    'VIEW_PROFILE',
    'UPDATE_PROFILE',
    'VIEW_ANALYTICS',
    'VIEW_MY_PORTAL',
    'VIEW_NOTIFICATIONS',
    'SEARCH_RECORDS'
  ]),

  EMPLOYEE: new Set<PermissionAction>([
    // Self-service portal & analytics
    'VIEW_MY_PORTAL',
    'VIEW_ANALYTICS',
    'VIEW_PROFILE',
    'UPDATE_PROFILE',
    'VIEW_NOTIFICATIONS',
    // Leaves (own applications)
    'VIEW_LEAVES',
    'MANAGE_LEAVES',
    // Hardware & TAZ requests
    'VIEW_HARDWARE_REQUISITIONS',
    'MANAGE_HARDWARE_REQUISITIONS',
    'VIEW_TAZ_COMMITTEE_FORMS',
    'MANAGE_TAZ_COMMITTEE_FORMS',
    // Reference lists
    'VIEW_CELLS',
    'VIEW_EXECUTIVES',
    'VIEW_EMPLOYEES',
    'VIEW_HOLIDAYS',
    'SEARCH_RECORDS'
  ])
};

export function hasPermission(role: string, action: PermissionAction): boolean {
  const normRole = role.toUpperCase() as UserRole;
  if (normRole === 'ADMIN') {
    return true;
  }
  const permissions = ROLE_PERMISSIONS[normRole];
  if (!permissions) {
    return false;
  }
  return permissions.has(action);
}

export function canAccessRoute(role: string, route: string): boolean {
  const normRole = role.toUpperCase();
  if (normRole === 'ADMIN') {
    return true;
  }
  if (normRole === 'EMPLOYEE') {
    // EMPLOYEE role can access /my-portal and /analytics (and their APIs)
    return (
      route === '/my-portal' ||
      route.startsWith('/my-portal/') ||
      route.startsWith('/api/my-portal') ||
      route === '/analytics' ||
      route.startsWith('/analytics/') ||
      route.startsWith('/api/analytics')
    );
  }
  // ADMIN and USER roles can access other routes, but cannot access employee self-service portal
  return route !== '/my-portal' && !route.startsWith('/my-portal/');
}
