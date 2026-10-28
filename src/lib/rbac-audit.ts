import logger from '@/lib/logger';
import { hasPermission, PermissionAction } from '@/permissions/rbac';
import { UserSessionData } from '@/lib/auth-wrapper';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * Route-to-Permission mapping for RBAC audit assessment.
 * Maps method + canonical route prefix to the existing PermissionAction.
 */
export const ROUTE_PERMISSION_MAP: Record<string, PermissionAction> = {
  // Employee permissions
  'GET /api/employees': 'VIEW_EMPLOYEES',
  'POST /api/employees': 'CREATE_EMPLOYEE',
  'POST /api/employees/parse-image': 'CREATE_EMPLOYEE',
  'PUT /api/employees': 'UPDATE_EMPLOYEE',
  'DELETE /api/employees': 'DELETE_EMPLOYEE',

  // Duty permissions
  'GET /api/duties': 'VIEW_DUTIES',
  'POST /api/duties': 'CREATE_DUTY',
  'POST /api/duties/check-conflicts': 'CREATE_DUTY',
  'POST /api/duties/parse-roster-image': 'CREATE_DUTY',
  'PUT /api/duties': 'UPDATE_DUTY',
  'DELETE /api/duties': 'DELETE_DUTY',

  // Office Order permissions
  'GET /api/office-orders': 'VIEW_OFFICE_ORDERS',
  'GET /api/office-orders/next-ref': 'VIEW_OFFICE_ORDERS',
  'GET /api/office-orders/raw': 'VIEW_OFFICE_ORDERS',
  'POST /api/office-orders': 'CREATE_OFFICE_ORDER',
  'PUT /api/office-orders': 'UPDATE_OFFICE_ORDER',
  'DELETE /api/office-orders': 'DELETE_OFFICE_ORDER',

  // User management permissions
  'GET /api/users': 'VIEW_USERS',
  'POST /api/users': 'MANAGE_USERS',
  'PUT /api/users': 'MANAGE_USERS',
  'DELETE /api/users': 'MANAGE_USERS',

  // Audit and backup
  'GET /api/audit': 'VIEW_AUDIT',
  'GET /api/backup': 'VIEW_BACKUP',
  'POST /api/backup': 'MANAGE_BACKUP',

  // Cells management
  'GET /api/cells': 'VIEW_CELLS',
  'POST /api/cells': 'MANAGE_CELLS',
  'PUT /api/cells': 'MANAGE_CELLS',
  'DELETE /api/cells': 'MANAGE_CELLS',

  // Executives management
  'GET /api/executives': 'VIEW_EXECUTIVES',
  'POST /api/executives': 'MANAGE_EXECUTIVES',
  'PUT /api/executives': 'MANAGE_EXECUTIVES',
  'DELETE /api/executives': 'MANAGE_EXECUTIVES',

  // Holidays
  'GET /api/holidays': 'VIEW_HOLIDAYS',
  'POST /api/holidays': 'MANAGE_HOLIDAYS',
  'DELETE /api/holidays': 'MANAGE_HOLIDAYS',

  // Document generation & print preview
  'POST /api/documents/generate-bill-memo': 'GENERATE_DOCUMENTS',
  'POST /api/documents/generate-closing-bill': 'GENERATE_DOCUMENTS',
  'POST /api/documents/generate-employee-list': 'GENERATE_DOCUMENTS',
  'POST /api/documents/generate-lunch-bill': 'GENERATE_DOCUMENTS',
  'POST /api/documents/generate-office-order': 'GENERATE_DOCUMENTS',

  // Administrative uploaded documents
  'GET /api/documents': 'VIEW_DOCUMENTS',
  'DELETE /api/documents': 'DELETE_DOCUMENTS',

  // Manual documents
  'GET /api/manual-documents': 'VIEW_MANUAL_DOCUMENTS',
  'GET /api/manual-documents/raw': 'VIEW_MANUAL_DOCUMENTS',
  'POST /api/manual-documents': 'MANAGE_MANUAL_DOCUMENTS',
  'PUT /api/manual-documents': 'MANAGE_MANUAL_DOCUMENTS',
  'DELETE /api/manual-documents': 'MANAGE_MANUAL_DOCUMENTS',

  // Leaves management
  'GET /api/leaves': 'VIEW_LEAVES',
  'GET /api/leaves/balance': 'VIEW_LEAVES',
  'POST /api/leaves': 'MANAGE_LEAVES',
  'PUT /api/leaves': 'MANAGE_LEAVES',
  'DELETE /api/leaves': 'MANAGE_LEAVES',
  'POST /api/leaves/log-resolve-failed': 'MANAGE_LEAVES',

  // Lunch bills
  'GET /api/lunch-bills': 'VIEW_LUNCH_BILLS',
  'GET /api/lunch-bills/leave-days': 'VIEW_LUNCH_BILLS',
  'POST /api/lunch-bills': 'MANAGE_LUNCH_BILLS',

  // Hardware requisitions
  'GET /api/hardware-requisitions': 'VIEW_HARDWARE_REQUISITIONS',
  'POST /api/hardware-requisitions': 'MANAGE_HARDWARE_REQUISITIONS',
  'DELETE /api/hardware-requisitions': 'MANAGE_HARDWARE_REQUISITIONS',

  // TAZ committee forms
  'GET /api/taz-committee-forms': 'VIEW_TAZ_COMMITTEE_FORMS',
  'POST /api/taz-committee-forms': 'MANAGE_TAZ_COMMITTEE_FORMS',
  'PUT /api/taz-committee-forms': 'MANAGE_TAZ_COMMITTEE_FORMS',
  'DELETE /api/taz-committee-forms': 'MANAGE_TAZ_COMMITTEE_FORMS',

  // Recycle bin / Trash
  'GET /api/trash': 'VIEW_TRASH',
  'POST /api/trash': 'MANAGE_TRASH',

  // Profile & general user features
  'GET /api/profile': 'VIEW_PROFILE',
  'PUT /api/profile': 'UPDATE_PROFILE',
  'GET /api/analytics': 'VIEW_ANALYTICS',
  'GET /api/my-portal': 'VIEW_MY_PORTAL',
  'GET /api/notifications': 'VIEW_NOTIFICATIONS',
  'GET /api/search': 'SEARCH_RECORDS',
};

