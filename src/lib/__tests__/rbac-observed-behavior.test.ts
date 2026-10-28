import { describe, it, expect, vi, beforeEach } from 'vitest';
import { auditRbacRequest, clearRbacAuditCache, ROUTE_PERMISSION_MAP, HttpMethod } from '@/lib/rbac-audit';
import { hasPermission, UserRole, PermissionAction, ROLE_PERMISSIONS } from '@/permissions/rbac';
import logger from '@/lib/logger';

interface RouteExpectation {
  method: HttpMethod;
  route: string;
  action: PermissionAction;
  allowedRoles: UserRole[];
}

// Complete table of all 71 canonical endpoints from docs/rbac-observed-behavior.md
const OBSERVED_ROUTE_MATRIX: RouteExpectation[] = [
  // 15 Base Routes
  { method: 'POST', route: '/api/employees', action: 'CREATE_EMPLOYEE', allowedRoles: ['ADMIN'] },
  { method: 'POST', route: '/api/employees/parse-image', action: 'CREATE_EMPLOYEE', allowedRoles: ['ADMIN'] },
  { method: 'PUT', route: '/api/employees', action: 'UPDATE_EMPLOYEE', allowedRoles: ['ADMIN', 'USER'] },
  { method: 'DELETE', route: '/api/employees', action: 'DELETE_EMPLOYEE', allowedRoles: ['ADMIN'] },
  { method: 'POST', route: '/api/duties', action: 'CREATE_DUTY', allowedRoles: ['ADMIN', 'USER'] },
  { method: 'POST', route: '/api/duties/check-conflicts', action: 'CREATE_DUTY', allowedRoles: ['ADMIN', 'USER'] },
  { method: 'POST', route: '/api/duties/parse-roster-image', action: 'CREATE_DUTY', allowedRoles: ['ADMIN', 'USER'] },
  { method: 'PUT', route: '/api/duties', action: 'UPDATE_DUTY', allowedRoles: ['ADMIN', 'USER'] },
  { method: 'DELETE', route: '/api/duties', action: 'DELETE_DUTY', allowedRoles: ['ADMIN'] },
  { method: 'POST', route: '/api/office-orders', action: 'CREATE_OFFICE_ORDER', allowedRoles: ['ADMIN', 'USER'] },
  { method: 'PUT', route: '/api/office-orders', action: 'UPDATE_OFFICE_ORDER', allowedRoles: ['ADMIN', 'USER'] },
  { method: 'DELETE', route: '/api/office-orders', action: 'DELETE_OFFICE_ORDER', allowedRoles: ['ADMIN'] },
  { method: 'POST', route: '/api/users', action: 'MANAGE_USERS', allowedRoles: ['ADMIN'] },
  { method: 'PUT', route: '/api/users', action: 'MANAGE_USERS', allowedRoles: ['ADMIN'] },
  { method: 'DELETE', route: '/api/users', action: 'MANAGE_USERS', allowedRoles: ['ADMIN'] },

  // 56 Extended Routes (Audit Coverage Expansion)
  { method: 'GET', route: '/api/analytics', action: 'VIEW_ANALYTICS', allowedRoles: ['ADMIN', 'USER', 'EMPLOYEE'] },
  { method: 'GET', route: '/api/audit', action: 'VIEW_AUDIT', allowedRoles: ['ADMIN'] },
  { method: 'GET', route: '/api/backup', action: 'VIEW_BACKUP', allowedRoles: ['ADMIN'] },
  { method: 'POST', route: '/api/backup', action: 'MANAGE_BACKUP', allowedRoles: ['ADMIN'] },
  { method: 'GET', route: '/api/cells', action: 'VIEW_CELLS', allowedRoles: ['ADMIN', 'USER', 'EMPLOYEE'] },
  { method: 'POST', route: '/api/cells', action: 'MANAGE_CELLS', allowedRoles: ['ADMIN'] },
  { method: 'PUT', route: '/api/cells', action: 'MANAGE_CELLS', allowedRoles: ['ADMIN'] },
  { method: 'DELETE', route: '/api/cells', action: 'MANAGE_CELLS', allowedRoles: ['ADMIN'] },
  { method: 'POST', route: '/api/documents/generate-bill-memo', action: 'GENERATE_DOCUMENTS', allowedRoles: ['ADMIN', 'USER'] },
  { method: 'POST', route: '/api/documents/generate-closing-bill', action: 'GENERATE_DOCUMENTS', allowedRoles: ['ADMIN', 'USER'] },
  { method: 'POST', route: '/api/documents/generate-employee-list', action: 'GENERATE_DOCUMENTS', allowedRoles: ['ADMIN', 'USER'] },
  { method: 'POST', route: '/api/documents/generate-lunch-bill', action: 'GENERATE_DOCUMENTS', allowedRoles: ['ADMIN', 'USER'] },
  { method: 'POST', route: '/api/documents/generate-office-order', action: 'GENERATE_DOCUMENTS', allowedRoles: ['ADMIN', 'USER'] },
  { method: 'GET', route: '/api/documents', action: 'VIEW_DOCUMENTS', allowedRoles: ['ADMIN'] },
  { method: 'DELETE', route: '/api/documents', action: 'DELETE_DOCUMENTS', allowedRoles: ['ADMIN'] },
  { method: 'GET', route: '/api/duties', action: 'VIEW_DUTIES', allowedRoles: ['ADMIN', 'USER'] },
  { method: 'GET', route: '/api/employees', action: 'VIEW_EMPLOYEES', allowedRoles: ['ADMIN', 'USER', 'EMPLOYEE'] },
  { method: 'GET', route: '/api/executives', action: 'VIEW_EXECUTIVES', allowedRoles: ['ADMIN', 'USER', 'EMPLOYEE'] },
  { method: 'POST', route: '/api/executives', action: 'MANAGE_EXECUTIVES', allowedRoles: ['ADMIN'] },
  { method: 'PUT', route: '/api/executives', action: 'MANAGE_EXECUTIVES', allowedRoles: ['ADMIN'] },
  { method: 'DELETE', route: '/api/executives', action: 'MANAGE_EXECUTIVES', allowedRoles: ['ADMIN'] },
  { method: 'GET', route: '/api/hardware-requisitions', action: 'VIEW_HARDWARE_REQUISITIONS', allowedRoles: ['ADMIN', 'USER', 'EMPLOYEE'] },
  { method: 'POST', route: '/api/hardware-requisitions', action: 'MANAGE_HARDWARE_REQUISITIONS', allowedRoles: ['ADMIN', 'USER', 'EMPLOYEE'] },
  { method: 'DELETE', route: '/api/hardware-requisitions', action: 'MANAGE_HARDWARE_REQUISITIONS', allowedRoles: ['ADMIN', 'USER', 'EMPLOYEE'] },
  { method: 'GET', route: '/api/holidays', action: 'VIEW_HOLIDAYS', allowedRoles: ['ADMIN', 'USER', 'EMPLOYEE'] },
  { method: 'POST', route: '/api/holidays', action: 'MANAGE_HOLIDAYS', allowedRoles: ['ADMIN'] },
  { method: 'DELETE', route: '/api/holidays', action: 'MANAGE_HOLIDAYS', allowedRoles: ['ADMIN'] },
  { method: 'GET', route: '/api/leaves/balance', action: 'VIEW_LEAVES', allowedRoles: ['ADMIN', 'USER', 'EMPLOYEE'] },
  { method: 'POST', route: '/api/leaves/log-resolve-failed', action: 'MANAGE_LEAVES', allowedRoles: ['ADMIN', 'USER', 'EMPLOYEE'] },
  { method: 'GET', route: '/api/leaves', action: 'VIEW_LEAVES', allowedRoles: ['ADMIN', 'USER', 'EMPLOYEE'] },
  { method: 'POST', route: '/api/leaves', action: 'MANAGE_LEAVES', allowedRoles: ['ADMIN', 'USER', 'EMPLOYEE'] },
  { method: 'PUT', route: '/api/leaves', action: 'MANAGE_LEAVES', allowedRoles: ['ADMIN', 'USER', 'EMPLOYEE'] },
  { method: 'DELETE', route: '/api/leaves', action: 'MANAGE_LEAVES', allowedRoles: ['ADMIN', 'USER', 'EMPLOYEE'] },
  { method: 'GET', route: '/api/lunch-bills/leave-days', action: 'VIEW_LUNCH_BILLS', allowedRoles: ['ADMIN', 'USER'] },
  { method: 'GET', route: '/api/lunch-bills', action: 'VIEW_LUNCH_BILLS', allowedRoles: ['ADMIN', 'USER'] },
  { method: 'POST', route: '/api/lunch-bills', action: 'MANAGE_LUNCH_BILLS', allowedRoles: ['ADMIN', 'USER'] },
  { method: 'GET', route: '/api/manual-documents/raw', action: 'VIEW_MANUAL_DOCUMENTS', allowedRoles: ['ADMIN', 'USER'] },
  { method: 'GET', route: '/api/manual-documents', action: 'VIEW_MANUAL_DOCUMENTS', allowedRoles: ['ADMIN', 'USER'] },
  { method: 'POST', route: '/api/manual-documents', action: 'MANAGE_MANUAL_DOCUMENTS', allowedRoles: ['ADMIN', 'USER'] },
  { method: 'PUT', route: '/api/manual-documents', action: 'MANAGE_MANUAL_DOCUMENTS', allowedRoles: ['ADMIN', 'USER'] },
  { method: 'DELETE', route: '/api/manual-documents', action: 'MANAGE_MANUAL_DOCUMENTS', allowedRoles: ['ADMIN', 'USER'] },
  { method: 'GET', route: '/api/my-portal', action: 'VIEW_MY_PORTAL', allowedRoles: ['ADMIN', 'USER', 'EMPLOYEE'] },
  { method: 'GET', route: '/api/notifications', action: 'VIEW_NOTIFICATIONS', allowedRoles: ['ADMIN', 'USER', 'EMPLOYEE'] },
  { method: 'GET', route: '/api/office-orders/next-ref', action: 'VIEW_OFFICE_ORDERS', allowedRoles: ['ADMIN', 'USER'] },
  { method: 'GET', route: '/api/office-orders/raw', action: 'VIEW_OFFICE_ORDERS', allowedRoles: ['ADMIN', 'USER'] },
  { method: 'GET', route: '/api/office-orders', action: 'VIEW_OFFICE_ORDERS', allowedRoles: ['ADMIN', 'USER'] },
  { method: 'GET', route: '/api/profile', action: 'VIEW_PROFILE', allowedRoles: ['ADMIN', 'USER', 'EMPLOYEE'] },
  { method: 'PUT', route: '/api/profile', action: 'UPDATE_PROFILE', allowedRoles: ['ADMIN', 'USER', 'EMPLOYEE'] },
  { method: 'GET', route: '/api/search', action: 'SEARCH_RECORDS', allowedRoles: ['ADMIN', 'USER', 'EMPLOYEE'] },
  { method: 'GET', route: '/api/taz-committee-forms', action: 'VIEW_TAZ_COMMITTEE_FORMS', allowedRoles: ['ADMIN', 'USER', 'EMPLOYEE'] },
  { method: 'POST', route: '/api/taz-committee-forms', action: 'MANAGE_TAZ_COMMITTEE_FORMS', allowedRoles: ['ADMIN', 'USER', 'EMPLOYEE'] },
  { method: 'PUT', route: '/api/taz-committee-forms', action: 'MANAGE_TAZ_COMMITTEE_FORMS', allowedRoles: ['ADMIN', 'USER', 'EMPLOYEE'] },
  { method: 'DELETE', route: '/api/taz-committee-forms', action: 'MANAGE_TAZ_COMMITTEE_FORMS', allowedRoles: ['ADMIN', 'USER', 'EMPLOYEE'] },
  { method: 'GET', route: '/api/trash', action: 'VIEW_TRASH', allowedRoles: ['ADMIN', 'USER'] },
  { method: 'POST', route: '/api/trash', action: 'MANAGE_TRASH', allowedRoles: ['ADMIN', 'USER'] },
  { method: 'GET', route: '/api/users', action: 'VIEW_USERS', allowedRoles: ['ADMIN'] },
];

