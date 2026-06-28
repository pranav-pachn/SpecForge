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
  Activity
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path + "/");
  };

  const navItemClass = (path: string, colorClass: string) => cn(
    "flex items-center gap-3 px-3 py-2 rounded-lg transition-all font-medium text-sm border border-transparent",
    isActive(path) 
      ? `bg-white dark:bg-slate-900 shadow-sm border-slate-200 dark:border-slate-800 ${colorClass}` 
      : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
  );

  return (
    <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md flex flex-col h-full shrink-0 relative z-10">
      <nav className="flex-1 p-4 space-y-6">
        <div className="space-y-1.5">
          <Link href="/dashboard" className={navItemClass("/dashboard", "text-blue-600 dark:text-blue-400")}>
            <LayoutDashboard className="h-4 w-4" />
            <span>Dashboard</span>
          </Link>
          <Link href="/workflows" className={navItemClass("/workflows", "text-blue-600 dark:text-blue-400")}>
            <GitPullRequest className="h-4 w-4" />
            <span>Workflows</span>
          </Link>
          <Link href="/artifacts" className={navItemClass("/artifacts", "text-blue-600 dark:text-blue-400")}>
            <FileText className="h-4 w-4" />
            <span>Artifacts</span>
          </Link>
        </div>

        <div>
          <h3 className="px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Quality Control</h3>
          <div className="space-y-1.5">
            <Link href="/review" className={navItemClass("/review", "text-purple-600 dark:text-purple-400")}>
              <CheckSquare className="h-4 w-4" />
              <span>Review Gates</span>
            </Link>
            <Link href="/validation" className={navItemClass("/validation", "text-indigo-600 dark:text-indigo-400")}>
              <ShieldCheck className="h-4 w-4" />
              <span>Validation</span>
            </Link>
            <Link href="/drift" className={navItemClass("/drift", "text-rose-600 dark:text-rose-400")}>
              <Activity className="h-4 w-4" />
              <span>Drift Monitoring</span>
            </Link>
          </div>
        </div>
      </nav>
      
      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <Link href="/settings" className={navItemClass("/settings", "text-slate-900 dark:text-slate-100")}>
          <Settings className="h-4 w-4" />
          <span>Settings</span>
        </Link>
        
        <div className="mt-4 px-3 flex items-center justify-between text-xs text-slate-400 font-medium">
          <span>Collapse menu</span>
          <kbd className="px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 font-mono text-[10px]">⌘B</kbd>
        </div>
      </div>
    </aside>
  );
}
