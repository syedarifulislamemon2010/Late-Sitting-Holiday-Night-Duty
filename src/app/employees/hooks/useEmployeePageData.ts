'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import logger from '@/lib/logger';
import { UserProfile } from '@/context/ProfileContext';
import { Cell, Employee, Executive, BulkEmployeeInput } from '../types';

export const STRICT_DESIGNATIONS = [
  'সিনিয়র প্রিন্সিপাল অফিসার (এসপিও)',
  'প্রিন্সিপাল অফিসার (পিও)',
  'সিনিয়র অফিসার-আইটি (এসও-আইটি)',
  'অফিসার-আইটি (ও-আইটি)'
];

export function useEmployeePageData(currentUser: UserProfile | null | undefined) {
  const [activeTab, setActiveTab] = useState<'employees' | 'cells'>('employees');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [cells, setCells] = useState<Cell[]>([]);
  const [executives, setExecutives] = useState<Executive[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [cellFilter, setCellFilter] = useState('select');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterDesignation, setFilterDesignation] = useState('ALL');
  const [filterPhoneStatus, setFilterPhoneStatus] = useState('ALL');
  const [filterBankIdStatus, setFilterBankIdStatus] = useState('ALL');
  const [filterFileNoStatus, setFilterFileNoStatus] = useState('ALL');

  // Modals & previews
  const [isBulkCellModalOpen, setIsBulkCellModalOpen] = useState(false);
  const [bulkCellText, setBulkCellText] = useState('');
  const [bulkCellError, setBulkCellError] = useState('');
  const [bulkCellImporting, setBulkCellImporting] = useState(false);
  
  const [generating, setGenerating] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [iframeUrl, setIframeUrl] = useState('');

  const [isEmpModalOpen, setIsEmpModalOpen] = useState(false);
  const [isCellModalOpen, setIsCellModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [editingCell, setEditingCell] = useState<Cell | null>(null);
  const [profileEmp, setProfileEmp] = useState<Employee | null>(null);

  // Multi-selection
  const [selectedEmps, setSelectedEmps] = useState<number[]>([]);

  // Forms
  const [empForm, setEmpForm] = useState({
    name: '',
    nameEn: '',
    designation: STRICT_DESIGNATIONS[0],
    designationEn: '',
    bankId: '',
    fileNo: '',
    mobile: '',
    cellId: ''
  });

  const [cellForm, setCellForm] = useState({
    name: '',
    description: ''
  });

  const [errorMessage, setErrorMessage] = useState('');
  const [empToDelete, setEmpToDelete] = useState<Employee | null>(null);
  const [cellToDelete, setCellToDelete] = useState<Cell | null>(null);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);

  // Bulk Employee Import
  const [isBulkEmpModalOpen, setIsBulkEmpModalOpen] = useState(false);
  const [bulkEmpText, setBulkEmpText] = useState('');
  const [bulkEmpCellId, setBulkEmpCellId] = useState('');
  const [bulkImporting, setBulkImporting] = useState(false);
  const [bulkError, setBulkError] = useState('');
  const [isImageImportLoading, setIsImageImportLoading] = useState(false);

  const [customApiKey] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('ai_api_key') || '';
    }
    return '';
  });

  const isAdminOrAdminCell = useMemo(() => {
    if (!currentUser) return false;
    if (currentUser.role === 'ADMIN') return true;
    return currentUser.cells?.some((c: { name: string }) => c.name.toLowerCase().includes('admin') || c.name.includes('প্রশাসন')) || false;
  }, [currentUser]);

  const allowedCellIds = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'ADMIN') return cells.map(c => c.id);
    const ids = new Set<number>();
    if (currentUser.cells) {
      currentUser.cells.forEach((c: { id: number }) => ids.add(c.id));
    }
    const emp = employees.find(e => e.bankId?.trim() === currentUser.username?.trim());
    if (emp) {
      ids.add(emp.cellId);
    }
    return Array.from(ids);
  }, [currentUser, cells, employees]);

  const ownEmployee = useMemo(() => {
    return employees.find(emp => emp.bankId?.trim() === currentUser?.username?.trim());
  }, [employees, currentUser]);

  const ownCellId = ownEmployee ? ownEmployee.cellId : (currentUser?.cells?.[0]?.id || null);

  const selectableCells = useMemo(() => {
    if (cellFilter === 'select') return [];
    if (cellFilter === 'all') return cells;
    if (cellFilter === 'executives') return [];
    return cells.filter(cell => cell.id.toString() === cellFilter);
  }, [cellFilter, cells]);

  const formSelectableCells = useMemo(() => {
    if (!currentUser || currentUser.role === 'ADMIN') return cells;
    return cells.filter(cell => allowedCellIds.includes(cell.id));
  }, [currentUser, cells, allowedCellIds]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [empRes, cellRes, execRes] = await Promise.all([
        fetch('/api/employees?directory=true'),
        fetch('/api/cells'),
        fetch('/api/executives')
      ]);
      const empData = await empRes.json();
      const cellData = await cellRes.json();
      const execData = await execRes.json();
      
      setEmployees(Array.isArray(empData) ? empData : []);
      setCells(Array.isArray(cellData) ? cellData : []);

      const filteredExecs = (Array.isArray(execData) ? execData : []).filter(e => {
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
      logger.error('Error loading employee directory data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadData]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (!isAdminOrAdminCell && ownCellId) {
      timer = setTimeout(() => {
        setCellFilter(ownCellId.toString());
      }, 0);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isAdminOrAdminCell, ownCellId]);

  const generateEmployeeList = async (): Promise<string | null> => {
    setGenerating(true);
    setErrorMessage('');
    try {
      const res = await fetch('/api/documents/generate-employee-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cellFilter })
      });
      const data = await res.json();
      if (res.ok && data.success && data.filePath) {
        return data.filePath;
      } else {
        setErrorMessage(data.message || 'কর্মকর্তা তালিকা প্রস্তুত করতে ব্যর্থ হয়েছে।');
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

  const handleDirectPrint = async () => {
    const path = await generateEmployeeList();
    if (path) {
      const iframe = document.getElementById('silent-print-iframe') as HTMLIFrameElement;
      if (iframe) {
        iframe.src = path;
        iframe.onload = () => {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        };
      }
    }
  };

  const handlePrintPreview = async () => {
    const path = await generateEmployeeList();
    if (path) {
      setIframeUrl(path);
      setIsPreviewOpen(true);
    }
  };

  const handleEmpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!empForm.name.trim() || !empForm.designation.trim() || !empForm.cellId || !empForm.bankId.trim() || !empForm.fileNo.trim()) {
      setErrorMessage('নাম, পদবী, ব্যাংক আইডি, নথি নম্বর এবং সেল অবশ্যই পূরণ করতে হবে।');
      return;
    }

    try {
      const url = editingEmp ? `/api/employees/${editingEmp.id}` : '/api/employees';
      const method = editingEmp ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(empForm)
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save officer');
      }

      setIsEmpModalOpen(false);
      setEditingEmp(null);
      setEmpForm({ name: '', nameEn: '', designation: STRICT_DESIGNATIONS[0], designationEn: '', bankId: '', fileNo: '', mobile: '', cellId: '' });
      await loadData();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('user-profile-updated'));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      setErrorMessage(msg === 'cell_required' ? 'অনুগ্রহ করে সেল সিলেক্ট করুন।' : 'সার্ভার সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।');
    }
  };

  const handleCellSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!cellForm.name.trim()) {
      setErrorMessage('সেলের নাম অবশ্যই পূরণ করতে হবে।');
      return;
    }

    try {
      const url = editingCell ? `/api/cells/${editingCell.id}` : '/api/cells';
      const method = editingCell ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cellForm)
      });
      
      if (!res.ok) {
        const err = await res.json();
        if (err.error === 'cell_exists') {
          throw new Error('এই নামের সেল ইতিমধ্যেই যোগ করা আছে।');
        }
        throw new Error('Failed to save cell');
      }

      setIsCellModalOpen(false);
      setEditingCell(null);
      setCellForm({ name: '', description: '' });
      loadData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'সেল সংরক্ষণ করতে সমস্যা হয়েছে।';
      setErrorMessage(msg);
    }
  };

  const deleteEmployee = (id: number) => {
    const emp = employees.find(e => e.id === id);
    setEmpToDelete(emp || ({ id, name: 'কর্মকর্তা' } as Employee));
  };

  const confirmDeleteEmp = async () => {
    if (!empToDelete) return;
    try {
      const res = await fetch(`/api/employees/${empToDelete.id}`, { method: 'DELETE' });
      if (res.ok) loadData();
    } catch (err) {
      logger.error('Error deleting officer:', err);
    } finally {
      setEmpToDelete(null);
    }
  };

  const deleteCell = (cell: Cell) => {
    if (cell._count && cell._count.employees > 0) {
      alert('এই সেলে কর্মকর্তা কর্মরত রয়েছে! সেলটি ডিলিট করার আগে কর্মকর্তাদের অন্য সেলে স্থানান্তর করুন।');
      return;
    }
    setCellToDelete(cell);
  };

  const confirmDeleteCell = async () => {
    if (!cellToDelete) return;
    try {
      const res = await fetch(`/api/cells/${cellToDelete.id}`, { method: 'DELETE' });
      if (res.ok) {
        loadData();
      } else {
        const err = await res.json();
        alert(err.error === 'cell_has_employees' ? 'সেলটি ডিলিট করা যাচ্ছে না কারণ এতে কর্মকর্তা কর্মরত আছে।' : 'সেল মুছে ফেলতে সমস্যা হয়েছে।');
      }
    } catch (err) {
      logger.error('Error deleting cell:', err);
    } finally {
      setCellToDelete(null);
    }
  };

  const handleBulkEmpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBulkError('');
    
    if (!bulkEmpText.trim()) {
      setBulkError('অনুগ্রহ করে কর্মকর্তাদের নামের টেক্সট পেস্ট করুন।');
      return;
    }
    
    const lines = bulkEmpText.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (lines.length === 0) {
      setBulkError('কোনো কর্মকর্তা তথ্য পাওয়া যায়নি।');
      return;
    }

    const parseRow = (line: string): string[] => {
      const row: string[] = [];
      let col = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];
        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            col += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if ((char === ',' || char === '\t' || char === '|' || char === ';') && !inQuotes) {
          row.push(col.trim());
          col = '';
        } else {
          col += char;
        }
      }
      row.push(col.trim());
      return row;
    };

    const mapDesignation = (rawDesig: string): string => {
      const clean = (rawDesig || '').toLowerCase();
      if (clean.includes('এসপিও') || clean.includes('সিনিয়র প্রিন্সিপাল') || clean.includes('spo')) {
        return STRICT_DESIGNATIONS[0];
      }
      if (clean.includes('পিও') || clean.includes('প্রিন্সিপাল') || clean.includes('po')) {
        return STRICT_DESIGNATIONS[1];
      }
      if (clean.includes('এসো') || clean.includes('এসও') || clean.includes('so') || clean.includes('সিনিয়র অফিসার') || clean.includes('so-it') || clean.includes('অফিসার-আইটি (এসও-আইটি)')) {
        return STRICT_DESIGNATIONS[2];
      }
      return STRICT_DESIGNATIONS[3];
    };

    let hasHeader = false;
    let nameIdx = 0;
    let desigIdx = 1;
    let bankIdx = 2;
    let fileIdx = 3;
    let mobileIdx = 4;
    let cellIdx = 5;

    const firstRow = parseRow(lines[0]).map(c => c.trim().toLowerCase());
    const headerMatches = firstRow.some(h => 
      h.includes('নাম') || h.includes('name') || 
      h.includes('পদব') || h.includes('designation') || 
      h.includes('ব্যাংক') || h.includes('bank') || 
      h.includes('নথি') || h.includes('file') || 
      h.includes('মোবাইল') || h.includes('mobile') || 
      h.includes('সেল') || h.includes('cell')
    );

    if (headerMatches) {
      hasHeader = true;
      nameIdx = firstRow.findIndex(h => h.includes('নাম') || h.includes('name'));
      desigIdx = firstRow.findIndex(h => h.includes('পদব') || h.includes('designation'));
      bankIdx = firstRow.findIndex(h => h.includes('ব্যাংক') || h.includes('bank') || h.includes('আইডি') || h.includes('id'));
      fileIdx = firstRow.findIndex(h => h.includes('নথি') || h.includes('file'));
      mobileIdx = firstRow.findIndex(h => h.includes('মোবাইল') || h.includes('mobile') || h.includes('ফোন') || h.includes('phone'));
      cellIdx = firstRow.findIndex(h => h.includes('সেল') || h.includes('cell'));
    }

    const startRowIdx = hasHeader ? 1 : 0;
    const parsed: BulkEmployeeInput[] = [];

    for (let idx = startRowIdx; idx < lines.length; idx++) {
      const line = lines[idx];
      if (!line) continue;

      let name = '';
      let designation = '';
      let bankId = '';
      let fileNo = '';
      let mobile = '';
      let cellName = '';

      const row = parseRow(line);
      if (row.length === 1 && line.includes(' - ')) {
        const parts = line.split(' - ');
        name = parts[0].trim();
        designation = parts.slice(1).join(' - ').trim();
      } else if (hasHeader) {
        name = nameIdx !== -1 && row[nameIdx] ? row[nameIdx].replace(/^["']|["']$/g, '').trim() : '';
        designation = desigIdx !== -1 && row[desigIdx] ? row[desigIdx].replace(/^["']|["']$/g, '').trim() : '';
        bankId = bankIdx !== -1 && row[bankIdx] ? row[bankIdx].replace(/^["']|["']$/g, '').trim() : '';
        fileNo = fileIdx !== -1 && row[fileIdx] ? row[fileIdx].replace(/^["']|["']$/g, '').trim() : '';
        mobile = mobileIdx !== -1 && row[mobileIdx] ? row[mobileIdx].replace(/^["']|["']$/g, '').trim() : '';
        cellName = cellIdx !== -1 && row[cellIdx] ? row[cellIdx].replace(/^["']|["']$/g, '').trim() : '';
      } else {
        name = row[0] ? row[0].replace(/^["']|["']$/g, '').trim() : '';
        designation = row[1] ? row[1].replace(/^["']|["']$/g, '').trim() : '';
        bankId = row[2] ? row[2].replace(/^["']|["']$/g, '').trim() : '';
        fileNo = row[3] ? row[3].replace(/^["']|["']$/g, '').trim() : '';
        mobile = row[4] ? row[4].replace(/^["']|["']$/g, '').trim() : '';
        cellName = row[5] ? row[5].replace(/^["']|["']$/g, '').trim() : '';
      }

      if (!name) continue;

      parsed.push({
        name,
        designation: mapDesignation(designation),
        bankId: bankId || null,
        fileNo: fileNo || null,
        mobile: mobile || null,
        cellName
      });
    }

    if (parsed.length === 0) {
      setBulkError('কোনো সঠিক কর্মকর্তা তথ্য পাওয়া যায়নি।');
      return;
    }

    setBulkImporting(true);
    try {
      let currentCells = [...cells];

      for (const emp of parsed) {
        let cellId: number | null = null;

        if (emp.cellName) {
          const matchedCell = currentCells.find(c => c.name.trim().toLowerCase() === emp.cellName.trim().toLowerCase());
          if (matchedCell) {
            cellId = matchedCell.id;
          } else if (currentUser?.role === 'ADMIN') {
            const cellRes = await fetch('/api/cells', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: emp.cellName.trim(), description: '' })
            });
            if (cellRes.ok) {
              const newCell = await cellRes.json();
              currentCells.push(newCell);
              setCells(prev => [...prev, newCell]);
              cellId = newCell.id;
            } else {
              const cellsRes = await fetch('/api/cells');
              const updatedCells = await cellsRes.json();
              if (Array.isArray(updatedCells)) {
                setCells(updatedCells);
                currentCells = updatedCells;
                const retryMatch = updatedCells.find(c => c.name.trim().toLowerCase() === emp.cellName.trim().toLowerCase());
                if (retryMatch) cellId = retryMatch.id;
              }
            }
          }
        }

        if (!cellId && bulkEmpCellId) {
          cellId = parseInt(bulkEmpCellId, 10);
        }

        if (!cellId) {
          cellId = ownCellId;
        }

        if (!cellId) {
          throw new Error(`"${emp.name}" কর্মকর্তার জন্য কোনো সেল পাওয়া যায়নি বা নির্বাচন করা হয়নি।`);
        }

        const res = await fetch('/api/employees', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: emp.name,
            designation: emp.designation,
            bankId: emp.bankId,
            fileNo: emp.fileNo,
            mobile: emp.mobile,
            cellId
          })
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || err.error || `"${emp.name}" কর্মকর্তাকে সংরক্ষণ করতে ব্যর্থ হয়েছে।`);
        }
      }

      setIsBulkEmpModalOpen(false);
      setBulkEmpText('');
      setBulkError('');
      loadData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'আমদানিতে ত্রুটি হয়েছে। অনুগ্রহ করে ডেটা চেক করে পুনরায় চেষ্টা করুন।';
      setBulkError(msg);
    } finally {
      setBulkImporting(false);
    }
  };

  const handleBulkCellSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBulkCellError('');
    
    if (!bulkCellText.trim()) {
      setBulkCellError('অনুগ্রহ করে সেলের নামগুলো পেস্ট করুন।');
      return;
    }
    
    const lines = bulkCellText.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
      
    if (lines.length === 0) {
      setBulkCellError('কোনো সেলের নাম পাওয়া যায়নি।');
      return;
    }
    
    setBulkCellImporting(true);
    try {
      for (const name of lines) {
        const exists = cells.some(c => c.name.trim().toLowerCase() === name.toLowerCase());
        if (exists) continue;

        const res = await fetch('/api/cells', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, description: '' })
        });
        
        if (!res.ok) {
          const err = await res.json();
          if (err.error !== 'cell_exists') {
            throw new Error(err.message || err.error || `"${name}" সেলটি সংরক্ষণ করতে ব্যর্থ হয়েছে।`);
          }
        }
      }
      
      setIsBulkCellModalOpen(false);
      setBulkCellText('');
      setBulkCellError('');
      loadData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'সেল আমদানি করতে সমস্যা হয়েছে।';
      setBulkCellError(msg);
    } finally {
      setBulkCellImporting(false);
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
          fileType,
          customApiKey
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'ইমেজ পার্স করতে ব্যর্থ হয়েছে।');
      }

      if (data.employees && Array.isArray(data.employees)) {
        const textLines = data.employees.map((emp: { name: string; designation: string }) => `${emp.name} - ${emp.designation}`).join('\n');
        setBulkEmpText(prev => prev ? `${prev}\n${textLines}` : textLines);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'ছবি থেকে তথ্য বের করতে সমস্যা হয়েছে।';
      setBulkError(msg);
    } finally {
      setIsImageImportLoading(false);
    }
  };

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

  const startEditEmp = (emp: Employee) => {
    setEditingEmp(emp);
    setEmpForm({
      name: emp.name,
      nameEn: emp.nameEn || '',
      designation: STRICT_DESIGNATIONS.includes(emp.designation) ? emp.designation : STRICT_DESIGNATIONS[0],
      designationEn: emp.designationEn || '',
      bankId: emp.bankId || '',
      fileNo: emp.fileNo || '',
      mobile: emp.mobile || '',
      cellId: emp.cellId.toString()
    });
    setErrorMessage('');
    setIsEmpModalOpen(true);
  };

  const startEditCell = (cell: Cell) => {
    setEditingCell(cell);
    setCellForm({
      name: cell.name,
      description: cell.description || ''
    });
    setErrorMessage('');
    setIsCellModalOpen(true);
  };

  const exportEmployeesToCSV = () => {
    let csvContent = '\uFEFFনাম,পদবী,ব্যাংক আইডি,নথি নং,মোবাইল নম্বর,সেল\n';
    filteredEmployees.forEach(emp => {
      const name = `"${emp.name.replace(/"/g, '""')}"`;
      const designation = `"${emp.designation.replace(/"/g, '""')}"`;
      const bankId = `"${(emp.bankId || '').replace(/"/g, '""')}"`;
      const fileNo = `"${(emp.fileNo || '').replace(/"/g, '""')}"`;
      const mobile = `"${(emp.mobile || '').replace(/"/g, '""')}"`;
      const cellName = `"${(emp.cell?.name || '').replace(/"/g, '""')}"`;
      csvContent += `${name},${designation},${bankId},${fileNo},${mobile},${cellName}\n`;
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `employees_list_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportCellsToCSV = () => {
    let csvContent = '\uFEFFসেলের নাম,কর্মকর্তা সংখ্যা\n';
    cells.forEach(cell => {
      const name = `"${cell.name.replace(/"/g, '""')}"`;
      const empCount = cell._count?.employees || 0;
      csvContent += `${name},${empCount}\n`;
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `cells_list_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const isAdditional = emp.dutyType === 'ADDITIONAL';
      const isSelf = !!(emp.bankId && currentUser?.username && emp.bankId.trim() === currentUser.username.trim());
      if (isAdditional && currentUser?.role !== 'ADMIN' && !isSelf) {
        return false;
      }

      const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            emp.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (emp.bankId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (emp.fileNo || '').toLowerCase().includes(searchQuery.toLowerCase());
      let matchesCell = false;
      if (cellFilter === 'select') {
        matchesCell = false;
      } else if (cellFilter === 'all') {
        matchesCell = true;
      } else if (cellFilter === 'executives') {
        matchesCell = false;
      } else {
        matchesCell = emp.cellId.toString() === cellFilter;
      }
      
      const matchesDesignation = filterDesignation === 'ALL' || emp.designation === filterDesignation;
      const matchesPhone = filterPhoneStatus === 'ALL' || 
        (filterPhoneStatus === 'has_phone' && emp.mobile && emp.mobile.trim().length > 0) ||
        (filterPhoneStatus === 'no_phone' && (!emp.mobile || emp.mobile.trim().length === 0));
      const matchesBankId = filterBankIdStatus === 'ALL' || 
        (filterBankIdStatus === 'has_bank_id' && emp.bankId && emp.bankId.trim().length > 0) ||
        (filterBankIdStatus === 'no_bank_id' && (!emp.bankId || emp.bankId.trim().length === 0));
      const matchesFileNo = filterFileNoStatus === 'ALL' || 
        (filterFileNoStatus === 'has_file_no' && emp.fileNo && emp.fileNo.trim().length > 0) ||
        (filterFileNoStatus === 'no_file_no' && (!emp.fileNo || emp.fileNo.trim().length === 0));

      return matchesSearch && matchesCell && matchesDesignation && matchesPhone && matchesBankId && matchesFileNo;
    });
  }, [employees, currentUser, searchQuery, cellFilter, filterDesignation, filterPhoneStatus, filterBankIdStatus, filterFileNoStatus]);

  const filteredExecutives = useMemo(() => {
    return executives.filter(exec => {
      const matchesSearch = exec.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            exec.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (exec.bankId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (exec.fileNo || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesPhone = filterPhoneStatus === 'ALL' || 
        (filterPhoneStatus === 'has_phone' && exec.phone && exec.phone.trim().length > 0) ||
        (filterPhoneStatus === 'no_phone' && (!exec.phone || exec.phone.trim().length === 0));
      const matchesBankId = filterBankIdStatus === 'ALL' || 
        (filterBankIdStatus === 'has_bank_id' && exec.bankId && exec.bankId.trim().length > 0) ||
        (filterBankIdStatus === 'no_bank_id' && (!exec.bankId || exec.bankId.trim().length === 0));
      const matchesFileNo = filterFileNoStatus === 'ALL' || 
        (filterFileNoStatus === 'has_file_no' && exec.fileNo && exec.fileNo.trim().length > 0) ||
        (filterFileNoStatus === 'no_file_no' && (!exec.fileNo || exec.fileNo.trim().length === 0));

      return matchesSearch && matchesPhone && matchesBankId && matchesFileNo;
    });
  }, [executives, searchQuery, filterPhoneStatus, filterBankIdStatus, filterFileNoStatus]);

  const sortedFilteredExecutives = useMemo(() => {
    return [...filteredExecutives].sort((a, b) => {
      const priority = (desig: string) => {
        const d = desig.toLowerCase();
        if (d.includes('উপ-মহাব্যবস্থাপক') || d.includes('ডিজিএম') || d.includes('dgm')) return 1;
        if (d.includes('সহকারী মহাব্যবস্থাপক') || d.includes('এজিএম') || d.includes('agm')) return 2;
        return 3;
      };
      const pA = priority(a.designation);
      const pB = priority(b.designation);
      if (pA !== pB) return pA - pB;
      return (a.fileNo || '').localeCompare(b.fileNo || '', undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [filteredExecutives]);

  // Bulk Actions
  const toggleSelectAll = (allIds: number[]) => {
    if (selectedEmps.length === allIds.length) {
      setSelectedEmps([]);
    } else {
      setSelectedEmps(allIds);
    }
  };

  const toggleSelectEmp = (id: number) => {
    setSelectedEmps(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    setIsBulkDeleteConfirmOpen(true);
  };

  const confirmBulkDelete = async () => {
    try {
      await Promise.all(selectedEmps.map(id => fetch(`/api/employees/${id}`, { method: 'DELETE' })));
      setSelectedEmps([]);
      loadData();
    } catch (err) {
      logger.error('Failed to bulk delete officers:', err);
    } finally {
      setIsBulkDeleteConfirmOpen(false);
    }
  };

  const handleBulkChangeCell = async (targetCellId: number) => {
    try {
      await Promise.all(selectedEmps.map(id => 
        fetch(`/api/employees/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cellId: targetCellId })
        })
      ));
      setSelectedEmps([]);
      loadData();
    } catch (err) {
      logger.error('Failed to bulk change cell:', err);
    }
  };

  return {
    activeTab,
    setActiveTab,
    employees,
    cells,
    executives,
    loading,
    searchQuery,
    setSearchQuery,
    cellFilter,
    setCellFilter,
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
    isBulkCellModalOpen,
    setIsBulkCellModalOpen,
    bulkCellText,
    setBulkCellText,
    bulkCellError,
    bulkCellImporting,
    generating,
    isPreviewOpen,
    setIsPreviewOpen,
    iframeUrl,
    isEmpModalOpen,
    setIsEmpModalOpen,
    isCellModalOpen,
    setIsCellModalOpen,
    editingEmp,
    setEditingEmp,
    editingCell,
    setEditingCell,
    profileEmp,
    setProfileEmp,
    selectedEmps,
    setSelectedEmps,
    empForm,
    setEmpForm,
    cellForm,
    setCellForm,
    errorMessage,
    setErrorMessage,
    isBulkEmpModalOpen,
    setIsBulkEmpModalOpen,
    bulkEmpText,
    setBulkEmpText,
    bulkEmpCellId,
    setBulkEmpCellId,
    bulkImporting,
    bulkError,
    isImageImportLoading,
    isAdminOrAdminCell,
    allowedCellIds,
    ownEmployee,
    selectableCells,
    formSelectableCells,
    filteredEmployees,
    sortedFilteredExecutives,
    loadData,
    handleDirectPrint,
    handlePrintPreview,
    handleEmpSubmit,
    handleCellSubmit,
    deleteEmployee,
    confirmDeleteEmp,
    empToDelete,
    setEmpToDelete,
    deleteCell,
    confirmDeleteCell,
    cellToDelete,
    setCellToDelete,
    handleBulkEmpSubmit,
    handleBulkCellSubmit,
    handleTextareaPaste,
    startEditEmp,
    startEditCell,
    exportEmployeesToCSV,
    exportCellsToCSV,
    toggleSelectAll,
    toggleSelectEmp,
    handleBulkDelete,
    confirmBulkDelete,
    isBulkDeleteConfirmOpen,
    setIsBulkDeleteConfirmOpen,
    handleBulkChangeCell
  };
}
