"use client";

export function DispatcherHeader({ dispatcherName = "DANIEL V." }: { dispatcherName?: string }) {
  return (
    <header className="h-14 border-b border-slate-200 flex items-center justify-between px-6 bg-white z-10 backdrop-blur-sm shadow-sm">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-600 rounded-md flex items-center justify-center font-bold text-sm text-white shadow-lg shadow-blue-500/20">
            T
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-tight text-slate-900">TIQN</span>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Dispatch Control</span>
          </div>
        </div>
        <div className="h-6 w-px bg-slate-200"></div>
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
          <span className="font-mono">SYSTEM OPERATIONAL</span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="text-xs font-medium text-slate-900">{dispatcherName}</div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wider">Operator</div>
        </div>
        <div className="w-8 h-8 bg-slate-100 rounded-md border border-slate-200 flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 text-slate-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </div>
      </div>
    </header>
  );
}

