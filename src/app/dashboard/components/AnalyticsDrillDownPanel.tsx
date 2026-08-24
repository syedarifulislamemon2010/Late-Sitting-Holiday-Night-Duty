import { BarChart3, Building2, TrendingUp, X, Loader2 } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { toBanglaDigits } from '@/lib/bengali-converter';

interface AnalyticsDrillDownPanelProps {
  activeChart: 'LATE_SITTING' | 'HOLIDAY' | 'NIGHT_SHIFT';
  onClose: () => void;
  chartLoading: boolean;
  cellWiseData: { name: string; count: number }[];
  monthlyTrend: { name: string; count: number }[];
}

export function AnalyticsDrillDownPanel({
  activeChart,
  onClose,
  chartLoading,
  cellWiseData,
  monthlyTrend
}: AnalyticsDrillDownPanelProps) {
  return (
    <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6 animate-in slide-in-from-bottom-4 duration-300 font-sans">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="text-indigo-650" size={20} />
          <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-base">
            {activeChart === 'LATE_SITTING' ? 'লেট সিটিং ডিউটি' : activeChart === 'HOLIDAY' ? 'ছুটির দিন ডিউটি' : 'রাত্রীকালীন ডিউটি'} বিশ্লেষণ ও ট্রেন্ড
          </h3>
        </div>
        <button 
          onClick={onClose}
          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-655 rounded-lg cursor-pointer"
        >
          <X size={16} />
        </button>
      </div>

      {chartLoading ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-3">
          <Loader2 className="animate-spin text-indigo-505" size={28} />
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">অ্যানালিটিক্স লোড হচ্ছে...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Cell Split (Bar Chart) */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 size={13} className="text-indigo-500 shrink-0" />
              <span>সেল ভিত্তিক ডিউটি বিভাজন (Cell Split)</span>
            </h4>
            {cellWiseData.length === 0 ? (
              <EmptyState
                icon={Building2}
                title="কোনো সেল রেকর্ড নেই"
                description="বর্তমানে এই ক্যাটাগরির কোনো সেল-ভিত্তিক ডিউটি রেকর্ড পাওয়া যায়নি।"
                className="py-6"
              />
            ) : (
              <div className="space-y-3">
                {cellWiseData.slice(0, 5).map((item, idx) => {
                  const maxVal = Math.max(...cellWiseData.map(c => c.count)) || 1;
                  const percentage = (item.count / maxVal) * 100;
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-350">
                        <span>{item.name}</span>
                        <span className="font-sans font-bold">{toBanglaDigits(item.count)} টি</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800/80 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-650 dark:bg-indigo-400 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Monthly Trend (Line Graph SVG) */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp size={13} className="text-emerald-500 shrink-0" />
              <span>মাসিক ট্রেন্ড গ্রাফ (Monthly Trend)</span>
            </h4>
            
            {monthlyTrend.length === 0 || Math.max(...monthlyTrend.map(t => t.count)) === 0 ? (
              <EmptyState
                icon={TrendingUp}
                title="কোনো ট্রেন্ড ডাটা নেই"
                description="বর্তমানে প্রদর্শনের জন্য কোনো মাসিক ডিউটি ট্রেন্ড পাওয়া যায়নি।"
                className="py-6"
              />
            ) : (
              <div className="w-full h-40 border border-slate-100 dark:border-slate-800/60 rounded-xl bg-slate-50/30 dark:bg-slate-955/10 p-4 relative">
                {(() => {
                  const maxCount = Math.max(...monthlyTrend.map(t => t.count)) || 1;
                  const points = monthlyTrend.map((t, idx) => {
                    const x = (idx / 11) * 220 + 20; 
                    const y = 80 - (t.count / maxCount) * 60; 
                    return `${x},${y}`;
                  }).join(' ');

                  return (
                    <svg viewBox="0 0 260 100" className="w-full h-full overflow-visible">
                      <line x1="20" y1="20" x2="240" y2="20" stroke="#f1f5f9" strokeWidth="0.5" className="dark:stroke-slate-800" />
                      <line x1="20" y1="50" x2="240" y2="50" stroke="#f1f5f9" strokeWidth="0.5" className="dark:stroke-slate-800" />
                      <line x1="20" y1="80" x2="240" y2="80" stroke="#e2e8f0" strokeWidth="1" className="dark:stroke-slate-800" />

                      {points && (
                        <>
                          <polyline
                            fill="none"
                            stroke="#4f46e5"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            points={points}
                          />
                          {monthlyTrend.map((t, idx) => {
                            const x = (idx / 11) * 220 + 20;
                            const y = 80 - (t.count / maxCount) * 60;
                            return (
                              <g key={idx} className="group/dot cursor-pointer">
                                <circle
                                  cx={x}
                                  cy={y}
                                  r="2.5"
                                  fill="#4f46e5"
                                  className="hover:r-4 transition-all"
                                />
                              </g>
                            );
                          })}
                        </>
                      )}
                      
                      {monthlyTrend.filter((_, i) => i % 2 === 0).map((t, idx) => {
                        const originalIdx = idx * 2;
                        const x = (originalIdx / 11) * 220 + 20;
                        return (
                          <text 
                            key={idx} 
                            x={x} 
                            y="92" 
                            textAnchor="middle" 
                            className="text-[6px] font-bold fill-slate-400 font-sans"
                          >
                            {t.name}
                          </text>
                        );
                      })}
                    </svg>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
