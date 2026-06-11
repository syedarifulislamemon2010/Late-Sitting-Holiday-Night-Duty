import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LeaveService } from '../leave.service';
import { LeaveRepository } from '@/repositories/leave.repository';
import { logActivity } from '@/lib/audit';

// Mock dependency modules
vi.mock('@/repositories/leave.repository', () => {
  return {
    LeaveRepository: {
      listAll: vi.fn(),
      findLatestLeave: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
  };
});

vi.mock('@/lib/audit', () => {
  return {
    logActivity: vi.fn(),
  };
});

vi.mock('@/lib/db', () => {
  return {
    db: {
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      returning: vi.fn(),
      transaction: vi.fn((cb) => cb(null)),
    },
  };
});

describe('LeaveService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockUserAdmin = {
    id: 1,
    name: 'Admin User',
    username: 'admin',
    role: 'ADMIN' as const,
  };

  const mockUserNormal = {
    id: 2,
    name: 'Normal User',
    username: 'user2',
    role: 'USER' as const,
  };

  const mockHeaders = {
    ipAddress: '127.0.0.1',
    userAgent: 'Mozilla/5.0',
  };

  const mockLeaveInput = {
    leaveType: 'CASUAL' as const,
    startDate: '2026-06-01',
    endDate: '2026-06-03',
    applicationDate: '2026-05-28',
    applicantName: 'Normal User',
    designation: 'Senior Officer',
    bankId: 'JB-12345',
    fileNo: 'F-999',
    cellName: 'IT Cell',
    leaveLocation: 'Dhaka',
    mobileNo: '01700000000',
    casualTotal: 20,
    casualUsed: 5,
    ordinaryTotal: 0,
    ordinaryUsed: 0,
    specialTotal: 0,
    specialUsed: 0,
  };

  describe('listLeaves', () => {
    it('should list all leaves for admin', async () => {
      vi.mocked(LeaveRepository.listAll).mockResolvedValue([
        { id: 10, ...mockLeaveInput, userId: 2, createdAt: new Date() },
      ]);

      const result = await LeaveService.listLeaves(mockUserAdmin, { latest: false, bankId: null });
      expect(result).toHaveLength(1);
      expect(LeaveRepository.listAll).toHaveBeenCalled();
    });

    it('should throw AuthError if currentUser is not provided', async () => {
      await expect(
        LeaveService.listLeaves(null, { latest: false, bankId: null })
      ).rejects.toThrow('unauthorized');
    });
  });

  describe('createLeave', () => {
    it('should successfully create leave', async () => {
      const mockCreatedLeave = { id: 11, ...mockLeaveInput, userId: mockUserNormal.id, createdAt: new Date() };
      vi.mocked(LeaveRepository.create).mockResolvedValue(mockCreatedLeave);

      const result = await LeaveService.createLeave(mockUserNormal, mockLeaveInput, mockHeaders);
      expect(result).toBeDefined();
      expect(result.id).toBe(11);
      expect(logActivity).toHaveBeenCalled();
    });
  });

  describe('deleteLeave', () => {
    it('should delete leave if applicant is the owner', async () => {
      const mockLeave = { id: 15, ...mockLeaveInput, userId: mockUserNormal.id, createdAt: new Date() };
      vi.mocked(LeaveRepository.findById).mockResolvedValue(mockLeave);
      vi.mocked(LeaveRepository.delete).mockResolvedValue(mockLeave);

      const result = await LeaveService.deleteLeave(mockUserNormal, 15, mockHeaders);
      expect(result.success).toBe(true);
      expect(LeaveRepository.delete).toHaveBeenCalledWith(15, null);
    });

    it('should throw AppError if leave does not exist', async () => {
      vi.mocked(LeaveRepository.findById).mockResolvedValue(null);

      await expect(
        LeaveService.deleteLeave(mockUserNormal, 999, mockHeaders)
      ).rejects.toThrow('leave_not_found');
    });

    it('should throw AuthError if normal user tries to delete another user\'s leave', async () => {
      const mockLeave = { id: 15, ...mockLeaveInput, userId: 99, createdAt: new Date() };
      vi.mocked(LeaveRepository.findById).mockResolvedValue(mockLeave);

      await expect(
        LeaveService.deleteLeave(mockUserNormal, 15, mockHeaders)
      ).rejects.toThrow('forbidden');
    });
  });
});
