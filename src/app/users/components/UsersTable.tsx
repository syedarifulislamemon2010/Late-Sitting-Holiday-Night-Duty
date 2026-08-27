'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { User, Cell, getPalette, extractNickname } from '../types';
import { Shield, Building2, Edit3, Trash2, UserPlus, Users as UsersIcon } from 'lucide-react';
import { toBanglaDigits } from '@/lib/bengali-converter';

interface UsersTableProps {
  users: User[];
  cells: Cell[];
  onOpenAddModal: () => void;
  onOpenEditModal: (u: User) => void;
  onDeleteUser: (id: number) => void;
}

export default function UsersTable({
  users,
  cells,
  onOpenAddModal,
  onOpenEditModal,
  onDeleteUser
}: UsersTableProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <UsersIcon size={20} className="text-indigo-600" />
            <span>সিস্টেম ব্যবহারকারী তালিকা</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            মোট ব্যবহারকারী: {toBanglaDigits(users.length)} জন
          </p>
        </div>

        <Button
          onClick={onOpenAddModal}
          size="sm"
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer"
        >
          <UserPlus size={14} /> নতুন ব্যবহারকারী যোগ করুন
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map(user => {
          const primaryCellId = user.cells && user.cells.length > 0 ? user.cells[0].id : 1;
          const palette = getPalette(primaryCellId);
          const nickname = extractNickname(user.name);

          return (
            <Card
              key={user.id}
              className={`p-5 transition-all duration-200 hover:shadow-md border ${palette.border} relative overflow-hidden flex flex-col justify-between`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className={`px-2.5 py-1 min-w-[42px] h-9 rounded-xl flex items-center justify-center font-bold text-xs shadow-xs tracking-tight whitespace-nowrap shrink-0 ${palette.badge}`}>
                      {nickname}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight truncate">
                        {user.name}
                      </h4>
                      <p className="text-xs font-mono text-slate-400 mt-0.5">
                        ID: {user.username}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                      user.role === 'ADMIN'
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50'
                        : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/50'
                    }`}
                  >
                    {user.role}
                  </span>
                </div>

                {user.mobile && (
                  <div className="text-xs text-slate-500 font-medium">
                    📱 {user.mobile}
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    অ্যাসাইনকৃত সেল:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {user.cells && user.cells.length > 0 ? (
                      user.cells.map(c => (
                        <span
                          key={c.id}
                          className="text-[11px] font-semibold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700"
                        >
                          {c.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">কোনো নির্দিষ্ট সেল নেই</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-1.5 pt-4 mt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onOpenEditModal(user)}
                  className="p-1.5 h-auto text-xs text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
                  title="এডিট"
                >
                  <Edit3 size={13} />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDeleteUser(user.id)}
                  className="p-1.5 h-auto text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                  title="মুছে ফেলুন"
                >
                  <Trash2 size={13} />
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
