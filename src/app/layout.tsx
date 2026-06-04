import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import AuthGuard from "@/components/AuthGuard";

export const metadata: Metadata = {
  title: "লেট সিটিং-হলিডে-নাইট পোর্টাল",
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
        <script
          suppressHydrationWarning={true}
          dangerouslySetInnerHTML={{
            __html: `
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
        <AuthGuard>
          <div className="flex-1 flex flex-col lg:flex-row min-h-0" suppressHydrationWarning={true}>
            <Sidebar />
            <main className="flex-1 flex flex-col min-w-0" suppressHydrationWarning={true}>
              <Navbar />
              <div className="flex-1 p-4 lg:p-8 overflow-y-auto flex flex-col justify-between" suppressHydrationWarning={true}>
                <div className="flex-1">
                  {children}
                </div>
                
                {/* Premium Dashboard Footer */}
                <footer className="no-print print:hidden py-6 mt-auto text-slate-400 text-xs font-medium text-center">
                  <p>
                    Designed & Developed by <span className="font-semibold text-blue-600">CBS Integrated Development Cell</span>
                  </p>
                  <p className="mt-1">
                    Online Banking Department | © 2026 Janata Bank PLC. All Rights Reserved.
                  </p>
                </footer>
              </div>
            </main>
          </div>
        </AuthGuard>
      </body>
    </html>
  );
}
