import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import AuthGuard from "@/components/AuthGuard";

export const metadata: Metadata = {
  title: "ডিউটি ম্যানেজমেন্ট সিস্টেম - ডিউটি পোর্টাল",
  description: "সরকারি অফিস আদেশ ও আপ্যায়ন বিল অটোমেশন পোর্টাল",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn" className="h-full" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col lg:flex-row bg-background text-foreground transition-colors duration-300" suppressHydrationWarning>
        <AuthGuard>
          <Sidebar />
          <main className="flex-1 flex flex-col min-w-0">
            <div className="flex-1 p-4 lg:p-8 overflow-y-auto">
              {children}
            </div>
          </main>
        </AuthGuard>
      </body>
    </html>
  );
}
