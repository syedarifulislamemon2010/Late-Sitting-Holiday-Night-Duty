import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import AuthGuard from "@/components/AuthGuard";
import CommandCenter from "@/components/CommandCenter";
import CommandPalette from "@/components/CommandPalette";
import { ProfileProvider } from "@/context/ProfileContext";
import { LayoutProvider } from "@/context/LayoutContext";
import { TopProgressBar } from "@/components/TopProgressBar";

import { LanguageProvider } from "@/context/LanguageContext";
import { ToastProvider } from "@/context/ToastContext";
import PageTransition from "@/components/PageTransition";
import SessionExpiryWarning from "@/components/SessionExpiryWarning";

export const metadata: Metadata = {
  title: "লেট সিটিং, ছুটির দিনে ও রাত্রীকালীন ডিউটি পোর্টাল",
  description: "সরকারি অফিস আদেশ ও আপ্যায়ন বিল অটোমেশন পোর্টাল",
  icons: {
    icon: "/janata-bank-logo-real.svg",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn" className="h-full" suppressHydrationWarning={true}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0b5e9e" />
        <script
          suppressHydrationWarning={true}
          dangerouslySetInnerHTML={{
            __html: `
              // Suppress third-party chrome extension errors (e.g. eppiocemhmnlbhjplcgkofciiegomcon, M_ID)
              window.addEventListener('error', function(e) {
                if ((e.filename && e.filename.indexOf('chrome-extension://') !== -1) || 
                    (e.message && (e.message.indexOf('M_ID') !== -1 || e.message.indexOf('chrome-extension') !== -1))) {
                  e.stopImmediatePropagation();
                  e.preventDefault();
                  return true;
                }
              }, true);
              window.addEventListener('unhandledrejection', function(e) {
                if (e.reason && (String(e.reason).indexOf('chrome-extension://') !== -1 || String(e.reason.stack || '').indexOf('chrome-extension://') !== -1)) {
                  e.stopImmediatePropagation();
                  e.preventDefault();
                }
              }, true);

              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function(err) {
                    console.log('SW reg failed: ', err);
                  });
                });
              }
              (function() {
                const removeBisSkinChecked = (el) => {
                  if (el.hasAttribute && el.hasAttribute('bis_skin_checked')) {
                    el.removeAttribute('bis_skin_checked');
                  }
                  for (let i = 0; i < el.children.length; i++) {
                    removeBisSkinChecked(el.children[i]);
                  }
                };
                const observer = new MutationObserver((mutations) => {
                  mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'bis_skin_checked') {
                      mutation.target.removeAttribute('bis_skin_checked');
                    } else if (mutation.addedNodes) {
                      mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1) {
                          removeBisSkinChecked(node);
                        }
                      });
                    }
                  });
                });
                observer.observe(document.documentElement, { 
                  attributes: true, 
                  subtree: true, 
                  childList: true,
                  attributeFilter: ['bis_skin_checked'] 
                });
              })();
            `
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300" suppressHydrationWarning={true}>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-4 focus:left-4 focus:bg-white focus:text-black focus:px-4 focus:py-2 focus:rounded focus:shadow-lg">
          মূল বিষয়বস্তুতে যান
        </a>
        <TopProgressBar />
        <LanguageProvider>
          <ProfileProvider>
            <LayoutProvider>
              <ToastProvider>
                <AuthGuard>
                  <SessionExpiryWarning />
                  <div className="flex-1 flex flex-col lg:flex-row min-h-0" suppressHydrationWarning={true}>
                  <Sidebar />
                  <main id="main-content" className="flex-1 flex flex-col min-w-0" suppressHydrationWarning={true}>
                    <Navbar />
                    <CommandCenter />
                    <CommandPalette />
                    <div className="flex-1 p-4 lg:p-8 overflow-y-auto flex flex-col justify-between" suppressHydrationWarning={true}>
                    <div className="flex-1">
                      <PageTransition>{children}</PageTransition>
                    </div>
                    
                    {/* Premium Dashboard Footer */}
                    <footer className="no-print print:hidden py-4 mt-auto text-slate-400 text-center app-footer-text text-xs font-sans">
                      ডিজাইন ও ডেভেলপমেন্ট: অনলাইন ব্যাংকিং ডিপার্টমেন্ট | সংস্করণ ১.০.০
                    </footer>
                  </div>
                  </main>
                </div>
              </AuthGuard>
            </ToastProvider>
          </LayoutProvider>
        </ProfileProvider>
      </LanguageProvider>
      </body>
    </html>
  );
}
