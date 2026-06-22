"use client";

import { useEffect, useState } from "react";
import { Users, ClipboardList, FileText, Calendar } from "lucide-react";

interface DashboardStats {
  totalEmployees: number;
  dutiesThisMonth: number;
  pendingOrders: number;
  leavesThisMonth: number;
  month: string;
}

function StatCard({
  label,
  value,
  icon,
  color,
  loading,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  loading: boolean;
}) {
  if (loading) return <div className="animate-pulse bg-gray-150/60 dark:bg-slate-800 rounded-2xl h-28 border border-slate-200/50 dark:border-slate-800/80" />;
  return (
    <div className={`rounded-2xl p-5 border ${color} flex items-center gap-4 shadow-sm transition-all hover:scale-[1.01]`}>
      <div className="p-3 bg-white/60 dark:bg-slate-900/40 rounded-xl">{icon}</div>
      <div>
        <p
          className="text-3xl font-bold"
          style={{ fontFamily: "'SolaimanLipi', 'Nikosh', sans-serif" }}
        >
          {value.toLocaleString("bn-BD")}
        </p>
        <p
          className="text-sm text-gray-600 dark:text-slate-400 mt-0.5"
          style={{ fontFamily: "'SolaimanLipi', 'Nikosh', sans-serif" }}
        >
          {label}
        </p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((r) => r.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const cards = [
    {
      label: "মোট কর্মকর্তা",
      value: stats?.totalEmployees ?? 0,
      icon: <Users size={22} className="text-blue-600 dark:text-blue-400" />,
      color: "bg-blue-50/50 border-blue-200/60 dark:bg-blue-950/10 dark:border-blue-900/30 text-blue-950 dark:text-blue-200",
    },
    {
      label: `${stats?.month ?? "এই মাসে"} ডিউটি`,
      value: stats?.dutiesThisMonth ?? 0,
      icon: <ClipboardList size={22} className="text-green-600 dark:text-green-400" />,
      color: "bg-green-50/50 border-green-200/60 dark:bg-green-950/10 dark:border-green-900/30 text-green-950 dark:text-green-200",
    },
    {
      label: "অমুদ্রিত অর্ডার",
      value: stats?.pendingOrders ?? 0,
      icon: <FileText size={22} className="text-amber-600 dark:text-amber-400" />,
      color: "bg-amber-50/50 border-amber-200/60 dark:bg-amber-955/10 dark:border-amber-900/30 text-amber-950 dark:text-amber-200",
    },
    {
      label: "এই মাসে ছুটি",
      value: stats?.leavesThisMonth ?? 0,
      icon: <Calendar size={22} className="text-purple-600 dark:text-purple-400" />,
      color: "bg-purple-50/50 border-purple-200/60 dark:bg-purple-955/10 dark:border-purple-900/30 text-purple-950 dark:text-purple-200",
    },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 font-sans">
      <div className="mb-6">
        <h1
          className="text-2xl font-bold text-gray-800 dark:text-slate-100"
          style={{ fontFamily: "'SolaimanLipi', 'Nikosh', sans-serif" }}
        >
          ড্যাশবোর্ড
        </h1>
        <p
          className="text-gray-500 dark:text-slate-400 text-sm mt-1"
          style={{ fontFamily: "'SolaimanLipi', 'Nikosh', sans-serif" }}
        >
          জনতা ব্যাংক পিএলসি — অনলাইন ব্যাংকিং বিভাগ
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card, i) => (
          <StatCard key={i} {...card} loading={loading} />
        ))}
      </div>

      <div className="bg-gray-50/40 dark:bg-slate-900/10 rounded-2xl p-6 border border-gray-200/50 dark:border-slate-800/80">
        <h2
          className="font-bold text-gray-700 dark:text-slate-355 mb-4 text-base"
          style={{ fontFamily: "'SolaimanLipi', 'Nikosh', sans-serif" }}
        >
          দ্রুত অ্যাক্সেস
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "রোস্টার", href: "/roster" },
            { label: "বিলিং", href: "/billing" },
            { label: "কর্মকর্তা", href: "/employees" },
            { label: "ছুটি", href: "/leave" },
          ].map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-center py-3 px-4 bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 rounded-xl text-sm font-medium text-slate-750 dark:text-slate-300 hover:bg-blue-50/60 dark:hover:bg-blue-950/20 hover:border-blue-300 dark:hover:border-blue-800 hover:text-blue-700 dark:hover:text-blue-400 transition-colors shadow-xs"
              style={{ fontFamily: "'SolaimanLipi', 'Nikosh', sans-serif" }}
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
