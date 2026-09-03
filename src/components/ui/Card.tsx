'use client';

import React from 'react';

interface CardProps {
  children?: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  topBorderAccent?: 'primary' | 'success' | 'warning' | 'danger' | 'none';
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

export function Card({
  children,
  title,
  subtitle,
  actions,
  footer,
  className = '',
  topBorderAccent = 'none',
  onClick,
}: CardProps) {
  const accentStyles = {
    none: 'border-t-slate-200 dark:border-t-slate-800',
    primary: 'border-t-3 border-t-primary-600',
    success: 'border-t-3 border-t-success-500',
    warning: 'border-t-3 border-t-warning-500',
    danger: 'border-t-3 border-t-danger-500',
  };

  const hasHeader = title || subtitle || actions;

  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-850/60 rounded-2xl shadow-xs transition-all duration-fast ease-premium ${className.includes('overflow-') ? '' : 'overflow-hidden'} ${
        topBorderAccent !== 'none' ? accentStyles[topBorderAccent] : ''
      } ${onClick ? 'cursor-pointer hover:shadow-md hover:scale-[1.005] select-none' : ''} ${className}`}
    >
      {hasHeader && (
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 px-6 py-4">
          <div className="leading-tight space-y-1">
            {title && (
              <h3 className="font-extrabold text-slate-800 dark:text-slate-150 text-base" style={{ letterSpacing: 'normal' }}>
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-slate-450 dark:text-slate-400 font-medium" style={{ letterSpacing: 'normal' }}>
                {subtitle}
              </p>
            )}
          </div>
          {actions && <div className="shrink-0 flex items-center gap-2">{actions}</div>}
        </div>
      )}
      
      {children && <div className="px-6 py-5 flex-1">{children}</div>}
      
      {footer && (
        <div className="bg-slate-50/50 dark:bg-slate-900/20 border-t border-slate-100 dark:border-slate-800/60 px-6 py-4 flex items-center justify-end gap-3">
          {footer}
        </div>
      )}
    </div>
  );
}
