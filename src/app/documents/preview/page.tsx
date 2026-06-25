'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';

function PreviewContent() {
  const searchParams = useSearchParams();
  const file = searchParams.get('file');
  const id = searchParams.get('id');
  const name = searchParams.get('name') || 'নথি';
  const type = searchParams.get('type') || '';
  const source = searchParams.get('source') || '';

  const isOfficeOrderOrBill = ['office-order', 'office_order', 'bill'].includes(source.trim().toLowerCase());

  const [loading, setLoading] = useState(!isOfficeOrderOrBill);
  const [error, setError] = useState<string | null>(null);
  const [pages, setPages] = useState<string[]>([]);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const pdfjsLoaded = useRef(false);

  useEffect(() => {
    if (isOfficeOrderOrBill) {
      setLoading(false);
      return;
    }

    const cleanType = type.trim().toLowerCase().replace(/^\./, '');
    const isPDF = cleanType === 'pdf';

    if (isPDF) {
      if (pdfjsLoaded.current) return;
      pdfjsLoaded.current = true;

      // Dynamically load PDF.js CDN
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js';
      script.async = true;
      script.onload = async () => {
        try {
          // @ts-ignore
          const pdfjsLib = window.pdfjsLib;
          pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

          let bytes: Uint8Array;

          if (id) {
            // Load base64 encoded PDF via JSON endpoint (bypasses IDM completely)
            const res = await fetch(`/api/manual-documents/raw?id=${id}`);
            if (!res.ok) throw new Error(`Server returned status ${res.status}`);
            
            const json = await res.json();
            if (!json.success || !json.data) {
              throw new Error(json.message || 'Failed to retrieve file contents');
            }

            const binaryString = window.atob(json.data);
            const len = binaryString.length;
            bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
          } else if (file) {
            // Fallback: fetch raw PDF file as arrayBuffer
            const res = await fetch(file);
            if (!res.ok) throw new Error(`Server returned status ${res.status}`);
            const buffer = await res.arrayBuffer();
            bytes = new Uint8Array(buffer);
          } else {
            throw new Error('No valid file source provided');
          }

          const loadingTask = pdfjsLib.getDocument({
            data: bytes,
            disableRange: true,
            disableStream: true
          });
          
          const pdf = await loadingTask.promise;
          const renderedPages: string[] = [];

          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale: 1.5 });

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            if (!context) continue;

            canvas.height = viewport.height;
            canvas.width = viewport.width;

            const renderContext = {
              canvasContext: context,
              viewport: viewport,
            };

            await page.render(renderContext).promise;

            // Convert to base64 image data URL
            renderedPages.push(canvas.toDataURL('image/png'));
          }

          setPages(renderedPages);
          setLoading(false);

          // Wait for rendering to settle, then open print dialog
          setTimeout(() => {
            window.print();
          }, 500);
        } catch (err) {
          console.error('Error rendering PDF:', err);
          setError('নথি লোড করতে ব্যর্থ হয়েছে। অনুগ্রহ করে ফাইলটি ডাউনলোড করে প্রিন্ট করুন।');
          setLoading(false);
        }
      };

      script.onerror = () => {
        setError('PDF.js লাইব্রেরি লোড করতে ব্যর্থ হয়েছে।');
        setLoading(false);
      };

      document.head.appendChild(script);

      return () => {
        if (document.head.contains(script)) {
          document.head.removeChild(script);
        }
      };
    } else {
      // Handle Image previews
      const loadImage = async () => {
        try {
          if (id) {
            const res = await fetch(`/api/manual-documents/raw?id=${id}`);
            if (!res.ok) throw new Error(`Server returned status ${res.status}`);
            
            const json = await res.json();
            if (!json.success || !json.data) {
              throw new Error(json.message || 'Failed to retrieve image contents');
            }
            
            setImgSrc(`data:${json.mimeType || 'image/jpeg'};base64,${json.data}`);
          } else if (file) {
            setImgSrc(file);
          } else {
            throw new Error('No valid file source provided');
          }
        } catch (err) {
          console.error('Error loading image:', err);
          setError('ছবিটি লোড করতে ব্যর্থ হয়েছে।');
          setLoading(false);
        }
      };
      
      loadImage();
    }
  }, [file, id, type]);

  if (isOfficeOrderOrBill) {
    return (
      <div style={{ width: '100%', height: '100vh', margin: 0, padding: 0, overflow: 'hidden' }}>
        <iframe
          src={`/api/office-orders/raw?id=${id}`}
          style={{ width: '100%', height: '100vh', border: 'none' }}
          title={name}
        />
      </div>
    );
  }

  // Error layout
  if (error) {
    return (
      <div style={{ textAlign: 'center', marginTop: '100px', fontFamily: 'sans-serif', padding: '20px' }}>
        <p style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '16px' }}>{error}</p>
        <p style={{ color: '#64748b', fontSize: '14px', marginTop: '12px' }}>
          অনুগ্রহ করে প্রিভিউ উইন্ডোটি বন্ধ করে ডাউনলোড বাটনে ক্লিক করুন।
        </p>
      </div>
    );
  }

  // Loading layout
  if (loading && pages.length === 0 && !imgSrc) {
    const isPDF = type.trim().toLowerCase().replace(/^\./, '') === 'pdf';
    return (
      <div style={{ textAlign: 'center', marginTop: '150px', fontFamily: 'sans-serif', color: '#4f46e5' }}>
        <div
          style={{
            display: 'inline-block',
            width: '40px',
            height: '40px',
            border: '4px solid #e0e7ff',
            borderTopColor: '#4f46e5',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
        <p style={{ fontWeight: 'bold', fontSize: '15px', marginTop: '20px' }}>
          {isPDF ? 'নথি লোড হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন...' : 'ছবি লোড হচ্ছে...'}
        </p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Render Image directly
  const cleanType = type.trim().toLowerCase().replace(/^\./, '');
  if (cleanType !== 'pdf') {
    return (
      <div className="image-preview-container">
        <style>{`
          body {
            margin: 0;
            padding: 0;
            background-color: #f4f4f5;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
          }
          img {
            max-width: 100%;
            max-height: 100vh;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          @media print {
            @page {
              size: A4 landscape;
              margin: 0;
            }
            body {
              background-color: #ffffff;
              margin: 0;
              padding: 0;
            }
            img {
              box-shadow: none;
              max-width: 100% !important;
              max-height: 95vh !important;
              width: auto !important;
              height: auto !important;
              display: block;
              margin: 0 auto;
            }
          }
        `}</style>
        {imgSrc && (
          <img
            src={imgSrc}
            alt={name}
            onLoad={() => {
              setLoading(false);
              setTimeout(() => window.print(), 300);
            }}
            onError={() => {
              setLoading(false);
              setError('ছবিটি লোড করতে ব্যর্থ হয়েছে।');
            }}
          />
        )}
      </div>
    );
  }

  // Render PDF Pages
  return (
    <div className="pdf-preview-container">
      <style>{`
        body {
          margin: 0;
          padding: 0;
          background-color: #f4f4f5;
          display: flex;
          flex-direction: column;
          align-items: center;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        .page-container {
          margin: 20px 0;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          background-color: #ffffff;
          display: block;
          max-width: 800px;
          width: 90%;
        }
        img.pdf-page-img {
          width: 100%;
          display: block;
          height: auto;
        }
        @media print {
          @page {
            size: A4 landscape;
            margin: 0;
          }
          body {
            background-color: #ffffff;
            margin: 0;
            padding: 0;
          }
          .page-container {
            margin: 0;
            padding: 0;
            box-shadow: none;
            page-break-after: always;
            width: 100%;
            max-width: 100%;
            display: block;
          }
          img.pdf-page-img {
            max-width: 100% !important;
            max-height: 95vh !important;
            width: auto !important;
            height: auto !important;
            display: block;
            margin: 0 auto;
          }
        }
      `}</style>
      {pages.map((src, idx) => (
        <div key={idx} className="page-container">
          <img src={src} className="pdf-page-img" alt={`Page ${idx + 1}`} />
        </div>
      ))}
    </div>
  );
}

export default function PreviewPage() {
  useEffect(() => {
    const syncTheme = () => {
      const storedTheme = localStorage.getItem('theme');
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const shouldBeDark = storedTheme === 'dark' || (!storedTheme && systemDark);
      if (shouldBeDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };
    syncTheme();
    window.addEventListener('storage', syncTheme);
    return () => window.removeEventListener('storage', syncTheme);
  }, []);

  return (
    <Suspense
      fallback={
        <div style={{ textAlign: 'center', marginTop: '100px', fontSize: '15px', color: '#4f46e5', fontWeight: 'bold' }}>
          লোড হচ্ছে...
        </div>
      }
    >
      <style>{`
        /* Global Theme Override for Previews */
        @media screen {
          aside, nav, footer, header, [role="navigation"], .no-print {
            display: none !important;
          }
          body, html, main, 
          main > div,
          main > div > div {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: 100% !important;
            min-height: 100vh !important;
            max-width: none !important;
            background: #f4f4f5 !important;
          }
          .dark body, .dark html, .dark main,
          .dark main > div,
          .dark main > div > div {
            background: #030712 !important;
          }
        }
        .dark iframe {
          background-color: #0b0f19 !important;
        }
        .dark body, .dark .pdf-preview-container, .dark .image-preview-container {
          background-color: #030712 !important;
        }
        .dark .page-container {
          background-color: #0f172a !important;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4) !important;
          border-color: #1e293b !important;
        }
        .dark img.pdf-page-img {
          filter: invert(0.9) hue-rotate(180deg) !important;
        }
        @media print {
          iframe, img.pdf-page-img, img {
            filter: none !important;
          }
          .page-container {
            background-color: #ffffff !important;
            box-shadow: none !important;
          }
        }
      `}</style>
      <PreviewContent />
    </Suspense>
  );
}
