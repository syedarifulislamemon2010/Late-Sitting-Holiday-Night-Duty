export default function Loading() {
  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-950">
      {/* Sidebar Skeleton */}
      <div className="hidden md:flex w-64 flex-col border-r border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 p-4">
        <div className="h-10 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse mb-8"></div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 w-full bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Navbar Skeleton */}
        <div className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 flex items-center justify-between px-6">
          <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded-md animate-pulse"></div>
          <div className="h-8 w-8 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse"></div>
        </div>

        {/* Content Skeleton */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="space-y-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="h-10 w-1/3 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse"></div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl animate-pulse"></div>
              ))}
            </div>

            {/* Main Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 h-[400px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl animate-pulse"></div>
              <div className="h-[400px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
