'use client';

import { useState, useEffect } from 'react';
import logger from '@/lib/logger';
import { useToast } from '@/context/ToastContext';
import { TazForm, Implementer, Holiday, Employee, Cell } from '../types';

export const INITIAL_FORM_DATA = {
  formDate: new Date().toISOString().split('T')[0],
  ref: '',
  pacsId: '',
  title: '',
  purpose: '',
  applicationName: 'T24',
  routineDetails: '',
  subroutineDetails: '',
  versionInfo: '',
  needBackendAccess: 'No',
  needCoreFtpAccess: 'No',
  needBrowserAccess: 'Yes',
  browserPortChange: 'No',
  duringTxHour: 'No',
  numTeamMembers: 1,
  approxScheduleStart: '20:00',
  approxScheduleEnd: '23:00',
  execScheduleStart: '',
  execScheduleEnd: '',
  impact: 'None',
  requesterName: '',
  requesterDesignation: '',
  requesterOrganization: 'Janata Bank PLC'
};

export const INITIAL_IMPLEMENTER: Implementer = {
  name: '',
  designation: '',
  organization: 'Janata Bank PLC'
};

export function useTazFormData() {
  const { showToast } = useToast();

  const [forms, setForms] = useState<TazForm[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [cells, setCells] = useState<Cell[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [implementers, setImplementers] = useState<Implementer[]>([INITIAL_IMPLEMENTER]);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterMonth, setFilterMonth] = useState('ALL');
  const [previewForm, setPreviewForm] = useState<TazForm | null>(null);

  // Fetch initial data
  useEffect(() => {
    async function loadData() {
      try {
        const [formsRes, empRes, cellsRes, holRes] = await Promise.all([
          fetch('/api/taz-committee-forms'),
          fetch('/api/employees'),
          fetch('/api/cells'),
          fetch('/api/holidays')
        ]);

        if (formsRes.ok) {
          const data = await formsRes.json();
          setForms(Array.isArray(data) ? data : []);
        }
        if (empRes.ok) {
          const data = await empRes.json();
          setEmployees(Array.isArray(data) ? data : []);
        }
        if (cellsRes.ok) {
          const data = await cellsRes.json();
          setCells(Array.isArray(data) ? data : []);
        }
        if (holRes.ok) {
          const data = await holRes.json();
          setHolidays(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        logger.error('Error fetching taz data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const loadForms = async () => {
    try {
      const res = await fetch('/api/taz-committee-forms');
      if (res.ok) {
        const data = await res.json();
        setForms(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      logger.error('Error loading taz forms:', err);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddImplementer = () => {
    setImplementers(prev => [...prev, { ...INITIAL_IMPLEMENTER }]);
    setFormData(prev => ({
      ...prev,
      numTeamMembers: prev.numTeamMembers + 1
    }));
  };

  const handleRemoveImplementer = (index: number) => {
    if (implementers.length <= 1) return;
    setImplementers(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({
      ...prev,
      numTeamMembers: Math.max(1, prev.numTeamMembers - 1)
    }));
  };

  const handleUpdateImplementer = (index: number, field: keyof Implementer, value: string) => {
    setImplementers(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleReset = () => {
    setFormData(INITIAL_FORM_DATA);
    setImplementers([{ ...INITIAL_IMPLEMENTER }]);
    setEditingId(null);
  };

  const handleEdit = (form: TazForm) => {
    setEditingId(form.id);
    let parsedImplementers: Implementer[] = [{ ...INITIAL_IMPLEMENTER }];
    try {
      if (form.implementersJson) {
        const parsed = JSON.parse(form.implementersJson);
        if (Array.isArray(parsed) && parsed.length > 0) {
          parsedImplementers = parsed;
        }
      }
    } catch (e) {}

    setFormData({
      formDate: form.formDate,
      ref: form.ref || '',
      pacsId: form.pacsId || '',
      title: form.title || '',
      purpose: form.purpose || '',
      applicationName: form.applicationName || 'T24',
      routineDetails: form.routineDetails || '',
      subroutineDetails: form.subroutineDetails || '',
      versionInfo: form.versionInfo || '',
      needBackendAccess: form.needBackendAccess || 'No',
      needCoreFtpAccess: form.needCoreFtpAccess || 'No',
      needBrowserAccess: form.needBrowserAccess || 'Yes',
      browserPortChange: form.browserPortChange || 'No',
      duringTxHour: form.duringTxHour || 'No',
      numTeamMembers: form.numTeamMembers || parsedImplementers.length,
      approxScheduleStart: form.approxScheduleStart || '20:00',
      approxScheduleEnd: form.approxScheduleEnd || '23:00',
      execScheduleStart: form.execScheduleStart || '',
      execScheduleEnd: form.execScheduleEnd || '',
      impact: form.impact || 'None',
      requesterName: form.requesterName || '',
      requesterDesignation: form.requesterDesignation || '',
      requesterOrganization: form.requesterOrganization || 'Janata Bank PLC'
    });
    setImplementers(parsedImplementers);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        implementersJson: JSON.stringify(implementers)
      };

      const url = editingId ? `/api/taz-committee-forms/${editingId}` : '/api/taz-committee-forms';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast(editingId ? 'ফর্ম সফলভাবে আপডেট করা হয়েছে!' : 'নতুন ফর্ম সফলভাবে তৈরি হয়েছে!', 'success');
        handleReset();
        loadForms();
      } else {
        const err = await res.json();
        showToast(err.error || 'ফর্ম সংরক্ষণ করতে ব্যর্থ হয়েছে।', 'error');
      }
    } catch (err) {
      logger.error('Error submitting taz form:', err);
      showToast('সার্ভারে যোগাযোগ করতে ব্যর্থ হয়েছে।', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('আপনি কি নিশ্চিত যে এই ফর্মটি মুছে ফেলতে চান?')) return;
    try {
      const res = await fetch(`/api/taz-committee-forms/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('ফর্ম সফলভাবে মুছে ফেলা হয়েছে!', 'success');
        loadForms();
      } else {
        showToast('ফর্ম মুছতে ব্যর্থ হয়েছে।', 'error');
      }
    } catch (err) {
      logger.error('Error deleting form:', err);
      showToast('সার্ভার এরর।', 'error');
    }
  };

  return {
    forms,
    employees,
    cells,
    holidays,
    loading,
    isSubmitting,
    editingId,
    formData,
    implementers,
    searchQuery,
    setSearchQuery,
    filterMonth,
    setFilterMonth,
    previewForm,
    setPreviewForm,
    handleInputChange,
    handleAddImplementer,
    handleRemoveImplementer,
    handleUpdateImplementer,
    handleReset,
    handleEdit,
    handleSubmit,
    handleDelete
  };
}
