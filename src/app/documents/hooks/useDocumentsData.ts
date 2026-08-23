'use client';

import { useState, useEffect, useRef } from 'react';
import logger from '@/lib/logger';
import { DocumentFile, OfficeOrder, ManualDoc, OrderDuty, UserSession } from '../types';

export function useDocumentsData(currentUser: UserSession | null) {
  const [activeTab, setActiveTab] = useState<'files' | 'manual-docs' | 'orders' | 'bills'>('files');
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [officeOrders, setOfficeOrders] = useState<OfficeOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  // Form states (Tab 1)
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customName, setCustomName] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Search & Filter states (Tab 1)
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'size-desc' | 'size-asc'>('date-desc');
  const [showFilesFilters, setShowFilesFilters] = useState(false);
  const [filesFilterOrigin, setFilesFilterOrigin] = useState<string>('ALL');
  const [filesFilterSize, setFilesFilterSize] = useState<string>('ALL');

  // Manual Documents States (Tab 2)
  const [manualDocs, setManualDocs] = useState<ManualDoc[]>([]);
  const [loadingManualDocs, setLoadingManualDocs] = useState(false);
  const [manualDocsSearchQuery, setManualDocsSearchQuery] = useState('');
  const [showManualFilters, setShowManualFilters] = useState(false);
  const [filterFileType, setFilterFileType] = useState<string>('ALL');
  const [filterDateRange, setFilterDateRange] = useState<string>('ALL');
  const [filterSize, setFilterSize] = useState<string>('ALL');
  const [sortByManual, setSortByManual] = useState<'date-desc' | 'date-asc' | 'size-desc' | 'size-asc'>('date-desc');

  // Manual upload states
  const [manualSelectedFile, setManualSelectedFile] = useState<File | null>(null);
  const [manualCustomName, setManualCustomName] = useState('');
  const [manualUploading, setManualUploading] = useState(false);
  const [manualDragActive, setManualDragActive] = useState(false);
  const [manualIsVisibleToUsers, setManualIsVisibleToUsers] = useState(false);
  const manualFileInputRef = useRef<HTMLInputElement>(null);

  // Edit / Rename Modal state for manual documents
  const [editingManualDoc, setEditingManualDoc] = useState<ManualDoc | null>(null);
  const [editDocName, setEditDocName] = useState('');

  // Tab 3 & 4 Search & Filters
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [showOrdersFilters, setShowOrdersFilters] = useState(false);
  const [ordersFilterCategory, setOrdersFilterCategory] = useState<string>('ALL');
  const [ordersFilterStatus, setOrdersFilterStatus] = useState<string>('ALL');
  const [ordersFilterCell, setOrdersFilterCell] = useState<string>('ALL');

  const [showBillsFilters, setShowBillsFilters] = useState(false);
  const [billsFilterCategory, setBillsFilterCategory] = useState<string>('ALL');
  const [billsFilterCell, setBillsFilterCell] = useState<string>('ALL');

  // Viewing Modal
  const [viewingOrder, setViewingOrder] = useState<OfficeOrder | null>(null);
  const [msgBanner, setMsgBanner] = useState<{ type: 'success' | 'cancel'; text: string } | null>(null);

  // Confirm Modal state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => Promise<void> | void;
  } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const msg = params.get('msg');
      if (msg === 'success') {
        setMsgBanner({ type: 'success', text: 'আপনার সম্পাদনা সফল হয়েছে।' });
        const newUrl = window.location.pathname + window.location.search.replace(/[?&]msg=success/, '').replace(/^&/, '?');
        window.history.replaceState({}, '', newUrl);
      } else if (msg === 'cancel') {
        setMsgBanner({ type: 'cancel', text: 'অপারেশন বা সম্পাদনা বাতিল করা হয়েছে।' });
        const newUrl = window.location.pathname + window.location.search.replace(/[?&]msg=cancel/, '').replace(/^&/, '?');
        window.history.replaceState({}, '', newUrl);
      }
    }
  }, []);

  useEffect(() => {
    if (currentUser && currentUser.role === 'USER') {
      setActiveTab('orders');
    }
  }, [currentUser]);

  const hasDeletePermission = (order: OfficeOrder) => {
    if (!currentUser) return false;
    if (currentUser.role === 'ADMIN') return true;
    const userCellNames = currentUser.cells?.map((c: { name: string }) => c.name) || [];
    if (order.cellName && userCellNames.includes(order.cellName)) return true;
    if (order.duties && Array.isArray(order.duties)) {
      return order.duties.some((d: OrderDuty) => d.cellName && userCellNames.includes(d.cellName));
    }
    return false;
  };

  const hasEditPermission = (order: OfficeOrder) => {
    if (!currentUser) return false;
    if (currentUser.role === 'ADMIN') return true;
    const userCellNames = currentUser.cells?.map((c: { name: string }) => c.name) || [];
    if (order.cellName && userCellNames.includes(order.cellName)) return true;
    if (order.duties && Array.isArray(order.duties)) {
      return order.duties.some((d: OrderDuty) => d.cellName && userCellNames.includes(d.cellName));
    }
    return false;
  };

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/documents');
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      } else {
        setError('নথিপত্র লোড করতে ব্যর্থ হয়েছে।');
      }
    } catch {
      setError('সার্ভারে যোগাযোগ করতে ব্যর্থ হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  const fetchOfficeOrders = async () => {
    try {
      setLoadingOrders(true);
      const res = await fetch('/api/office-orders');
      if (res.ok) {
        const data = await res.json();
        setOfficeOrders(data);
      } else {
        setError('অফিস অর্ডার আর্কাইভ লোড করতে ব্যর্থ হয়েছে।');
      }
    } catch {
      setError('সার্ভারে যোগাযোগ করতে ব্যর্থ হয়েছে।');
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchManualDocs = async () => {
    try {
      setLoadingManualDocs(true);
      const res = await fetch('/api/manual-documents');
      if (res.ok) {
        const data = await res.json();
        setManualDocs(data);
      } else {
        setError('ম্যানুয়াল নথিপত্র লোড করতে ব্যর্থ হয়েছে।');
      }
    } catch {
      setError('সার্ভারে যোগাযোগ করতে ব্যর্থ হয়েছে।');
    } finally {
      setLoadingManualDocs(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === 'files') {
        if (currentUser && currentUser.role === 'USER') {
          return;
        }
        fetchDocuments();
      } else if (activeTab === 'manual-docs') {
        fetchManualDocs();
      } else {
        fetchOfficeOrders();
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [activeTab, currentUser]);

  // Upload Manual Document
  const handleManualUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualSelectedFile) return;

    setManualUploading(true);
    setError('');
    setSuccessMsg('');

    try {
      const formData = new FormData();
      formData.append('file', manualSelectedFile);
      formData.append('name', manualCustomName.trim());
      if (currentUser?.role === 'ADMIN') {
        formData.append('isVisibleToUsers', String(manualIsVisibleToUsers));
      }

      const res = await fetch('/api/manual-documents', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessMsg('ফাইলটি সফলভাবে আপলোড এবং সংরক্ষণ করা হয়েছে!');
        setManualSelectedFile(null);
        setManualCustomName('');
        setManualIsVisibleToUsers(false);
        if (manualFileInputRef.current) manualFileInputRef.current.value = '';
        fetchManualDocs();
      } else {
        setError(data.message || 'ফাইল আপলোড করতে ব্যর্থ হয়েছে।');
      }
    } catch {
      setError('সার্ভারে যোগাযোগ করতে ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।');
    } finally {
      setManualUploading(false);
    }
  };

  // Delete Manual Document
  const handleDeleteManualDoc = (id: number) => {
    const doc = manualDocs.find(d => d.id === id);
    if (!doc) return;

    setDeleteConfirm({
      isOpen: true,
      title: 'ফাইল মুছে ফেলার নিশ্চিতকরণ',
      description: `আপনি কি নিশ্চিত যে এই ফাইলটি (${doc.name}) আর্কাইভ থেকে মুছে ফেলতে চান? এটি ডিলিট করলে ফাইলটি রিসাইকেল বিনে স্থানান্তরিত হবে এবং পরবর্তীতে পুনরুদ্ধার (Restore) করা সম্ভব।`,
      onConfirm: async () => {
        try {
          const res = await fetch('/api/manual-documents', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
          });

          if (res.ok) {
            setSuccessMsg('ফাইলটি সফলভাবে মুছে ফেলা হয়েছে ও রিসাইকেল বিনে পাঠানো হয়েছে।');
            fetchManualDocs();
          } else {
            const data = await res.json();
            setError(data.message || 'ফাইলটি মুছে ফেলা সম্ভব হয়নি।');
          }
        } catch {
          setError('সার্ভারে যোগাযোগ করতে ব্যর্থ হয়েছে।');
        }
      }
    });
  };

  // Rename Manual Document
  const handleRenameManualDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingManualDoc || !editDocName.trim()) return;

    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/manual-documents', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingManualDoc.id, name: editDocName.trim() }),
      });

      if (res.ok) {
        setSuccessMsg('ফাইলের নাম সফলভাবে পরিবর্তন করা হয়েছে।');
        setEditingManualDoc(null);
        setEditDocName('');
        fetchManualDocs();
      } else {
        const data = await res.json();
        setError(data.message || 'ফাইলের নাম পরিবর্তন করতে ব্যর্থ হয়েছে।');
      }
    } catch {
      setError('সার্ভারে যোগাযোগ করতে ব্যর্থ হয়েছে।');
    }
  };

  // Toggle Visibility for Admin Uploaded Documents
  const handleToggleVisibility = async (id: number, isVisibleToUsers: boolean) => {
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/manual-documents', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isVisibleToUsers }),
      });

      if (res.ok) {
        setSuccessMsg(isVisibleToUsers ? 'ফাইলটি সফলভাবে সকলের জন্য উন্মুক্ত করা হয়েছে।' : 'ফাইলটির দেখার অনুমতি শুধুমাত্র নিজের মধ্যে সীমাবদ্ধ করা হয়েছে।');
        fetchManualDocs();
      } else {
        const data = await res.json();
        setError(data.message || 'দৃশ্যমানতা পরিবর্তন করতে ব্যর্থ হয়েছে।');
      }
    } catch {
      setError('সার্ভারে যোগাযোগ করতে ব্যর্থ হয়েছে।');
    }
  };

  // Delete generated document (Tab 1)
  const handleDeleteDoc = (id: number) => {
    const doc = documents.find(d => d.id === id);
    if (!doc) return;

    setDeleteConfirm({
      isOpen: true,
      title: 'ডকুমেন্ট মুছে ফেলার নিশ্চিতকরণ',
      description: `আপনি কি নিশ্চিত যে এই ফাইলটি (${doc.name}) আর্কাইভ থেকে মুছে ফেলতে চান? এটি ডিলিট করলে ফাইলটি রিসাইকেল বিনে স্থানান্তরিত হবে এবং পরবর্তীতে পুনরুদ্ধার (Restore) করা সম্ভব।`,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/documents?id=${id}`, { method: 'DELETE' });
          if (res.ok) {
            setSuccessMsg('ফাইলটি সফলভাবে মুছে ফেলা হয়েছে ও রিসাইকেল বিনে পাঠানো হয়েছে।');
            fetchDocuments();
          } else {
            setError('ফাইলটি মুছে ফেলতে ব্যর্থ হয়েছে।');
          }
        } catch {
          setError('সার্ভারে যোগাযোগ করতে ব্যর্থ হয়েছে।');
        }
      }
    });
  };

  // Upload Generated PDF (Tab 1)
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    setError('');
    setSuccessMsg('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('name', customName.trim());

      const res = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        setSuccessMsg('ফাইলটি সফলভাবে আপলোড এবং সংরক্ষণ করা হয়েছে!');
        setSelectedFile(null);
        setCustomName('');
        if (fileInputRef.current) fileInputRef.current.value = '';
        fetchDocuments();
      } else {
        const data = await res.json();
        setError(data.message || 'ফাইল আপলোড করতে ব্যর্থ হয়েছে।');
      }
    } catch {
      setError('সার্ভারে যোগাযোগ করতে ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।');
    } finally {
      setUploading(false);
    }
  };

  // Delete office order by id
  const handleDeleteOrder = (id: number) => {
    const order = officeOrders.find(o => o.id === id);
    if (!order) return;

    if (!hasDeletePermission(order)) {
      alert('দুঃখিত, এই office order/বিল মুছে ফেলার জন্য আপনার পর্যাপ্ত পারমিশন বা অনুমতি নেই।');
      return;
    }

    const isBill = order.category?.startsWith('BILL_');
    const warningMsg = isBill 
      ? `আপনি কি নিশ্চিত যে এই বিল স্মারক বিবরণীটি (${order.orderRef}) আর্কাইভ থেকে মুছে ফেলতে চান? এটি ডিলিট করলে বিলের রেকর্ডটি রিসাইকেল বিনে স্থানান্তরিত হবে। এটি স্থায়ীভাবে মুছে ফেলা হবে না এবং পরবর্তীতে পুনরুদ্ধার (Restore) করা সম্ভব।`
      : `আপনি কি নিশ্চিত যে এই অফিস আদেশ স্মারক বিবরণীটি (${order.orderRef}) আর্কাইভ থেকে মুছে ফেলতে চান? এটি ডিলিট করলে এটি রিসাইকেল বিনে স্থানান্তরিত হবে এবং পুনরুদ্ধার করা সম্ভব। কিন্তু রিস্টোর করার পূর্ব পর্যন্ত এই আদেশের বিপরীতে বিল প্রসেস করা সম্ভব হবে না।`;

    setDeleteConfirm({
      isOpen: true,
      title: isBill ? 'বিল মেমো মুছে ফেলার নিশ্চিতকরণ' : 'অফিস আদেশ মুছে ফেলার নিশ্চিতকরণ',
      description: warningMsg,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/office-orders/${id}`, {
            method: 'DELETE',
          });

          if (res.ok) {
            setSuccessMsg(isBill ? 'বিল মেমোটি সফলভাবে মুছে ফেলা হয়েছে।' : 'অফিস আদেশটি সফলভাবে মুছে ফেলা হয়েছে।');
            fetchOfficeOrders();
          } else {
            const errData = await res.json().catch(() => ({}));
            setError(errData.message || 'অফিস আদেশটি মুছে ফেলা সম্ভব হয়নি।');
          }
        } catch {
          setError('সার্ভারে যোগাযোগ করতে ব্যর্থ হয়েছে।');
        }
      }
    });
  };

  // Delete office order
  const handleDeleteOfficeOrder = (orderRef: string, category: string) => {
    const isBill = category?.startsWith('BILL_');
    const typeLabel = isBill ? 'বিল' : 'অফিস আদেশ';

    setDeleteConfirm({
      isOpen: true,
      title: `${typeLabel} মুছে ফেলার নিশ্চিতকরণ`,
      description: `আপনি কি নিশ্চিত যে আপনি স্মারক নম্বর "${orderRef}" এর সংরক্ষিত ${typeLabel}টি মুছে ফেলতে চান? এটি ডিলিট করলে সংশ্লিষ্ট সকল রেকর্ড রিসাইকেল বিনে স্থানান্তরিত হবে এবং ডিউটি তালিকা পুনরায় আন-অ্যাসাইনড হবে।`,
      onConfirm: async () => {
        try {
          const res = await fetch('/api/office-orders', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderRef, category }),
          });

          if (res.ok) {
            setSuccessMsg(`${typeLabel} সফলভাবে মুছে ফেলা হয়েছে ও রিসাইকেল বিনে পাঠানো হয়েছে।`);
            fetchOfficeOrders();
          } else {
            const data = await res.json();
            setError(data.message || `${typeLabel} মুছে ফেলতে সমস্যা হয়েছে।`);
          }
        } catch {
          setError('সার্ভারে যোগাযোগ করতে ব্যর্থ হয়েছে।');
        }
      }
    });
  };

  return {
    activeTab,
    setActiveTab,
    documents,
    officeOrders,
    loading,
    loadingOrders,
    error,
    setError,
    uploading,
    dragActive,
    setDragActive,
    selectedFile,
    setSelectedFile,
    customName,
    setCustomName,
    successMsg,
    setSuccessMsg,
    fileInputRef,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    showFilesFilters,
    setShowFilesFilters,
    filesFilterOrigin,
    setFilesFilterOrigin,
    filesFilterSize,
    setFilesFilterSize,
    manualDocs,
    loadingManualDocs,
    manualDocsSearchQuery,
    setManualDocsSearchQuery,
    showManualFilters,
    setShowManualFilters,
    filterFileType,
    setFilterFileType,
    filterDateRange,
    setFilterDateRange,
    filterSize,
    setFilterSize,
    sortByManual,
    setSortByManual,
    manualSelectedFile,
    setManualSelectedFile,
    manualCustomName,
    setManualCustomName,
    manualUploading,
    manualDragActive,
    setManualDragActive,
    manualIsVisibleToUsers,
    setManualIsVisibleToUsers,
    manualFileInputRef,
    editingManualDoc,
    setEditingManualDoc,
    editDocName,
    setEditDocName,
    orderSearchQuery,
    setOrderSearchQuery,
    showOrdersFilters,
    setShowOrdersFilters,
    ordersFilterCategory,
    setOrdersFilterCategory,
    ordersFilterStatus,
    setOrdersFilterStatus,
    ordersFilterCell,
    setOrdersFilterCell,
    showBillsFilters,
    setShowBillsFilters,
    billsFilterCategory,
    setBillsFilterCategory,
    billsFilterCell,
    setBillsFilterCell,
    viewingOrder,
    setViewingOrder,
    msgBanner,
    setMsgBanner,
    hasDeletePermission,
    hasEditPermission,
    fetchDocuments,
    fetchOfficeOrders,
    fetchManualDocs,
    handleManualUploadSubmit,
    handleDeleteManualDoc,
    handleRenameManualDoc,
    handleToggleVisibility,
    handleDeleteDoc,
    handleUploadSubmit,
    handleDeleteOrder,
    handleDeleteOfficeOrder,
    deleteConfirm,
    setDeleteConfirm
  };
}
