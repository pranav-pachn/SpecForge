"use client";

import Link from "next/link";
import { Hammer, LogOut, Menu } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useMobileMenu } from "./MobileMenuContext";

import { ThemeToggle } from "@/components/ui/ThemeToggle";

export default function Navbar() {
  const { data: session } = useSession();
  const { isOpen, setIsOpen } = useMobileMenu();
  const user = session?.user;
  const initials = user?.name
    ? user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || "?";

  return (
    <header className="h-16 flex items-center px-6 shrink-0 bg-transparent relative z-20">
      <div className="absolute inset-x-4 top-2 bottom-2 glass rounded-2xl flex items-center px-4">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden mr-4 p-2 text-slate-400 hover:text-foreground hover:bg-white/10 rounded-xl transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link href={session ? "/dashboard" : "/"} className="flex items-center gap-3 font-bold text-lg group">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-2 rounded-xl shadow-[0_0_15px_rgba(59,130,246,0.5)] group-hover:shadow-[0_0_25px_rgba(59,130,246,0.7)] group-hover:scale-105 transition-all duration-300">
            <Hammer className="h-4 w-4" />
          </div>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-foreground to-slate-400 tracking-tight">
          SpecForge
        </span>
      </Link>
      
      <div className="ml-auto flex items-center gap-2 sm:gap-4">
        <button 
          onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-colors text-sm"
        >
          <span className="opacity-70">Search</span>
          <kbd className="font-sans text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/20 border border-white/10">Ctrl K</kbd>
        </button>
      
        <div className="h-4 w-px bg-white/10 mx-1 hidden sm:block" />

        <ThemeToggle />

        <div className="flex items-center gap-2 sm:gap-3 bg-black/20 border border-white/5 px-2 sm:px-3 py-1.5 rounded-full shadow-inner">
          <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-[10px] font-bold text-white shadow-[0_0_10px_rgba(168,85,247,0.4)]">
            {initials}
          </div>
          <span className="hidden sm:inline text-sm font-medium text-slate-300 pr-2 max-w-[180px] truncate">
            {user?.email || "Loading..."}
          </span>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="p-2 sm:p-2.5 text-slate-400 hover:text-foreground hover:bg-white/10 rounded-xl transition-all duration-200"
          title="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
      </div>
    </header>
  );
}
