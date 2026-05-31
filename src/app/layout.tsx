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
              <div className="flex-1 p-4 lg:p-8 overflow-y-auto" suppressHydrationWarning={true}>
                {children}
              </div>
            </main>
          </div>
        </AuthGuard>
      </body>
    </html>
  );
}
