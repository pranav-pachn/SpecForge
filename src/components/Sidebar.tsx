"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  FileText, 
  GitPullRequest, 
  LayoutDashboard, 
  Settings,
  ShieldCheck,
  CheckSquare,
  Activity,
  Home
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md flex flex-col h-full shrink-0 relative z-10">
      <nav className="flex-1 p-4 space-y-6">
        <div className="space-y-1.5">
          <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 px-3">
            Core
          </div>
          <Link 
            href="/dashboard"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              pathname === '/dashboard' 
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' 
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            <Home className="w-5 h-5" />
            Dashboard
          </Link>
        </div>
      </nav>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <div className="mt-4 px-3 flex items-center justify-between text-xs text-slate-400 font-medium">
          <span>Collapse menu</span>
          <kbd className="px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 font-mono text-[10px]">⌘B</kbd>
        </div>
      </div>
    </aside>
  );
}
