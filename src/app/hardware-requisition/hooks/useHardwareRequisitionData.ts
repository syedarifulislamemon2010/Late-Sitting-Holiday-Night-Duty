'use client';

import { useState, useEffect } from 'react';
import logger from '@/lib/logger';
import { UserProfile } from '@/context/ProfileContext';
import { HardwareItem, HardwareRequisition, Employee, Cell, DEFAULT_HARDWARE_ITEMS } from '../types';

export const INITIAL_ITEM: HardwareItem = {
  id: '1',
  itemType: 'Desktop Computer',
  itemDescription: '',
  quantity: 1,
  unit: 'টি',
  remarks: ''
};

export function useHardwareRequisitionData(currentUser: UserProfile | null | undefined) {
  const [requisitions, setRequisitions] = useState<HardwareRequisition[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [cells, setCells] = useState<Cell[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form State
  const [requisitionDate, setRequisitionDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [applicantName, setApplicantName] = useState('');
  const [applicantDesignation, setApplicantDesignation] = useState('');
  const [applicantCell, setApplicantCell] = useState('');
  const [applicantId, setApplicantId] = useState('');
  const [requisitionType, setRequisitionType] = useState('নতুন সরঞ্জাম বরাদ্দ');
  const [reason, setReason] = useState('');
  const [items, setItems] = useState<HardwareItem[]>([{ ...INITIAL_ITEM, id: Math.random().toString(36).substring(2, 9) }]);

  const [searchQuery, setSearchQuery] = useState('');
  const [previewReq, setPreviewReq] = useState<HardwareRequisition | null>(null);
  const [reqToDelete, setReqToDelete] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch initial data
  const loadData = async () => {
    try {
      setLoading(true);
      const [reqsRes, empsRes, cellsRes] = await Promise.all([
        fetch('/api/hardware-requisitions'),
        fetch('/api/employees'),
        fetch('/api/cells')
      ]);

      if (reqsRes.ok) {
        const data = await reqsRes.json();
        setRequisitions(Array.isArray(data) ? data : []);
      }
      if (empsRes.ok) {
        const data = await empsRes.json();
        setEmployees(Array.isArray(data) ? data : []);
      }
      if (cellsRes.ok) {
        const data = await cellsRes.json();
        setCells(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      logger.error('Error fetching hardware requisitions data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Auto-fill from current user if matched
  useEffect(() => {
    if (currentUser && employees.length > 0 && !applicantName) {
      const matched = employees.find(e => e.bankId && e.bankId.trim() === currentUser.username?.trim());
      if (matched) {
        setApplicantName(matched.name);
        setApplicantDesignation(matched.designation);
        setApplicantId(matched.bankId || '');
        if (matched.cell?.name) {
          setApplicantCell(matched.cell.name);
        }
      }
    }
  }, [currentUser, employees, applicantName]);

  const handleAddItem = () => {
    setItems(prev => [
      ...prev,
      { ...INITIAL_ITEM, id: Math.random().toString(36).substring(2, 9) }
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleUpdateItem = <K extends keyof HardwareItem>(id: string, field: K, value: HardwareItem[K]) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleReset = () => {
    setRequisitionDate(new Date().toISOString().split('T')[0]);
    setRequisitionType('নতুন সরঞ্জাম বরাদ্দ');
    setReason('');
    setItems([{ ...INITIAL_ITEM, id: Math.random().toString(36).substring(2, 9) }]);
    setEditingId(null);
  };

  const handleEdit = (req: HardwareRequisition) => {
    setEditingId(req.id);
    setRequisitionDate(req.requisitionDate);
    setApplicantName(req.applicantName);
    setApplicantDesignation(req.applicantDesignation);
    setApplicantCell(req.applicantCell);
    setApplicantId(req.applicantId || '');
    setRequisitionType(req.requisitionType || 'নতুন সরঞ্জাম বরাদ্দ');
    setReason(req.reason || '');

    let parsedItems: HardwareItem[] = [{ ...INITIAL_ITEM, id: Math.random().toString(36).substring(2, 9) }];
    try {
      if (req.itemsJson) {
        const p = JSON.parse(req.itemsJson);
        if (Array.isArray(p) && p.length > 0) {
          parsedItems = p;
        }
      }
    } catch (e) {}
    setItems(parsedItems);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const payload = {
        requisitionDate,
        applicantName,
        applicantDesignation,
        applicantCell,
        applicantId,
        requisitionType,
        reason,
        itemsJson: JSON.stringify(items)
      };

      const url = editingId ? `/api/hardware-requisitions/${editingId}` : '/api/hardware-requisitions';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSuccessMessage(editingId ? 'রিকুইজিশন সফলভাবে আপডেট হয়েছে!' : 'নতুন রিকুইজিশন সফলভাবে তৈরি হয়েছে!');
        handleReset();
        loadData();
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        const err = await res.json();
        setErrorMessage(err.error || 'রিকুইজিশন সংরক্ষণ করতে ব্যর্থ হয়েছে।');
      }
    } catch (err) {
      logger.error('Error submitting requisition:', err);
      setErrorMessage('সার্ভার কানেকশন ব্যর্থ হয়েছে।');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: number) => {
    setReqToDelete(id);
  };

  const confirmDeleteReq = async () => {
    if (!reqToDelete) return;
    try {
      const res = await fetch(`/api/hardware-requisitions/${reqToDelete}`, { method: 'DELETE' });
      if (res.ok) {
        setSuccessMessage('রিকুইজিশন সফলভাবে মুছে ফেলা হয়েছে!');
        loadData();
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setErrorMessage('রিকুইজিশন মুছতে ব্যর্থ হয়েছে।');
      }
    } catch (err) {
      logger.error('Error deleting requisition:', err);
      setErrorMessage('সার্ভার এরর।');
    } finally {
      setReqToDelete(null);
    }
  };

  return {
    requisitions,
    employees,
    cells,
    loading,
    isSubmitting,
    editingId,
    requisitionDate,
    setRequisitionDate,
    applicantName,
    setApplicantName,
    applicantDesignation,
    setApplicantDesignation,
    applicantCell,
    setApplicantCell,
    applicantId,
    setApplicantId,
    requisitionType,
    setRequisitionType,
    reason,
    setReason,
    items,
    searchQuery,
    setSearchQuery,
    previewReq,
    setPreviewReq,
    reqToDelete,
    setReqToDelete,
    successMessage,
    setSuccessMessage,
    errorMessage,
    setErrorMessage,
    handleAddItem,
    handleRemoveItem,
    handleUpdateItem,
    handleReset,
    handleEdit,
    handleSubmit,
    handleDelete,
    confirmDeleteReq
  };
}
