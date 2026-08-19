'use client';

import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  className?: string;
}

export function EmptyState({
  title = 'কোনো তথ্য পাওয়া যায়নি',
  description = 'বর্তমানে প্রদর্শনের জন্য কোনো রেকর্ড বিদ্যমান নেই।',
  icon: Icon = Inbox,
  action,
  className = ''
}: EmptyStateProps) {
  return (
    <div className={`w-full py-12 px-4 flex flex-col items-center justify-center text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 ${className}`}>
      <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
        <Icon size={24} />
      </div>
      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
        {title}
      </h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
        {description}
      </p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          aria-label={action.label}
          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
        >
          {action.icon && <action.icon size={14} />}
          {action.label}
        </button>
      )}
    </div>
  );
}
