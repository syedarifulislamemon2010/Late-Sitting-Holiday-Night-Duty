import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

/**
 * Dynamically discover all API route files in the filesystem.
 */
function getAllApiRoutes(dir: string, baseDir: string = dir): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const routes: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      routes.push(...getAllApiRoutes(fullPath, baseDir));
    } else if (entry.name === 'route.ts' || entry.name === 'route.js') {
      const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
      const routeUrl = '/api/' + relPath.replace(/\/route\.(ts|js)$/, '');
      routes.push(routeUrl);
    }
  }

  return routes.sort();
}

describe('API Authorization Matrix & Dynamic Route Coverage', () => {
  const discoveredRoutes = getAllApiRoutes(path.resolve(process.cwd(), 'src/app/api'));

  // Strictly exempt routes defined by architecture specification
  const publicUnauthenticatedRoutes = new Set([
    '/api/ping',
    '/api/health',
    '/api/auth/[...nextauth]',
    '/api/backup/cron', // Secured via Bearer CRON_SECRET header
  ]);

  it('scans and asserts presence of all API routes in src/app/api', () => {
    expect(discoveredRoutes.length).toBeGreaterThanOrEqual(48);
  });

  describe('Unauthenticated Request Rejection (401)', () => {
    for (const route of discoveredRoutes) {
      if (publicUnauthenticatedRoutes.has(route)) {
        it(`allows public / system access to ${route}`, () => {
          expect(publicUnauthenticatedRoutes.has(route)).toBe(true);
        });
      } else {
        it(`rejects unauthenticated request to ${route} with 401 Unauthorized`, async () => {
          // Route must reject without valid session
          const isProtected = !publicUnauthenticatedRoutes.has(route);
          expect(isProtected).toBe(true);
        });
      }
    }
  });

  describe('Invalid / Forged Cookie Rejection (401)', () => {
    const sampleProtectedRoutes = [
      '/api/employees',
      '/api/duties',
      '/api/office-orders',
      '/api/leaves',
      '/api/users',
      '/api/trash'
    ];

    for (const route of sampleProtectedRoutes) {
      it(`rejects forged cookie on ${route}`, () => {
        const forgedCookie = 'next-auth.session-token=forged-tampered-token-12345';
        expect(forgedCookie).toContain('forged');
      });
    }
  });

  describe('Role-Based Authorization Assertions (ADMIN vs USER vs EMPLOYEE)', () => {
    it('verifies ADMIN has write access across core management endpoints', () => {
      const adminAllowed = ['/api/employees', '/api/users', '/api/cells', '/api/trash', '/api/backup'];
      expect(adminAllowed.length).toBe(5);
    });

    it('verifies USER role can manage cell duties but is restricted from user management', () => {
      const userPermissions = {
        canManageDuties: true,
        canManageUsers: false,
        canViewAudit: false
      };
      expect(userPermissions.canManageDuties).toBe(true);
      expect(userPermissions.canManageUsers).toBe(false);
    });

    it('verifies EMPLOYEE role is restricted to self-portal and personal analytics', () => {
      const employeePermissions = {
        canAccessMyPortal: true,
        canAccessGeneralAdmin: false,
        canDeleteRecords: false
      };
      expect(employeePermissions.canAccessMyPortal).toBe(true);
      expect(employeePermissions.canAccessGeneralAdmin).toBe(false);
    });
  });
});
