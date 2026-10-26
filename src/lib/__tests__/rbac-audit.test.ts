import { describe, it, expect, vi, beforeEach } from 'vitest';
import { auditRbacRequest, clearRbacAuditCache } from '@/lib/rbac-audit';
import logger from '@/lib/logger';
import fs from 'fs';
import path from 'path';

describe('auditRbacRequest Evaluator & Comprehensive Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    clearRbacAuditCache();
    delete process.env.RBAC_MODE;
  });

  it('(ক) logs would-deny for EMPLOYEE attempting POST /api/duties (logged:true, allowed:false)', () => {
    const warnSpy = vi.spyOn(logger, 'warn');
    const result = auditRbacRequest('POST', '/api/duties', { role: 'EMPLOYEE', username: 'emp1' });

    expect(result.allowed).toBe(false);
    expect(result.action).toBe('CREATE_DUTY');
    expect(result.logged).toBe(true);
    expect(warnSpy).toHaveBeenCalledWith(
      "[RBAC AUDIT] would-deny user='emp1' role='EMPLOYEE' action='CREATE_DUTY' method='POST' path='/api/duties'"
    );
  });

  it('(খ) allows and does NOT log would-allow for ADMIN attempting POST /api/duties (allowed:true, logged:false)', () => {
    const warnSpy = vi.spyOn(logger, 'warn');
    const infoSpy = vi.spyOn(logger, 'info');
    const result = auditRbacRequest('POST', '/api/duties', { role: 'ADMIN', username: 'admin1' });

    expect(result.allowed).toBe(true);
    expect(result.action).toBe('CREATE_DUTY');
    expect(result.logged).toBe(false);
    expect(warnSpy).not.toHaveBeenCalled();
    expect(infoSpy).not.toHaveBeenCalled();
  });

  it('(গ) USER attempting DELETE /api/employees/5 evaluates to would-deny per current rbac.ts', () => {
    const warnSpy = vi.spyOn(logger, 'warn');
    const result = auditRbacRequest('DELETE', '/api/employees/5', { role: 'USER', username: 'user1' });

    expect(result.allowed).toBe(false);
    expect(result.action).toBe('DELETE_EMPLOYEE');
    expect(result.logged).toBe(true);
    expect(warnSpy).toHaveBeenCalledWith(
      "[RBAC AUDIT] would-deny user='user1' role='USER' action='DELETE_EMPLOYEE' method='DELETE' path='/api/employees/5'"
    );
  });

  it('logs unmapped route once per method+route via logger.info without creating new actions', () => {
    const infoSpy = vi.spyOn(logger, 'info');
    const res1 = auditRbacRequest('GET', '/api/cells', { role: 'USER', username: 'user1' });
    expect(res1.allowed).toBe(true);
    expect(res1.unmapped).toBe(true);
    expect(infoSpy).toHaveBeenCalledTimes(1);
    expect(infoSpy).toHaveBeenCalledWith("[RBAC AUDIT] unmapped route: method='GET' path='/api/cells'");

    // Second call should NOT log again
    const res2 = auditRbacRequest('GET', '/api/cells', { role: 'USER', username: 'user2' });
    expect(res2.allowed).toBe(true);
    expect(infoSpy).toHaveBeenCalledTimes(1);
  });

  it('(ঙ) suppresses duplicate would-deny logs for same user and action within 1 minute', () => {
    const warnSpy = vi.spyOn(logger, 'warn');
    const res1 = auditRbacRequest('POST', '/api/users', { role: 'USER', username: 'spammer' });
    expect(res1.logged).toBe(true);
    expect(warnSpy).toHaveBeenCalledTimes(1);

    const res2 = auditRbacRequest('POST', '/api/users', { role: 'USER', username: 'spammer' });
    expect(res2.allowed).toBe(false);
    expect(res2.logged).toBe(false); // suppressed
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it('(ঙ) does not log or evaluate when RBAC_MODE=off', () => {
    process.env.RBAC_MODE = 'off';
    const warnSpy = vi.spyOn(logger, 'warn');
    const res = auditRbacRequest('POST', '/api/users', { role: 'USER', username: 'user1' });
    expect(res.allowed).toBe(true);
    expect(res.logged).toBe(false);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('(ঙ) fail-open: does not throw or fail request if logger throws', () => {
    vi.spyOn(logger, 'warn').mockImplementationOnce(() => {
      throw new Error('Disk full');
    });
    expect(() => {
      const res = auditRbacRequest('POST', '/api/users', { role: 'USER', username: 'user1' });
      expect(res.allowed).toBe(true);
      expect(res.logged).toBe(false);
    }).not.toThrow();
  });

  it('(ঘ) স্ট্যাটিক টেস্ট: সব route.ts স্ক্যান করে প্রতিটি exported HTTP হ্যান্ডলারে সঠিক method-সহ auditRbacRequest আছে কিনা যাচাই', () => {
    function getApiFiles(dir: string): string[] {
      let results: string[] = [];
      const list = fs.readdirSync(dir);
      for (const file of list) {
        const full = path.join(dir, file);
        const stat = fs.statSync(full);
        if (stat && stat.isDirectory()) results = results.concat(getApiFiles(full));
        else if (file === 'route.ts') results.push(full);
      }
      return results;
    }

    const exemptRoutes = [
      'auth' + path.sep + '[...nextauth]',
      'backup' + path.sep + 'cron',
      'health',
      'ping'
    ];

    const apiFiles = getApiFiles(path.resolve(process.cwd(), 'src/app/api')).filter(
      f => !exemptRoutes.some(ex => f.includes(ex))
    );

    const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
    const missingCalls: string[] = [];

    for (const file of apiFiles) {
      const content = fs.readFileSync(file, 'utf8');
      const rel = path.relative(process.cwd(), file).replace(/\\/g, '/');

      for (const m of methods) {
        const exportRegex = new RegExp(`export\\s+async\\s+function\\s+${m}\\s*\\(`);
        if (exportRegex.test(content)) {
          // Look for auditRbacRequest('${m}', or auditRbacRequest("${m}",
          const auditCallRegex = new RegExp(`auditRbacRequest\\(\\s*['"]${m}['"]`);
          if (!auditCallRegex.test(content)) {
            missingCalls.push(`${m} in ${rel}`);
          }
        }
      }
    }

    expect(missingCalls).toEqual([]);
  });
});
