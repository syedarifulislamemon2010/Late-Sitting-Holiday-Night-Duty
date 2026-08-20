'use client';

import React from 'react';
import { User, Cell, Employee, extractNickname } from '../types';
import { X, Save, Building2, Shield, CheckSquare, Square, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingUser: User | null;
  name: string;
  setName: (v: string) => void;
  username: string;
  setUsername: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  mobile: string;
  setMobile: (v: string) => void;
  role: string;
  setRole: (v: string) => void;
  selectedCellIds: number[];
  setSelectedCellIds: React.Dispatch<React.SetStateAction<number[]>>;
  cellRoles: Record<number, string>;
  setCellRoles: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  cells: Cell[];
  employees: Employee[];
  error: string;
  onSave: (e: React.FormEvent) => void;
}

export default function UserFormModal({
  isOpen,
  onClose,
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
  cells,
  employees,
  error,
  onSave
}: UserFormModalProps) {
  if (!isOpen) return null;

  const handleCellToggle = (cellId: number) => {
    setSelectedCellIds(prev => {
      if (prev.includes(cellId)) {
        const next = prev.filter(id => id !== cellId);
        setCellRoles(rPrev => {
          const rNext = { ...rPrev };
          delete rNext[cellId];
          return rNext;
        });
        return next;
      } else {
        return [...prev, cellId];
      }
    });
  };

  const handleEmployeeSelect = (empIdStr: string) => {
    if (!empIdStr) return;
    const emp = employees.find(e => e.id.toString() === empIdStr);
    if (emp) {
      setName(emp.name);
      if (emp.bankId) {
        setUsername(emp.bankId);
      }
      if (emp.mobile) {
        setMobile(emp.mobile);
      }
      if (emp.cellId) {
        setSelectedCellIds([emp.cellId]);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
            {editingUser ? '✏️ ব্যবহারকারী অ্যাকাউন্ট সম্পাদনা' : '➕ নতুন ব্যবহারকারী তৈরি'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 text-rose-800 dark:text-rose-300 rounded-xl text-xs font-semibold flex items-center gap-2">
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={onSave} className="space-y-4">
          {!editingUser && employees.length > 0 && (
            <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl">
              <label className="block text-xs font-bold text-indigo-900 dark:text-indigo-300 mb-1">
                কর্মকর্তা তালিকা থেকে দ্রুত অটো-ফিল করুন (ঐচ্ছিক)
              </label>
              <select
                onChange={e => handleEmployeeSelect(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-xl text-slate-700 dark:text-slate-200"
              >
                <option value="">-- কর্মকর্তা নির্বাচন করুন --</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id.toString()}>
                    {emp.name} ({emp.designation}) {emp.bankId ? `- ID: ${emp.bankId}` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                পূর্ণ নাম (Full Name)*
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="उदा. মোঃ আরিফুল ইসলাম ইমন"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                ইউজারনেম (Login ID / Bank ID)*
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="उदा. 43308"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                পাসওয়ার্ড {editingUser ? '(পরিবর্তন না করতে খালি রাখুন)' : '*'}
              </label>
              <input
                type="password"
                required={!editingUser}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={editingUser ? '••••••••' : 'পাসওয়ার্ড দিন'}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                মোবাইল নম্বর
              </label>
              <input
                type="text"
                value={mobile}
                onChange={e => setMobile(e.target.value)}
                placeholder="01XXXXXXXXX"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              ব্যবহারকারীর ভূমিকা (Role)
            </label>
            <select
              value={role}
              onChange={e => setRole(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
            >
              <option value="USER">সাধারণ ব্যবহারকারী (USER)</option>
              <option value="ADMIN">সিস্টেম অ্যাডমিন (ADMIN)</option>
            </select>
          </div>

          {/* Cell Assignment Section */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              নির্দিষ্ট সেল অ্যাসাইন করুন (Assign Cells)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
              {cells.map(cell => {
                const isSelected = selectedCellIds.includes(cell.id);
                return (
                  <div
                    key={cell.id}
                    onClick={() => handleCellToggle(cell.id)}
                    className={`flex items-center gap-2 p-2 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {isSelected ? (
                      <CheckSquare size={14} className="text-indigo-600 shrink-0" />
                    ) : (
                      <Square size={14} className="text-slate-400 shrink-0" />
                    )}
                    <span className="truncate">{cell.name}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={onClose} className="text-xs">
              বাতিল
            </Button>
            <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold">
              <Save size={14} className="mr-1" /> {editingUser ? 'আপডেট করুন' : 'সংরক্ষণ করুন'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
