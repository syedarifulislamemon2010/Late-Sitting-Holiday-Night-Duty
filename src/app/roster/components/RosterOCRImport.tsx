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
}

export default function RosterOCRImport({
  cellId,
  dutyType,
  onImportConfirmed,
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
      setScanMessage("নেটওয়ার্ক সমস্যা। আবার চেষ্টা করুন।");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="border border-dashed border-blue-300 rounded-lg p-4 bg-blue-50/30">
      <div className="flex items-center gap-2 mb-3">
        <ScanLine className="text-blue-600" size={18} />
        <h3 className="font-semibold text-blue-800" style={{ fontFamily: "'SolaimanLipi', sans-serif" }}>
          রোস্টার ইমেজ থেকে স্বয়ংক্রিয় আমদানি (AI OCR)
        </h3>
      </div>

      {/* Upload area */}
      <div
        className="border-2 border-dashed border-blue-200 rounded-lg p-6 text-center cursor-pointer hover:bg-blue-50 transition-colors"
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="mx-auto mb-2 text-blue-400" size={24} />
        <p className="text-sm text-blue-600" style={{ fontFamily: "'SolaimanLipi', sans-serif" }}>
          কাগজের রোস্টারের ছবি এখানে আপলোড করুন
        </p>
        <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP সমর্থিত</p>
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
        <div className="mt-3 flex items-center gap-2 text-blue-600">
          <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full" />
          <span className="text-sm" style={{ fontFamily: "'SolaimanLipi', sans-serif" }}>
            AI স্ক্যান করছে...
          </span>
        </div>
      )}

      {/* Extracted entries */}
      {extractedEntries.length > 0 && (
        <div className="mt-3">
          <p className="text-sm text-green-700 mb-2" style={{ fontFamily: "'SolaimanLipi', sans-serif" }}>
            ✅ {scanMessage}
          </p>
          <div className="max-h-48 overflow-y-auto space-y-2">
            {extractedEntries.map((entry, idx) => (
              <div key={idx} className="bg-white border border-green-200 rounded p-2 text-xs">
                <p className="font-medium" style={{ fontFamily: "'SolaimanLipi', sans-serif" }}>
                  {entry.employeeName} ({entry.bankId})
                </p>
                <p className="text-gray-500">{entry.dates.join(", ")}</p>
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
