export interface Executive {
  id: number;
  name: string;
  designation: string;
  phone: string | null;
  email: string | null;
  bankId: string | null;
  fileNo: string | null;
  createdAt: string;
}

export interface User {
  id: number;
  name: string;
  username: string;
  role: 'ADMIN' | 'USER';
}

export const STRICT_DESIGNATIONS = [
  'মহাব্যবস্থাপক',
  'উপ-মহাব্যবস্থাপক',
  'সহকারী মহাব্যবস্থাপক'
];

export const extractNickname = (nameStr: string): string => {
  const clean = nameStr.trim();
  
  // Custom exact overrides for Janata Bank PLC IT Officers/Executives
  if (clean.includes('সোহরাব')) return 'সোহরাব';
  if (clean.includes('আশিকুর')) return 'আশিকুর';
  if (clean.includes('ইমন')) return 'ইমন';
  
  const parts = clean.split(/\s+/);
  if (parts.length === 0) return 'ইউ';
  
  const prefixes = [
    'নথিপত্র', 'জনাব', 'মুhammad', 'muhammad', 'মুহাম্মদ', 'মোহাম্মদ', 'মোহাম্মাদ', 'মো', 'মোঃ', 'মোহা', 'শ্রী', 'ডা', 'ডাঃ', 'ড', 'ডক্টর', 'মহম্মদ', 'মিসেস', 'মিস', 'এসএম'
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

export const desigPriority: Record<string, number> = {
  'মহাব্যবস্থাপক': 1,
  'উপ-মহাব্যবস্থাপক': 2,
  'সহকারী মহাব্যবস্থাপক': 3
};
