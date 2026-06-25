"use client";

import { useState, useRef } from "react";
import { Upload, ScanLine } from "lucide-react";

interface ExtractedEntry {
  bankId: string;
  employeeName: string;
  dates: string[];
}

interface RosterOCRImportProps {
  cellId: number;
  dutyType: "LATE_SITTING" | "HOLIDAY" | "NIGHT_SHIFT";
  onImportConfirmed: (entries: ExtractedEntry[]) => void;
  disabled?: boolean;
}

export default function RosterOCRImport({
  cellId,
  dutyType,
  onImportConfirmed,
  disabled = false,
}: RosterOCRImportProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [extractedEntries, setExtractedEntries] = useState<ExtractedEntry[]>([]);
  const [scanMessage, setScanMessage] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (file: File) => {
    setIsScanning(true);
    setExtractedEntries([]);
    setPreviewUrl(URL.createObjectURL(file));

    const formData = new FormData();
    formData.append("image", file);
    formData.append("dutyType", dutyType);
    formData.append("cellId", cellId.toString());

    try {
      const response = await fetch("/api/duties/parse-roster-image", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setExtractedEntries(data.extractedEntries);
        setScanMessage(data.message);
      } else {
        setScanMessage(data.message || "স্ক্যান করতে সমস্যা হয়েছে।");
      }
    } catch {
      setScanMessage("নেটওয়ার্ক সমস্যা। আবার চেষ্টা করুন।");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className={`border border-dashed rounded-xl p-4 transition-all duration-300 ${disabled ? 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/10' : 'border-blue-300 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-950/20'}`}>
      <div className="flex items-center gap-2 mb-2">
        <ScanLine className={disabled ? 'text-slate-400 dark:text-slate-650' : 'text-blue-600 dark:text-blue-400'} size={18} />
        <h3 className={`font-semibold ${disabled ? 'text-slate-500 dark:text-slate-455' : 'text-blue-800 dark:text-blue-200'}`} style={{ fontFamily: "'SolaimanLipi', sans-serif" }}>
          রোস্টার ইমেজ থেকে স্বয়ংক্রিয় আমদানি (AI OCR)
        </h3>
      </div>
      {disabled && (
        <p className="text-[11px] text-amber-600 dark:text-amber-505 font-bold mb-3 flex items-center gap-1 font-sans">
          <span>⚠️ ইমেজ থেকে ইম্পোর্ট করতে প্রথমে উপরে ডিউটির ক্যাটাগরি সিলেক্ট করুন</span>
        </p>
      )}

      {/* Upload area */}
      <div
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
          disabled 
            ? "border-slate-200 dark:border-slate-800 bg-slate-100/40 dark:bg-slate-900/20 opacity-60 cursor-not-allowed pointer-events-none" 
            : "border-blue-200 dark:border-blue-800 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:border-blue-300 dark:hover:border-blue-700 text-blue-600 dark:text-blue-400"
        }`}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <Upload className={`mx-auto mb-2 ${disabled ? 'text-slate-350 dark:text-slate-650' : 'text-blue-400 dark:text-blue-500'}`} size={24} />
        <p className={`text-sm font-semibold ${disabled ? 'text-slate-400 dark:text-slate-500' : 'text-blue-600 dark:text-blue-400'}`} style={{ fontFamily: "'SolaimanLipi', sans-serif" }}>
          কাগজের রোস্টারের ছবি এখানে আপলোড করুন
        </p>
        <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">JPG, PNG, WEBP সমর্থিত</p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImageUpload(file);
        }}
      />

      {/* Preview */}
      {previewUrl && (
        <img src={previewUrl} alt="Roster preview" className="mt-3 rounded max-h-40 object-contain w-full" />
      )}

      {/* Scanning state */}
      {isScanning && (
        <div className="mt-3 flex items-center gap-2 text-blue-600 dark:text-blue-400">
          <div className="animate-spin w-4 h-4 border-2 border-blue-600 dark:border-blue-500 border-t-transparent rounded-full" />
          <span className="text-sm" style={{ fontFamily: "'SolaimanLipi', sans-serif" }}>
            AI স্ক্যান করছে...
          </span>
        </div>
      )}

      {/* Extracted entries */}
      {extractedEntries.length > 0 && (
        <div className="mt-3">
          <p className="text-sm text-green-700 dark:text-green-400 mb-2" style={{ fontFamily: "'SolaimanLipi', sans-serif" }}>
            ✅ {scanMessage}
          </p>
          <div className="max-h-48 overflow-y-auto space-y-2">
            {extractedEntries.map((entry, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-950 border border-green-200 dark:border-green-900/40 rounded-xl p-2 text-xs">
                <p className="font-medium text-slate-800 dark:text-slate-200" style={{ fontFamily: "'SolaimanLipi', sans-serif" }}>
                  {entry.employeeName} ({entry.bankId})
                </p>
                <p className="text-gray-500 dark:text-slate-400">{entry.dates.join(", ")}</p>
              </div>
            ))}
          </div>
          <button
            onClick={() => onImportConfirmed(extractedEntries)}
            className="mt-3 w-full bg-green-600 text-white py-2 rounded text-sm font-medium hover:bg-green-700 transition-colors"
            style={{ fontFamily: "'SolaimanLipi', sans-serif" }}
          >
            ✅ নিশ্চিত করুন ও ডিউটি ইমপোর্ট করুন
          </button>
        </div>
      )}
    </div>
  );
}
