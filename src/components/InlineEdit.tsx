'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Edit2, Check, X, Loader2 } from 'lucide-react';

interface InlineEditProps {
  value: string;
  onSave: (newValue: string) => Promise<void>;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  canEdit?: boolean;
}

export default function InlineEdit({
  value,
  onSave,
  placeholder = 'সম্পাদনা করুন...',
  className = '',
  inputClassName = '',
  canEdit = true
}: InlineEditProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync external value updates
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  if (!canEdit) {
    return <span className={`${className}`}>{value || <span className="text-slate-400 italic">ফাঁকা</span>}</span>;
  }

  const handleSave = async () => {
    const trimmed = inputValue.trim();
    if (trimmed === value.trim()) {
      setIsEditing(false);
      return;
    }

    setLoading(true);
    try {
      await onSave(trimmed);
      setIsEditing(false);
    } catch (err) {
      console.error('Inline edit save failed:', err);
      // Revert on error
      setInputValue(value);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setInputValue(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1.5 min-w-[120px] relative z-10" onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          disabled={loading}
          className={`px-2 py-1 bg-white dark:bg-slate-950 border border-indigo-500 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-100 font-sans w-full ${inputClassName}`}
        />
        {loading ? (
          <Loader2 size={13} className="text-indigo-650 animate-spin shrink-0" />
        ) : (
          <div className="flex items-center gap-0.5 shrink-0">
            <button 
              onMouseDown={(e) => {
                e.preventDefault(); // prevent blur
                handleSave();
              }}
              className="p-1 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-md cursor-pointer"
            >
              <Check size={12} />
            </button>
            <button 
              onMouseDown={(e) => {
                e.preventDefault();
                setInputValue(value);
                setIsEditing(false);
              }}
              className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-md cursor-pointer"
            >
              <X size={12} />
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      onClick={(e) => {
        e.stopPropagation();
        setIsEditing(true);
      }}
      className={`group flex items-center justify-between gap-1.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-850 px-1.5 py-1 rounded-lg transition-colors border border-transparent hover:border-slate-200/40 dark:hover:border-slate-800/40 ${className}`}
    >
      <span className="truncate">
        {value ? (
          value
        ) : (
          <span className="text-slate-400 dark:text-slate-650 italic text-[11px]">{placeholder}</span>
        )}
      </span>
      <Edit2 
        size={11} 
        className="text-slate-450 dark:text-slate-550 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" 
      />
    </div>
  );
}
