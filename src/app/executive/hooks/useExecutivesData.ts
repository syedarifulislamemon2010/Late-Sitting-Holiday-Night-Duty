import { useState, useEffect } from 'react';
import logger from '@/lib/logger';
import { Executive, STRICT_DESIGNATIONS, desigPriority } from '../types';

export function useExecutivesData() {
  const [executives, setExecutives] = useState<Executive[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterDesignation, setFilterDesignation] = useState('ALL');
  const [filterPhoneStatus, setFilterPhoneStatus] = useState('ALL');
  const [filterBankIdStatus, setFilterBankIdStatus] = useState('ALL');
  const [filterFileNoStatus, setFilterFileNoStatus] = useState('ALL');
  
  // Printing states
  const [generating, setGenerating] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [iframeUrl, setIframeUrl] = useState('');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExec, setEditingExec] = useState<Executive | null>(null);
  const [profileExec, setProfileExec] = useState<Executive | null>(null);
  const [execToDelete, setExecToDelete] = useState<Executive | null>(null);

  // Form states
  const [form, setForm] = useState({
    name: '',
    designation: STRICT_DESIGNATIONS[0],
    bankId: '',
    fileNo: ''
  });

  const [errorMessage, setErrorMessage] = useState('');

  // Bulk Import state
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkImporting, setBulkImporting] = useState(false);
  const [bulkError, setBulkError] = useState('');

  // Image paste parsing states
  const [isImageImportLoading, setIsImageImportLoading] = useState(false);
  const [customApiKey] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('ai_api_key') || '';
    }
    return '';
  });

  // Fetch initial data
  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch('/api/executives');
      const data = await res.json();
      const rawList = Array.isArray(data) ? data : [];
      // Filter out GMs strictly, leaving only DGMs and AGMs
      const filteredExecs = rawList.filter(e => {
        const d = e.designation.trim();
        return (
          d.includes('উপ-মহাব্যবস্থাপক') || 
          d.includes('সহকারী মহাব্যবস্থাপক') || 
          d.includes('ডিজিএম') || 
          d.includes('এজিএম') || 
          d.toLowerCase().includes('dgm') || 
          d.toLowerCase().includes('agm')
        ) && !(
          d.includes('মহাব্যবস্থাপক') && 
          !d.includes('উপ-') && 
          !d.includes('সহকারী')
        );
      });
      setExecutives(filteredExecs);
    } catch (err) {
      logger.error('Error loading executives:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Handle Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!form.name.trim() || !form.designation.trim()) {
      setErrorMessage('নাম এবং পদবী অবশ্যই পূরণ করতে হবে।');
      return;
    }

    try {
      const url = editingExec ? `/api/executives/${editingExec.id}` : '/api/executives';
      const method = editingExec ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          designation: form.designation.trim(),
          bankId: form.bankId.trim() || null,
          fileNo: form.fileNo.trim() || null
        })
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save executive');
      }

      setIsModalOpen(false);
      setEditingExec(null);
      setForm({ name: '', designation: STRICT_DESIGNATIONS[0], bankId: '', fileNo: '' });
      loadData();
    } catch (err) {
      logger.error(err);
      setErrorMessage('সার্ভার সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।');
    }
  };

  // Delete Executive
  const deleteExec = (exec: Executive) => {
    setExecToDelete(exec);
  };

  const confirmDeleteExec = async () => {
    if (!execToDelete) return;
    try {
      const res = await fetch(`/api/executives/${execToDelete.id}`, { method: 'DELETE' });
      if (res.ok) loadData();
    } catch (err) {
      logger.error('Error deleting executive:', err);
    } finally {
      setExecToDelete(null);
    }
  };

  const generateEmployeeList = async (): Promise<string | null> => {
    setGenerating(true);
    setErrorMessage('');
    try {
      const res = await fetch('/api/documents/generate-employee-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cellFilter: 'executives' })
      });
      const data = await res.json();
      if (res.ok && data.success && data.filePath) {
        return data.filePath;
      } else {
        setErrorMessage(data.message || 'নির্বাহী তালিকা প্রস্তুত করতে ব্যর্থ হয়েছে।');
        return null;
      }
    } catch (err) {
      logger.error('Error generating employee list:', err);
      setErrorMessage('সার্ভারে যোগাযোগ করতে ব্যর্থ হয়েছে।');
      return null;
    } finally {
      setGenerating(false);
    }
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBulkError('');
    
    if (!bulkText.trim()) {
      setBulkError('অনুগ্রহ করে কর্মকর্তাদের নামের টেক্সট পেস্ট করুন।');
      return;
    }
    
    // Parse lines
    const rawLines = bulkText.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (rawLines.length === 0) {
      setBulkError('কোনো কর্মকর্তা তথ্য পাওয়া যায়নি। সঠিক ফরম্যাটে লিখুন।');
      return;
    }

    // Detect if first line is a header
    const testLine = rawLines[0];
    const testParts: string[] = [];
    let currentField = '';
    let inQuotes = false;
    for (let i = 0; i < testLine.length; i++) {
      const char = testLine[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        testParts.push(currentField.trim());
        currentField = '';
      } else {
        currentField += char;
      }
    }
    testParts.push(currentField.trim());

    const cleanedFirstRow = testParts.map(p => {
      let s = p;
      if (s.startsWith('"') && s.endsWith('"')) s = s.substring(1, s.length - 1);
      if (s.startsWith("'") && s.endsWith("'")) s = s.substring(1, s.length - 1);
      return s.trim().toLowerCase();
    });

    const isHeader = cleanedFirstRow.some(h => 
      h.includes('নাম') || h.includes('name') || 
      h.includes('পদব') || h.includes('designation') || 
      h.includes('ব্যাংক') || h.includes('bank') || 
      h.includes('নথি') || h.includes('file')
    );

    const dataLines = isHeader ? rawLines.slice(1) : rawLines;

    const parsed = dataLines.map(line => {
      let name = '';
      let designation = '';
      let bankId = '';
      let fileNo = '';
      let matched = false;

      // Helper function to clean quotes from start and end
      const cleanQuotes = (str: string): string => {
        let clean = str.trim();
        while ((clean.startsWith('"') && clean.endsWith('"')) || (clean.startsWith("'") && clean.endsWith("'"))) {
          clean = clean.substring(1, clean.length - 1).trim();
        }
        if (clean.startsWith('"')) clean = clean.substring(1).trim();
        if (clean.endsWith('"')) clean = clean.substring(0, clean.length - 1).trim();
        if (clean.startsWith("'")) clean = clean.substring(1).trim();
        if (clean.endsWith("'")) clean = clean.substring(0, clean.length - 1).trim();
        return clean;
      };

      // 1. Try parsing as CSV first (automatically strips surrounding double quotes)
      const csvParts: string[] = [];
      let currentCsvField = '';
      let inCsvQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inCsvQuotes = !inCsvQuotes;
        } else if (char === ',' && !inCsvQuotes) {
          csvParts.push(currentCsvField.trim());
          currentCsvField = '';
        } else {
          currentCsvField += char;
        }
      }
      csvParts.push(currentCsvField.trim());

      if (csvParts.length >= 2 && line.includes(',')) {
        name = cleanQuotes(csvParts[0]);
        designation = cleanQuotes(csvParts[1]);
        bankId = cleanQuotes(csvParts[2] || '');
        fileNo = cleanQuotes(csvParts[3] || '');
        matched = true;
      }

      // 2. Try splitting by tab, pipe, comma first as they are highly unambiguous
      if (!matched) {
        const primarySeps = ['\t', ' | ', '|', ' , ', ','];
        for (const sep of primarySeps) {
          if (line.includes(sep)) {
            const parts = line.split(sep);
            if (parts.length >= 2) {
              name = cleanQuotes(parts[0]);
              designation = cleanQuotes(parts.slice(1).join(sep));
              if (parts.length >= 4) {
                bankId = cleanQuotes(parts[2] || '');
                fileNo = cleanQuotes(parts[3] || '');
              } else if (parts.length === 3) {
                bankId = cleanQuotes(parts[2] || '');
              }
              matched = true;
              break;
            }
          }
        }
      }

      // 3. Check for space-wrapped hyphens ' - '
      if (!matched && line.includes(' - ')) {
        const parts = line.split(' - ');
        if (parts.length >= 2) {
          name = cleanQuotes(parts[0]);
          designation = cleanQuotes(parts.slice(1).join(' - '));
          matched = true;
        }
      }

      // 4. Check for bare hyphen '-' (respecting compound words like DGM)
      if (!matched && line.includes('-')) {
        let splitIndex = -1;
        let currentPos = 0;
        while (true) {
          const idx = line.indexOf('-', currentPos);
          if (idx === -1) break;

          const leftContext = line.substring(0, idx).trim();
          const rightContext = line.substring(idx + 1).trim();

          const isInternalHyphen = 
            leftContext.endsWith('উপ') || 
            leftContext.endsWith('সহকারী') || 
            leftContext.endsWith('অফিসার') || 
            leftContext.endsWith('এসো') ||
            leftContext.endsWith('এসো-আইটি') ||
            leftContext.endsWith('এসও') ||
            leftContext.endsWith('এজিএম') ||
            leftContext.endsWith('ডিজিএম') ||
            leftContext.endsWith('জিএম') ||
            rightContext.startsWith('মহাব্যবস্থাপক') ||
            rightContext.startsWith('আইটি');

          if (!isInternalHyphen) {
            splitIndex = idx;
            break;
          }
          currentPos = idx + 1;
        }

        if (splitIndex !== -1) {
          name = cleanQuotes(line.substring(0, splitIndex));
          designation = cleanQuotes(line.substring(splitIndex + 1));
          matched = true;
        }
      }

      if (!matched) {
        name = cleanQuotes(line);
        designation = ''; // default fallback
      }
      
      const mapDesignation = (rawDesig: string): string => {
        const clean = rawDesig.toLowerCase();
        if (clean.includes('উপ') || clean.includes('dgm') || clean.includes('ডিজিএম')) {
          return STRICT_DESIGNATIONS[1]; // DGM
        }
        if (clean.includes('সহকারী') || clean.includes('agm') || clean.includes('এজিএম')) {
          return STRICT_DESIGNATIONS[2]; // AGM
        }
        if (clean.includes('মহাব্যবস্থাপক') || clean.includes('gm') || clean.includes('জিএম')) {
          return STRICT_DESIGNATIONS[0]; // GM
        }
        return STRICT_DESIGNATIONS[1]; // fallback: DGM
      };
      
      return {
        name: name,
        designation: mapDesignation(designation),
        phone: '',
        email: '',
        bankId: bankId ? bankId : null,
        fileNo: fileNo ? fileNo : null
      };
    });
      
    if (parsed.length === 0) {
      setBulkError('কোনো কর্মকর্তা তথ্য পাওয়া যায়নি। সঠিক ফরম্যাটে লিখুন।');
      return;
    }
    
    setBulkImporting(true);
    try {
      // SEQUENTIAL INSERTS to prevent Neon connection pool exhaustion
      for (const exec of parsed) {
        const res = await fetch('/api/executives', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(exec)
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || err.error || 'Failed to save bulk');
        }
      }
      
      setIsBulkModalOpen(false);
      setBulkText('');
      setBulkError('');
      loadData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'আমদানিতে কিছু সমস্যা হয়েছে। অনুগ্রহ করে ডেটা চেক করে পুনরায় চেষ্টা করুন।';
      setBulkError(msg);
    } finally {
      setBulkImporting(false);
    }
  };

  const parseImageAndPopulate = async (base64Data: string, fileType: string) => {
    setIsImageImportLoading(true);
    setBulkError('');
    
    try {
      const res = await fetch('/api/employees/parse-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileData: base64Data,
          fileType: fileType,
          customApiKey: customApiKey
        })
      });

      const data = await res.json();
      if (!okStatus(res.status)) {
        throw new Error(data.message || 'ইমেজ পার্স করতে ব্যর্থ হয়েছে।');
      }

      if (data.employees && Array.isArray(data.employees)) {
        const textLines = data.employees.map((emp: { name: string; designation: string }) => `${emp.name} - ${emp.designation}`).join('\n');
        setBulkText(prev => prev ? `${prev}\n${textLines}` : textLines);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'ছবি থেকে তথ্য বের করতে সমস্যা হয়েছে।';
      setBulkError(msg);
    } finally {
      setIsImageImportLoading(false);
    }
  };

  function okStatus(status: number) {
    return status >= 200 && status < 300;
  }

  const handleTextareaPaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) continue;

        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Data = reader.result as string;
          await parseImageAndPopulate(base64Data, file.type);
        };
        reader.readAsDataURL(file);
        break;
      }
    }
  };

  const exportExecutivesToCSV = () => {
    let csvContent = '\uFEFFনাম,পদবী,ব্যাংক আইডি,নথি নম্বর\n';
    filteredExecutives.forEach(exec => {
      const name = `"${exec.name.replace(/"/g, '""')}"`;
      const designation = `"${exec.designation.replace(/"/g, '""')}"`;
      const bankId = `"${(exec.bankId || '').replace(/"/g, '""')}"`;
      const fileNo = `"${(exec.fileNo || '').replace(/"/g, '""')}"`;
      csvContent += `${name},${designation},${bankId},${fileNo}\n`;
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `executives_list_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const startEditExec = (exec: Executive) => {
    setEditingExec(exec);
    setForm({
      name: exec.name,
      designation: STRICT_DESIGNATIONS.includes(exec.designation) ? exec.designation : STRICT_DESIGNATIONS[0],
      bankId: exec.bankId || '',
      fileNo: exec.fileNo || ''
    });
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const openNewExecModal = () => {
    setEditingExec(null);
    setForm({ name: '', designation: STRICT_DESIGNATIONS[0], bankId: '', fileNo: '' });
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const openBulkModal = () => {
    setBulkText('');
    setBulkError('');
    setIsBulkModalOpen(true);
  };

  const filteredExecutives = executives.filter(exec => {
    const matchesSearch = exec.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          exec.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (exec.bankId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (exec.fileNo || '').toLowerCase().includes(searchQuery.toLowerCase());
                          
    const matchesDesignation = filterDesignation === 'ALL' || exec.designation === filterDesignation;
    const matchesPhone = filterPhoneStatus === 'ALL' || 
      (filterPhoneStatus === 'has_phone' && exec.phone && exec.phone.trim().length > 0) ||
      (filterPhoneStatus === 'no_phone' && (!exec.phone || exec.phone.trim().length === 0));
    const matchesBankId = filterBankIdStatus === 'ALL' || 
      (filterBankIdStatus === 'has_bank_id' && exec.bankId && exec.bankId.trim().length > 0) ||
      (filterBankIdStatus === 'no_bank_id' && (!exec.bankId || exec.bankId.trim().length === 0));
    const matchesFileNo = filterFileNoStatus === 'ALL' || 
      (filterFileNoStatus === 'has_file_no' && exec.fileNo && exec.fileNo.trim().length > 0) ||
      (filterFileNoStatus === 'no_file_no' && (!exec.fileNo || exec.fileNo.trim().length === 0));

    return matchesSearch && matchesDesignation && matchesPhone && matchesBankId && matchesFileNo;
  }).sort((a, b) => {
    const prioA = desigPriority[a.designation] || 99;
    const prioB = desigPriority[b.designation] || 99;
    if (prioA !== prioB) {
      return prioA - prioB;
    }
    return (a.fileNo || '').localeCompare(b.fileNo || '', undefined, { numeric: true, sensitivity: 'base' });
  });

  return {
    executives,
    loading,
    searchQuery,
    setSearchQuery,
    showAdvancedFilters,
    setShowAdvancedFilters,
    filterDesignation,
    setFilterDesignation,
    filterPhoneStatus,
    setFilterPhoneStatus,
    filterBankIdStatus,
    setFilterBankIdStatus,
    filterFileNoStatus,
    setFilterFileNoStatus,
    generating,
    isPreviewOpen,
    setIsPreviewOpen,
    iframeUrl,
    setIframeUrl,
    isModalOpen,
    setIsModalOpen,
    editingExec,
    profileExec,
    setProfileExec,
    execToDelete,
    setExecToDelete,
    form,
    setForm,
    errorMessage,
    isBulkModalOpen,
    setIsBulkModalOpen,
    bulkText,
    setBulkText,
    bulkImporting,
    bulkError,
    isImageImportLoading,
    handleSubmit,
    deleteExec,
    confirmDeleteExec,
    generateEmployeeList,
    handleBulkSubmit,
    handleTextareaPaste,
    exportExecutivesToCSV,
    startEditExec,
    openNewExecModal,
    openBulkModal,
    filteredExecutives,
    loadData
  };
}
