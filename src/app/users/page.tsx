'use client';

import { useState, useEffect } from 'react';
import { 
  UserPlus, 
  Shield, 
  Building2, 
  Trash2, 
  Edit3, 
  AlertCircle, 
  CheckSquare, 
  Square,
  Key,
  UserCheck
} from 'lucide-react';

interface Cell {
  id: number;
  name: string;
  description?: string;
}

interface User {
  id: number;
  username: string;
  name: string;
  role: string;
  cells: { id: number; name: string }[];
  mobile?: string | null;
}

const extractNickname = (nameStr: string): string => {
  const clean = nameStr.trim();
  
  // Custom exact overrides for Janata Bank PLC IT Officers
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
  if (clean.includes('আরিফুল ইসলাম')) return 'আরিফ'; // Avoid matching 'আরিফুল ইসলাম ইমন'
  if (clean.includes('রাশেদ')) return 'রাশেদ';
  if (clean.includes('জাকির')) return 'জাকির';
  if (clean.includes('ফাতিহ')) return 'ফাতিহ';
  
  // Rule-based fallback
  const parts = clean.split(/\s+/);
  if (parts.length === 0) return 'ইউ';
  
  // Cleaned prefixes (no punctuation, including common variations)
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

export default function UserManagement() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [cells, setCells] = useState<Cell[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mobile, setMobile] = useState('');
  const [role, setRole] = useState('USER');
  const [selectedCellIds, setSelectedCellIds] = useState<number[]>([]);
  const [profileUser, setProfileUser] = useState<User | null>(null);

  // Tab State
  const [activeSettingsTab, setActiveSettingsTab] = useState<'profile' | 'users' | 'logs'>('profile');
  
  // Profile settings update form
  const [profileName, setProfileName] = useState('');
  const [profileMobile, setProfileMobile] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Audit logs state
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logSearchQuery, setLogSearchQuery] = useState('');

  // Helper for premium colors
  const getPalette = (cellId: number) => {
    const palettes = [
      {
        name: 'indigo',
        border: 'border-indigo-200 dark:border-indigo-900/50',
        bg: 'bg-indigo-50/20 dark:bg-indigo-950/5',
        badge: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400',
        text: 'text-indigo-650 dark:text-indigo-400'
      },
      {
        name: 'emerald',
        border: 'border-emerald-200 dark:border-emerald-900/50',
        bg: 'bg-emerald-50/20 dark:bg-emerald-950/5',
        badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400',
        text: 'text-emerald-650 dark:text-emerald-400'
      },
      {
        name: 'amber',
        border: 'border-amber-200 dark:border-amber-900/50',
        bg: 'bg-amber-50/20 dark:bg-amber-950/5',
        badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-455',
        text: 'text-amber-650 dark:text-amber-400'
      },
      {
        name: 'rose',
        border: 'border-rose-200 dark:border-rose-900/50',
        bg: 'bg-rose-50/20 dark:bg-rose-950/5',
        badge: 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-455',
        text: 'text-rose-650 dark:text-rose-400'
      },
      {
        name: 'violet',
        border: 'border-violet-200 dark:border-violet-900/50',
        bg: 'bg-violet-50/20 dark:bg-violet-950/5',
        badge: 'bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400',
        text: 'text-violet-650 dark:text-violet-400'
      },
      {
        name: 'cyan',
        border: 'border-cyan-200 dark:border-cyan-900/50',
        bg: 'bg-cyan-50/20 dark:bg-cyan-950/5',
        badge: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-400',
        text: 'text-cyan-650 dark:text-cyan-400'
      },
      {
        name: 'teal',
        border: 'border-teal-200 dark:border-teal-900/50',
        bg: 'bg-teal-50/20 dark:bg-teal-950/5',
        badge: 'bg-teal-50 text-teal-700 dark:bg-teal-950/30 dark:text-teal-400',
        text: 'text-teal-650 dark:text-teal-400'
      },
      {
        name: 'sky',
        border: 'border-sky-200 dark:border-sky-900/50',
        bg: 'bg-sky-50/20 dark:bg-sky-950/5',
        badge: 'bg-sky-50 text-sky-700 dark:bg-sky-950/30 dark:text-sky-400',
        text: 'text-sky-650 dark:text-sky-400'
      }
    ];
    return palettes[cellId % palettes.length];
  };

  const toBanglaDigits = (num: number | string): string => {
    const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return num.toString().replace(/\d/g, (digit) => banglaDigits[parseInt(digit, 10)]);
  };

  const sortUsersByBankId = (userList: User[]) => {
    return [...userList].sort((a, b) => {
      const numA = parseInt(a.username, 10);
      const numB = parseInt(b.username, 10);
      
      const isNumA = !isNaN(numA) && /^\d+$/.test(a.username.trim());
      const isNumB = !isNaN(numB) && /^\d+$/.test(b.username.trim());

      if (isNumA && isNumB) {
        return numA - numB;
      }
      if (isNumA) return -1;
      if (isNumB) return 1;
      
      return a.username.localeCompare(b.username);
    });
  };

  const renderUserCard = (user: User, paletteId: number) => {
    const pal = getPalette(paletteId);
    const emp = employees.find(
      (e) => e.bankId && e.bankId.trim().toLowerCase() === user.username.trim().toLowerCase()
    );
    return (
      <div 
        key={user.id} 
        className={`p-6 rounded-2xl flex flex-col justify-between hover:scale-[1.02] hover:shadow-lg transition-all duration-300 group ${pal.border} ${pal.bg}`}
      >
        {/* Card top section */}
        <div className="cursor-pointer font-sans" onClick={() => setProfileUser(user)}>
          <div className="flex justify-between items-start gap-2">
            <div className="space-y-1">
              <h3 className="font-extrabold text-slate-855 dark:text-slate-100 text-base leading-tight group-hover:text-indigo-650 dark:group-hover:text-indigo-400 transition-colors">{user.name}</h3>
              {emp && (
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">{emp.designation}</p>
              )}
              <div className="flex flex-col gap-0.5 mt-1.5">
                <span className="text-[11px] font-bold text-slate-450 dark:text-slate-500 font-sans">ব্যাংক আইডি: {user.username}</span>
                {user.mobile && (
                  <span className="text-[11px] font-bold text-slate-450 dark:text-slate-500 font-sans">মোবাইল: {user.mobile}</span>
                )}
                {emp?.fileNo && (
                  <span className="text-[11px] font-bold text-slate-450 dark:text-slate-500 font-sans">নথি নম্বর: {emp.fileNo}</span>
                )}
              </div>
            </div>
            
            {/* Role Tag */}
            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase border ${user.role === 'ADMIN' ? 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-455' : 'bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-950/20 dark:border-indigo-900/30 dark:text-indigo-400'}`}>
              {user.role}
            </span>
          </div>

          {/* Cells lists */}
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 font-sans">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wide">
              <Building2 size={12} className="text-slate-400" />
              <span>প্রবেশাধিকার প্রাপ্ত সেলসমূহ:</span>
            </div>
            
            {user.role === 'ADMIN' ? (
              <p className="text-xs font-semibold text-slate-650 dark:text-slate-400 mt-2 italic flex items-center gap-1">
                <Shield size={12} className="text-rose-500" />
                এডমিন হিসেবে সব সেলের অ্যাক্সেস রয়েছে
              </p>
            ) : user.cells.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {user.cells.map(c => (
                  <span 
                    key={c.id} 
                    className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100/50 dark:border-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-extrabold font-mono"
                  >
                    {c.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-2 italic">
                ⚠️ কোনো সেলের অ্যাক্সেস নেই!
              </p>
            )}
          </div>
        </div>

        {/* Actions panel */}
        <div className="mt-6 flex justify-end items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800/60 no-print">
          <button
            onClick={() => handleOpenEditModal(user)}
            className="p-2 text-indigo-600 hover:bg-indigo-50 active:scale-95 dark:text-indigo-400 dark:hover:bg-indigo-950/30 rounded-xl transition-all"
            title="ইউজার তথ্য এডিট করুন"
          >
            <Edit3 size={15} />
          </button>
          {user.username !== 'admin' && (
            <button
              onClick={() => handleDeleteUser(user)}
              className="p-2 text-rose-600 hover:bg-rose-50 active:scale-95 dark:text-rose-400 dark:hover:bg-rose-950/30 rounded-xl transition-all"
              title="ইউজার ডিলিট করুন"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>
    );
  };

  // Fetch initial profile
  useEffect(() => {
    async function getProfile() {
      try {
        const res = await fetch('/api/auth');
        const data = await res.json();
        if (res.ok && data.authenticated) {
          setCurrentUser(data.user);
          setProfileName(data.user.name);
          setProfileMobile(data.user.mobile || '');
        }
      } catch (err) {
        console.error('Profile fetch error:', err);
      }
    }
    getProfile();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersRes, cellsRes, empsRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/cells'),
        fetch('/api/employees')
      ]);

      if (usersRes.ok && cellsRes.ok && empsRes.ok) {
        const usersData = await usersRes.json();
        const cellsData = await cellsRes.json();
        const empsData = await empsRes.json();
        setUsers(usersData);
        setCells(cellsData);
        setEmployees(empsData);
      } else {
        setError('ডাটা লোড করতে ব্যর্থ হয়েছে।');
      }
    } catch (err) {
      console.error(err);
      setError('সার্ভার ত্রুটি ঘটেছে।');
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      setLoadingLogs(true);
      const res = await fetch('/api/audit-logs');
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data);
      }
    } catch (err) {
      console.error('Logs fetch error:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (currentUser && currentUser.role === 'ADMIN') {
      if (activeSettingsTab === 'users') {
        loadData();
      } else if (activeSettingsTab === 'logs') {
        fetchAuditLogs();
      }
    }
  }, [currentUser, activeSettingsTab]);

  const handleOpenCreateModal = () => {
    setEditingUser(null);
    setName('');
    setUsername('');
    setPassword('123456');
    setMobile('');
    setRole('USER');
    setSelectedCellIds([]);
    setError('');
    setSuccess('');
    setIsModalOpen(true);
  };

  // Auto-fetch employee details by bankId (username)
  useEffect(() => {
    if (!editingUser && username.trim() !== '') {
      const match = employees.find(
        (emp) => (emp.bankId || '').trim().toLowerCase() === username.trim().toLowerCase()
      );
      if (match) {
        setName(match.name);
        setSelectedCellIds([match.cellId]);
        setPassword('123456');
      }
    }
  }, [username, editingUser, employees]);

  const handleOpenEditModal = (user: User) => {
    setEditingUser(user);
    setName(user.name);
    setUsername(user.username);
    setPassword(''); // leave blank if keeping same
    setMobile(user.mobile || '');
    setRole(user.role);
    setSelectedCellIds(user.cells.map(c => c.id));
    setError('');
    setSuccess('');
    setIsModalOpen(true);
  };

  const handleCellToggle = (cellId: number) => {
    if (selectedCellIds.includes(cellId)) {
      setSelectedCellIds(selectedCellIds.filter(id => id !== cellId));
    } else {
      setSelectedCellIds([...selectedCellIds, cellId]);
    }
  };

  const handleSelectAllCells = () => {
    if (selectedCellIds.length === cells.length) {
      setSelectedCellIds([]);
    } else {
      setSelectedCellIds(cells.map(c => c.id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim()) {
      setError('দয়া করে ইউজারের নাম প্রদান করুন।');
      return;
    }

    if (!editingUser) {
      // Create user validations
      if (!username.trim()) {
        setError('দয়া করে একটি ইউজারনেম প্রদান করুন।');
        return;
      }
      if (!password || password.length < 4) {
        setError('পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে।');
        return;
      }
    }

    const payload = {
      name: name.trim(),
      username: username.trim(),
      password: password ? password.trim() : undefined,
      role,
      cellIds: selectedCellIds,
      mobile: mobile.trim()
    };

    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
      const method = editingUser ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(editingUser ? 'ইউজার সফলভাবে আপডেট হয়েছে!' : 'ইউজার সফলভাবে তৈরি হয়েছে!');
        setIsModalOpen(false);
        loadData();
      } else {
        setError(data.message || 'ইউজার সংরক্ষণ করতে সমস্যা হয়েছে।');
      }
    } catch (err) {
      setError('সার্ভারে যোগাযোগ করতে ব্যর্থ হয়েছে।');
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (user.username === 'admin') {
      alert('সিস্টেম সুপার এডমিনকে মুছে ফেলা যাবে না!');
      return;
    }

    if (currentUser && currentUser.id === user.id) {
      alert('আপনি বর্তমানে লগইনকৃত ইউজার অ্যাকাউন্টটি মুছে ফেলতে পারবেন না!');
      return;
    }

    if (!confirm(`আপনি কি নিশ্চিতভাবে ইউজার "${user.name}" মুছে ফেলতে চান?`)) return;

    try {
      const res = await fetch(`/api/users/${user.id}`, { method: 'DELETE' });
      if (res.ok) {
        setSuccess('ইউজার সফলভাবে মুছে ফেলা হয়েছে।');
        loadData();
      } else {
        const data = await res.json();
        setError(data.message || 'ইউজার মুছতে ব্যর্থ হয়েছে।');
      }
    } catch (err) {
      setError('সার্ভারে যোগাযোগ করতে ব্যর্থ হয়েছে।');
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    if (!profileName.trim()) {
      setProfileError('নাম পূরণ করা আবশ্যক।');
      return;
    }
    if (newPassword && newPassword.length < 4) {
      setProfileError('পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে।');
      return;
    }
    if (newPassword !== confirmPassword) {
      setProfileError('পাসওয়ার্ড দুটি মেলেনি!');
      return;
    }

    setUpdatingProfile(true);
    try {
      const res = await fetch(`/api/users/${currentUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profileName.trim(),
          password: newPassword ? newPassword.trim() : undefined,
          mobile: profileMobile.trim()
        })
      });
      const data = await res.json();
      if (res.ok) {
        setProfileSuccess('আপনার প্রোফাইল তথ্য ও পাসওয়ার্ড সফলভাবে আপডেট হয়েছে!');
        setNewPassword('');
        setConfirmPassword('');
        const updatedUser = { ...currentUser, name: profileName.trim(), mobile: profileMobile.trim() };
        setCurrentUser(updatedUser);
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        window.dispatchEvent(new Event('user-profile-updated'));
      } else {
        setProfileError(data.message || 'আপডেট করতে ব্যর্থ হয়েছে।');
      }
    } catch (err) {
      setProfileError('সার্ভারে যোগাযোগ করতে ব্যর্থ হয়েছে।');
    } finally {
      setUpdatingProfile(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-3 font-sans">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500 font-bold">সেটিংস লোড হচ্ছে...</p>
      </div>
    );
  }

  const effectiveTab = currentUser.role === 'ADMIN' ? activeSettingsTab : 'profile';

  // Filter logs based on search query
  const filteredLogs = auditLogs.filter(log => {
    const q = logSearchQuery.toLowerCase();
    return (
      (log.username || '').toLowerCase().includes(q) ||
      (log.action || '').toLowerCase().includes(q) ||
      (log.details || '').toLowerCase().includes(q) ||
      (log.ipAddress || '').toLowerCase().includes(q) ||
      (log.macAddress || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="app-page-title text-slate-800 dark:text-slate-100 font-sans tracking-wide">সিস্টেম সেটিংস</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">আপনার প্রোফাইল পাসওয়ার্ড পরিবর্তন এবং ইউজার পারমিশন সমূহ নিয়ন্ত্রণ করুন।</p>
        </div>
      </div>

      {/* Tabs list */}
      {currentUser.role === 'ADMIN' && (
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 mb-6 no-print">
          <button
            onClick={() => setActiveSettingsTab('profile')}
            className={`px-5 py-2.5 font-sans font-bold text-xs transition-all border-b-2 -mb-[2px] ${effectiveTab === 'profile' ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 font-extrabold' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-250'}`}
          >
            আমার প্রোফাইল ও পাসওয়ার্ড
          </button>
          <button
            onClick={() => setActiveSettingsTab('users')}
            className={`px-5 py-2.5 font-sans font-bold text-xs transition-all border-b-2 -mb-[2px] ${effectiveTab === 'users' ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 font-extrabold' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-250'}`}
          >
            ইউজার পারমিশন ম্যানেজমেন্ট
          </button>
          <button
            onClick={() => setActiveSettingsTab('logs')}
            className={`px-5 py-2.5 font-sans font-bold text-xs transition-all border-b-2 -mb-[2px] ${effectiveTab === 'logs' ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 font-extrabold' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-250'}`}
          >
            সিস্টেম অ্যাক্টিভিটি লগ
          </button>
        </div>
      )}

      {/* PROFILE TAB */}
      {effectiveTab === 'profile' && (
        <div className="max-w-2xl mx-auto glass-card p-8 rounded-[24px] border border-slate-200/50 dark:border-slate-800 shadow-xl space-y-6">
          <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-extrabold text-lg flex items-center justify-center shadow-lg">
              {extractNickname(currentUser.name)}
            </div>
            <div>
              <h3 className="font-extrabold text-slate-850 dark:text-slate-100 text-lg">{currentUser.name}</h3>
              <p className="text-xs text-slate-400 dark:text-slate-550 mt-0.5">ব্যাংক আইডি: @{currentUser.username} | রোল: {currentUser.role === 'ADMIN' ? 'সিস্টেম সুপার এডমিন' : 'সাধারণ ইউজার'}</p>
            </div>
          </div>

          {profileSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-xl animate-shake">
              {profileSuccess}
            </div>
          )}

          {profileError && (
            <div className="p-4 bg-rose-50 border border-rose-250 text-rose-700 text-xs font-bold rounded-xl animate-shake">
              {profileError}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-5 font-sans">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">আমার নাম</label>
              <input
                type="text"
                required
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">মোবাইল নম্বর</label>
              <input
                type="text"
                placeholder="যেমন: ০১৭XXXXXXXX"
                value={profileMobile}
                onChange={(e) => setProfileMobile(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ব্যাংক আইডি (অপরিবর্তনযোগ্য)</label>
                <input
                  type="text"
                  disabled
                  value={currentUser.username}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/60 text-xs text-slate-500 cursor-not-allowed"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">সিস্টেম রোল (অপরিবর্তনযোগ্য)</label>
                <input
                  type="text"
                  disabled
                  value={currentUser.role === 'ADMIN' ? 'সুপার এডমিন (ADMIN)' : 'সাধারণ ইউজার (USER)'}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/60 text-xs text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            {((currentUser.cells && currentUser.cells.length > 0) || currentUser.role === 'USER') && (
              <div className="p-4 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800/60 rounded-xl space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase">আমার প্রবেশাধিকার প্রাপ্ত সেলসমূহ:</span>
                <div className="flex flex-wrap gap-1.5">
                  {currentUser.cells && currentUser.cells.length > 0 ? (
                    currentUser.cells.map((c: any) => (
                      <span key={c.id} className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-650 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30 text-[10px] font-bold rounded-lg font-mono">
                        {c.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-amber-600 font-semibold italic">⚠️ কোনো সেলে অ্যাসাইন করা নেই</span>
                  )}
                </div>
              </div>
            )}

            <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 space-y-4">
              <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-xs flex items-center gap-1.5">
                <Key size={14} className="text-indigo-600" />
                পাসওয়ার্ড পরিবর্তন (খালি রাখলে আগের পাসওয়ার্ড বহাল থাকবে)
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-indigo-650 dark:text-indigo-400 uppercase">নতুন পাসওয়ার্ড</label>
                  <input
                    type="password"
                    placeholder="কমপক্ষে ৪ অক্ষরের পাসওয়ার্ড"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-indigo-650 dark:text-indigo-400 uppercase">নতুন পাসওয়ার্ড নিশ্চিত করুন</label>
                  <input
                    type="password"
                    placeholder="পুনরায় পাসওয়ার্ডটি দিন"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={updatingProfile}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-xs font-bold transition-all duration-200 shadow-md shadow-indigo-150/50 dark:shadow-none active:scale-95 disabled:opacity-50"
              >
                {updatingProfile ? 'সংরক্ষণ হচ্ছে...' : 'সেটিংস সংরক্ষণ করুন'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* USER MANAGEMENT TAB */}
      {effectiveTab === 'users' && (
        <>
          <div className="flex justify-between items-center no-print">
            <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 font-sans">ইউজার ও সেল পারমিশন</h3>
            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-xs font-bold transition-all duration-200 shadow-md shadow-indigo-100/50 dark:shadow-none flex items-center gap-2 group active:scale-95"
            >
              <UserPlus size={15} className="group-hover:scale-110 transition-transform" />
              নতুন ইউজার তৈরি
            </button>
          </div>

          {success && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-2xl animate-shake no-print">
              {success}
            </div>
          )}

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-250 text-rose-700 text-xs font-bold rounded-2xl animate-shake no-print">
              {error}
            </div>
          )}

          {/* Users List Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-48 bg-slate-200 dark:bg-slate-800/40 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-10 font-sans">
              
              {/* Admin Group */}
              {users.filter(u => u.role === 'ADMIN').length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/20 dark:bg-rose-950/5 shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 flex items-center justify-center text-rose-500">
                        <Shield size={16} />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm tracking-wide">সিস্টেম এডমিনিস্ট্রেটরবৃন্দ (System Administrators)</h3>
                        <p className="text-[10px] text-slate-400 dark:text-slate-550 font-bold mt-0.5">সব সেলের দায়িত্বপ্রাপ্ত সুপার ইউজারবৃন্দ</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-455">
                      {toBanglaDigits(users.filter(u => u.role === 'ADMIN').length)} জন ইউজার
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sortUsersByBankId(users.filter(u => u.role === 'ADMIN')).map(user => renderUserCard(user, 3))}
                  </div>
                </div>
              )}

              {/* Cell Groups */}
              {cells.map(cell => {
                const cellUsers = users.filter(u => u.cells.some(c => c.id === cell.id));
                if (cellUsers.length === 0) return null;
                const sortedCellUsers = sortUsersByBankId(cellUsers);
                const cellPal = getPalette(cell.id);

                return (
                  <div key={cell.id} className="space-y-4">
                    <div className={`flex items-center justify-between p-4 rounded-2xl ${cellPal.border} ${cellPal.bg} shadow-xs`}>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 flex items-center justify-center text-slate-700 dark:text-slate-350">
                          <Building2 size={16} />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-slate-855 dark:text-slate-100 text-sm tracking-wide">{cell.name} সেল ইউজারবৃন্দ</h3>
                          <p className="text-[10px] text-slate-400 dark:text-slate-555 font-bold mt-0.5">শুধুমাত্র {cell.name} সেলের দায়িত্বপ্রাপ্ত ইউজারবৃন্দ</p>
                        </div>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${cellPal.badge}`}>
                        {toBanglaDigits(sortedCellUsers.length)} জন ইউজার
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {sortedCellUsers.map(user => renderUserCard(user, cell.id))}
                    </div>
                  </div>
                );
              })}

              {/* Standard Users without Cells */}
              {users.filter(u => u.role === 'USER' && u.cells.length === 0).length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/20 dark:bg-amber-950/5 shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 flex items-center justify-center text-amber-500">
                        <AlertCircle size={16} />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm tracking-wide">সেলের দায়িত্বহীন ইউজারবৃন্দ (Unassigned Users)</h3>
                        <p className="text-[10px] text-slate-400 dark:text-slate-550 font-bold mt-0.5">বর্তমানে কোনো সেলের দায়িত্ব নেই</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-455">
                      {toBanglaDigits(users.filter(u => u.role === 'USER' && u.cells.length === 0).length)} জন ইউজার
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sortUsersByBankId(users.filter(u => u.role === 'USER' && u.cells.length === 0)).map(user => renderUserCard(user, 2))}
                  </div>
                </div>
              )}

            </div>
          )}
        </>
      )}

      {/* SYSTEM ACTIVITY LOGS TAB */}
      {effectiveTab === 'logs' && (
        <div className="space-y-6 font-sans">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print bg-slate-50 dark:bg-slate-950/20 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-extrabold text-slate-850 dark:text-slate-250">সিস্টেম অ্যাক্টিভিটি লগ</h3>
              <p className="text-[10px] font-bold text-slate-450 dark:text-slate-500 mt-0.5">লগইন, এন্ট্রি, এডিট ও ডিলিটসহ সকল সিস্টেম কার্যক্রমের অডিট ট্রেইল</p>
            </div>
            
            <div className="w-full md:w-64">
              <input
                type="text"
                placeholder="লগ অনুসন্ধান করুন..."
                value={logSearchQuery}
                onChange={(e) => setLogSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-white dark:bg-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {loadingLogs ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-2">
              <div className="w-10 h-10 border-4 border-indigo-650 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-bold text-slate-500 font-sans">লগ ডাটা লোড হচ্ছে...</p>
            </div>
          ) : filteredLogs.length > 0 ? (
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm bg-white dark:bg-slate-900">
              <div className="overflow-x-auto max-h-[60vh] no-scrollbar">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950/40 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide border-b border-slate-100 dark:border-slate-850">
                      <th className="px-5 py-3">সময়</th>
                      <th className="px-4 py-3">ব্যবহারকারী</th>
                      <th className="px-4 py-3">কার্যক্রম</th>
                      <th className="px-5 py-3">বিস্তারিত বিবরণ</th>
                      <th className="px-4 py-3">আইপি এড্রেস</th>
                      <th className="px-4 py-3">ম্যাক এড্রেস</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-sans">
                    {filteredLogs.map((log: any) => {
                      const dateObj = new Date(log.createdAt);
                      const formattedTime = dateObj.toLocaleDateString('bn-BD', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) + ' ' + dateObj.toLocaleTimeString('bn-BD', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      });

                      const actionColors: Record<string, string> = {
                        'LOGIN': 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-100/50 dark:border-blue-900/30',
                        'CREATE': 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-900/30',
                        'UPDATE': 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-455 border border-amber-100/50 dark:border-amber-900/30',
                        'DELETE': 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-455 border border-rose-100/50 dark:border-rose-900/30',
                        'CHANGE_PASSWORD': 'bg-purple-50 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400 border border-purple-100/50 dark:border-purple-900/30'
                      };

                      return (
                        <tr key={log.id} className="hover:bg-slate-50/55 dark:hover:bg-slate-950/10 transition-colors">
                          <td className="px-5 py-3.5 whitespace-nowrap text-slate-400 dark:text-slate-550 font-medium">
                            {formattedTime}
                          </td>
                          <td className="px-4 py-3.5 font-bold text-slate-800 dark:text-slate-300">
                            @{log.username}
                          </td>
                          <td className="px-4 py-3.5">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${actionColors[log.action] || 'bg-slate-50 text-slate-650'}`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-slate-650 dark:text-slate-350 max-w-md font-medium">
                            {log.details}
                          </td>
                          <td className="px-4 py-3.5 font-mono text-slate-500 dark:text-slate-450 font-semibold">
                            {log.ipAddress || '---'}
                          </td>
                          <td className="px-4 py-3.5 font-mono text-slate-500 dark:text-slate-450 font-semibold">
                            {log.macAddress || '---'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900">
              <p className="text-slate-450 dark:text-slate-500 text-xs font-bold font-sans">কোনো অ্যাক্টিভিটি লগ পাওয়া যায়নি।</p>
            </div>
          )}
        </div>
      )}

      {/* RENDER POPUP EDIT/CREATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 no-print">
          <div className="w-full max-w-[500px] bg-white dark:bg-slate-900 rounded-[28px] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden relative animate-float">
            
            {/* Modal Header */}
            <div className="px-6 py-5 bg-slate-50 dark:bg-slate-950/20 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck size={18} className="text-indigo-600" />
                <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-base font-sans">
                  {editingUser ? 'ইউজার তথ্য পরিবর্তন' : 'নতুন ইউজার তৈরি করুন'}
                </h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-2xl leading-none font-sans"
              >
                &times;
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto no-scrollbar">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-2 animate-shake">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* 1. Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#1976D2] uppercase tracking-[0.08em]">ইউজারের পূর্ণ নাম *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: জনাব সৈয়দ ইমন"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              {/* Mobile */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#1976D2] uppercase tracking-[0.08em]">মোবাইল নম্বর</label>
                <input
                  type="text"
                  placeholder="যেমন: ০১৭XXXXXXXX"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              {/* 2. Username */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#1976D2] uppercase tracking-[0.08em]">ইউজারনেম (ব্যাংক আইডি) *</label>
                <input
                  type="text"
                  required
                  disabled={!!editingUser}
                  placeholder="যেমন: 026799 (ব্যাংক আইডি)"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  className={`w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs focus:outline-none focus:border-indigo-500 ${editingUser ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-slate-50/50 dark:bg-slate-950/20 text-slate-800 dark:text-slate-200'}`}
                />
              </div>

              {/* 3. Password */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-[#1976D2] uppercase tracking-[0.08em]">
                    {editingUser ? 'নতুন পাসওয়ার্ড (ঐচ্ছিক)' : 'পাসওয়ার্ড *'}
                  </label>
                  {editingUser && (
                    <span className="text-[9px] text-slate-400 font-semibold italic flex items-center gap-0.5">
                      <Key size={10} /> পাসওয়ার্ড পরিবর্তন না করতে চাইলে খালি রাখুন
                    </span>
                  )}
                </div>
                <input
                  type="password"
                  placeholder="কমপক্ষে ৪ অক্ষরের পাসওয়ার্ড দিন"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              {/* 4. Role */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#1976D2] uppercase tracking-[0.08em]">সিস্টেম রোল (Role)</label>
                <select
                  value={role}
                  disabled={editingUser?.username === 'admin'}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-855 rounded-xl text-xs font-semibold focus:outline-none"
                >
                  <option value="USER">USER (সাধারণ ইউজার)</option>
                  <option value="ADMIN">ADMIN (সিস্টেম সুপার এডমিন)</option>
                </select>
              </div>

              {/* 5. Cell Assignments (For all users/roles) */}
              {(role === 'USER' || role === 'ADMIN') && (
                <div className="space-y-2 pt-2 border-t border-dashed border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-[#1976D2] uppercase tracking-[0.08em]">
                      {name ? `${name} সেল সিলেক্ট করুন *` : 'দায়িত্বপ্রাপ্ত সেলসমূহ নির্বাচন করুন *'}
                    </label>
                    <button
                      type="button"
                      onClick={handleSelectAllCells}
                      className="text-[10px] font-bold text-indigo-650 dark:text-indigo-400 hover:underline"
                    >
                      {selectedCellIds.length === cells.length ? 'সব আনসিলেক্ট করুন' : 'সব সিলেক্ট করুন'}
                    </button>
                  </div>

                  {cells.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3 max-h-36 overflow-y-auto pr-1 no-scrollbar pt-1">
                      {cells.map(cell => {
                        const isChecked = selectedCellIds.includes(cell.id);
                        return (
                          <div 
                            key={cell.id}
                            onClick={() => handleCellToggle(cell.id)}
                            className={`p-3 rounded-xl border-2 cursor-pointer flex items-center justify-between transition-all duration-200 active:scale-[0.98] ${isChecked ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'bg-slate-50/50 dark:bg-slate-950/10 border-slate-200/70 dark:border-slate-855 text-slate-700 dark:text-slate-330 hover:border-slate-300'}`}
                          >
                            <div className="space-y-0.5 text-left leading-none">
                              <span className="font-extrabold text-xs font-mono">{cell.name}</span>
                              {cell.description && (
                                <p className="text-[9px] font-medium text-slate-400 dark:text-slate-555 mt-0.5 line-clamp-1">
                                  {cell.description}
                                </p>
                              )}
                            </div>
                            {isChecked ? (
                              <CheckSquare size={16} className="text-indigo-600 dark:text-indigo-400" />
                            ) : (
                              <Square size={16} className="text-slate-400" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-amber-500 italic">সিস্টেমে কোনো সেল খুঁজে পাওয়া যায়নি! প্রথমে কর্মকর্তা পেজে গিয়ে সেল তৈরি করুন।</p>
                  )}
                </div>
              )}

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 dark:border-slate-800 dark:hover:bg-slate-800 text-xs font-bold rounded-xl active:scale-95 transition-all"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-indigo-100 dark:shadow-none"
                >
                  {editingUser ? 'আপডেট করুন' : 'ইউজার তৈরি করুন'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          USER DETAILS PROFILE MODAL
      ---------------------------------------------------- */}
      {profileUser && (() => {
        const emp = employees.find(
          (e) => e.bankId && e.bankId.trim().toLowerCase() === profileUser.username.trim().toLowerCase()
        );
        return (
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-sans"
            onClick={() => setProfileUser(null)}
          >
            <div 
              className="bg-white dark:bg-slate-900 rounded-[28px] w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl animate-scale-up"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Cover Image */}
              <div className="h-28 bg-gradient-to-r from-indigo-500 to-violet-600 relative flex items-end justify-center">
                <div className="absolute -bottom-10 px-3 h-20 min-w-20 rounded-full border-4 border-white dark:border-slate-900 bg-indigo-100 flex items-center justify-center text-indigo-650 text-sm font-extrabold shadow-md">
                  {extractNickname(profileUser.name)}
                </div>
              </div>

              {/* Profile Info Details */}
              <div className="pt-14 pb-8 px-6 text-center space-y-6">
                <div>
                  <h4 className="font-extrabold text-slate-850 dark:text-slate-50 text-lg leading-tight">{profileUser.name}</h4>
                  <p className="text-xs font-semibold text-slate-450 dark:text-slate-500 mt-1">@{profileUser.username}</p>
                </div>

                {/* Grid of Attributes */}
                <div className="grid grid-cols-2 gap-3 text-left">
                  <div className="p-3 bg-slate-50/70 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-855 rounded-xl space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">ইউজার রোল</span>
                    <p className="text-xs font-bold text-slate-850 dark:text-slate-200">
                      {profileUser.role === 'ADMIN' ? 'সুপার এডমিন' : 'সাধারণ ইউজার'}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50/70 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-855 rounded-xl space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">ব্যাংক আইডি</span>
                    <p className="text-xs font-bold text-slate-850 dark:text-slate-200">{profileUser.username}</p>
                  </div>

                  {emp && (
                    <>
                      <div className="p-3 bg-slate-50/70 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-855 rounded-xl space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">পদবী</span>
                        <p className="text-xs font-bold text-slate-850 dark:text-slate-200">{emp.designation}</p>
                      </div>
                      <div className="p-3 bg-slate-50/70 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-855 rounded-xl space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">ব্যক্তিগত নথি নং</span>
                        <p className="text-xs font-bold text-slate-850 dark:text-slate-200">{emp.fileNo || 'নেই'}</p>
                      </div>
                      <div className="p-3 bg-slate-50/70 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-855 rounded-xl space-y-1.5 col-span-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">সেল</span>
                        <p className="text-xs font-bold text-slate-850 dark:text-slate-200">{emp.cell?.name || 'নেই'}</p>
                      </div>
                    </>
                  )}

                  <div className="p-3 bg-slate-50/70 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-855 rounded-xl space-y-1.5 col-span-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">মোবাইল নম্বর</span>
                    <p className="text-xs font-bold text-slate-850 dark:text-slate-200">{profileUser.mobile || 'যুক্ত করা হয়নি'}</p>
                  </div>

                  <div className="p-3 bg-slate-50/70 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-855 rounded-xl space-y-1.5 col-span-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">প্রবেশাধিকার প্রাপ্ত সেলসমূহ</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {profileUser.role === 'ADMIN' ? (
                        <span className="text-xs font-bold text-rose-600">সব সেল (সুপার এডমিন হিসেবে অ্যাক্সেস)</span>
                      ) : profileUser.cells.length > 0 ? (
                        profileUser.cells.map(c => (
                          <span 
                            key={c.id} 
                            className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100/50 dark:border-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-extrabold"
                          >
                            {c.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs font-bold text-amber-600">কোনো সেল অ্যাসাইন করা নেই</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Close Buttons */}
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => setProfileUser(null)}
                    className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer transition-colors"
                  >
                    বন্ধ করুন
                  </button>
                  <button
                    onClick={() => {
                      const u = profileUser;
                      setProfileUser(null);
                      handleOpenEditModal(u);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer transition-colors"
                  >
                    সম্পাদনা করুন
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
