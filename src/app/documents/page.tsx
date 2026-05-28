'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  UploadCloud, 
  FileText, 
  Trash2, 
  Search, 
  Eye, 
  Download, 
  AlertCircle, 
  Loader2, 
  Calendar, 
  HardDrive,
  CheckCircle,
  FileDown,
  ArrowUpDown,
  Printer,
  X,
  FileSignature
} from 'lucide-react';

interface DocumentFile {
  id: number;
  name: string;
  filePath: string;
  fileSize: number;
  uploadedAt: string;
}

export default function DocumentsPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'files' | 'orders' | 'bills'>('files');
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [officeOrders, setOfficeOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [error, setError] = useState('');

  // Load user role from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      try {
        const userObj = JSON.parse(stored);
        setCurrentUser(userObj);
        if (userObj.role === 'USER') {
          setActiveTab('orders'); // default to office orders since files is restricted for USER
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, []);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  // Form states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customName, setCustomName] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'size-desc' | 'size-asc'>('date-desc');

  // Viewing Modal
  const [viewingOrder, setViewingOrder] = useState<any | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const toBanglaDigits = (numStr: string | number) => {
    const banglaMap: { [key: string]: string } = {
      '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
      '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯'
    };
    return numStr.toString().replace(/[0-9]/g, digit => banglaMap[digit] || digit);
  };

  const getFormattedNumberWords = (num: number) => {
    if (!num) return '';
    const singleWords = ['', 'এক', 'দুই', 'তিন', 'চার', 'পাঁচ', 'ছয়', 'সাত', 'আট', 'নয়'];
    const teenWords = ['দশ', 'এগারো', 'বারো', 'তেরো', 'চৌদ্দ', 'পনেরো', 'ষোলো', 'সতেরো', 'আঠারো', 'উনিশ'];
    const doubleWords = ['', '', 'বিশ', 'ত্রিশ', 'চল্লিশ', 'পঞ্চাশ', 'ষাট', 'সত্তর', 'আশি', 'নব্বই'];

    const convertTens = (n: number): string => {
      if (n < 10) return singleWords[n];
      if (n >= 10 && n < 20) return teenWords[n - 10];
      const ten = Math.floor(n / 10);
      const unit = n % 10;
      return doubleWords[ten] + (unit > 0 ? ' ' + singleWords[unit] : '');
    };

    let temp = num;
    let wordStr = '';
    
    if (temp >= 100000) {
      const lac = Math.floor(temp / 100000);
      wordStr += convertTens(lac) + ' লক্ষ ';
      temp %= 100000;
    }

    if (temp >= 1000) {
      const thousand = Math.floor(temp / 1000);
      wordStr += convertTens(thousand) + ' হাজার ';
      temp %= 1000;
    }
    
    if (temp >= 100) {
      const hundred = Math.floor(temp / 100);
      wordStr += singleWords[hundred] + ' শত ';
      temp %= 100;
    }
    
    if (temp > 0) {
      wordStr += convertTens(temp);
    }
    
    return wordStr.trim() + ' টাকা';
  };

  // Fetch all documents
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
    } catch (err) {
      setError('সার্ভারে যোগাযোগ করতে ব্যর্থ হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  // Fetch all archived office orders
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
    } catch (err) {
      setError('সার্ভারে যোগাযোগ করতে ব্যর্থ হয়েছে।');
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'files') {
      if (currentUser && currentUser.role === 'USER') {
        return;
      }
      fetchDocuments();
    } else {
      fetchOfficeOrders();
    }
  }, [activeTab, currentUser]);

  // Format File Size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format Date in Bengali
  const formatDateBengali = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('bn-BD', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return dateStr;
    }
  };

  const getFormattedDateList = (dates: string[]) => {
    return dates
      .sort()
      .map(d => {
        const [year, month, day] = d.split('-');
        return toBanglaDigits(`${day}-${month}-${year}`);
      })
      .join(', ');
  };

  // Drag Handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateAndSetFile = (file: File) => {
    setError('');
    setSuccessMsg('');
    if (!file.name.endsWith('.pdf') && file.type !== 'application/pdf') {
      setError('শুধুমাত্র পিডিএফ (.pdf) ফরম্যাটের ফাইল আপলোড করা যাবে।');
      setSelectedFile(null);
      return;
    }
    
    setSelectedFile(file);
    const baseName = file.name.replace(/\.pdf$/i, '');
    setCustomName(baseName);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  // Upload Document
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

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessMsg('ফাইলটি সফলভাবে আপলোড এবং সংরক্ষণ করা হয়েছে!');
        setSelectedFile(null);
        setCustomName('');
        if (fileInputRef.current) fileInputRef.current.value = '';
        fetchDocuments();
      } else {
        setError(data.message || 'ফাইল আপলোড করতে ব্যর্থ হয়েছে।');
      }
    } catch (err) {
      setError('সার্ভারে যোগাযোগ করতে ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।');
    } finally {
      setUploading(false);
    }
  };

  // Delete Document
  const handleDelete = async (id: number) => {
    if (!confirm('আপনি কি নিশ্চিত যে এই ফাইলটি মুছে ফেলতে চান? এটি রিসাইকেল বিনে চলে যাবে।')) {
      return;
    }

    try {
      const res = await fetch('/api/documents', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        setSuccessMsg('নথিটি সফলভাবে মুছে ফেলা হয়েছে।');
        fetchDocuments();
      } else {
        setError('নথিটি মুছে ফেলা সম্ভব হয়নি।');
      }
    } catch (err) {
      setError('সার্ভারে যোগাযোগ করতে ব্যর্থ হয়েছে।');
    }
  };

  // Delete Office Order
  const handleDeleteOrder = async (id: number) => {
    if (!confirm('আপনি কি নিশ্চিত যে এই স্মারক বিবরণীটি আর্কাইভ থেকে মুছে ফেলতে চান? এটি ডিলিট করলে এর সাথে যুক্ত কর্মকর্তাদের সকল ডিউটি ডাটাবেস থেকে সম্পূর্ণভাবে মুছে যাবে এবং তা আর ফিরে আসবে না।')) {
      return;
    }

    try {
      const res = await fetch(`/api/office-orders/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setSuccessMsg('অফিস আদেশটি সফলভাবে মুছে ফেলা হয়েছে।');
        fetchOfficeOrders();
      } else {
        setError('অফিস আদেশটি মুছে ফেলা সম্ভব হয়নি।');
      }
    } catch (err) {
      setError('সার্ভারে যোগাযোগ করতে ব্যর্থ হয়েছে।');
    }
  };

  // Print view A4 order modal sheet (Exactly matching Image 3)
  const handlePrintModal = () => {
    const printContent = document.getElementById('printable-order-sheet');
    if (!printContent) return;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>অফিস নির্দেশ - প্রিন্ট</title>
            <style>
              body {
                margin: 0;
                padding: 0;
                font-family: 'Kalpurush', 'Noto Sans Bengali', sans-serif;
                font-size: 10px;
                color: #000;
                background-color: #fff;
                line-height: 1.6;
              }
              @page {
                size: A4;
                margin: 0;
              }
              #printable-order-sheet {
                width: 210mm !important;
                height: 297mm !important;
                padding: 1.0in !important;
                box-sizing: border-box !important;
                display: flex !important;
                flex-direction: column !important;
                justify-content: space-between !important;
                font-family: 'Kalpurush', 'Noto Sans Bengali', sans-serif !important;
                font-size: 10px !important;
                color: #000 !important;
                background-color: #fff !important;
                line-height: 1.6 !important;
              }
              .w-full { width: 100%; }
              .flex { display: flex; }
              .justify-between { justify-content: space-between; }
              .items-start { align-items: flex-start; }
              .border-b-2 { border-bottom: 2px solid #0b5e9e; }
              .border-b { border-bottom: 1px solid #e2e8f0; }
              .border-t { border-top: 1px solid #e2e8f0; }
              .pb-2 { padding-bottom: 8px; }
              .pt-1 { padding-top: 4px; }
              .pb-1 { padding-bottom: 4px; }
              .pt-2 { padding-top: 8px; }
              .pt-4 { padding-top: 16px; }
              .text-left { text-align: left; }
              .text-right { text-align: right; }
              .font-bold { font-weight: bold; }
              .font-extrabold { font-weight: 800; }
              .text-center { text-align: center; }
              .text-xs { font-size: 10px; }
              .text-sm { font-size: 10px; }
              .text-base { font-size: 18px; }
              .leading-tight { line-height: 1.15; }
              .leading-relaxed { line-height: 1.6; }
              .leading-normal { line-height: 1.6; }
              .leading-none { line-height: 1.0; }
              .leading-snug { line-height: 1.375; }
              .uppercase { text-transform: uppercase; }
              .tracking-wider { letter-spacing: 0.05em; }
              .mt-0.5 { margin-top: 2px; }
              .mt-1 { margin-top: 4px; }
              .mt-2 { margin-top: 8px; }
              .mt-2.5 { margin-top: 10px; }
              .mt-4 { margin-top: 16px; }
              .mt-6 { margin-top: 24px; }
              .mt-8 { margin-top: 32px; }
              .mt-12 { margin-top: 48px; }
              .mb-1.5 { margin-bottom: 6px; }
              .mb-4 { margin-bottom: 16px; }
              .pl-2 { padding-left: 8px; }
              .pl-5 { padding-left: 20px; }
              .shrink-0 { flex-shrink: 0; }
              .gap-2 { gap: 8px; }
              .gap-3 { gap: 12px; }
              .gap-4 { gap: 16px; }
              .font-serif { font-family: Georgia, Cambria, "Times New Roman", Times, serif; }
              .underline { text-decoration: underline; }
              .decoration-black { text-decoration-color: #000000; }
              .underline-offset-2 { text-underline-offset: 2px; }
              .text-justify { text-align: justify; }
              .text-indent-8 { text-indent: 0.5in; }
              .text-slate-950 { color: #000000; }
              .font-normal { font-weight: 400; }
              .w-\\[8\\%\\] { width: 8%; }
              .w-\\[28\\%\\] { width: 28%; }
              .w-\\[12\\%\\] { width: 12%; }
              .w-\\[27\\%\\] { width: 27%; }
              .w-\\[25\\%\\] { width: 25%; }
              .w-\\[50\\%\\] { width: 50%; }
              .list-decimal { list-style-type: decimal; }
              .space-y-4 > * + * { margin-top: 16px; }
              .space-y-2.5 > * + * { margin-top: 10px; }
              .space-y-1 > * + * { margin-top: 4px; }
              .space-y-0.5 > * + * { margin-top: 2px; }
              table { width: 100%; border-collapse: collapse; margin-top: 10px; }
              th, td { border: 1px solid #000; padding: 4px; font-size: 10px; line-height: 1.4; }
              th { font-weight: bold; background-color: #f8fafc; }
            </style>
          </head>
          <body>
            ${printContent.outerHTML}
            <script>
              window.onload = function() {
                window.print();
                window.close();
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  // Filtered & Sorted Documents
  const filteredDocuments = documents
    .filter(doc => doc.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'date-desc') {
        return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
      }
      if (sortBy === 'date-asc') {
        return new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
      }
      if (sortBy === 'size-desc') {
        return b.fileSize - a.fileSize;
      }
      if (sortBy === 'size-asc') {
        return a.fileSize - b.fileSize;
      }
      return 0;
    });

  // Filtered Office Orders (Only categories NOT starting with BILL_)
  const officeOrdersList = officeOrders.filter(order => !order.category?.startsWith('BILL_'));
  const filteredOfficeOrders = officeOrdersList.filter(order => 
    order.orderRef.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
    order.employeeName.toLowerCase().includes(orderSearchQuery.toLowerCase())
  );

  // Filtered Bill Memos (Only categories starting with BILL_)
  const billMemosList = officeOrders.filter(order => order.category?.startsWith('BILL_'));
  const filteredBillMemos = billMemosList.filter(order => 
    order.orderRef.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
    order.employeeName.toLowerCase().includes(orderSearchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 font-sans max-w-7xl mx-auto pb-12">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            সেন্ট্রাল ফাইল ও অর্ডার আর্কাইভ
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-sm">
            ম্যানুয়াল আপলোডকৃত ফাইল ও সিস্টেম জেনারেটেড অফিস আদেশের সূত্র ট্র্যাকিং সংরক্ষণাগার প্যানেল।
          </p>
        </div>
        <div className="flex items-center gap-2.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100/80 dark:border-indigo-950/30 rounded-2xl w-fit">
          <HardDrive size={16} className="text-indigo-500" />
          <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-400">
            সংরক্ষিত আইটেম: {activeTab === 'files' ? documents.length : (activeTab === 'orders' ? officeOrdersList.length : billMemosList.length)} টি
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        {currentUser?.role !== 'USER' && (
          <button
            onClick={() => {
              setActiveTab('files');
              setError('');
              setSuccessMsg('');
            }}
            className={`px-6 py-3.5 text-sm font-semibold border-b-2 transition-all relative ${
              activeTab === 'files'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'
            }`}
          >
            ম্যানুয়াল ফাইল আর্কাইভ
          </button>
        )}
        <button
          onClick={() => {
            setActiveTab('orders');
            setError('');
            setSuccessMsg('');
          }}
          className={`px-6 py-3.5 text-sm font-semibold border-b-2 transition-all relative ${
            activeTab === 'orders'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'
          }`}
        >
          অফিস অর্ডার আর্কাইভ (স্মারক সূত্র)
        </button>
        <button
          onClick={() => {
            setActiveTab('bills');
            setError('');
            setSuccessMsg('');
          }}
          className={`px-6 py-3.5 text-sm font-semibold border-b-2 transition-all relative ${
            activeTab === 'bills'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'
          }`}
        >
          বিল মেমো আর্কাইভ (স্মারক সূত্র)
        </button>
      </div>

      {/* Main Area */}
      {activeTab === 'files' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Side: Upload Panel */}
          <div className="lg:col-span-4 space-y-6">
            <div className="glass-card rounded-3xl p-6 border border-white/10 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500" />
              
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
                <UploadCloud size={20} className="text-indigo-500" />
                নতুন ফাইল আপলোড
              </h2>

              {/* Banners */}
              {error && (
                <div className="mb-4 p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-2xl text-xs text-red-600 dark:text-red-400 flex items-center gap-2.5">
                  <AlertCircle size={16} className="shrink-0" />
                  <span className="font-medium">{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="mb-4 p-3.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 rounded-2xl text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2.5">
                  <CheckCircle size={16} className="shrink-0" />
                  <span className="font-medium">{successMsg}</span>
                </div>
              )}

              <form onSubmit={handleUploadSubmit} className="space-y-4">
                <div 
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center min-h-[180px] group ${
                    dragActive 
                      ? 'border-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/20 scale-[1.01]' 
                      : selectedFile 
                        ? 'border-emerald-500/50 bg-emerald-50/10 dark:bg-emerald-950/10' 
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30'
                  }`}
                >
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept=".pdf" 
                    className="hidden" 
                    onChange={handleFileSelect}
                  />

                  {selectedFile ? (
                    <div className="space-y-3">
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center mx-auto text-emerald-500 border border-emerald-500/20 animate-pulse">
                        <FileText size={24} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-100 max-w-[200px] truncate mx-auto">
                          {selectedFile.name}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                          সাইজ: {formatFileSize(selectedFile.size)}
                        </p>
                      </div>
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                        সংযুক্ত করা হয়েছে
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="w-12 h-12 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center mx-auto text-indigo-500 border border-indigo-500/20 group-hover:scale-110 transition-transform">
                        <UploadCloud size={24} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                          এখানে ড্রাগ করে ফাইলটি ফেলুন অথবা
                        </p>
                        <p className="text-[11px] text-indigo-500 font-semibold mt-1">
                          কম্পিউটার থেকে ব্রাউজ করুন
                        </p>
                      </div>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                        শুধুমাত্র পিডিএফ (.pdf) ফাইল, সর্বোচ্চ ১০ এমবি
                      </p>
                    </div>
                  )}
                </div>

                {selectedFile && (
                  <div className="space-y-1.5 animate-fadeIn">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      ফাইলের নাম (ঐচ্ছিক)
                    </label>
                    <input
                      type="text"
                      placeholder="নথির টাইটেল লিখুন"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-sm focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                )}

                {selectedFile && (
                  <div className="flex gap-2.5 pt-2">
                    <button
                      type="submit"
                      disabled={uploading}
                      className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                    >
                      {uploading ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          <span>আপলোড হচ্ছে...</span>
                        </>
                      ) : (
                        <>
                          <UploadCloud size={14} />
                          <span>আর্কাইভে যুক্ত করুন</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setCustomName('');
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-semibold transition-all border border-slate-200 dark:border-slate-700"
                    >
                      বাতিল
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* Document list */}
          <div className="lg:col-span-8 space-y-6">
            <div className="glass-card rounded-3xl p-6 border border-white/10 shadow-xl min-h-[500px] flex flex-col justify-between">
              <div className="space-y-6">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text"
                      placeholder="নথির নাম দিয়ে অনুসন্ধান করুন..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/30 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-500"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <ArrowUpDown size={14} className="text-slate-400" />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/30 text-xs font-semibold text-slate-600 dark:text-slate-305 focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
                    >
                      <option value="date-desc">আপলোড তারিখ (নতুন আগে)</option>
                      <option value="date-asc">আপলোড তারিখ (পুরাতন আগে)</option>
                      <option value="size-desc">সাইজ (বড় আগে)</option>
                      <option value="size-asc">সাইজ (ছোট আগে)</option>
                    </select>
                  </div>
                </div>

                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-3">
                    <Loader2 size={36} className="text-indigo-500 animate-spin" />
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">আর্কাইভ লোড হচ্ছে...</p>
                  </div>
                ) : filteredDocuments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-400 dark:text-slate-600">
                      <AlertCircle size={28} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">কোন ফাইল পাওয়া যায়নি</h3>
                      <p className="text-xs text-slate-400 mt-1 max-w-[280px]">
                        {searchQuery ? 'আপনার অনুসন্ধানকৃত নাম অনুযায়ী কোনো ফাইল খুঁজে পাওয়া যায়নি।' : 'সংরক্ষণাগারটিতে এখনও কোনো অফিস আদেশ বা গেজেট ফাইল যুক্ত করা হয়নি।'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredDocuments.map((doc) => (
                      <div 
                        key={doc.id}
                        className="group border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-4 bg-white/30 dark:bg-slate-900/20 hover:bg-white dark:hover:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 flex flex-col justify-between gap-4 shadow-sm"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-red-500/10 dark:bg-red-500/20 flex items-center justify-center text-red-500 shrink-0 border border-red-500/10">
                            <FileText size={20} />
                          </div>
                          <div className="min-w-0 space-y-1">
                            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-snug group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors truncate" title={doc.name}>
                              {doc.name}
                            </h4>
                            
                            <div className="flex flex-col gap-1 text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                              <span className="flex items-center gap-1">
                                <Calendar size={11} />
                                {formatDateBengali(doc.uploadedAt)}
                              </span>
                              <span className="flex items-center gap-1 font-sans">
                                <HardDrive size={11} />
                                {formatFileSize(doc.fileSize)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60 pt-3">
                          <div className="flex items-center gap-1.5">
                            <a 
                              href={doc.filePath} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:hover:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-bold transition-all"
                              title="ভিউ করুন"
                            >
                              <Eye size={12} />
                              <span>দেখুন</span>
                            </a>
                            
                            <a 
                              href={doc.filePath} 
                              download={doc.name + '.pdf'}
                              className="flex items-center justify-center p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 rounded-lg transition-all"
                              title="ডাউনলোড করুন"
                            >
                              <FileDown size={12} />
                            </a>
                          </div>

                          <button 
                            onClick={() => handleDelete(doc.id)}
                            className="p-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/30 text-red-500 dark:text-red-400 rounded-lg transition-all"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {!loading && filteredDocuments.length > 0 && (
                <div className="border-t border-slate-100 dark:border-slate-800/60 pt-4 mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] text-slate-400">
                  <span className="font-semibold">ডিউটি বিল ও অফিস আদেশ নথি সংরক্ষণাগার</span>
                  <span className="bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
                    নিরাপদ স্টোরেজ
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : activeTab === 'orders' ? (
        /* Tab 2: Office Order Reference Archive */
        <div className="space-y-6">
          <div className="glass-card rounded-3xl p-6 border border-white/10 shadow-xl min-h-[500px]">
            <div className="space-y-6">
              
              {/* Search Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    placeholder="স্মারক সূত্র নম্বর বা কর্মকর্তার নাম দিয়ে অনুসন্ধান করুন..."
                    value={orderSearchQuery}
                    onChange={(e) => setOrderSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/30 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-500"
                  />
                </div>
              </div>

              {successMsg && (
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 rounded-2xl text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2.5">
                  <CheckCircle size={16} className="shrink-0" />
                  <span className="font-medium">{successMsg}</span>
                </div>
              )}

              {/* Grid lists of office orders */}
              {loadingOrders ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-3">
                  <Loader2 size={36} className="text-indigo-500 animate-spin" />
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">আর্কাইভ লোড হচ্ছে...</p>
                </div>
              ) : filteredOfficeOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-400 dark:text-slate-600">
                    <AlertCircle size={28} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">কোন সূত্র সংরক্ষিত নেই</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-[280px]">
                      {orderSearchQuery ? 'অনুসন্ধানকৃত স্মারক সূত্র অনুযায়ী কোনো তথ্য পাওয়া যায়নি।' : 'ডিউটি শিডিউল পেজে প্রিন্ট প্রিভিউ বা পিডিএফ ডাউনলোড করা হলে, সূত্রটি এখানে স্বয়ংক্রিয়ভাবে পাশে "প্রিন্টেড" ট্যাগসহ সংরক্ষিত হবে।'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredOfficeOrders.map((order) => (
                    <div 
                      key={order.id}
                      className="group border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-5 bg-white/30 dark:bg-slate-900/20 hover:bg-white dark:hover:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 flex flex-col justify-between gap-4 shadow-sm"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 border border-emerald-500/20">
                            <CheckCircle size={10} className="text-emerald-500" />
                            প্রিন্টেড
                          </span>
                          <span className="text-[10px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full font-bold uppercase">
                            {order.category === 'LATE_SITTING' ? 'লেট সিটিং' : order.category === 'HOLIDAY' ? 'সরকারি ছুটি' : 'রাত্রীকালীন'}
                          </span>
                        </div>
                        
                        <div className="space-y-1.5">
                          <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-100 leading-snug font-mono break-all animate-pulse" title={order.orderRef}>
                            {order.orderRef}
                          </h4>
                          
                          <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 dark:text-slate-400 font-semibold pt-1 border-t border-slate-100/50 dark:border-slate-800/50 mt-2">
                            <div>
                              <span className="text-slate-400 font-medium block">আদেশের তারিখ:</span>
                              <span>{order.orderDate}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 font-medium block">কর্মকর্তা:</span>
                              <span className="truncate block" title={order.employeeName}>{order.employeeName}</span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-slate-400 font-medium block">শাখা/সেল:</span>
                              <span>{order.cellName || 'আইটি বিভাগ'}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60 pt-3">
                        <div className="flex items-center gap-1.5">
                          <button 
                            onClick={() => setViewingOrder(order)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:hover:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-extrabold transition-all"
                            title="অর্ডারটি ভিউ করুন"
                          >
                            <Eye size={12} />
                            <span>ভিউ</span>
                          </button>
                          
                          {currentUser?.role !== 'USER' && (
                            <button 
                              onClick={() => window.location.href = `/roster?edit_ref=${encodeURIComponent(order.orderRef)}`}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-650 dark:text-slate-300 rounded-lg text-[10px] font-bold transition-all border border-slate-200 dark:border-slate-700"
                              title="রোস্টারে ফিরে এডিট করুন (স্মারক একই থাকবে)"
                            >
                              <FileSignature size={12} />
                              <span>সম্পাদনা (রোস্টার)</span>
                            </button>
                          )}
                        </div>

                        {currentUser?.role !== 'USER' && (
                          <button 
                            onClick={() => handleDeleteOrder(order.id)}
                            className="p-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/30 text-red-500 dark:text-red-400 rounded-lg transition-all"
                            title="আর্কাইভ থেকে মুছে ফেলুন"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Tab 3: Bill Memo Reference Archive */
        <div className="space-y-6">
          <div className="glass-card rounded-3xl p-6 border border-white/10 shadow-xl min-h-[500px]">
            <div className="space-y-6">
              
              {/* Search Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    placeholder="স্মারক সূত্র নম্বর বা কর্মকর্তার নাম দিয়ে অনুসন্ধান করুন..."
                    value={orderSearchQuery}
                    onChange={(e) => setOrderSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/30 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-500"
                  />
                </div>
              </div>

              {successMsg && (
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 rounded-2xl text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2.5">
                  <CheckCircle size={16} className="shrink-0" />
                  <span className="font-medium">{successMsg}</span>
                </div>
              )}

              {/* Grid lists of bill memos */}
              {loadingOrders ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-3">
                  <Loader2 size={36} className="text-indigo-500 animate-spin" />
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">আর্কাইভ লোড হচ্ছে...</p>
                </div>
              ) : filteredBillMemos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-400 dark:text-slate-600">
                    <AlertCircle size={28} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">কোন বিল স্মারক সংরক্ষিত নেই</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-[280px]">
                      {orderSearchQuery ? 'অনুসন্ধানকৃত স্মারক সূত্র অনুযায়ী কোনো তথ্য পাওয়া যায়নি।' : 'ডিউটি বিল বিবরণী পেজে প্রিন্ট প্রিভিউ বা পিডিএফ ডাউনলোড করা হলে, বিবরণীটি এখানে স্বয়ংক্রিয়ভাবে পাশে "প্রিন্টেড" ট্যাগসহ সংরক্ষিত হবে।'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredBillMemos.map((order) => (
                    <div 
                      key={order.id}
                      className="group border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-5 bg-white/30 dark:bg-slate-900/20 hover:bg-white dark:hover:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 flex flex-col justify-between gap-4 shadow-sm"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 border border-emerald-500/20">
                            <CheckCircle size={10} className="text-emerald-500" />
                            প্রিন্টেড
                          </span>
                          <span className="text-[10px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full font-bold uppercase">
                            {order.category === 'BILL_LATE_SITTING' ? 'লেট সিটিং বিল' : order.category === 'BILL_HOLIDAY' ? 'সরকারি ছুটি বিল' : 'রাত্রীকালীন বিল'}
                          </span>
                        </div>
                        
                        <div className="space-y-1.5">
                          <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-100 leading-snug font-mono break-all font-bold" title={order.orderRef}>
                            {order.orderRef}
                          </h4>
                          
                          <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 dark:text-slate-400 font-semibold pt-1 border-t border-slate-100/50 dark:border-slate-800/50 mt-2">
                            <div>
                              <span className="text-slate-400 font-medium block">প্রতিনিধি কর্মকর্তা:</span>
                              <span className="text-slate-700 dark:text-slate-300 font-bold">{order.employeeName}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 font-medium block">তারিখ:</span>
                              <span className="text-slate-700 dark:text-slate-300 font-bold">
                                {toBanglaDigits(new Date(order.orderDate).toLocaleDateString('bn-BD', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-'))}
                              </span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-slate-400 font-medium block">শাখা/সেল:</span>
                              <span>{order.cellName || 'আইটি বিভাগ'}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60 pt-3">
                        <div className="flex items-center gap-1.5">
                          <button 
                            onClick={() => setViewingOrder(order)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:hover:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-extrabold transition-all"
                            title="বিল মেমো ভিউ করুন"
                          >
                            <Eye size={12} />
                            <span>ভিউ</span>
                          </button>

                          {currentUser?.role !== 'USER' && (
                            <button 
                              onClick={() => window.location.href = `/billing?edit_ref=${encodeURIComponent(order.orderRef)}`}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-650 dark:text-slate-300 rounded-lg text-[10px] font-bold transition-all border border-slate-200 dark:border-slate-700"
                              title="বিলিং এ ফিরে এডিট করুন (স্মারক একই থাকবে)"
                            >
                              <FileSignature size={12} />
                              <span>সম্পাদনা (বিলিং)</span>
                            </button>
                          )}
                        </div>

                        {currentUser?.role !== 'USER' && (
                          <button 
                            onClick={() => handleDeleteOrder(order.id)}
                            className="p-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/30 text-red-500 dark:text-red-400 rounded-lg transition-all"
                            title="আর্কাইভ থেকে মুছে ফেলুন"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- VIEW OFFICE ORDER MODAL (Exactly matching Mock Image 3 Layout) --- */}
      {/* --- VIEW OFFICE ORDER OR BILL MODAL --- */}
      {viewingOrder && (() => {
        const isBill = viewingOrder.category?.startsWith('BILL_');
        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
              
              {/* Modal Header Controls */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-2">
                  <FileText className="text-indigo-500" size={20} />
                  <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">
                    {isBill ? 'আপ্যায়ন বিল বিবরণী প্রাক-প্রদর্শন (Legal Size)' : 'অফিস নির্দেশ প্রাক-প্রদর্শন (A4 Size)'}
                  </h3>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handlePrintModal}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-650/20"
                  >
                    <Printer size={13} />
                    <span>প্রিন্ট করুন</span>
                  </button>
                  <button
                    onClick={() => setViewingOrder(null)}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 transition-all"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Scrollable Printable Wrapper */}
              <div className="flex-1 overflow-y-auto p-8 bg-slate-105/50 dark:bg-slate-950/20 flex justify-center">
                
                {isBill ? (
                  /* simulated Legal-sized Bill Memo sheet */
                  <div 
                    id="printable-order-sheet"
                    className="w-[215.9mm] min-h-[355.6mm] bg-white border border-slate-200 text-black shadow-lg flex flex-col justify-between relative text-left font-serif leading-none text-[10px]"
                    style={{ color: '#000000', backgroundColor: '#ffffff', fontFamily: 'Kalpurush, "Noto Sans Bengali", sans-serif', boxSizing: 'border-box', paddingTop: '0.6in', paddingBottom: '0.75in', paddingLeft: '1.3in', paddingRight: '0.5in' }}
                  >
                    <div className="flex flex-col h-full justify-between">
                      <div>
                        {/* Official Header */}
                        <div className="w-full flex justify-end text-right mb-4">
                          <div className="text-right leading-none">
                            <h2 className="text-[16px] font-bold text-black uppercase" style={{ fontFamily: 'Kalpurush', fontSize: '16px', lineHeight: '1.0' }}>অনলাইন ব্যাংকিং ডিপার্টমেন্ট</h2>
                            <p className="text-[10px] font-bold text-black mt-1.5" style={{ fontFamily: 'Kalpurush', fontSize: '10px', lineHeight: '1.0' }}>তারিখ: {toBanglaDigits(new Date(viewingOrder.orderDate).toLocaleDateString('bn-BD', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-'))} ইং</p>
                          </div>
                        </div>

                        {/* Title and Main Body */}
                        <div className="flex-1 flex flex-col justify-between mt-2">
                          <div>
                            <h2 className="text-left text-[10px] font-bold underline decoration-black underline-offset-2 leading-none" style={{ fontFamily: 'Kalpurush', fontSize: '10px', lineHeight: '1.0' }}>
                              বিষয়: {viewingOrder.content?.subjectText || 'যাতায়াত ও আপ্যায়ন ভাতা প্রদান প্রসঙ্গে।'}
                            </h2>
                            
                            <div className="mt-2.5">
                              <p className="text-justify leading-normal text-black text-[10px]" style={{ fontFamily: 'Kalpurush', fontSize: '10px', lineHeight: '1.0', textIndent: '0.5in', textAlign: 'justify' }}>
                                {viewingOrder.content?.openingParagraph}
                              </p>
                            </div>

                            {/* Table */}
                            {viewingOrder.duties && viewingOrder.duties.length > 0 ? (() => {
                              const cat = viewingOrder.category || '';
                              const isHoliday = cat.includes('HOLIDAY');
                              const isNight = cat.includes('NIGHT_SHIFT');
                              const apyaonRate = isHoliday ? 250 : isNight ? 600 : 100;
                              const transportRate = cat.includes('LATE_SITTING') ? 150 : 0;
                              return (
                                <table className="w-full border-collapse border border-black text-center mt-3 text-[10px]" style={{ fontFamily: 'Kalpurush', fontSize: '10px', lineHeight: '1.0', borderCollapse: 'collapse', border: '1px solid #000' }}>
                                  <thead>
                                    <tr className="bg-slate-50 font-bold border-b border-black text-[10px]" style={{ fontFamily: 'Kalpurush', fontSize: '10px', lineHeight: '1.0' }}>
                                      <th className="border border-black p-1.5 w-[8%] text-center" style={{ border: '1px solid #000', padding: '6px' }}>ক্রমিক</th>
                                      <th className="border border-black p-1.5 text-left pl-3 w-[28%]" style={{ border: '1px solid #000', padding: '6px', textAlign: 'left', paddingLeft: '12px' }}>নাম ও পদবী</th>
                                      <th className="border border-black p-1.5 text-center w-[25%]" style={{ border: '1px solid #000', padding: '6px' }}>তারিখ</th>
                                      <th className="border border-black p-1.5 text-center w-[15%]" style={{ border: '1px solid #000', padding: '6px' }}>যাতায়াত</th>
                                      <th className="border border-black p-1.5 text-center w-[15%]" style={{ border: '1px solid #000', padding: '6px' }}>আপ্যায়ন</th>
                                      <th className="border border-black p-1.5 text-center w-[9%]" style={{ border: '1px solid #000', padding: '6px' }}>মোট</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {viewingOrder.duties.map((s: any, index: number) => (
                                      <tr key={index} className="text-black text-[10px]" style={{ fontFamily: 'Kalpurush', fontSize: '10px', lineHeight: '1.0' }}>
                                        <td className="border border-black p-1.5 text-center" style={{ border: '1px solid #000', padding: '6px' }}>{toBanglaDigits(index + 1)}</td>
                                        <td className="border border-black p-1.5 text-left pl-3 font-normal" style={{ border: '1px solid #000', padding: '6px', textAlign: 'left', paddingLeft: '12px' }}>
                                          <p className="font-normal">{s.employeeName}</p>
                                          <p className="text-[9px] text-slate-800 font-normal mt-0.5">{s.designation}</p>
                                        </td>
                                        <td className="border border-black p-1.5 text-center leading-snug font-normal" style={{ border: '1px solid #000', padding: '6px' }}>
                                          <p className="break-words max-w-[200px] leading-snug">{s.datesFormatted || s.dates || ''}</p>
                                          <p className="text-[9px] text-slate-700 mt-1 font-semibold">মোট: {toBanglaDigits(s.days)} দিন</p>
                                        </td>
                                        <td className="border border-black p-1.5 text-center font-normal" style={{ border: '1px solid #000', padding: '6px' }}>
                                          ({toBanglaDigits(transportRate)}x{toBanglaDigits(s.days)}) = {toBanglaDigits(s.totalTransport)}/-
                                        </td>
                                        <td className="border border-black p-1.5 text-center font-normal" style={{ border: '1px solid #000', padding: '6px' }}>
                                          ({toBanglaDigits(apyaonRate)}x{toBanglaDigits(s.days)}) = {toBanglaDigits(s.totalApyaon)}/-
                                        </td>
                                        <td className="border border-black p-1.5 font-extrabold text-center" style={{ border: '1px solid #000', padding: '6px', fontWeight: 'bold' }}>
                                          {toBanglaDigits(s.grandTotal)}/-
                                        </td>
                                      </tr>
                                    ))}
                                    <tr className="font-bold bg-slate-50/50" style={{ border: '1px solid #000', fontWeight: 'bold' }}>
                                      <td colSpan={2} className="border border-black p-1.5 text-right pr-3" style={{ border: '1px solid #000', padding: '6px', textAlign: 'right', paddingRight: '12px' }}>সর্বমোট:</td>
                                      <td className="border border-black p-1.5 text-center" style={{ border: '1px solid #000', padding: '6px' }}>{toBanglaDigits(viewingOrder.content?.totalDays)} দিন</td>
                                      <td className="border border-black p-1.5 text-center" style={{ border: '1px solid #000', padding: '6px' }}>৳{toBanglaDigits(viewingOrder.content?.totalTransport)}/-</td>
                                      <td className="border border-black p-1.5 text-center" style={{ border: '1px solid #000', padding: '6px' }}>৳{toBanglaDigits(viewingOrder.content?.totalApyaon)}/-</td>
                                      <td className="border border-black p-1.5 text-center font-extrabold" style={{ border: '1px solid #000', padding: '6px', fontWeight: 'bold' }}>৳{toBanglaDigits(viewingOrder.content?.grandTotal)}/-</td>
                                    </tr>
                                  </tbody>
                                </table>
                              );
                            })() : null}

                            {/* Words and paragraphs */}
                            <div className="text-left pt-3 mt-3 space-y-2.5" style={{ fontFamily: 'Kalpurush', fontSize: '10px', lineHeight: '1.0' }}>
                              <p className="font-bold text-black">কথায়: {viewingOrder.content?.grandTotalInWords || ''} মাত্র।</p>
                              <p className="text-justify leading-normal text-black" style={{ fontFamily: 'Kalpurush', fontSize: '10px', lineHeight: '1.0', textAlign: 'justify' }}>
                                ০২। আলোচ্য বিলটি সঠিক এবং পূর্বে পরিশোধ করা হয়নি।
                              </p>
                              <p className="text-justify leading-normal text-black" style={{ fontFamily: 'Kalpurush', fontSize: '10px', lineHeight: '1.0', textAlign: 'justify' }}>
                                ০৩। ২০১৭ সালের আর্থিক ক্ষমতা অর্পন এর পৃষ্ঠা ১৫ এর অনুচ্ছেদ-২৬.০২ মোতাবেক যাতায়াত খাত (কোড-১৩৫৫১২০৫০০০০০০৩) অনুযায়ী প্রকৃত খরচ = <strong>{toBanglaDigits(viewingOrder.content?.totalTransport)}/- ({viewingOrder.content?.totalTransport ? getFormattedNumberWords(viewingOrder.content?.totalTransport) : ''})</strong> এবং পৃষ্ঠা ১৪ এর অনুচ্ছেদ-২২.০২ মোতাবেক আপ্যায়ন খাত (কোড-১৩৫৫১২০১০০০০০০২) অনুযায়ী প্রকৃত খরচ = <strong>{toBanglaDigits(viewingOrder.content?.totalApyaon)}/- ({viewingOrder.content?.totalApyaon ? getFormattedNumberWords(viewingOrder.content?.totalApyaon) : ''})</strong> অনুমোদন ক্ষমতা উপ-মহাব্যবস্থাপক মহোদয়ের এখতিয়ারাধীন।
                              </p>
                              <p className="text-justify leading-normal text-black" style={{ fontFamily: 'Kalpurush', fontSize: '10px', lineHeight: '1.0', textAlign: 'justify' }}>
                                ০৪। এমতাবস্থায়, বর্ণিত খরচ অনুমোদনপূর্বক যাতায়াত ও আপ্যায়ন খাত (প্রযোজ্য ক্ষেত্রে) বিকলন করতঃ মোট = <strong>{toBanglaDigits(viewingOrder.content?.grandTotal)}/- ({viewingOrder.content?.grandTotal ? getFormattedNumberWords(viewingOrder.content?.grandTotal) : ''})</strong> <strong>{viewingOrder.employeeName}</strong> এর নামে প্রদানের নিমিত্ত নিরীক্ষার অনুরোধ জানিয়ে বাজেট এন্ড এক্সপেন্ডিচার কন্ট্রোল ডিপার্টমেন্ট বরাবর এবং নিরীক্ষান্তে নথি একাউন্টস ডিপার্টমেন্ট বরাবর প্রেরণ করা যেতে পারে।
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Right-aligned payee signature block */}
                        <div className="w-full flex justify-end text-right" style={{ marginTop: '0.4in', marginBottom: '0.2in' }}>
                          <div className="text-right leading-none" style={{ fontFamily: 'Kalpurush', fontSize: '10px', paddingRight: '0.1in' }}>
                            <p className="font-extrabold text-[10px]">({viewingOrder.employeeName})</p>
                            <p className="text-[10px] font-bold text-slate-800 mt-1">বিল সংগ্রহকারী কর্মকর্তা</p>
                          </div>
                        </div>

                        {/* Left-aligned Routing List with nice gaps, underlines and font size 10, NOT bold */}
                        <div className="w-full text-left mt-4 pl-1 no-break-inside" style={{ fontFamily: 'Kalpurush', fontSize: '10px', lineHeight: '1.0' }}>
                          <div style={{ marginBottom: '0.85in' }}>
                            <p className="inline-block border-b border-black pb-0.5 text-[10px]" style={{ fontFamily: 'Kalpurush', fontSize: '10px', lineHeight: '1.0' }}>
                              এসপিও, অনলাইন ব্যাংকিং ডিপার্টমেন্ট সমীপেঃ
                            </p>
                          </div>
                          <div style={{ marginBottom: '0.85in' }}>
                            <p className="inline-block border-b border-black pb-0.5 text-[10px]" style={{ fontFamily: 'Kalpurush', fontSize: '10px', lineHeight: '1.0' }}>
                              এজিএম, অনলাইন ব্যাংকিং ডিপার্টমেন্ট সমীপেঃ
                            </p>
                          </div>
                          <div style={{ marginBottom: '0.85in' }}>
                            <p className="inline-block border-b border-black pb-0.5 text-[10px]" style={{ fontFamily: 'Kalpurush', fontSize: '10px', lineHeight: '1.0' }}>
                              উপ-মহাব্যবস্থাপক, অনলাইন ব্যাংকিং ডিপার্টমেন্ট সমীপেঃ {viewingOrder.content?.signingOfficer ? `(${viewingOrder.content?.signingOfficer})` : ''}
                            </p>
                          </div>
                          <div style={{ marginBottom: '0.85in' }}>
                            <p className="inline-block border-b border-black pb-0.5 text-[10px]" style={{ fontFamily: 'Kalpurush', fontSize: '10px', lineHeight: '1.0' }}>
                              উপ-মহাব্যবস্থাপক, বাজেট অ্যান্ড এক্সপেন্ডিচার কন্ট্রোল ডিপার্টমেন্ট সমীপেঃ
                            </p>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                ) : (
                  /* simulated A4 Office Order sheet (currently rendered) */
                  <div 
                    id="printable-order-sheet"
                    className="w-[210mm] min-h-[297mm] bg-white border border-slate-200 text-black shadow-lg p-[1.0in] flex flex-col justify-between relative text-left font-serif leading-relaxed text-[10px]"
                    style={{ color: '#000000', backgroundColor: '#ffffff', fontFamily: 'Kalpurush, "Noto Sans Bengali", sans-serif', boxSizing: 'border-box' }}
                  >
                    <div>
                      {/* Janata Bank PLC Redesigned Header to match mockup logo exactly */}
                      <div className="w-full flex justify-between items-start border-b-2 border-[#0b5e9e] pb-2">
                        {/* Left side: Logo & Tagline */}
                        <div className="flex items-start gap-2 text-left">
                          <svg viewBox="0 0 512 512" style={{ width: '64px', height: '64px' }} className="text-[#0b5e9e] shrink-0" fill="none">
                            <g>
                              <path fill="currentColor" d="M175.7,351.4c-53.1,0-96.4-43.3-96.4-96.4c0-24.9,9.5-48.6,26.6-66.5l8.2,7.9c-15.1,15.8-23.5,36.7-23.5,58.7c0,46.9,38.1,85.1,85,85.1c46.9,0,85.1-38.2,85.1-85.1v-97.7h11.4v97.7C272.1,308.1,228.9,351.4,175.7,351.4z"/>
                              <path fill="currentColor" d="M175.7,329.1c-41.3,0-74.9-33.6-74.9-74.9c0-19.4,7.3-37.7,20.7-51.7l8.2,7.9c-11.3,11.8-17.5,27.4-17.5,43.9c0,35.1,28.5,63.6,63.5,63.6c35.1,0,63.6-28.5,63.6-63.6v-96.9h11.4v96.9C250.7,295.4,217,329.1,175.7,329.1z"/>
                              <path fill="currentColor" d="M175.7,306.8c-29.5,0-53.4-24-53.4-53.5c0-13.8,5.2-26.9,14.8-36.9l8.2,7.9c-7.5,7.8-11.6,18.2-11.6,29c0,23.2,18.9,42.1,42.1,42.1c23.2,0,42.1-18.9,42.1-42.1v-96.1h11.4v96.1C229.2,282.8,205.2,306.8,175.7,306.8z"/>
                              <path fill="currentColor" d="M175.7,284.4c-17.6,0-32-14.3-32-32c0-8.3,3.1-16.1,8.8-22.1l8.2,7.9c-3.7,3.8-5.7,8.9-5.7,14.2c0,11.4,9.2,20.6,20.6,20.6c11.4,0,20.6-9.2,20.6-20.6v-95.2h11.4v95.2C207.7,270.1,193.3,284.4,175.7,284.4z"/>
                              <path fill="currentColor" d="M400.1,255.1c9.9-7.8,15.9-19.8,15.9-32.7c0-23-18.7-41.6-41.6-41.6h-85.1v11.7h85.1c16.5,0,29.9,13.4,29.9,29.9c0,11.8-7,22.5-17.8,27.3l-12.1,5.4l12.1,5.4c10.8,4.8,17.8,15.5,17.8,27.3c0,16.5-13.4,30-29.9,30H270.2c-2.7,4.1-5.8,8-9,11.7h113.1c23,0,41.6-18.7,41.6-41.7C416,274.8,410,262.8,400.1,255.1z"/>
                              <path fill="currentColor" d="M442.1,218.5c0-33.9-27.6-61.5-61.5-61.5h-91.4v11.4h91.4c27.7,0,50.2,22.5,50.2,50.2c0,12.1-4.4,23.8-12.3,32.8l-3.3,3.7l3.3,3.7c7.9,9.1,12.3,20.8,12.3,32.9c0,27.7-22.5,50.2-50.2,50.2h-132c-5,4.2-10.5,8-16.2,11.4h148.2c33.9,0,61.5-27.6,61.5-61.5c0-13.2-4.3-26-12.1-36.6C437.9,244.6,442.1,231.8,442.1,218.5z"/>
                              <path fill="currentColor" d="M362.7,204.7h-73.5v11.4h73.5c5.4,0,9.7,4.3,9.7,9.7c0,2.6-1,5-2.9,6.9c-1.8,1.8-4.2,2.8-6.8,2.8h-73.5v11.4h73.5c5.7,0,11-2.2,14.9-6.2c4-4,6.2-9.3,6.2-14.9C383.8,214.2,374.3,204.7,362.7,204.7z"/>
                              <path fill="currentColor" d="M362.7,263.3h-73.8c-0.3,3.8-0.8,7.6-1.4,11.4h75.2c5.4,0,9.7,4.4,9.7,9.7c0,2.6-1,5.1-2.9,6.9c-1.8,1.8-4.3,2.8-6.8,2.8h-80.4c-1.4,3.9-3.1,7.7-4.9,11.4h85.4c5.6,0,10.9-2.2,14.8-6.1c4-3.9,6.3-9.3,6.3-15C383.8,272.7,374.3,263.3,362.7,263.3z"/>
                              <path fill="currentColor" d="M255.8,420.3c-64.5,0-129-12.9-192.9-38.6l-2.7-1.1l-0.7-2.8c-24.7-97.3-24.7-177.2,0.2-244.3l0.9-2.4l2.3-0.9c128.4-51.4,258.3-51.4,386.2,0l2.7,1.1l0.7,2.8c24.7,97.3,24.7,177.2-0.2,244.3l-0.9,2.4-2.3,0.9C384.9,407.4,320.3,420.3,255.8,420.3z M69.8,372.2c123.4,48.9,248.8,48.9,372.7-0.1c22.9-63.7,22.8-139.8-0.3-232.3c-123.4-48.9-248.8-48.9-372.7,0.1C46.6,203.6,46.7,279.7,69.8,372.2z"/>
                            </g>
                          </svg>
                          <div className="font-serif leading-none mt-0.5">
                            <h2 style={{ fontFamily: 'Kalpurush', fontSize: '24px', fontWeight: 'bold', color: '#0b5e9e', lineHeight: '1.0', margin: 0 }}>জনতা ব্যাংক পিএলসি.</h2>
                            <p style={{ fontFamily: 'Kalpurush', fontSize: '10px', fontWeight: 'bold', color: '#555555', marginTop: '4px', lineHeight: '1.0', margin: 0 }}>উন্নয়নে আপনার বিশ্বস্ত অংশীদার</p>
                          </div>
                        </div>

                        {/* Right side: Department */}
                        <div className="text-right mt-1">
                          <h3 style={{ fontFamily: 'Kalpurush', fontSize: '18px', fontWeight: 'bold', color: '#000000', lineHeight: '1.0', marginTop: '8px' }}>অনলাইন ব্যাংকিং ডিপার্টমেন্ট</h3>
                        </div>
                      </div>

                      {/* Sub-header line: Reference and Date (With exactly 1 inch space below it) */}
                      <div className="w-full flex justify-between items-center text-[10px] pt-1 pb-1 border-b border-black/10 mt-1" style={{ fontFamily: 'Kalpurush', fontSize: '10px', lineHeight: '1.0', marginBottom: '0.4in' }}>
                        <span className="font-bold">সূত্রঃ {viewingOrder.orderRef}</span>
                        <span className="font-bold">
                          তারিখঃ {toBanglaDigits(new Date(viewingOrder.orderDate).toLocaleDateString('bn-BD', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-'))} ইং
                        </span>
                      </div>

                      {/* Title and Main Body */}
                      <div className="flex-1 flex flex-col justify-start pt-2 text-[10px]" style={{ fontFamily: 'Kalpurush', fontSize: '10px', lineHeight: '1.0' }}>
                        <div className="space-y-2.5">
                          <h2 className="text-center text-[12px] font-extrabold underline decoration-black underline-offset-2" style={{ fontFamily: 'Kalpurush', fontSize: '12px', lineHeight: '1.0' }}>
                            অফিস নির্দেশ
                          </h2>
                          
                          <p 
                            className="text-justify leading-normal mt-2 text-[10px] text-slate-950 text-indent-8"
                            style={{ fontFamily: 'Kalpurush', fontSize: '10px', lineHeight: '1.0', textIndent: '0.5in', textAlign: 'justify' }}
                            dangerouslySetInnerHTML={{ __html: viewingOrder.content?.orderText || '' }}
                          />

                          {/* Redesigned Printed Duty Table Grouped by Employee */}
                          {viewingOrder.duties && viewingOrder.duties.length > 0 ? (
                            <table className="w-full border-collapse border border-black text-center mt-2.5 text-[10px]" style={{ fontFamily: 'Kalpurush', fontSize: '10px', lineHeight: '1.0', borderCollapse: 'collapse', border: '1px solid #000' }}>
                              <thead>
                                <tr className="bg-slate-50 font-bold border-b border-black text-[10px]" style={{ fontFamily: 'Kalpurush', fontSize: '10px', lineHeight: '1.0' }}>
                                  <th className="border border-black p-1 w-[8%] text-center" style={{ border: '1px solid #000', padding: '4px' }}>ক্রমিক নং</th>
                                  <th className="border border-black p-1 text-left pl-2 w-[28%]" style={{ border: '1px solid #000', padding: '4px', textAlign: 'left', paddingLeft: '8px' }}>নির্বাহী/ কর্মকর্তার নাম</th>
                                  <th className="border border-black p-1 text-center w-[12%]" style={{ border: '1px solid #000', padding: '4px', textAlign: 'center' }}>পদবী</th>
                                  <th className="border border-black p-1 text-left pl-2 w-[27%]" style={{ border: '1px solid #000', padding: '4px', textAlign: 'left', paddingLeft: '8px' }}>কাজের বিবরণ</th>
                                  <th className="border border-black p-1 text-center w-[25%]" style={{ border: '1px solid #000', padding: '4px', textAlign: 'center' }}>তারিখ</th>
                                </tr>
                              </thead>
                              <tbody>
                                {viewingOrder.duties.map((group: any, index: number) => (
                                  <tr key={index} className="text-black text-[10px]" style={{ fontFamily: 'Kalpurush', fontSize: '10px', lineHeight: '1.0' }}>
                                    <td className="border border-black p-1 text-center font-normal" style={{ border: '1px solid #000', padding: '4px', textAlign: 'center' }}>
                                      {toBanglaDigits(index + 1)}
                                    </td>
                                    <td className="border border-black p-1 text-left pl-2 leading-tight font-normal text-[10px]" style={{ border: '1px solid #000', padding: '4px', textAlign: 'left', paddingLeft: '8px' }}>
                                      {group.employeeName.startsWith('জনাব') ? group.employeeName : `জনাব ${group.employeeName}`}
                                    </td>
                                    <td className="border border-black p-1 text-center font-normal" style={{ border: '1px solid #000', padding: '4px', textAlign: 'center' }}>
                                      {group.designation.match(/\(([^)]+)\)/) ? group.designation.match(/\(([^)]+)\)/)[1] : group.designation}
                                    </td>
                                    <td className="border border-black p-1 text-left pl-2 leading-tight font-normal text-black" style={{ border: '1px solid #000', padding: '4px', textAlign: 'left', paddingLeft: '8px' }}>
                                      {group.description || 'Customization এবং Development সংক্রান্ত'}
                                    </td>
                                    <td className="border border-black p-1 text-center font-normal font-serif leading-snug tracking-tight" style={{ border: '1px solid #000', padding: '4px', textAlign: 'center' }}>
                                      {getFormattedDateList(group.dates)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : null}

                          {/* Sign-off Officer block (Left Aligned on Bottom Left with 1 inch space above it) */}
                          <div className="w-full flex justify-start text-[10px]" style={{ fontFamily: 'Kalpurush', fontSize: '10px', lineHeight: '1.0', marginTop: '1.0in' }}>
                            <div className="text-left pl-2">
                              <p className="font-bold text-black" style={{ margin: 0, fontWeight: 'bold' }}>({viewingOrder.content?.signingOfficer || 'স্বাক্ষরিত'})</p>
                              <p className="text-[10px] text-slate-800" style={{ margin: 0, marginTop: '2px', fontWeight: 'bold' }}>{viewingOrder.content?.signingDesignation || 'উপ-মহাব্যবস্থাপক'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>

            </div>

          </div>
        );
      })()}

    </div>
  );
}
