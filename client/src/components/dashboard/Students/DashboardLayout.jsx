import TopNav from './TopNav';

export default function DashboardLayout({ 
  children, 
  title = '',
  breadcrumbs = [],
  showPageHeader = true,
  showSystemStatusInHeader = false 
}) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* Top Navigation Bar */}
      <TopNav />
      
      {/* Main Content Area */}
      <main className="flex-1">
        {/* Optional Page Header */}
        {showPageHeader && (
          <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
            <div className="max-w-7xl mx-auto px-6 py-6">
              {breadcrumbs.length > 0 && (
                <nav className="text-xs text-slate-500 mb-2">
                  {breadcrumbs.map((b, idx) => (
                    <span key={`${b.label}-${idx}`}>
                      <span className="font-medium text-slate-600">{b.label}</span>
                      {idx < breadcrumbs.length - 1 && <span className="mx-2 text-slate-300">/</span>}
                    </span>
                  ))}
                </nav>
              )}
              {title && (
                <div className="flex items-center justify-between gap-4">
                  <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
                  {showSystemStatusInHeader && (
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      System Online
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Page Content */}
        <div className="max-w-7xl mx-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
}