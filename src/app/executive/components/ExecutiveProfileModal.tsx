import { Executive, User, extractNickname } from '../types';

interface ExecutiveProfileModalProps {
  profileExec: Executive | null;
  onClose: () => void;
  currentUser: User | null;
  startEditExec: (exec: Executive) => void;
}

export function ExecutiveProfileModal({
  profileExec,
  onClose,
  currentUser,
  startEditExec
}: ExecutiveProfileModalProps) {
  if (!profileExec) return null;

  return (
    <div 
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-sans"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-900 rounded-[28px] w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl animate-scale-up text-slate-800 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Cover Image */}
        <div className="h-28 bg-gradient-to-r from-indigo-500 to-violet-600 relative flex items-end justify-center">
          <div className="absolute -bottom-10 px-3 h-20 min-w-20 rounded-full border-4 border-white dark:border-slate-900 bg-indigo-100 flex items-center justify-center text-indigo-650 text-sm font-extrabold shadow-md">
            {extractNickname(profileExec.name)}
          </div>
        </div>

        {/* Profile Info Details */}
        <div className="pt-14 pb-8 px-6 text-center space-y-6">
          <div>
            <h4 className="font-extrabold text-slate-800 dark:text-slate-50 text-lg leading-tight">{profileExec.name}</h4>
          </div>

          {/* Grid of Attributes */}
          <div className="grid grid-cols-2 gap-3 text-left">
            <div className="p-3 bg-slate-50/70 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 rounded-xl space-y-1.5 col-span-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">পদবী</span>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{profileExec.designation}</p>
            </div>
            <div className="p-3 bg-slate-50/70 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 rounded-xl space-y-1.5 col-span-2 sm:col-span-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">ব্যাংক আইডি</span>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100 font-sans">{profileExec.bankId || 'প্রদান করা হয়নি'}</p>
            </div>
            <div className="p-3 bg-slate-50/70 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 rounded-xl space-y-1.5 col-span-2 sm:col-span-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">ব্যক্তিগত নথি নং</span>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100 font-sans">{profileExec.fileNo || 'প্রদান করা হয়নি'}</p>
            </div>
          </div>

          {/* Close Buttons */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer transition-colors"
            >
              বন্ধ করুন
            </button>
            {currentUser?.role === 'ADMIN' && (
              <button
                onClick={() => {
                  const exec = profileExec;
                  onClose();
                  startEditExec(exec);
                }}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer transition-colors"
              >
                সম্পাদনা করুন
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
