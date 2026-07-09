'use client';

import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'gray';
  className?: string;
}

export function Badge({
  children,
  variant = 'info',
  className = '',
}: BadgeProps) {
  const baseStyles = 'inline-flex items-center rounded-full text-xs font-semibold px-2.5 py-0.5 border select-none leading-none shrink-0';
  
  const variantStyles = {
    success: 'bg-success-50 text-success-700 border-success-100 dark:bg-success-900/10 dark:text-success-400 dark:border-success-900/30',
    warning: 'bg-warning-50 text-warning-700 border-warning-100 dark:bg-warning-900/10 dark:text-warning-400 dark:border-warning-900/30',
    danger: 'bg-danger-50 text-danger-700 border-danger-100 dark:bg-danger-900/10 dark:text-danger-400 dark:border-danger-900/30',
    info: 'bg-primary-50 text-primary-700 border-primary-100 dark:bg-primary-950/20 dark:text-primary-400 dark:border-primary-900/30',
    gray: 'bg-neutral-50 text-neutral-600 border-neutral-200 dark:bg-neutral-800/40 dark:text-neutral-400 dark:border-neutral-800',
  };

  return (
    <span className={`${baseStyles} ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
}
