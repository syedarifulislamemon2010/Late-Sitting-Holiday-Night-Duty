'use client';

import React from 'react';
import { useProfile } from '@/context/ProfileContext';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { Shield, UserCheck, Users, Clock, AlertCircle, CheckCircle } from 'lucide-react';

import { useUsersData } from './hooks/useUsersData';
import UserProfileTab from './components/UserProfileTab';
import UsersTable from './components/UsersTable';
import UserFormModal from './components/UserFormModal';
import UserAuditLogView from './components/UserAuditLogView';

export default function UserManagementPage() {
  const { currentUser, refetchProfile } = useProfile();
  const isAdmin = currentUser?.role === 'ADMIN';

  const data = useUsersData(currentUser, refetchProfile);

  if (data.loading) {
    return (
      <div className="p-6">
        <TableSkeleton rows={8} columns={5} />
      </div>
    );
  }

  return (
    <div className="space-y-6 min-h-screen bg-slate-50/50 dark:bg-transparent -m-4 lg:-m-8 p-4 lg:p-8">
      {/* Top Banner with Settings Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 lg:p-6 rounded-2xl shadow-sm">
        <div className="space-y-1">
          <h1 className="text-xl lg:text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <span>ব্যবহারকারী ও অ্যাকাউন্ট ব্যবস্থাপনা</span>
          </h1>
          <p className="text-xs lg:text-sm text-slate-500 dark:text-slate-400">
            প্রোফাইল সেটিংস, ব্যবহারকারী অ্যাকাউন্ট এবং সিস্টেম অ্যাক্সেস পারমিশন নিয়ন্ত্রণ করুন।
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => data.setActiveSettingsTab('profile')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              data.activeSettingsTab === 'profile'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            <UserCheck size={15} />
            <span>আমার প্রোফাইল</span>
          </button>

          {isAdmin && (
            <>
              <button
                type="button"
                onClick={() => data.setActiveSettingsTab('users')}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  data.activeSettingsTab === 'users'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-800'
                }`}
              >
                <Users size={15} />
                <span>সকল ব্যবহারকারী</span>
              </button>

              <button
                type="button"
                onClick={() => data.setActiveSettingsTab('logs')}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  data.activeSettingsTab === 'logs'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-800'
                }`}
              >
                <Shield size={15} />
                <span>অডিট লগ</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Global Success / Error Alerts */}
      {data.success && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-2xl flex items-center gap-2.5 shadow-sm text-xs font-semibold animate-in fade-in duration-200">
          <CheckCircle size={16} className="text-emerald-600 shrink-0" />
          <span>{data.success}</span>
        </div>
      )}

      {data.error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 rounded-2xl flex items-center gap-2.5 shadow-sm text-xs font-semibold animate-in fade-in duration-200">
          <AlertCircle size={16} className="text-rose-600 shrink-0" />
          <span>{data.error}</span>
        </div>
      )}

      {/* Tab 1: Profile Settings */}
      {data.activeSettingsTab === 'profile' && (
        <UserProfileTab
          currentUser={currentUser}
          profileName={data.profileName}
          setProfileName={data.setProfileName}
          profileMobile={data.profileMobile}
          setProfileMobile={data.setProfileMobile}
          newPassword={data.newPassword}
          setNewPassword={data.setNewPassword}
          confirmPassword={data.confirmPassword}
          setConfirmPassword={data.setConfirmPassword}
          profileError={data.profileError}
          profileSuccess={data.profileSuccess}
          updatingProfile={data.updatingProfile}
          onUpdateProfile={data.handleUpdateProfile}
        />
      )}

      {/* Tab 2: Users Management (Admin Only) */}
      {isAdmin && data.activeSettingsTab === 'users' && (
        <UsersTable
          users={data.users}
          cells={data.cells}
          onOpenAddModal={data.handleOpenAddModal}
          onOpenEditModal={data.handleOpenEditModal}
          onDeleteUser={data.handleDeleteUser}
        />
      )}

      {/* Tab 3: Security Audit Logs (Admin Only) */}
      {isAdmin && data.activeSettingsTab === 'logs' && (
        <UserAuditLogView
          logs={data.auditLogs}
          loading={data.loadingLogs}
          searchQuery={data.logSearchQuery}
          setSearchQuery={data.setLogSearchQuery}
        />
      )}

      {/* Add / Edit User Modal */}
      <UserFormModal
        isOpen={data.isModalOpen}
        onClose={() => data.setIsModalOpen(false)}
        editingUser={data.editingUser}
        name={data.name}
        setName={data.setName}
        username={data.username}
        setUsername={data.setUsername}
        password={data.password}
        setPassword={data.setPassword}
        mobile={data.mobile}
        setMobile={data.setMobile}
        role={data.role}
        setRole={data.setRole}
        selectedCellIds={data.selectedCellIds}
        setSelectedCellIds={data.setSelectedCellIds}
        cellRoles={data.cellRoles}
        setCellRoles={data.setCellRoles}
        cells={data.cells}
        employees={data.employees}
        error={data.error}
        onSave={data.handleSaveUser}
      />
    </div>
  );
}
