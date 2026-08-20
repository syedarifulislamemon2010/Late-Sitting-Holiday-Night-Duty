'use client';

import { useState, useEffect } from 'react';
import logger from '@/lib/logger';
import { UserProfile } from '@/context/ProfileContext';
import { User, Cell, Employee, AuditLog } from '../types';

export function useUsersData(currentUser: UserProfile | null | undefined, refetchProfile?: () => Promise<void>) {
  const [users, setUsers] = useState<User[]>([]);
  const [cells, setCells] = useState<Cell[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Active Tab
  const [activeSettingsTab, setActiveSettingsTab] = useState<'profile' | 'users' | 'logs'>('profile');

  // Form modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mobile, setMobile] = useState('');
  const [role, setRole] = useState('USER');
  const [selectedCellIds, setSelectedCellIds] = useState<number[]>([]);
  const [cellRoles, setCellRoles] = useState<Record<number, string>>({});

  // Profile tab state
  const [profileName, setProfileName] = useState('');
  const [profileMobile, setProfileMobile] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Audit logs state
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logSearchQuery, setLogSearchQuery] = useState('');

  // Sync profile fields from currentUser
  useEffect(() => {
    if (currentUser) {
      setProfileName(currentUser.name || '');
      setProfileMobile(currentUser.mobile || '');
    }
  }, [currentUser]);

  // Load users, cells, and employees
  const loadData = async () => {
    try {
      setLoading(true);
      const [usersRes, cellsRes, empRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/cells'),
        fetch('/api/employees')
      ]);

      if (usersRes.ok) {
        const uData = await usersRes.json();
        setUsers(Array.isArray(uData) ? uData : []);
      }
      if (cellsRes.ok) {
        const cData = await cellsRes.json();
        setCells(Array.isArray(cData) ? cData : []);
      }
      if (empRes.ok) {
        const eData = await empRes.json();
        setEmployees(Array.isArray(eData) ? eData : []);
      }
    } catch (err) {
      logger.error('Error fetching user management data:', err);
      setError('তথ্য লোড করতে সমস্যা হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Fetch audit logs
  const fetchAuditLogs = async () => {
    try {
      setLoadingLogs(true);
      const res = await fetch('/api/audit');
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      logger.error('Error loading audit logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (activeSettingsTab === 'logs') {
      fetchAuditLogs();
    }
  }, [activeSettingsTab]);

  // Open modal for adding/editing user
  const handleOpenAddModal = () => {
    setEditingUser(null);
    setName('');
    setUsername('');
    setPassword('');
    setMobile('');
    setRole('USER');
    setSelectedCellIds([]);
    setCellRoles({});
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: User) => {
    setEditingUser(user);
    setName(user.name);
    setUsername(user.username);
    setPassword('');
    setMobile(user.mobile || '');
    setRole(user.role);
    setSelectedCellIds(user.cells ? user.cells.map(c => c.id) : []);

    const roleMap: Record<number, string> = {};
    if (user.cellDuties) {
      try {
        const parsed = JSON.parse(user.cellDuties);
        Object.assign(roleMap, parsed);
      } catch (e) {}
    }
    setCellRoles(roleMap);
    setError('');
    setIsModalOpen(true);
  };

  // Create or Update User
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const payload: {
        name: string;
        username: string;
        role: string;
        cellIds: number[];
        mobile: string;
        cellDuties: string;
        password?: string;
      } = {
        name,
        username,
        role,
        cellIds: selectedCellIds,
        mobile,
        cellDuties: JSON.stringify(cellRoles)
      };

      if (password) {
        payload.password = password;
      }

      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
      const method = editingUser ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSuccess(editingUser ? 'ব্যবহারকারী সফলভাবে আপডেট হয়েছে!' : 'নতুন ব্যবহারকারী সফলভাবে তৈরি হয়েছে!');
        setIsModalOpen(false);
        setTimeout(() => setSuccess(''), 3000);
        loadData();
      } else {
        const data = await res.json();
        setError(data.error || 'সংরক্ষণ ব্যর্থ হয়েছে।');
      }
    } catch (err) {
      logger.error('Error saving user:', err);
      setError('সার্ভারে যোগাযোগ করতে ব্যর্থ হয়েছে।');
    }
  };

  // Delete User
  const handleDeleteUser = async (id: number) => {
    if (!confirm('আপনি কি নিশ্চিত যে এই ব্যবহারকারী অ্যাকাউন্টটি মুছে ফেলতে চান?')) return;

    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSuccess('ব্যবহারকারী অ্যাকাউন্ট সফলভাবে মুছে ফেলা হয়েছে!');
        setTimeout(() => setSuccess(''), 3000);
        loadData();
      } else {
        const data = await res.json();
        setError(data.error || 'মুছে ফেলতে ব্যর্থ হয়েছে।');
      }
    } catch (err) {
      logger.error('Error deleting user:', err);
      setError('সার্ভার এরর।');
    }
  };

  // Update Profile
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    if (newPassword && newPassword !== confirmPassword) {
      setProfileError('নতুন পাসওয়ার্ড এবং নিশ্চিতকরণ পাসওয়ার্ড মিলছে না।');
      return;
    }

    try {
      setUpdatingProfile(true);
      const payload: {
        name: string;
        mobile: string;
        password?: string;
      } = {
        name: profileName,
        mobile: profileMobile
      };
      if (newPassword) {
        payload.password = newPassword;
      }

      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setProfileSuccess('আপনার প্রোফাইল তথ্য সফলভাবে আপডেট করা হয়েছে!');
        setNewPassword('');
        setConfirmPassword('');
        if (refetchProfile) {
          await refetchProfile();
        }
        setTimeout(() => setProfileSuccess(''), 4000);
      } else {
        const data = await res.json();
        setProfileError(data.error || 'প্রোফাইল আপডেট করতে ব্যর্থ হয়েছে।');
      }
    } catch (err) {
      logger.error('Error updating profile:', err);
      setProfileError('সার্ভারে যোগাযোগ করতে সমস্যা হয়েছে।');
    } finally {
      setUpdatingProfile(false);
    }
  };

  return {
    users,
    cells,
    employees,
    loading,
    error,
    setError,
    success,
    setSuccess,
    activeSettingsTab,
    setActiveSettingsTab,
    isModalOpen,
    setIsModalOpen,
    editingUser,
    name,
    setName,
    username,
    setUsername,
    password,
    setPassword,
    mobile,
    setMobile,
    role,
    setRole,
    selectedCellIds,
    setSelectedCellIds,
    cellRoles,
    setCellRoles,
    profileName,
    setProfileName,
    profileMobile,
    setProfileMobile,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    profileError,
    setProfileError,
    profileSuccess,
    setProfileSuccess,
    updatingProfile,
    auditLogs,
    loadingLogs,
    logSearchQuery,
    setLogSearchQuery,
    handleOpenAddModal,
    handleOpenEditModal,
    handleSaveUser,
    handleDeleteUser,
    handleUpdateProfile
  };
}
