export interface Cell {
  id: number;
  name: string;
  description?: string;
}

export interface User {
  id: number;
  username: string;
  name: string;
  role: string;
  cells: { id: number; name: string }[];
  mobile?: string | null;
  cellDuties?: string | null;
}

export interface Employee {
  id: number;
  name: string;
  designation: string;
  bankId: string | null;
  fileNo: string | null;
  cellId: number;
  cell?: { id: number; name: string } | null;
  mobile?: string | null;
}

export interface AuditLog {
  id: number;
  createdAt: string;
  username: string;
  action: string;
  details: string;
  ipAddress?: string | null;
  macAddress?: string | null;
}

export const extractNickname = (nameStr: string): string => {
  const clean = nameStr.trim();
  
  if (clean.includes('মনোয়ার')) return 'মনোয়ার';
  if (clean.includes('প্রদীপ্ত')) return 'প্রদীপ্ত';
  if (clean.includes('মারুফ')) return 'মারুফ';
  if (clean.includes('জোবায়ের')) return 'জোবায়ের';
  if (clean.includes('ইমন')) return 'ইমন';
  if (clean.includes('কিবরিয়া') || clean.includes('কিবর')) return 'কিবরিয়া';
  if (clean.includes('সাইফ')) return 'সাইফ';
  if (clean.includes('দেবাশীষ')) return 'দেবাশীষ';
  if (clean.includes('শাহিন')) return 'শাহিন';
  if (clean.includes('সৈকত')) return 'সৈকত';
  if (clean.includes('বাহার')) return 'বাহার';
  if (clean.includes('রিয়াজ')) return 'রিয়াজ';
  if (clean.includes('রবিউল')) return 'রবিউল';
  if (clean.includes('হাদীউজ্জামান') || clean.includes('বাপ্পী')) return 'বাপ্পী';
  if (clean.includes('আরিফুল ইসলাম')) return 'আরিফ';
  if (clean.includes('রাশেদ')) return 'রাশেদ';
  if (clean.includes('জাকির')) return 'জাকির';
  if (clean.includes('ফাতিহ')) return 'ফাতিহ';
  
  const parts = clean.split(/\s+/);
  if (parts.length === 0) return 'ইউ';
  
  const prefixes = [
    'জনাব', 'মুhammad', 'muhammad', 'মুহাম্মদ', 'মোহাম্মদ', 'মোহাম্মাদ', 'মো', 'মোঃ', 'মোহা', 'শ্রী', 'ডা', 'ডাঃ', 'ড', 'ডক্টর', 'মহম্মদ', 'মিসেস', 'মিস', 'এসএম'
  ];
  
  for (let i = 0; i < parts.length; i++) {
    const word = parts[i];
    const cleanedWord = word.replace(/[.,:;ঃ]/g, '').trim();
    if (!prefixes.includes(cleanedWord) && cleanedWord.length > 0) {
      return word.substring(0, 10);
    }
  }
  
  return parts[0] ? parts[0].substring(0, 10) : 'ইউ';
};

export const getPalette = (cellId: number) => {
  const palettes = [
    {
      name: 'indigo',
      border: 'border-indigo-200 dark:border-indigo-900/50',
      bg: 'bg-indigo-50/20 dark:bg-indigo-950/5',
      badge: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400',
      text: 'text-indigo-600 dark:text-indigo-400'
    },
    {
      name: 'emerald',
      border: 'border-emerald-200 dark:border-emerald-900/50',
      bg: 'bg-emerald-50/20 dark:bg-emerald-950/5',
      badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400',
      text: 'text-emerald-600 dark:text-emerald-400'
    },
    {
      name: 'amber',
      border: 'border-amber-200 dark:border-amber-900/50',
      bg: 'bg-amber-50/20 dark:bg-amber-950/5',
      badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
      text: 'text-amber-600 dark:text-amber-400'
    },
    {
      name: 'rose',
      border: 'border-rose-200 dark:border-rose-900/50',
      bg: 'bg-rose-50/20 dark:bg-rose-950/5',
      badge: 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400',
      text: 'text-rose-600 dark:text-rose-400'
    },
    {
      name: 'violet',
      border: 'border-violet-200 dark:border-violet-900/50',
      bg: 'bg-violet-50/20 dark:bg-violet-950/5',
      badge: 'bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400',
      text: 'text-violet-600 dark:text-violet-400'
    },
    {
      name: 'cyan',
      border: 'border-cyan-200 dark:border-cyan-900/50',
      bg: 'bg-cyan-50/20 dark:bg-cyan-950/5',
      badge: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-400',
      text: 'text-cyan-600 dark:text-cyan-400'
    },
    {
      name: 'teal',
      border: 'border-teal-200 dark:border-teal-900/50',
      bg: 'bg-teal-50/20 dark:bg-teal-950/5',
      badge: 'bg-teal-50 text-teal-700 dark:bg-teal-950/30 dark:text-teal-400',
      text: 'text-teal-600 dark:text-teal-400'
    },
    {
      name: 'sky',
      border: 'border-sky-200 dark:border-sky-900/50',
      bg: 'bg-sky-50/20 dark:bg-sky-950/5',
      badge: 'bg-sky-50 text-sky-700 dark:bg-sky-950/30 dark:text-sky-400',
      text: 'text-sky-600 dark:text-sky-400'
    }
  ];
  return palettes[cellId % palettes.length];
};
