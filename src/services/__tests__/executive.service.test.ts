import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExecutiveService } from '../executive.service';
import { db } from '@/lib/db';

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([]),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
  }
}));

vi.mock('@/lib/audit', () => ({
  logActivity: vi.fn().mockResolvedValue(true)
}));

describe('ExecutiveService', () => {
  const adminUser = {
    id: 1,
    username: 'admin',
    name: 'System Admin',
    role: 'ADMIN' as const
  };

  const regularUser = {
    id: 2,
    username: '12345',
    name: 'Regular Officer',
    role: 'USER' as const
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows authenticated users to list executives', async () => {
    const mockExecutives = [
      { id: 1, name: 'Executive A', designation: 'General Manager' }
    ];
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        orderBy: vi.fn().mockResolvedValue(mockExecutives)
      })
    } as any);

    const result = await ExecutiveService.listExecutives(regularUser);
    expect(result).toHaveLength(1);
  });

  it('throws unauthorized error if user is not logged in when listing', async () => {
    await expect(ExecutiveService.listExecutives(null)).rejects.toThrow();
  });

  it('prevents regular users from creating an executive', async () => {
    await expect(
      ExecutiveService.createExecutive(
        regularUser,
        { name: 'Exec B', designation: 'DGM' },
        { ipAddress: '127.0.0.1', userAgent: 'test' }
      )
    ).rejects.toThrow();
  });

  it('validates name and designation requirement on executive creation', async () => {
    await expect(
      ExecutiveService.createExecutive(
        adminUser,
        { name: '', designation: '' },
        { ipAddress: '127.0.0.1', userAgent: 'test' }
      )
    ).rejects.toThrow();
  });
});
