'use client';

import React, { useId } from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  containerClassName?: string;
}

export function Select({
  label,
  error,
  children,
  containerClassName = '',
  className = '',
  id,
  ...props
}: SelectProps) {
  const generatedId = useId();
  const selectId = id || generatedId;

  return (
    <div className={`flex flex-col gap-1.5 w-full ${containerClassName}`}>
      {label && (
        <label
          id={`${selectId}-label`}
          htmlFor={selectId}
          className="text-xs font-bold text-slate-600 dark:text-slate-400 select-none cursor-pointer"
          style={{ letterSpacing: 'normal' }}
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        aria-invalid={!!error}
        aria-labelledby={label ? `${selectId}-label` : undefined}
        aria-label={!label ? 'Select an option' : undefined}
        className={`w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-900 border ${
          error 
            ? 'border-danger-400 focus:ring-danger-500 focus:border-danger-500' 
            : 'border-slate-200 dark:border-slate-800 focus:ring-primary-500 focus:border-primary-500'
        } rounded-xl shadow-xs transition-all duration-fast ease-premium focus:ring-2 outline-none text-slate-800 dark:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed`}
        style={{ letterSpacing: 'normal' }}
        {...props}
      >
        {children}
      </select>
      {error && (
        <span 
          className="text-[11px] font-semibold text-danger-700 dark:text-danger-400"
          style={{ letterSpacing: 'normal' }}
        >
          {error}
        </span>
      )}
    </div>
  );
}
