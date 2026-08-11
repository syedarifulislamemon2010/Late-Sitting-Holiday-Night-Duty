'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'outline' | 'text';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  className = '',
  disabled,
  onClick,
  type = 'button',
  ...props
}: ButtonProps) {
  // Prevent double-clicking when loading or disabled
  const handlePress = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (loading || disabled) {
      e.preventDefault();
      return;
    }
    if (onClick) onClick(e);
  };

  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-xl select-none transition-all duration-fast ease-premium cursor-pointer focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 outline-none shrink-0';
  
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
  };

  const variantStyles = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white shadow-xs border border-transparent active:scale-98',
    secondary: 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-transparent dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-200 active:scale-98',
    success: 'bg-success-600 hover:bg-success-700 text-white shadow-xs border border-transparent active:scale-98',
    warning: 'bg-warning-500 hover:bg-warning-600 text-white shadow-xs border border-transparent active:scale-98',
    danger: 'bg-danger-600 hover:bg-danger-700 text-white shadow-xs border border-transparent active:scale-98',
    outline: 'bg-white dark:bg-slate-900 border border-neutral-250 text-neutral-850 hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-350 dark:hover:bg-slate-800/60 active:scale-98',
    text: 'bg-transparent hover:bg-neutral-50 text-neutral-700 dark:text-neutral-300 dark:hover:bg-slate-800/40 border border-transparent',
  };

  const isBtnDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isBtnDisabled}
      aria-disabled={isBtnDisabled ? 'true' : undefined}
      aria-busy={loading ? 'true' : undefined}
      onClick={handlePress}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${isBtnDisabled ? 'opacity-50 cursor-not-allowed active:scale-100' : ''} ${className}`}
      {...props}
    >
      {loading && <Loader2 className="animate-spin mr-2 shrink-0" size={size === 'sm' ? 12 : 16} />}
      {children}
    </button>
  );
}
