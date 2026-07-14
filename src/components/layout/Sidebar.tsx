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
    <aside className="w-64 pt-4 pb-4 pl-4 flex flex-col h-full shrink-0 relative z-10">
      <div className="glass-panel flex-1 rounded-2xl flex flex-col overflow-hidden">
      <nav className="flex-1 p-4 space-y-6">
        <div className="space-y-1.5">
          <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 px-3">
            Core
          </div>
          <Link 
            href="/dashboard"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              pathname === '/dashboard' 
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]' 
                : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'
            }`}
          >
            <Home className="w-5 h-5" />
            Dashboard
          </Link>
        </div>
      </nav>

      <div className="p-4 border-t border-white/5">
        <div className="mt-4 px-3 flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>Collapse menu</span>
          <kbd className="px-1.5 py-0.5 rounded border border-slate-700 bg-black/20 font-mono text-[10px]">⌘B</kbd>
        </div>
      </div>
      </div>
    </aside>
  );
}
