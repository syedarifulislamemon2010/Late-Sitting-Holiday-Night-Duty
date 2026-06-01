import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
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
      <body className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300" suppressHydrationWarning={true}>
        <AuthGuard>
          <div className="flex-1 flex flex-col lg:flex-row min-h-0" suppressHydrationWarning={true}>
            <Sidebar />
            <main className="flex-1 flex flex-col min-w-0" suppressHydrationWarning={true}>
              <div className="flex-1 p-4 lg:p-8 overflow-y-auto flex flex-col justify-between" suppressHydrationWarning={true}>
                <div className="flex-1">
                  {children}
                </div>
                
                {/* Premium Dashboard Footer */}
                <footer className="mt-12 pt-6 border-t border-slate-200/60 dark:border-slate-800/80 text-center space-y-1 text-slate-400 dark:text-slate-500 font-semibold tracking-wide select-none">
                  <p className="text-[11px] sm:text-xs">
                    Designed & Developed by <span className="font-extrabold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">CBS Integrated Development Cell</span>
                  </p>
                  <p className="text-[10px] sm:text-[11px] opacity-80">
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
