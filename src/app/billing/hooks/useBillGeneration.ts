import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import logger from '@/lib/logger';
import { toBanglaDigits, getBanglaNumberWords } from '@/lib/bengali-converter';
import { getShortDesignation } from '@/lib/print-helpers';
import { 
  OfficeOrder, 
  DutyListEntry, 
  getPrintCategoryRates 
} from '../types';

interface UseBillGenerationProps {
  billing: any;
}

export function useBillGeneration({ billing }: UseBillGenerationProps) {
  const isFirstLoadRef = useRef(true);
  const isInitializingArchiveRef = useRef(false);

  const [isPrintMode, setIsPrintMode] = useState(false);
  const [isEditingArchive, setIsEditingArchive] = useState(false);
  const [billGenerated, setBillGenerated] = useState(false);

  const [billDate, setBillDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [subjectText, setSubjectText] = useState('যাতায়াত ও আপ্যায়ন ভাতা প্রদান প্রসঙ্গে।');
  const [representativeName, setRepresentativeName] = useState('জনাব শাহনেওয়াজ মাহমুদ');
  const [representativeDesignation, setRepresentativeDesignation] = useState('এসও-আইটি');
  const [openingParagraph, setOpeningParagraph] = useState('');
  const [selectedExecutiveId, setSelectedExecutiveId] = useState('');
  const [signingOfficer, setSigningOfficer] = useState('জনাব মোহাম্মদ সোহরাব হোসেন');
  const [signingDesignation, setSigningDesignation] = useState('উপ-মহাব্যবস্থাপক');

  const [archiving, setArchiving] = useState(false);
  const [billRef, setBillRef] = useState('');
  const [originalBillRef, setOriginalBillRef] = useState('');
  const [initialBillValues, setInitialBillValues] = useState<{
    printCategory: 'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT';
    billDate: string;
    representativeName: string;
    subjectText: string;
    openingParagraph: string;
    signingOfficer: string;
    signingDesignation: string;
  } | null>(null);

  const [msgBanner, setMsgBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showUrlBanner, setShowUrlBanner] = useState(false);

  // Set default executive
  useEffect(() => {
    if (billing.executives.length > 0 && !selectedExecutiveId) {
      const defaultExec = billing.executives.find((ex: any) => ex.name.includes('মোহাম্মদ সোহরাব হোসেন') || ex.designation.includes('উপ-মহাব্যবস্থাপক')) || billing.executives[0];
      if (defaultExec) {
        setSelectedExecutiveId(defaultExec.id.toString());
        setSigningOfficer(defaultExec.name);
        setSigningDesignation(defaultExec.designation);
      }
    }
  }, [billing.executives, selectedExecutiveId]);

  // Read URL query params on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const orderRefParam = params.get('orderRef');
      const categoryParam = params.get('category');
      const msg = params.get('msg');
      
      let matched = false;
      if (orderRefParam) {
        billing.setSelectedOrderRef(orderRefParam);
        matched = true;
      }
      if (categoryParam) {
        billing.setPrintCategory(categoryParam as 'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT');
        matched = true;
      }
      if (matched) {
        setShowUrlBanner(true);
      }
      if (msg === 'success') {
        setMsgBanner({ type: 'success', text: 'আপনার সম্পাদনা সফল হয়েছে।' });
        const newUrl = window.location.pathname + window.location.search.replace(/[?&]msg=success/, '').replace(/^&/, '?');
        window.history.replaceState({}, '', newUrl);
      } else if (msg === 'cancel') {
        setMsgBanner({ type: 'error', text: 'অপারেশন বা সম্পাদনা বাতিল করা হয়েছে।' });
        const newUrl = window.location.pathname + window.location.search.replace(/[?&]msg=cancel/, '').replace(/^&/, '?');
        window.history.replaceState({}, '', newUrl);
      }
    }
  }, []);

  const isBillDirty = useMemo(() => {
    if (!isEditingArchive || !initialBillValues) return false;
    
    if (billing.printCategory !== initialBillValues.printCategory) return true;
    if (billDate !== initialBillValues.billDate) return true;
    if (representativeName !== initialBillValues.representativeName) return true;
    if (subjectText !== initialBillValues.subjectText) return true;
    if (openingParagraph !== initialBillValues.openingParagraph) return true;
    if (signingOfficer !== initialBillValues.signingOfficer) return true;
    if (signingDesignation !== initialBillValues.signingDesignation) return true;
    
    return false;
  }, [
    isEditingArchive,
    initialBillValues,
    billing.printCategory,
    billDate,
    representativeName,
    subjectText,
    openingParagraph,
    signingOfficer,
    signingDesignation
  ]);

  // Sync billRef dynamically
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('edit_ref')) {
        const hasRepChanged = initialBillValues && representativeName !== initialBillValues.representativeName;
        const hasCategoryChanged = initialBillValues && billing.printCategory !== initialBillValues.printCategory;
        if (!hasRepChanged && !hasCategoryChanged) {
          return;
        }
      }
    }

    let repName = 'ইমন';
    if (representativeName) {
      repName = representativeName.replace(/^জনাব\s+/, '');
    }
    
    const targetOrderRef = billing.selectedOrderRef || billing.baseOrderRef;
    
    if (targetOrderRef) {
      const parts = targetOrderRef.split('/');
      if (parts.length >= 3) {
        parts[2] = repName;
      }
      const val = parts.join('/') + '/বিল';
      setTimeout(() => {
        setBillRef(val);
      }, 0);
    } else {
      const catBangla = billing.printCategory === 'LATE_SITTING' ? 'লেট-সিটিং' : billing.printCategory === 'HOLIDAY' ? 'অফ-ডে' : 'নাইট';
      const bnYear = toBanglaDigits('2026');
      const bnRand = toBanglaDigits(billing.randomNumber);
      const val = `৯১০৩/ডেভ/${repName}/${catBangla}/অফিস-নির্দেশ/${bnYear}/${bnRand}/বিল`;
      setTimeout(() => {
        setBillRef(val);
      }, 0);
    }
  }, [billing.baseOrderRef, billing.selectedOrderRef, billing.printCategory, representativeName, billing.randomNumber, initialBillValues]);

  // Load archived bill details
  const loadArchivedBill = useCallback(async (editRefVal: string) => {
    isInitializingArchiveRef.current = true;
    try {
      const res = await fetch('/api/office-orders');
      if (res.ok) {
        const orders = await res.json();
        const archivedBill = orders.find((o: OfficeOrder) => o.orderRef === editRefVal);
        if (archivedBill) {
          setIsEditingArchive(true);
          setIsPrintMode(true);
          setOriginalBillRef(editRefVal);
          setBillRef(editRefVal);
          
          if (archivedBill.category && archivedBill.category.startsWith('BILL_')) {
            setTimeout(() => {
              billing.setPrintCategory(archivedBill.category.slice(5) as 'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT');
            }, 0);
          }
          setBillDate(archivedBill.orderDate || new Date().toISOString().split('T')[0]);
          setRepresentativeName(archivedBill.employeeName || '');
          
          let baseRef = editRefVal;
          if (baseRef.endsWith('/বিল')) {
            baseRef = baseRef.replace(/\/বিল$/, '');
          }
          billing.setBaseOrderRef(baseRef);
          billing.setSelectedOrderRef(baseRef);

          if (archivedBill.content) {
            if (archivedBill.content.openingParagraph) {
              setOpeningParagraph(archivedBill.content.openingParagraph);
            }
            if (archivedBill.content.subjectText) {
              setSubjectText(archivedBill.content.subjectText);
            }
            if (archivedBill.content.signingOfficer) {
              setSigningOfficer(archivedBill.content.signingOfficer);
            }
            if (archivedBill.content.signingDesignation) {
              setSigningDesignation(archivedBill.content.signingDesignation);
            }
          }
          let categoryVal: 'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT' = 'LATE_SITTING';
          if (archivedBill.category && archivedBill.category.startsWith('BILL_')) {
            categoryVal = archivedBill.category.slice(5) as 'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT';
          }
          setInitialBillValues({
            printCategory: categoryVal,
            billDate: archivedBill.orderDate || new Date().toISOString().split('T')[0],
            representativeName: archivedBill.employeeName || '',
            subjectText: archivedBill.content?.subjectText || '',
            openingParagraph: archivedBill.content?.openingParagraph || '',
            signingOfficer: archivedBill.content?.signingOfficer || '',
            signingDesignation: archivedBill.content?.signingDesignation || ''
          });
          if (archivedBill.status === 'Generated' || archivedBill.status === 'Modified' || archivedBill.status === 'Generated & Printed' || archivedBill.status === 'Printed') {
            setBillGenerated(true);
          } else {
            setBillGenerated(false);
          }
        }
      }
    } catch (err) {
      console.error('Error loading archived bill for editing:', err);
    } finally {
      setTimeout(() => {
        isInitializingArchiveRef.current = false;
      }, 300);
    }
  }, [billing]);

  // Load archived bill details if edit_ref query param is present
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const editRef = params.get('edit_ref');
    if (editRef) {
      setTimeout(() => {
        loadArchivedBill(editRef);
      }, 0);
    }
  }, [loadArchivedBill]);

  // Load target office order if orderRef is present
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const orderRefParam = params.get('orderRef');
    if (orderRefParam) {
      const targetRef = orderRefParam;
      async function loadTargetOrder() {
        try {
          const [cellRes, orderRes] = await Promise.all([
            fetch('/api/cells'),
            fetch('/api/office-orders')
          ]);
          if (cellRes.ok && orderRes.ok) {
            const localCells = await cellRes.json();
            const orders = await orderRes.json();
            const matchedOrder = orders.find((o: OfficeOrder) => o.orderRef === targetRef);
            if (!matchedOrder) {
              alert('রেফারেন্সকৃত অফিস আদেশটি খুঁজে পাওয়া যায়নি।');
              window.location.href = '/documents';
              return;
            }
            if (matchedOrder.status === 'Deleted') {
              alert('এই অফিস আদেশটি মুছে ফেলা হয়েছে। মুছে ফেলা আদেশের বিল তৈরি করা সম্ভব নয়।');
              window.location.href = '/documents';
              return;
            }
            if (matchedOrder.status !== 'Generated & Printed' && matchedOrder.status !== 'Printed' && matchedOrder.status !== 'Generated' && matchedOrder.status !== 'Modified') {
              alert(`এই অফিস আদেশের বিল তৈরি করা যাবে না। বিল তৈরির পূর্বে অফিস আদেশটি প্রিন্ট অথবা জেনারেটেড অবস্থায় থাকতে হবে (বর্তমান অবস্থা: ${matchedOrder.status})।`);
              window.location.href = '/documents';
              return;
            }

            if (matchedOrder) {
              billing.setSelectedOrderRef(targetRef);
              billing.setPrintCategory(matchedOrder.category as 'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT');
              setIsPrintMode(true);
              
              if (matchedOrder.employeeName) {
                setRepresentativeName(matchedOrder.employeeName);
              }
              
              if (matchedOrder.cellName) {
                const matchedCell = localCells.find((c: any) => c.name === matchedOrder.cellName);
                if (matchedCell) {
                  billing.setSelectedCell(matchedCell.id.toString());
                }
              }
              
              let dutiesList: DutyListEntry[] = (matchedOrder.duties as any) || [];
              if (dutiesList.length === 0 && matchedOrder.dutiesJson) {
                try {
                  dutiesList = JSON.parse(matchedOrder.dutiesJson);
                } catch (e) {
                  console.error('Failed to parse dutiesJson:', e);
                }
              }
              
              let yearMonth = '';
              if (dutiesList.length > 0) {
                const firstDuty = dutiesList[0] as any;
                const firstDate = firstDuty?.date || (Array.isArray(firstDuty?.dates) && firstDuty.dates[0]) || '';
                if (firstDate) {
                  const parts = firstDate.split('-');
                  if (parts.length >= 2) yearMonth = `${parts[0]}-${parts[1]}`;
                }
              }
              if (!yearMonth && matchedOrder.orderDate) {
                const parts = matchedOrder.orderDate.split('-');
                if (parts.length >= 2) yearMonth = `${parts[0]}-${parts[1]}`;
              }
              
              if (yearMonth) {
                billing.setSelectedMonth(yearMonth);
              }
            }
          }
        } catch (err) {
          console.error('Error loading targeted order for billing:', err);
        }
      }
      loadTargetOrder();
    }
  }, []);

  const handlePrintButtonClick = () => {
    if (billing.selectedCategory === 'all') {
      const categoriesWithDuties = new Set<'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT'>();
      billing.duties.forEach((d: any) => {
        if (d.type === 'LATE_SITTING' || d.type === 'HOLIDAY' || d.type === 'NIGHT_SHIFT') {
          categoriesWithDuties.add(d.type);
        }
      });

      if (categoriesWithDuties.size === 0) {
        alert('কোনো ডিউটি পাওয়া যায়নি।');
        return;
      }

      if (categoriesWithDuties.size === 1) {
        const cat = Array.from(categoriesWithDuties)[0];
        billing.handleCategoryChange(cat);
        setIsPrintMode(true);
      } else {
        alert('একাধিক ক্যাটাগরির ডিউটি রয়েছে। অনুগ্রহ করে ফিল্টার প্যানেল থেকে নির্দিষ্ট ক্যাটাগরি ফিল্টার করে প্রিন্ট করুন। প্রথম ক্যাটাগরিটি প্রিন্টের জন্য লোড করা হচ্ছে।');
        const firstCat = Array.from(categoriesWithDuties)[0];
        billing.handleCategoryChange(firstCat);
        setIsPrintMode(true);
      }
    } else {
      setIsPrintMode(true);
    }
  };

  const handleBackToLedger = () => {
    setIsPrintMode(false);
    setIsEditingArchive(false);
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/billing');
    }
    setTimeout(() => {
      billing.fetchDutiesForBilling();
    }, 0);
  };

  const handleCancelEditBill = () => {
    setIsPrintMode(false);
    setIsEditingArchive(false);
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from') || '/documents';
    const redirectUrl = from.includes('?') ? `${from}&msg=cancel` : `${from}?msg=cancel`;
    window.location.assign(redirectUrl);
  };

  const handleLoadBillForEditing = (editRef: string) => {
    if (typeof window !== 'undefined') {
      const currentUrl = window.location.pathname + window.location.search;
      window.history.pushState({}, '', `/billing?edit_ref=${encodeURIComponent(editRef)}&from=${encodeURIComponent(currentUrl)}`);
    }
    loadArchivedBill(editRef);
  };

  const handleGenerateBillFromOrder = (order: OfficeOrder) => {
    if (typeof window !== 'undefined') {
      const currentUrl = window.location.pathname + window.location.search;
      window.history.pushState({}, '', `/billing?orderRef=${encodeURIComponent(order.orderRef)}&from=${encodeURIComponent(currentUrl)}`);
    }
    billing.setSelectedOrderRef(order.orderRef);
    billing.setPrintCategory(order.category as 'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT');
    setIsPrintMode(true);
    
    if (order.employeeName) {
      setRepresentativeName(order.employeeName);
    }
    
    if (order.cellName) {
      const matchedCell = billing.cells.find((c: any) => c.name === order.cellName);
      if (matchedCell) {
        billing.setSelectedCell(matchedCell.id.toString());
      }
    }
    
    let dutiesList: DutyListEntry[] = (order.duties as any) || [];
    if (dutiesList.length === 0 && order.dutiesJson) {
      try {
        dutiesList = JSON.parse(order.dutiesJson);
      } catch (e) {
        console.error('Failed to parse dutiesJson:', e);
      }
    }
    
    let yearMonth = '';
    if (dutiesList.length > 0) {
      const firstDuty = dutiesList[0] as any;
      const firstDate = firstDuty?.date || (Array.isArray(firstDuty?.dates) && firstDuty.dates[0]) || '';
      if (firstDate) {
        const parts = firstDate.split('-');
        if (parts.length >= 2) yearMonth = `${parts[0]}-${parts[1]}`;
      }
    }
    if (!yearMonth && order.orderDate) {
      const parts = order.orderDate.split('-');
      if (parts.length >= 2) yearMonth = `${parts[0]}-${parts[1]}`;
    }
    
    if (yearMonth) {
      billing.setSelectedMonth(yearMonth);
    }
  };

  // Reset billGenerated to false if inputs change
  useEffect(() => {
    if (isFirstLoadRef.current) {
      isFirstLoadRef.current = false;
      return;
    }
    if (isInitializingArchiveRef.current) {
      return;
    }
    logger.debug("Billing input changed, resetting billGenerated to false");
    setBillGenerated(false);
  }, [
    billing.selectedMonth,
    billing.selectedCell,
    billing.selectedCategory,
    billing.printCategory,
    openingParagraph,
    subjectText,
    signingOfficer,
    signingDesignation,
    representativeName,
    billDate
  ]);

  // Sync templates and openingParagraph dynamically based on printCategory
  useEffect(() => {
    let text = '';
    if (billing.printCategory === 'LATE_SITTING') {
      text = 'কর্তৃপক্ষের নির্দেশক্রমে Online Banking Software T-24 বাস্তবায়ন ও উক্ত Software দ্বারা পরিচালিত শাখা সমুহে অপারেশনাল সহায়তা প্রদানের নিমিত্তে অত্র ডিপার্টমেন্টের নিম্নবর্ণিত কর্মকর্তাগণ তাদের নামের পার্শ্বে বর্নিত তারিখে ছুটির পরে অফিসে অবস্থান করেছেন। উল্লেখ্য, গত ০৪/০৯/২০১৪ ইং তারিখে অনুষ্ঠিত র্বোড অব ডিরেক্টরস এর ৩৩৪ তম সভার সিদ্ধান্ত "ঙ" মোতাবেক আইটি কার্যক্রম 24 ঘন্টা নিরবিচ্ছিন্ন সাপোর্ট প্রদানের ক্ষেত্রে ছুটির পরে দায়িত্ব পালনকারী নির্বাহী/কর্মকতাদের অনুকুলে ৩০০/- (যাতায়াত- ২০০/-+আপ্যায়ন-১০০/-) হারে ভাতা প্রদান অনুমোদিত আছে। নিম্নে বর্ণিত নির্বাহী/কর্মকতাদের অনুকূলে যাতায়াত ও আপ্যায়ন ভাতা বাবদ খরচ উল্লেখ করা হলঃ';
    } else if (billing.printCategory === 'NIGHT_SHIFT') {
      text = 'কর্তৃপক্ষের নির্দেশক্রমে Online Banking Software T-24 বাস্তবায়ন ও উক্ত Software দ্বারা পরিচালিত শাখা সমুহে অপারেশনাল সহায়তা প্রদানের নিমিত্তে অত্র ডিপার্টমেন্টের নিম্নবর্ণিত কর্মকর্তাগণ তাদের নামের পার্শ্বে বর্নিত তারিখে রাত্রীকালীন শিফটে অফিসে অবস্থান করেছেন। উল্লেখ্য, গত ০৪/০৯/২০১৪ ইং তারিখে অনুষ্ঠিত র্বোড অব ডিরেক্টরস এর ৩৩৪ তম সভার সিদ্ধান্ত "ঙ" মোতাবেক আইটি কার্যক্রম 24 ঘন্টা নিরবিচ্ছিন্ন সাপোর্ট প্রদানের ক্ষেত্রে রাত্রী জাগরনের জন্য রাত্রীকালীন শিফটের দায়িত্ব পালনকারী নির্বাহী/কর্মকতাদের অনুকুলে ১০০০/- (যাতায়াত- ৪০০/-+আপ্যায়ন-৬০০/-) হারে ভাতা প্রদান অনুমোদিত আছে। নিম্নে বর্ণিত নির্বাহী/কর্মকতাদের অনুকূলে যাতায়াত ও আপ্যায়ন ভাতা বাবদ খরচ উল্লেখ করা হলঃ';
    } else if (billing.printCategory === 'HOLIDAY') {
      text = 'কর্তৃপক্ষের নির্দেশক্রমে Online Banking Software T-24 বাস্তবায়ন ও উক্ত Software দ্বারা পরিচালিত শাখা সমুহে অপারেশনাল সহায়তা প্রদানের নিমিত্তে অত্র ডিপার্টমেন্টের নিম্নবর্ণিত কর্মকর্তাগণ তাদের নামের পার্শ্বে বর্নিত তারিখে ছুটির দিনে অফিসে অবস্থান করেছেন। উল্লেখ্য, গত ০৪/০৯/২০১৪ ইং তারিখে অনুষ্ঠিত র্বোড অব ডিরেক্টরস এর ৩৩৪ তম সভার সিদ্ধান্ত "ঙ" মোতাবেক আইটি কার্যক্রম 24 ঘন্টা নিরবিচ্ছিন্ন সাপোর্ট প্রদানের ক্ষেত্রে ছুটির দিনে দায়িত্ব পালনকারী নির্বাহী/কর্মকতাদের অনুকুলে ৫০০/- (যাতায়াত- ২৫০/-+আপ্যায়ন-২৫০/-) হারে ভাতা প্রদান অনুমোদিত আছে। নিম্নে বর্ণিত নির্বাহী/কর্মকতাদের অনুকূলে যাতায়াত ও আপ্যায়ন ভাতা বাবদ খরচ উল্লেখ করা হলঃ';
    }
    setTimeout(() => {
      setOpeningParagraph(text);
    }, 0);
  }, [billing.printCategory]);

  // Representative payee auto-selection
  const lastSelectedOrderRefForPayee = useRef<string | null>(null);
  const lastPrintCategoryForPayee = useRef<string | null>(null);

  useEffect(() => {
    if (isEditingArchive) {
      lastSelectedOrderRefForPayee.current = billing.selectedOrderRef;
      lastPrintCategoryForPayee.current = billing.printCategory;
      return;
    }

    const hasOrderRefChanged = lastSelectedOrderRefForPayee.current !== billing.selectedOrderRef;
    const hasCategoryChanged = lastPrintCategoryForPayee.current !== billing.printCategory;
    
    if (hasOrderRefChanged || hasCategoryChanged) {
      lastSelectedOrderRefForPayee.current = billing.selectedOrderRef;
      lastPrintCategoryForPayee.current = billing.printCategory;

      if (billing.selectedOrderRef && billing.archivedOrders.length > 0) {
        const matchedOrder = billing.archivedOrders.find((o: any) => {
          if (!o.orderRef) return false;
          return o.orderRef.replace(/\/বিল$/, '') === billing.selectedOrderRef.replace(/\/বিল$/, '');
        });
        if (matchedOrder && matchedOrder.employeeName) {
          const nameVal = matchedOrder.employeeName;
          const matchedEmp = billing.employees.find((e: any) => e.name === nameVal);
          const desigVal = matchedEmp ? getShortDesignation(matchedEmp.designation) : 'এসও-আইটি';
          setTimeout(() => {
            setRepresentativeName(nameVal);
            setRepresentativeDesignation(desigVal);
          }, 0);
          return;
        }
      }

      if (billing.printFilteredSummaries.length > 0) {
        const nameVal = billing.printFilteredSummaries[0].name;
        const desigVal = getShortDesignation(billing.printFilteredSummaries[0].designation);
        setTimeout(() => {
          setRepresentativeName(nameVal);
          setRepresentativeDesignation(desigVal);
        }, 0);
      } else {
        setTimeout(() => {
          setRepresentativeName('');
          setRepresentativeDesignation('');
        }, 0);
      }
    }
  }, [billing.duties, billing.printCategory, billing.selectedOrderRef, billing.archivedOrders, billing.employees, billing.printFilteredSummaries, isEditingArchive]);

  // Handle Generate and Print Actions
  const handleGenerateAndPrint = async (action: 'generate' | 'print' | 'download') => {
    setArchiving(true);
    billing.setArchiveSuccess(null);
    billing.setArchiveError(null);
    
    try {
      const formatMonthName = (monthStr: string) => {
        if (!monthStr || monthStr === 'all') {
          const today = new Date();
          const mm = String(today.getMonth() + 1).padStart(2, '0');
          monthStr = `${today.getFullYear()}-${mm}`;
        }
        const [year, month] = monthStr.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, 1);
        const monthName = date.toLocaleString('en-US', { month: 'long' });
        return `${monthName}-${year}`;
      };
      
      const billingMonthName = formatMonthName(billing.selectedMonth);
      const { transportRate, apyaonRate } = getPrintCategoryRates(billing.printCategory);

      const summariesPayload = billing.printFilteredSummaries.map((s: any) => {
        const days = billing.printCategory === 'LATE_SITTING' ? s.lateDays : billing.printCategory === 'HOLIDAY' ? s.holidayDays : s.nightDays;
        const totalTransport = days * transportRate;
        const totalApyaon = days * apyaonRate;
        const empTotal = totalTransport + totalApyaon;
        return {
          name: s.name,
          designation: s.designation,
          bankId: s.bankId || '',
          days: days,
          apyaonRate: apyaonRate,
          totalApyaon: totalApyaon,
          totalTransport: totalTransport,
          grandTotal: empTotal,
          datesFormatted: billing.formatWorkedDatesForCategory(s.employeeId)
        };
      });

      const matchedCellObj = billing.cells.find((c: any) => c.id.toString() === billing.selectedCell);
      const cellName = matchedCellObj ? matchedCellObj.name : (billing.selectedCell === 'all' ? 'All Cells' : 'IT Department');

      const backingOrder = billing.archivedOrders.find((o: any) => {
        if (!o.orderRef) return false;
        const cleanO = o.orderRef.replace(/\/বিল$/, '');
        const cleanS = billing.selectedOrderRef.replace(/\/বিল$/, '');
        return cleanO === cleanS && !o.category?.startsWith('BILL_');
      });

      const archivePayload = {
        orderRef: billRef,
        originalOrderRef: isEditingArchive ? originalBillRef : undefined,
        orderDate: billDate,
        category: "BILL_" + billing.printCategory,
        employeeName: representativeName,
        cellName: cellName,
        status: action === 'generate' ? 'Generated' : 'Printed',
        duties: summariesPayload.map((s: any) => ({
          employeeId: s.bankId,
          employeeName: s.name,
          designation: s.designation,
          days: s.days,
          apyaonRate: s.apyaonRate,
          totalApyaon: s.totalApyaon,
          totalTransport: s.totalTransport,
          grandTotal: s.grandTotal,
          datesFormatted: s.datesFormatted
        })),
        dutyIds: billing.duties
          .filter((d: any) => {
            if (!d.orderRef || d.type !== billing.printCategory) return false;
            const cleanD = d.orderRef.replace(/\/বিল$/, '');
            const cleanSel = billing.selectedOrderRef.replace(/\/বিল$/, '');
            const cleanBase = billing.baseOrderRef.replace(/\/বিল$/, '');
            const cleanBill = billRef.replace(/\/বিল$/, '');
            const cleanOrig = (isEditingArchive ? originalBillRef : '').replace(/\/বিল$/, '');
            return (
              cleanD === cleanSel ||
              cleanD === cleanBase ||
              cleanD === cleanBill ||
              (cleanOrig && cleanD === cleanOrig)
            );
          })
          .map((d: any) => d.id),
        content: {
          openingParagraph: openingParagraph,
          totalDays: billing.totalDaysAll,
          totalApyaon: billing.totalApyaonAll,
          totalTransport: billing.totalTransportAll,
          grandTotal: billing.grandTotalPrintAll,
          grandTotalInWords: getBanglaNumberWords(billing.grandTotalPrintAll),
          signingOfficer: signingOfficer,
          signingDesignation: signingDesignation,
          representativeDesignation: representativeDesignation,
          subjectText: subjectText,
          backingOrderId: backingOrder ? backingOrder.id : null,
          backingOrderRef: backingOrder ? backingOrder.orderRef : (billing.selectedOrderRef || null),
          backingOrderDate: backingOrder ? backingOrder.orderDate : null
        }
      };

      const archiveRes = await fetch('/api/office-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(archivePayload),
      });

      if (!archiveRes.ok) {
        throw new Error('Failed to archive bill memo metadata');
      }
      logger.info('Bill memo metadata archived successfully!');

      if (action === 'generate') {
        const payload = {
          billingMonth: billingMonthName,
          openingParagraph: openingParagraph,
          summaries: summariesPayload,
          totalDays: billing.totalDaysAll,
          totalApyaon: billing.totalApyaonAll,
          totalTransport: billing.totalTransportAll,
          grandTotal: billing.grandTotalPrintAll,
          grandTotalInWords: getBanglaNumberWords(billing.grandTotalPrintAll),
          signingOfficer: signingOfficer,
          signingDesignation: signingDesignation,
          representativeName: representativeName,
          representativeDesignation: representativeDesignation,
          subjectText: subjectText,
          billDate: billDate,
          transportRate: transportRate,
          apyaonRate: apyaonRate,
          totalTransportInWords: getBanglaNumberWords(billing.totalTransportAll),
          totalApyaonInWords: getBanglaNumberWords(billing.totalApyaonAll),
          billRef: billRef,
          actionType: 'GENERATE_BILL'
        };

        const res = await fetch('/api/documents/generate-bill-memo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          setBillGenerated(true);
          billing.setArchiveSuccess('বিল মেমো সফলভাবে জেনারেট এবং সংরক্ষণ করা হয়েছে!');
          billing.fetchDutiesForBilling();
          if (isEditingArchive) {
            const params = new URLSearchParams(window.location.search);
            const from = params.get('from') || '/documents';
            const redirectUrl = from.includes('?') ? `${from}&msg=success` : `${from}?msg=success`;
            window.location.assign(redirectUrl);
          }
        } else {
          throw new Error('Failed to generate PDF');
        }
      } else if (action === 'download') {
        const payload = {
          billingMonth: billingMonthName,
          openingParagraph: openingParagraph,
          summaries: summariesPayload,
          totalDays: billing.totalDaysAll,
          totalApyaon: billing.totalApyaonAll,
          totalTransport: billing.totalTransportAll,
          grandTotal: billing.grandTotalPrintAll,
          grandTotalInWords: getBanglaNumberWords(billing.grandTotalPrintAll),
          signingOfficer: signingOfficer,
          signingDesignation: signingDesignation,
          representativeName: representativeName,
          representativeDesignation: representativeDesignation,
          subjectText: subjectText,
          billDate: billDate,
          transportRate: transportRate,
          apyaonRate: apyaonRate,
          totalTransportInWords: getBanglaNumberWords(billing.totalTransportAll),
          totalApyaonInWords: getBanglaNumberWords(billing.totalApyaonAll),
          billRef: billRef,
          actionType: 'DOWNLOAD_BILL_PDF'
        };

        const res = await fetch('/api/documents/generate-bill-memo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const data = await res.json();
          if (data.filePath) {
            window.open(data.filePath, '_blank');
          }
          setIsPrintMode(false);
          setIsEditingArchive(false);
          if (typeof window !== 'undefined') {
            window.history.pushState({}, '', '/billing');
          }
          billing.fetchDutiesForBilling();
        } else {
          throw new Error('Failed to generate PDF');
        }
      } else if (action === 'print') {
        const payload = {
          billingMonth: billingMonthName,
          openingParagraph: openingParagraph,
          summaries: summariesPayload,
          totalDays: billing.totalDaysAll,
          totalApyaon: billing.totalApyaonAll,
          totalTransport: billing.totalTransportAll,
          grandTotal: billing.grandTotalPrintAll,
          grandTotalInWords: getBanglaNumberWords(billing.grandTotalPrintAll),
          signingOfficer: signingOfficer,
          signingDesignation: signingDesignation,
          representativeName: representativeName,
          representativeDesignation: representativeDesignation,
          subjectText: subjectText,
          billDate: billDate,
          transportRate: transportRate,
          apyaonRate: apyaonRate,
          totalTransportInWords: getBanglaNumberWords(billing.totalTransportAll),
          totalApyaonInWords: getBanglaNumberWords(billing.totalApyaonAll),
          billRef: billRef,
          actionType: 'PRINT_BILL'
        };

        await fetch('/api/documents/generate-bill-memo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        setTimeout(() => {
          window.print();
          setIsPrintMode(false);
          setIsEditingArchive(false);
          if (typeof window !== 'undefined') {
            window.history.pushState({}, '', '/billing');
          }
          billing.fetchDutiesForBilling();
        }, 100);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'বিল মেমো প্রসেস করতে ব্যর্থ হয়েছে।';
      console.error('Error in handleGenerateAndPrint:', err);
      billing.setArchiveError(errorMsg);
      setTimeout(() => billing.setArchiveError(null), 5000);
    } finally {
      setArchiving(false);
    }
  };

  return {
    isPrintMode,
    setIsPrintMode,
    isEditingArchive,
    setIsEditingArchive,
    billGenerated,
    setBillGenerated,
    billDate,
    setBillDate,
    subjectText,
    setSubjectText,
    representativeName,
    setRepresentativeName,
    representativeDesignation,
    setRepresentativeDesignation,
    openingParagraph,
    setOpeningParagraph,
    selectedExecutiveId,
    setSelectedExecutiveId,
    signingOfficer,
    setSigningOfficer,
    signingDesignation,
    setSigningDesignation,
    archiving,
    setArchiving,
    billRef,
    setBillRef,
    originalBillRef,
    setOriginalBillRef,
    initialBillValues,
    setInitialBillValues,
    msgBanner,
    setMsgBanner,
    showUrlBanner,
    setShowUrlBanner,
    isBillDirty,
    loadArchivedBill,
    handlePrintButtonClick,
    handleBackToLedger,
    handleCancelEditBill,
    handleLoadBillForEditing,
    handleGenerateBillFromOrder,
    handleGenerateAndPrint
  };
}