describe('RBAC Observed Behavior Verification Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    clearRbacAuditCache();
    delete process.env.RBAC_MODE;
  });

  it('verifies ROUTE_PERMISSION_MAP covers all 71 canonical route combinations', () => {
    expect(OBSERVED_ROUTE_MATRIX.length).toBe(71);
    expect(Object.keys(ROUTE_PERMISSION_MAP).length).toBe(71);

    for (const item of OBSERVED_ROUTE_MATRIX) {
      const key = `${item.method} ${item.route}`;
      expect(ROUTE_PERMISSION_MAP[key]).toBe(item.action);
    }
  });

  describe('Exhaustive (Method, Route, Role) Audit Evaluation Matches Observed Behavior', () => {
    const allRoles: UserRole[] = ['ADMIN', 'USER', 'EMPLOYEE'];

    for (const item of OBSERVED_ROUTE_MATRIX) {
      for (const role of allRoles) {
        const shouldBeAllowed = item.allowedRoles.includes(role);

        it(`${item.method} ${item.route} for role=${role} -> allowed=${shouldBeAllowed}`, () => {
          clearRbacAuditCache();
          const warnSpy = vi.spyOn(logger, 'warn');
          const infoSpy = vi.spyOn(logger, 'info');

          const user = { role, username: `test_${role.toLowerCase()}` };
          const result = auditRbacRequest(item.method, item.route, user);

          // 1. Result must NOT be unmapped
          expect(result.unmapped).toBeFalsy();
          expect(infoSpy).not.toHaveBeenCalled();

          // 2. Action must match mapped action
          expect(result.action).toBe(item.action);

          // 3. Allowed result MUST strictly equal observed behavior
          expect(result.allowed).toBe(shouldBeAllowed);

          // 4. Logging contract: would-deny is logged iff not allowed
          if (shouldBeAllowed) {
            expect(result.logged).toBe(false);
            expect(warnSpy).not.toHaveBeenCalled();
          } else {
            expect(result.logged).toBe(true);
            expect(warnSpy).toHaveBeenCalledTimes(1);
            expect(warnSpy).toHaveBeenCalledWith(
              `[RBAC AUDIT] would-deny user='test_${role.toLowerCase()}' role='${role}' action='${item.action}' method='${item.method}' path='${item.route}'`
            );
          }
        });
      }
    }
  });

  it('asserts role permission set definitions in rbac.ts match observed permissions', () => {
    expect(ROLE_PERMISSIONS.ADMIN.size).toBe(44);
    expect(ROLE_PERMISSIONS.USER.size).toBe(30);
    expect(ROLE_PERMISSIONS.EMPLOYEE.size).toBe(16);

    // ADMIN has all
    expect(hasPermission('ADMIN', 'MANAGE_BACKUP')).toBe(true);
    expect(hasPermission('ADMIN', 'VIEW_USERS')).toBe(true);

    // USER cannot manage backup, audit, or view users
    expect(hasPermission('USER', 'MANAGE_BACKUP')).toBe(false);
    expect(hasPermission('USER', 'VIEW_USERS')).toBe(false);
    expect(hasPermission('USER', 'VIEW_AUDIT')).toBe(false);
    expect(hasPermission('USER', 'CREATE_DUTY')).toBe(true);
    expect(hasPermission('USER', 'VIEW_CELLS')).toBe(true);

    // EMPLOYEE restricted to self portal and basic view
    expect(hasPermission('EMPLOYEE', 'VIEW_MY_PORTAL')).toBe(true);
    expect(hasPermission('EMPLOYEE', 'VIEW_ANALYTICS')).toBe(true);
    expect(hasPermission('EMPLOYEE', 'CREATE_DUTY')).toBe(false);
    expect(hasPermission('EMPLOYEE', 'MANAGE_USERS')).toBe(false);
  });
});
