import Link from 'next/link';

export function QuickAccessSection() {
  const links = [
    { label: "রোস্টার", href: "/roster" },
    { label: "বিলিং", href: "/billing" },
    { label: "কর্মকর্তা", href: "/employees" },
    { label: "ছুটি", href: "/leave" },
  ];

  return (
    <div className="bg-slate-50/40 dark:bg-slate-900/10 rounded-2xl p-6 border border-gray-200/50 dark:border-slate-800/80">
      <h2
        className="font-bold text-gray-700 dark:text-slate-300 mb-4 text-base"
        style={{ fontFamily: "'SolaimanLipi', 'Nikosh', sans-serif" }}
      >
        দ্রুত অ্যাক্সেস
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-center py-3 px-4 bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 rounded-xl text-sm font-medium text-slate-750 dark:text-slate-300 hover:bg-blue-50/60 dark:hover:bg-blue-950/20 hover:border-blue-300 dark:hover:border-blue-800 hover:text-blue-700 dark:hover:text-blue-400 transition-colors shadow-xs cursor-pointer"
            style={{ fontFamily: "'SolaimanLipi', 'Nikosh', sans-serif" }}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
