import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import logger from '@/lib/logger';
import { toBanglaDigits } from '@/lib/bengali-converter';
import { getShortDesignation, sortDatesStringAscending } from '@/lib/print-helpers';
import { UserProfile, UserCell } from '@/context/ProfileContext';
import {
  Cell,
  Employee,
  Executive,
  OfficeOrder,
  OrderDuty,
  Duty,
  EmployeeBillingSummary,
  BillGroup,
  ReportData,
  DutyListEntry,
  getSlotName,
  getNormalizedRef,
  getSeniorityRank,
  getPrintCategoryRates,
  userHasAccessToOrder
} from '../types';

export function useBillingData(currentUser: UserProfile | null | undefined) {
  const [cells, setCells] = useState<Cell[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [executives, setExecutives] = useState<Executive[]>([]);
  const [duties, setDuties] = useState<Duty[]>([]);
  const [archivedOrders, setArchivedOrders] = useState<OfficeOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedCell, setSelectedCell] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [printCategory, setPrintCategory] = useState<'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT'>('LATE_SITTING');

  const [selectedOrderRef, setSelectedOrderRef] = useState<string>('');
  const [pendingOrderRefs, setPendingOrderRefs] = useState<string[]>([]);
  const [billedOrderRefs, setBilledOrderRefs] = useState<string[]>([]);
  const [baseOrderRef, setBaseOrderRef] = useState('');
  const [randomNumber] = useState(() => Math.floor(10 + Math.random() * 90));

  const [reportDate, setReportDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [expandedSlots, setExpandedSlots] = useState<Record<string, boolean>>({});
  const [showOrderWarning, setShowOrderWarning] = useState(false);

  const [archiveSuccess, setArchiveSuccess] = useState<string | null>(null);
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<{ id: number; orderRef: string; isBill: boolean } | null>(null);

  const userCellNamesString = currentUser?.cells?.map((c: UserCell) => c.name).sort().join(',') || '';
  const userRole = currentUser?.role || '';
  const userUsername = currentUser?.username || '';

  // Load Cells, Executives, and Employees list
  useEffect(() => {
    async function loadStaticData() {
      try {
        const [cellRes, execRes, empRes] = await Promise.all([
          fetch('/api/cells'),
          fetch('/api/executives'),
          fetch('/api/employees')
        ]);
        const cellData = await cellRes.json();
        const execData = await execRes.json();
        const empData = await empRes.json();
        setCells(Array.isArray(cellData) ? cellData : []);
        setEmployees(Array.isArray(empData) ? empData : []);
        if (Array.isArray(execData)) {
          const dgmExecs = execData.filter((ex: Executive) => {
            const d = ex.designation.trim().toLowerCase();
            return d.includes('dgm') || d.includes('ডিজিএম') || d.includes('উপ-মহাব্যবস্থাপক');
          });
          const desigPriority: Record<string, number> = {
            'উপ-মহাব্যবস্থাপক': 1
          };
          const sortedExecs = [...dgmExecs].sort((a, b) => {
            const prioA = desigPriority[a.designation] || 99;
            const prioB = desigPriority[b.designation] || 99;
            if (prioA !== prioB) return prioA - prioB;
            return a.id - b.id;
          });
          setExecutives(sortedExecs);
        }
      } catch (err) {
        console.error('Error loading static data:', err);
      }
    }
    loadStaticData();
  }, []);

  // Set default cell for non-admin user
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('orderRef') || params.get('edit_ref')) {
        return;
      }
    }
    if (currentUser && currentUser.role !== 'ADMIN' && employees.length > 0) {
      const matchedEmp = employees.find(e => e.bankId && e.bankId.trim().toLowerCase() === currentUser.username?.trim().toLowerCase());
      const primaryCellId = matchedEmp ? matchedEmp.cellId : (currentUser.cells?.[0]?.id || null);
      if (primaryCellId) {
        setTimeout(() => {
          setSelectedCell(primaryCellId.toString());
        }, 0);
      }
    }
  }, [currentUser, employees]);

  const handleCategoryChange = (val: string) => {
    setSelectedCategory(val);
    if (val !== 'all') {
      setPrintCategory(val as 'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT');
    }
  };

  // Fetch duties based on selected month & filters
  const fetchDutiesForBilling = useCallback(async () => {
    try {
      setLoading(true);
      
      let urlOrderRef = '';
      let urlEditRef = '';
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        urlOrderRef = params.get('orderRef') || '';
        urlEditRef = params.get('edit_ref') || '';
      }
      
      let backingRef = '';
      if (urlEditRef) {
        backingRef = urlEditRef.endsWith('/বিল') ? urlEditRef.replace(/\/বিল$/, '') : urlEditRef;
      }
      const orderRefToFetch = selectedOrderRef || urlOrderRef || backingRef;

      let activeList: Duty[] = [];
      if (orderRefToFetch) {
        const res = await fetch(`/api/duties?orderRef=${encodeURIComponent(orderRefToFetch)}&includeArchived=true`);
        const data = await res.json();
        activeList = Array.isArray(data) ? data : [];
      } else {
        let queryUrl = `/api/duties?includeArchived=true`;
        if (selectedMonth !== 'all') {
          const yearMonth = selectedMonth.split('-');
          const year = yearMonth[0];
          const month = yearMonth[1];
          
          const startDate = `${year}-${month}-01`;
          const lastDay = new Date(parseInt(year, 10), parseInt(month, 10), 0).getDate();
          const endDate = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
          queryUrl += `&startDate=${startDate}&endDate=${endDate}`;
        }
        if (selectedCell !== 'all') {
          queryUrl += `&cellId=${selectedCell}`;
        }
        
        const res = await fetch(queryUrl);
        const data = await res.json();
        activeList = Array.isArray(data) ? data : [];
      }

      if (currentUser && currentUser.role !== 'ADMIN') {
        const userCellNames = currentUser.cells?.map((c: UserCell) => c.name) || [];
        activeList = activeList.filter(d => d.employee?.cell?.name && userCellNames.includes(d.employee.cell.name));
      }

      // Fetch all archived office orders and bills
      const ordersRes = await fetch('/api/office-orders');
      const ordersData = await ordersRes.json();
      let archivedOrdersList: OfficeOrder[] = Array.isArray(ordersData) ? ordersData : [];

      if (currentUser && currentUser.role !== 'ADMIN') {
        archivedOrdersList = archivedOrdersList.filter(o => userHasAccessToOrder(o, currentUser, employees));
      }
      setArchivedOrders(archivedOrdersList);

      const archivedBillNormalizedRefs = new Set(
        archivedOrdersList
          .filter((o: OfficeOrder) => o.category?.startsWith('BILL_') || o.orderRef?.endsWith('/বিল'))
          .map((o: OfficeOrder) => getNormalizedRef(o.orderRef))
      );

      const printedOrderRefs = new Set(
        archivedOrdersList
          .filter((o: OfficeOrder) => !o.category?.startsWith('BILL_') && (o.status === 'Generated & Printed' || o.status === 'Printed' || o.status === 'Generated' || o.status === 'Modified'))
          .map((o: OfficeOrder) => o.orderRef)
      );

      const filteredDuties = activeList.filter((d: Duty) => {
        if (orderRefToFetch) return true;
        if (!d.orderRef) return false;
        if (!printedOrderRefs.has(d.orderRef)) return false;
        if (d.orderRef.endsWith('/বিল')) return false;
        const norm = getNormalizedRef(d.orderRef);
        return !archivedBillNormalizedRefs.has(norm);
      });

      const hasUnbilledDutiesWithoutOrder = activeList.some((d: Duty) => {
        if (!d.orderRef) return true;
        if (d.orderRef.endsWith('/বিল')) return false;
        const norm = getNormalizedRef(d.orderRef);
        if (archivedBillNormalizedRefs.has(norm)) return false;
        return !printedOrderRefs.has(d.orderRef);
      });
      setShowOrderWarning(activeList.length > 0 && hasUnbilledDutiesWithoutOrder && filteredDuties.length === 0);

      // Extract distinct orderRefs for the selected printCategory
      const pendingRefs = Array.from(
        new Set(
          filteredDuties
            .filter((d: Duty) => d.type === printCategory)
            .map((d: Duty) => d.orderRef)
            .filter((ref): ref is string => Boolean(ref))
        )
      ) as string[];

      const billedRefs = Array.from(
        new Set(
          archivedOrdersList
            .filter((o: OfficeOrder) => {
              const isOfficeOrder = o.category === printCategory && (o.status === 'Generated & Printed' || o.status === 'Printed' || o.status === 'Generated' || o.status === 'Modified');
              if (!isOfficeOrder) return false;
              const norm = getNormalizedRef(o.orderRef);
              return archivedBillNormalizedRefs.has(norm);
            })
            .map((o: OfficeOrder) => o.orderRef)
        )
      ) as string[];
      
      if (orderRefToFetch) {
        setPendingOrderRefs([orderRefToFetch]);
        setBilledOrderRefs([]);
        setSelectedOrderRef(orderRefToFetch);
      } else {
        setPendingOrderRefs(pendingRefs);
        setBilledOrderRefs(billedRefs);
        if (pendingRefs.length > 0) {
          setSelectedOrderRef(current => {
            if (!current || (!pendingRefs.includes(current) && !billedRefs.includes(current))) {
              return pendingRefs[0];
            }
            return current;
          });
        } else if (billedRefs.length > 0) {
          setSelectedOrderRef(current => {
            if (!current || (!pendingRefs.includes(current) && !billedRefs.includes(current))) {
              return billedRefs[0];
            }
            return current;
          });
        } else {
          setSelectedOrderRef('');
        }
      }

      setDuties(filteredDuties);
    } catch (err) {
      console.error('Error fetching duties for billing:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedCell, printCategory, selectedOrderRef, userCellNamesString, userRole, userUsername, employees]);

  useEffect(() => {
    setTimeout(() => {
      fetchDutiesForBilling();
    }, 0);
  }, [fetchDutiesForBilling]);

  // Reactive effect to keep baseOrderRef in sync with printCategory and duties
  useEffect(() => {
    const firstDuty = duties.find(d => d.type === printCategory && d.orderRef);
    setTimeout(() => {
      setBaseOrderRef(firstDuty ? firstDuty.orderRef || '' : '');
    }, 0);
  }, [duties, printCategory]);

  const hasDeletePermission = (order: OfficeOrder) => {
    if (!currentUser) return false;
    if (currentUser.role === 'ADMIN') return true;
    const userCellNames = currentUser.cells?.map((c: UserCell) => c.name) || [];
    if (order.cellName && userCellNames.includes(order.cellName)) return true;
    if (order.duties && Array.isArray(order.duties)) {
      return order.duties.some((d: OrderDuty) => d.cellName && userCellNames.includes(d.cellName));
    }
    return false;
  };

  const hasEditPermission = (order: OfficeOrder) => {
    if (!currentUser) return false;
    if (currentUser.role === 'ADMIN') return true;
    const userCellNames = currentUser.cells?.map((c: UserCell) => c.name) || [];
    if (order.cellName && userCellNames.includes(order.cellName)) return true;
    if (order.duties && Array.isArray(order.duties)) {
      return order.duties.some((d: OrderDuty) => d.cellName && userCellNames.includes(d.cellName));
    }
    return false;
  };

  const archivedBillNormalizedRefs = useMemo(() => {
    return new Set(
      archivedOrders
        .filter((o: OfficeOrder) => o.category?.startsWith('BILL_') || o.orderRef?.endsWith('/বিল'))
        .map((o: OfficeOrder) => getNormalizedRef(o.orderRef))
    );
  }, [archivedOrders]);

  const handleDeleteOrder = (id: number) => {
    const order = archivedOrders.find(o => o.id === id);
    if (!order) return;

    if (!hasDeletePermission(order)) {
      alert('দুঃখিত, এই office order/বিল মুছে ফেলার জন্য আপনার পর্যাপ্ত পারমিশন বা অনুমতি নেই।');
      return;
    }

    const isBill = order.category?.startsWith('BILL_');
    setOrderToDelete({ id, orderRef: order.orderRef, isBill: !!isBill });
  };

  const confirmDeleteOrder = async () => {
    if (!orderToDelete) return;
    const { id, isBill } = orderToDelete;

    try {
      const res = await fetch(`/api/office-orders/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setArchiveSuccess(isBill ? 'বিল মেমোটি সফলভাবে মুছে ফেলা হয়েছে।' : 'অফিস আদেশটি সফলভাবে মুছে ফেলা হয়েছে।');
        setTimeout(() => setArchiveSuccess(null), 5000);
        fetchDutiesForBilling();
      } else {
        const errData = await res.json().catch(() => ({}));
        setArchiveError(errData.message || 'মুছে ফেলা সম্ভব হয়নি।');
        setTimeout(() => setArchiveError(null), 5000);
      }
    } catch {
      setArchiveError('সার্ভারে যোগাযোগ করতে ব্যর্থ হয়েছে।');
      setTimeout(() => setArchiveError(null), 5000);
    } finally {
      setOrderToDelete(null);
    }
  };

  const getFilteredOrders = useCallback((type: 'orders' | 'bills') => {
    return archivedOrders.filter((order: OfficeOrder) => {
      if (order.status === 'Deleted') return false;
      const isBill = order.category?.startsWith('BILL_');
      if (type === 'orders' && isBill) return false;
      if (type === 'bills' && !isBill) return false;
      
      if (currentUser && currentUser.role !== 'ADMIN') {
        if (!userHasAccessToOrder(order, currentUser, employees)) {
          return false;
        }
      }

      if (selectedCell !== 'all') {
        const targetCellObj = cells.find(c => c.id.toString() === selectedCell);
        if (targetCellObj && order.cellName !== targetCellObj.name && order.cellName !== 'All Cells' && order.cellName !== 'সকল সেল') {
          let dutiesList: OrderDuty[] = order.duties || [];
          if (dutiesList.length === 0 && order.dutiesJson) {
            try {
              dutiesList = JSON.parse(order.dutiesJson);
            } catch (e) {
              console.error(e);
            }
          }
          let hasTargetCellEmployee = false;
          if (dutiesList.length === 0) {
            if (order.employeeName) {
              const matched = employees.find(e => e.name === order.employeeName);
              if (matched && matched.cell?.name === targetCellObj.name) {
                hasTargetCellEmployee = true;
              }
            }
          } else {
            hasTargetCellEmployee = dutiesList.some((d: OrderDuty) => {
              const empIdStr = d.employeeId ? d.employeeId.toString() : '';
              const empName = d.employeeName || '';
              const matched = employees.find(e => 
                (e.id && e.id.toString() === empIdStr) || 
                (e.bankId && e.bankId.toString() === empIdStr) || 
                (e.name && e.name === empName)
              );
              return matched && matched.cell?.name === targetCellObj.name;
            });
          }
          if (!hasTargetCellEmployee) {
            return false;
          }
        }
      }
      
      if (selectedCategory !== 'all') {
        const expectedCat = type === 'bills' ? `BILL_${selectedCategory}` : selectedCategory;
        if (order.category !== expectedCat) {
          return false;
        }
      }

      if (selectedMonth && selectedMonth !== 'all') {
        if (type === 'bills') {
          if (order.orderDate && !order.orderDate.startsWith(selectedMonth)) {
            return false;
          }
        } else {
          const norm = getNormalizedRef(order.orderRef);
          const bill = archivedOrders.find(o => 
            o.category?.startsWith('BILL_') && 
            o.status !== 'Deleted' && 
            getNormalizedRef(o.orderRef) === norm
          );
          const dateToFilterBy = bill ? bill.orderDate : order.orderDate;
          if (dateToFilterBy && !dateToFilterBy.startsWith(selectedMonth)) {
            return false;
          }
        }
      }
      
      return true;
    });
  }, [archivedOrders, selectedCell, selectedCategory, selectedMonth, cells, currentUser, employees]);

  const filteredOrdersList = useMemo(() => getFilteredOrders('orders'), [getFilteredOrders]);
  const pendingBillingOfficeOrders = useMemo(() => {
    return filteredOrdersList.filter(o => 
      o.status !== 'Deleted' &&
      !archivedBillNormalizedRefs.has(getNormalizedRef(o.orderRef))
    );
  }, [filteredOrdersList, archivedBillNormalizedRefs]);

  const billedOfficeOrders = useMemo(() => {
    return filteredOrdersList.filter(o => 
      o.status !== 'Deleted' &&
      archivedBillNormalizedRefs.has(getNormalizedRef(o.orderRef))
    );
  }, [filteredOrdersList, archivedBillNormalizedRefs]);

  const filteredBillMemos = useMemo(() => getFilteredOrders('bills'), [getFilteredOrders]);
  const allActiveOfficeOrders = useMemo(() => {
    return filteredOrdersList.filter(o => o.status !== 'Deleted');
  }, [filteredOrdersList]);

  const ledgerActiveOfficeOrders = useMemo<OfficeOrder[]>(() => {
    const active = allActiveOfficeOrders;
    if (active.length === 0) return [];

    const orderWithBillingDates = active.map(order => {
      const norm = getNormalizedRef(order.orderRef);
      const bill = archivedOrders.find(o => 
        o.category?.startsWith('BILL_') && 
        o.status !== 'Deleted' && 
        getNormalizedRef(o.orderRef) === norm
      );
      const billingDateStr = bill ? bill.orderDate : order.orderDate;
      const cleanDate = billingDateStr ? billingDateStr.substring(0, 10) : "";
      return { order, cleanDate };
    });

    let latestDateStr = "";
    let latestDateTime = -1;

    orderWithBillingDates.forEach(item => {
      if (item.cleanDate) {
        const t = new Date(item.cleanDate).getTime();
        if (t > latestDateTime) {
          latestDateTime = t;
          latestDateStr = item.cleanDate;
        }
      }
    });

    if (!latestDateStr) return active;

    return orderWithBillingDates
      .filter(item => item.cleanDate === latestDateStr)
      .map(item => item.order);
  }, [allActiveOfficeOrders, archivedOrders]);

  const ledgerGrandTotal = useMemo(() => {
    return ledgerActiveOfficeOrders.reduce((sum: number, order: OfficeOrder) => {
      let dutiesList = order.duties || [];
      if (dutiesList.length === 0 && order.dutiesJson) {
        try {
          dutiesList = JSON.parse(order.dutiesJson);
        } catch (e) {
          console.error(e);
        }
      }
      const totalDays = dutiesList.reduce((dSum: number, d: OrderDuty) => dSum + (Array.isArray(d.dates) ? d.dates.length : (d.days || 0)), 0);
      let transportRate = 200;
      let apyaonRate = 100;
      if (order.category === 'HOLIDAY') {
        transportRate = 250;
        apyaonRate = 250;
      } else if (order.category === 'NIGHT_SHIFT') {
        transportRate = 400;
        apyaonRate = 600;
      }
      return sum + (totalDays * (apyaonRate + transportRate));
    }, 0);
  }, [ledgerActiveOfficeOrders]);

  const billGroups = useMemo(() => {
    const groupsMap = new Map<string, OfficeOrder[]>();
    filteredBillMemos.forEach(o => {
      if (o.orderDate) {
        if (!groupsMap.has(o.orderDate)) {
          groupsMap.set(o.orderDate, []);
        }
        groupsMap.get(o.orderDate)!.push(o);
      }
    });

    const sortedDates = Array.from(groupsMap.keys()).sort().reverse();

    return sortedDates.map(dateStr => {
      const bills = groupsMap.get(dateStr) || [];
      return {
        date: dateStr,
        name: getSlotName(dateStr),
        bills: bills
      };
    });
  }, [filteredBillMemos]);

  // Aggregate duties by employee for billing ledger
  const billingSummaries = useMemo((): EmployeeBillingSummary[] => {
    const map = new Map<number, EmployeeBillingSummary>();
    
    let activeDuties = selectedOrderRef
      ? duties.filter(d => {
          if (!d.orderRef) return false;
          return getNormalizedRef(d.orderRef) === getNormalizedRef(selectedOrderRef);
        })
      : duties;
      
    if (selectedCategory !== 'all') {
      activeDuties = activeDuties.filter(d => d.type === selectedCategory);
    }
      
    if (selectedOrderRef && activeDuties.length === 0) {
      const backingOrder = archivedOrders.find(o => {
        if (!o.orderRef || o.category?.startsWith('BILL_')) return false;
        return getNormalizedRef(o.orderRef) === getNormalizedRef(selectedOrderRef);
      });

      if (backingOrder) {
        let orderDutiesList: OrderDuty[] = [];
        if (backingOrder.duties && backingOrder.duties.length > 0) {
          orderDutiesList = backingOrder.duties;
        } else if (backingOrder.dutiesJson) {
          try {
            orderDutiesList = JSON.parse(backingOrder.dutiesJson);
          } catch (e) {
            console.error('Failed to parse dutiesJson fallback:', e);
          }
        }

        const { transportRate: tRate, apyaonRate: aRate } = getPrintCategoryRates(printCategory);

        orderDutiesList.forEach((od, idx) => {
          const empId = Number(od.employeeId) || idx + 10000;
          const name = od.employeeName || od.name || '';
          const designation = od.designation || '';
          const dates = od.dates || [];
          const days = dates.length || od.days || 0;

          const totalApyaon = days * aRate;
          const totalTransport = days * tRate;
          const grandTotal = totalApyaon + totalTransport;

          if (selectedCategory !== 'all' && printCategory !== selectedCategory) {
            return;
          }

          const sortedDates = [...dates].sort((a, b) => a.localeCompare(b));
          const formatted = sortedDates.map(dStr => {
            const [year, month, day] = dStr.split('-');
            const bnDay = toBanglaDigits(day.padStart(2, '0'));
            const bnMonth = toBanglaDigits(month.padStart(2, '0'));
            const bnYear = toBanglaDigits(year);
            return `${bnDay}-${bnMonth}-${bnYear}`;
          }).join(', ');

          map.set(empId, {
            employeeId: empId,
            name,
            designation,
            cellName: backingOrder.cellName || '',
            bankId: String(od.employeeId || ''),
            fileNo: od.fileNo || '',
            lateDays: printCategory === 'LATE_SITTING' ? days : 0,
            lateAllowance1: printCategory === 'LATE_SITTING' ? totalApyaon : 0,
            lateAllowance2: printCategory === 'LATE_SITTING' ? totalTransport : 0,
            holidayDays: printCategory === 'HOLIDAY' ? days : 0,
            holidayAllowance1: printCategory === 'HOLIDAY' ? totalApyaon : 0,
            holidayAllowance2: printCategory === 'HOLIDAY' ? totalTransport : 0,
            nightDays: printCategory === 'NIGHT_SHIFT' ? days : 0,
            nightAllowance1: printCategory === 'NIGHT_SHIFT' ? totalApyaon : 0,
            nightAllowance2: printCategory === 'NIGHT_SHIFT' ? totalTransport : 0,
            grandTotal: grandTotal,
            datesFormatted: formatted
          });
        });

        return Array.from(map.values()).sort((a, b) => {
          const rankA = getSeniorityRank(a.designation);
          const rankB = getSeniorityRank(b.designation);
          if (rankA !== rankB) {
            return rankA - rankB;
          }
          return b.grandTotal - a.grandTotal;
        });
      }
    }

    activeDuties.forEach(duty => {
      const emp = duty.employee;
      if (!emp) return;
      if (!map.has(emp.id)) {
        map.set(emp.id, {
          employeeId: emp.id,
          name: emp.name,
          designation: emp.designation,
          cellName: emp.cell?.name || '',
          bankId: emp.bankId,
          fileNo: emp.fileNo,
          lateDays: 0,
          lateAllowance1: 0,
          lateAllowance2: 0,
          holidayDays: 0,
          holidayAllowance1: 0,
          holidayAllowance2: 0,
          nightDays: 0,
          nightAllowance1: 0,
          nightAllowance2: 0,
          grandTotal: 0
        });
      }
      
      const summary = map.get(emp.id)!;
      
      if (duty.type === 'LATE_SITTING') {
        summary.lateDays++;
        summary.lateAllowance1 += duty.allowance1; 
        summary.lateAllowance2 += duty.allowance2; 
      } else if (duty.type === 'HOLIDAY') {
        summary.holidayDays++;
        summary.holidayAllowance1 += duty.allowance1; 
        summary.holidayAllowance2 += duty.allowance2; 
      } else if (duty.type === 'NIGHT_SHIFT') {
        summary.nightDays++;
        summary.nightAllowance1 += duty.allowance1; 
        summary.nightAllowance2 += duty.allowance2; 
      }
      
      summary.grandTotal += duty.totalBill;
    });
    
    return Array.from(map.values()).sort((a, b) => {
      const rankA = getSeniorityRank(a.designation);
      const rankB = getSeniorityRank(b.designation);
      if (rankA !== rankB) {
        return rankA - rankB;
      }
      return b.grandTotal - a.grandTotal;
    });
  }, [duties, selectedOrderRef, selectedCategory, printCategory, archivedOrders]);

  const printFilteredSummaries = useMemo(() => {
    return billingSummaries.filter(s => {
      if (printCategory === 'LATE_SITTING') return s.lateDays > 0;
      if (printCategory === 'HOLIDAY') return s.holidayDays > 0;
      if (printCategory === 'NIGHT_SHIFT') return s.nightDays > 0;
      return false;
    });
  }, [billingSummaries, printCategory]);

  const formatWorkedDatesForCategory = useCallback((empId: number) => {
    const summary = billingSummaries.find(s => s.employeeId === empId);
    if (summary && summary.datesFormatted) {
      return sortDatesStringAscending(summary.datesFormatted);
    }

    const empDuties = duties.filter(d => d.employeeId === empId && d.type === printCategory);
    if (empDuties.length === 0) return '';
    const sorted = [...empDuties].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const formattedDates = sorted.map(d => {
      const [year, month, day] = d.date.split('-');
      const bnDay = toBanglaDigits(parseInt(day, 10).toString().padStart(2, '0'));
      const bnMonth = toBanglaDigits(parseInt(month, 10).toString().padStart(2, '0'));
      const bnYear = toBanglaDigits(year);
      return `${bnDay}-${bnMonth}-${bnYear}`;
    });
    
    return formattedDates.join(', ');
  }, [billingSummaries, duties, printCategory]);

  const { transportRate, apyaonRate } = getPrintCategoryRates(printCategory);

  const totalTransportAll = useMemo(() => {
    return printFilteredSummaries.reduce((sum, s) => {
      const days = printCategory === 'LATE_SITTING' ? s.lateDays : printCategory === 'HOLIDAY' ? s.holidayDays : s.nightDays;
      return sum + (days * transportRate);
    }, 0);
  }, [printFilteredSummaries, printCategory, transportRate]);

  const totalApyaonAll = useMemo(() => {
    return printFilteredSummaries.reduce((sum, s) => {
      const days = printCategory === 'LATE_SITTING' ? s.lateDays : printCategory === 'HOLIDAY' ? s.holidayDays : s.nightDays;
      return sum + (days * apyaonRate);
    }, 0);
  }, [printFilteredSummaries, printCategory, apyaonRate]);

  const grandTotalPrintAll = totalTransportAll + totalApyaonAll;

  const totalDaysAll = useMemo(() => {
    return printFilteredSummaries.reduce((sum, s) => {
      const days = printCategory === 'LATE_SITTING' ? s.lateDays : printCategory === 'HOLIDAY' ? s.holidayDays : s.nightDays;
      return sum + days;
    }, 0);
  }, [printFilteredSummaries, printCategory]);

  // Consolidated Daily Report Calculations
  const reportData = useMemo<ReportData>(() => {
    const targetBills = archivedOrders.filter(o => 
      o.category?.startsWith('BILL_') && 
      o.orderDate === reportDate &&
      o.status !== 'Deleted'
    );

    let totalBillsCount = targetBills.length;
    let totalDays = 0;
    let totalTransport = 0;
    let totalApyaon = 0;
    let grandTotal = 0;

    let lateSittingAmount = 0;
    let holidayAmount = 0;
    let nightShiftAmount = 0;

    const cleanName = (n: string) => (n || '').replace(/^(জনাব|জনাবা|ডাঃ|ড\.)\s*/, '').replace(/\s+/g, ' ').trim().toLowerCase();

    const empMap = new Map<string, any>();

    targetBills.forEach(bill => {
      let dutiesList: OrderDuty[] = (bill.duties as OrderDuty[]) || [];
      if (dutiesList.length === 0 && bill.dutiesJson) {
        try {
          dutiesList = JSON.parse(bill.dutiesJson);
        } catch (e) {
          console.error('Failed to parse bill dutiesJson in report:', e);
        }
      }

      const isLateSitting = bill.category === 'BILL_LATE_SITTING';
      const isHoliday = bill.category === 'BILL_HOLIDAY';
      const isNight = bill.category === 'BILL_NIGHT_SHIFT';

      dutiesList.forEach(duty => {
        const name = duty.employeeName || duty.name || '';
        const designation = duty.designation || '';
        const days = Number(duty.days || (duty.dates && duty.dates.length) || 0);
        const transport = Number(duty.totalTransport || 0);
        const apyaon = Number(duty.totalApyaon || 0);
        const total = Number(duty.grandTotal || (transport + apyaon) || 0);

        totalDays += days;
        totalTransport += transport;
        totalApyaon += apyaon;
        grandTotal += total;

        if (isLateSitting) lateSittingAmount += total;
        if (isHoliday) holidayAmount += total;
        if (isNight) nightShiftAmount += total;

        const empKey = cleanName(name);

        if (!empMap.has(empKey)) {
          empMap.set(empKey, {
            employeeName: name,
            designation: designation,
            lateSittingDays: 0,
            lateSittingAmount: 0,
            holidayDays: 0,
            holidayAmount: 0,
            nightShiftDays: 0,
            nightShiftAmount: 0,
            totalDays: 0,
            grandTotal: 0
          });
        }

        const record = empMap.get(empKey)!;
        record.totalDays += days;
        record.grandTotal += total;

        if (isLateSitting) {
          record.lateSittingDays += days;
          record.lateSittingAmount += total;
        } else if (isHoliday) {
          record.holidayDays += days;
          record.holidayAmount += total;
        } else if (isNight) {
          record.nightShiftDays += days;
          record.nightShiftAmount += total;
        }
      });
    });

    const employeesBreakdown = Array.from(empMap.values()).sort((a, b) => {
      const rankA = getSeniorityRank(a.designation);
      const rankB = getSeniorityRank(b.designation);
      if (rankA !== rankB) return rankA - rankB;
      return b.grandTotal - a.grandTotal;
    });

    const totalLateDays = employeesBreakdown.reduce((sum, r) => sum + r.lateSittingDays, 0);
    const totalLateAmount = employeesBreakdown.reduce((sum, r) => sum + r.lateSittingAmount, 0);
    const totalHolidayDays = employeesBreakdown.reduce((sum, r) => sum + r.holidayDays, 0);
    const totalHolidayAmount = employeesBreakdown.reduce((sum, r) => sum + r.holidayAmount, 0);
    const totalNightDays = employeesBreakdown.reduce((sum, r) => sum + r.nightShiftDays, 0);
    const totalNightAmount = employeesBreakdown.reduce((sum, r) => sum + r.nightShiftAmount, 0);
    const totalDaysSum = employeesBreakdown.reduce((sum, r) => sum + r.totalDays, 0);
    const grandTotalSum = employeesBreakdown.reduce((sum, r) => sum + r.grandTotal, 0);

    const calculatedApyaon = (totalLateDays * 100) + (totalHolidayDays * 250) + (totalNightDays * 600);
    const calculatedTransport = (totalLateDays * 200) + (totalHolidayDays * 250) + (totalNightDays * 400);

    const payeeMap = new Map<string, any>();

    targetBills.forEach(bill => {
      const payeeName = bill.employeeName || 'অজ্ঞাত কর্মকর্তা';
      const designation = bill.content?.representativeDesignation || '';
      
      let dutiesList: OrderDuty[] = (bill.duties as OrderDuty[]) || [];
      if (dutiesList.length === 0 && bill.dutiesJson) {
        try {
          dutiesList = JSON.parse(bill.dutiesJson);
        } catch (e) {
          console.error('Failed to parse bill dutiesJson in reportData:', e);
        }
      }

      const isLateSitting = bill.category === 'BILL_LATE_SITTING';
      const isHoliday = bill.category === 'BILL_HOLIDAY';
      const isNight = bill.category === 'BILL_NIGHT_SHIFT';

      let billTransport = 0;
      let billApyaon = 0;
      let billGrandTotal = 0;

      dutiesList.forEach(duty => {
        const days = Number(duty.days || (duty.dates && duty.dates.length) || 0);
        let transport = Number(duty.totalTransport || 0);
        let apyaon = Number(duty.totalApyaon || 0);
        let total = Number(duty.grandTotal || (transport + apyaon) || 0);

        if (!transport || !apyaon || total === 0) {
          if (isLateSitting) {
            apyaon = days * 100;
            transport = days * 200;
            total = days * 300;
          } else if (isHoliday) {
            apyaon = days * 250;
            transport = days * 250;
            total = days * 500;
          } else if (isNight) {
            apyaon = days * 600;
            transport = days * 400;
            total = days * 1000;
          }
        }

        billTransport += transport;
        billApyaon += apyaon;
        billGrandTotal += total;
      });

      if (billGrandTotal === 0 && bill.content?.grandTotal) {
        billGrandTotal = bill.content.grandTotal;
        if (isLateSitting) {
          billApyaon = Math.round(billGrandTotal / 3);
          billTransport = billGrandTotal - billApyaon;
        } else if (isHoliday) {
          billApyaon = Math.round(billGrandTotal / 2);
          billTransport = billGrandTotal - billApyaon;
        } else if (isNight) {
          billApyaon = Math.round(billGrandTotal * 0.6);
          billTransport = billGrandTotal - billApyaon;
        }
      }

      const key = payeeName.trim().toLowerCase();
      if (!payeeMap.has(key)) {
        payeeMap.set(key, {
          payeeName,
          designation,
          billCount: 0,
          transportAllowance: 0,
          apyaonAllowance: 0,
          grandTotal: 0
        });
      }

      const record = payeeMap.get(key)!;
      record.billCount += 1;
      record.transportAllowance += billTransport;
      record.apyaonAllowance += billApyaon;
      record.grandTotal += billGrandTotal;

      if (!record.designation && designation) {
        record.designation = designation;
      }
    });

    const payeesSummary = Array.from(payeeMap.values()).sort((a, b) => b.grandTotal - a.grandTotal);

    return {
      totalBillsCount,
      totalDays: totalDaysSum,
      grandTotal: grandTotalSum,
      grandTotalSum,
      totalDaysSum,
      totalTransport: calculatedTransport,
      totalApyaon: calculatedApyaon,
      lateSittingAmount: totalLateAmount,
      holidayAmount: totalHolidayAmount,
      nightShiftAmount: totalNightAmount,
      totalLateDays,
      totalLateAmount,
      totalHolidayDays,
      totalHolidayAmount,
      totalNightDays,
      totalNightAmount,
      employeesBreakdown,
      payeesSummary
    };
  }, [reportDate, archivedOrders]);

  const metrics = useMemo(() => {
    let totalLateSittingBill = 0;
    let totalLateAllowance1 = 0; 
    let totalLateAllowance2 = 0; 
    let totalHolidayBill = 0;
    let totalHolidayAllowance1 = 0; 
    let totalHolidayAllowance2 = 0; 
    let totalNightBill = 0;
    let totalNightAllowance1 = 0; 
    let totalNightAllowance2 = 0; 
    let grandTotal = 0;

    const targetCellObj = selectedCell !== 'all' ? cells.find(c => c.id.toString() === selectedCell) : null;

    ledgerActiveOfficeOrders.forEach(order => {
      if (selectedCategory !== 'all' && order.category !== selectedCategory) return;
      let dutiesList: OrderDuty[] = order.duties || [];
      if (dutiesList.length === 0 && order.dutiesJson) {
        try {
          dutiesList = JSON.parse(order.dutiesJson);
        } catch (e) {
          console.error(e);
        }
      }
      
      dutiesList.forEach((d: OrderDuty) => {
        if (targetCellObj) {
          const empIdStr = d.employeeId ? d.employeeId.toString() : '';
          const empName = d.employeeName || '';
          const matched = employees.find(e => 
            (e.id && e.id.toString() === empIdStr) || 
            (e.bankId && e.bankId.toString() === empIdStr) || 
            (e.name && e.name === empName)
          );
          if (matched) {
            if (matched.cell?.name !== targetCellObj.name) return;
          } else if (order.cellName && order.cellName !== 'All Cells' && order.cellName !== 'সকল সেল' && order.cellName !== targetCellObj.name) {
            return;
          }
        }

        const days = Array.isArray(d.dates) ? d.dates.length : (d.days || 0);
        let tRate = 200;
        let aRate = 100;
        if (order.category === 'HOLIDAY') {
          tRate = 250;
          aRate = 250;
        } else if (order.category === 'NIGHT_SHIFT') {
          tRate = 400;
          aRate = 600;
        }

        const totalApyaon = d.totalApyaon !== undefined && d.totalApyaon > 0 ? d.totalApyaon : (days * aRate);
        const totalTransport = d.totalTransport !== undefined && d.totalTransport > 0 ? d.totalTransport : (days * tRate);
        const itemGrandTotal = d.grandTotal !== undefined && d.grandTotal > 0 ? d.grandTotal : (totalApyaon + totalTransport);

        grandTotal += itemGrandTotal;
        if (order.category === 'LATE_SITTING') {
          totalLateSittingBill += itemGrandTotal;
          totalLateAllowance1 += totalApyaon;
          totalLateAllowance2 += totalTransport;
        } else if (order.category === 'HOLIDAY') {
          totalHolidayBill += itemGrandTotal;
          totalHolidayAllowance1 += totalApyaon;
          totalHolidayAllowance2 += totalTransport;
        } else if (order.category === 'NIGHT_SHIFT') {
          totalNightBill += itemGrandTotal;
          totalNightAllowance1 += totalApyaon;
          totalNightAllowance2 += totalTransport;
        }
      });
    });

    return {
      totalLateSittingBill,
      totalLateAllowance1,
      totalLateAllowance2,
      totalHolidayBill,
      totalHolidayAllowance1,
      totalHolidayAllowance2,
      totalNightBill,
      totalNightAllowance1,
      totalNightAllowance2,
      grandTotal
    };
  }, [ledgerActiveOfficeOrders, selectedCategory, selectedCell, cells, employees]);

  const toggleSlot = (slotDate: string) => {
    setExpandedSlots(prev => ({
      ...prev,
      [slotDate]: !prev[slotDate]
    }));
  };

  const findMatchingOfficeOrder = (bill: OfficeOrder) => {
    const norm = getNormalizedRef(bill.orderRef);
    return archivedOrders.find(o => 
      !o.category?.startsWith('BILL_') && 
      !o.orderRef?.endsWith('/বিল') && 
      getNormalizedRef(o.orderRef) === norm
    );
  };

  const findAssociatedBill = (order: OfficeOrder) => {
    const norm = getNormalizedRef(order.orderRef);
    return archivedOrders.find(o => 
      o.category?.startsWith('BILL_') && 
      o.status !== 'Deleted' && 
      getNormalizedRef(o.orderRef) === norm
    );
  };

  const handleChangeBillGroup = async (billId: number, bill: OfficeOrder, targetDate: string) => {
    try {
      let finalDate = targetDate;
      if (targetDate === 'custom') {
        const custom = prompt('নতুন গ্রুপ তারিখ দিন (YYYY-MM-DD):', bill.orderDate);
        if (!custom) return;
        if (!/^\d{4}-\d{2}-\d{2}$/.test(custom)) {
          alert('ভুল তারিখ ফরম্যাট! YYYY-MM-DD ফরম্যাটে দিন।');
          return;
        }
        finalDate = custom;
      }
      
      const res = await fetch(`/api/office-orders/${billId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderRef: bill.orderRef,
          orderDate: finalDate,
          employeeName: bill.employeeName,
          cellName: bill.cellName,
          status: bill.status
        })
      });
      
      if (!res.ok) {
        throw new Error('Failed to update group');
      }
      
      alert('গ্রুপ সফলভাবে পরিবর্তন করা হয়েছে!');
      fetchDutiesForBilling();
    } catch (err) {
      console.error(err);
      alert('গ্রুপ পরিবর্তন করতে ব্যর্থ হয়েছে।');
    }
  };

  return {
    cells,
    employees,
    executives,
    duties,
    archivedOrders,
    loading,
    selectedCell,
    setSelectedCell,
    selectedMonth,
    setSelectedMonth,
    selectedCategory,
    setSelectedCategory,
    printCategory,
    setPrintCategory,
    selectedOrderRef,
    setSelectedOrderRef,
    pendingOrderRefs,
    billedOrderRefs,
    baseOrderRef,
    setBaseOrderRef,
    randomNumber,
    reportDate,
    setReportDate,
    expandedSlots,
    toggleSlot,
    findAssociatedBill,
    findMatchingOfficeOrder,
    handleChangeBillGroup,
    handleDeleteOrder,
    handleCategoryChange,
    fetchDutiesForBilling,
    hasDeletePermission,
    hasEditPermission,
    archivedBillNormalizedRefs,
    pendingBillingOfficeOrders,
    billedOfficeOrders,
    filteredBillMemos,
    allActiveOfficeOrders,
    ledgerActiveOfficeOrders,
    ledgerGrandTotal,
    billGroups,
    metrics,
    billingSummaries,
    printFilteredSummaries,
    reportData,
    totalTransportAll,
    totalApyaonAll,
    grandTotalPrintAll,
    totalDaysAll,
    showOrderWarning,
    formatWorkedDatesForCategory,
    archiveSuccess,
    setArchiveSuccess,
    archiveError,
    setArchiveError,
    orderToDelete,
    setOrderToDelete,
    confirmDeleteOrder
  };
}
