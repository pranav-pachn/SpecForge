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
  Home,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMobileMenu } from "./MobileMenuContext";

export default function Sidebar() {
  const pathname = usePathname();
  const { isOpen, setIsOpen } = useMobileMenu();

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm transition-all" 
          onClick={() => setIsOpen(false)}
        />
      )}
      <aside className={cn(
        "w-64 pt-4 pb-4 pl-4 pr-4 md:pr-0 flex-col h-full shrink-0 z-50 md:relative md:flex transition-transform duration-300",
        isOpen ? "flex fixed inset-y-0 left-0" : "hidden md:flex"
      )}>
        <div className="glass-panel flex-1 rounded-2xl flex flex-col overflow-hidden relative bg-slate-900/90 md:bg-transparent">
          <button 
            onClick={() => setIsOpen(false)}
            className="md:hidden absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
          <nav className="flex-1 p-4 space-y-6 pt-12 md:pt-4">
            <div className="space-y-1.5">
              <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 px-3">
                Core
              </div>
              <Link 
                href="/dashboard"
                onClick={() => setIsOpen(false)}
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

          <div className="p-4 border-t border-white/5 hidden md:block">
            <div className="mt-4 px-3 flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Collapse menu</span>
              <kbd className="px-1.5 py-0.5 rounded border border-slate-700 bg-black/20 font-mono text-[10px]">⌘B</kbd>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