// In-memory cache to suppress duplicate audit logs within 1 minute
// Key: `${username}:${key}` -> Timestamp
const logSuppressionCache = new Map<string, number>();
const SUPPRESSION_WINDOW_MS = 60 * 1000;

// Set to track unmapped routes logged once per process runtime to avoid spam
const unmappedLogged = new Set<string>();

export function clearRbacAuditCache(): void {
  logSuppressionCache.clear();
  unmappedLogged.clear();
}

export interface AuditRbacResult {
  allowed: boolean;
  action?: PermissionAction;
  logged: boolean;
  unmapped?: boolean;
}

/**
 * Audit-only RBAC evaluator for HTTP requests.
 * Logs whether an action would be permitted under RBAC without blocking any request.
 * Env RBAC_MODE: 'audit' (default) or 'off'. Never blocks in audit mode.
 * Suppresses duplicate logs for the same user+route+action within 1 minute.
 * Logs unmapped routes at logger.info level once per route.
 * Emits logger.warn ONLY on would-deny (does not emit would-allow).
 */
export function auditRbacRequest(
  method: HttpMethod,
  pathname: string,
  user: UserSessionData | { role?: string; username?: string; name?: string } | null | undefined
): AuditRbacResult {
  const rbacMode = process.env.RBAC_MODE || 'audit';
  if (rbacMode === 'off') {
    return { allowed: true, logged: false };
  }

  try {
    if (!user || !user.role) {
      return { allowed: true, logged: false };
    }

    const role = user.role;
    const username = (user as { username?: string; name?: string }).username || (user as { username?: string; name?: string }).name || 'anonymous';

    // Normalize route key (e.g. "/api/employees/5" -> "/api/employees", "/api/duties/[id]" -> "/api/duties")
    const baseRoute = pathname.replace(/\/\d+$/, '').replace(/\/\[[^\]]+\]$/, '');
    const key = `${method} ${baseRoute}`;
    const action = ROUTE_PERMISSION_MAP[key];

    if (!action) {
      // Unmapped route: Log once at info level per (method + route)
      if (!unmappedLogged.has(key)) {
        unmappedLogged.add(key);
        logger.info(`[RBAC AUDIT] unmapped route: method='${method}' path='${pathname}'`);
      }
      return { allowed: true, logged: false, unmapped: true };
    }

    const wouldAllow = hasPermission(role, action);

    // If allowed, do NOT log (suppress would-allow volume per specification)
    if (wouldAllow) {
      return { allowed: true, action, logged: false };
    }

    // Check duplicate suppression for would-deny logs within 1 minute
    const cacheKey = `${username}:${key}:deny`;
    const now = Date.now();
    const lastLogged = logSuppressionCache.get(cacheKey);

    if (lastLogged && now - lastLogged < SUPPRESSION_WINDOW_MS) {
      return { allowed: false, action, logged: false };
    }

    logSuppressionCache.set(cacheKey, now);

    // Prune stale cache entries if too large
    if (logSuppressionCache.size > 2000) {
      for (const [k, timestamp] of logSuppressionCache.entries()) {
        if (now - timestamp >= SUPPRESSION_WINDOW_MS) {
          logSuppressionCache.delete(k);
        }
      }
    }

    // Emit would-deny warning in exact required format:
    // [RBAC AUDIT] would-deny user='…' role='…' action='…' method='…' path='…'
    logger.warn(
      `[RBAC AUDIT] would-deny user='${username}' role='${role}' action='${action}' method='${method}' path='${pathname}'`
    );

    return { allowed: false, action, logged: true };
  } catch (err) {
    // Fail-open for audit logging: never throw or block request
    try {
      logger.error('auditRbacRequest failed silently:', err);
    } catch {}
    return { allowed: true, logged: false };
  }
}
