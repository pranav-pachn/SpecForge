"use client";

import Link from "next/link";
import { Hammer, LogOut } from "lucide-react";
import { useSession, signOut } from "next-auth/react";

export default function Navbar() {
  const { data: session } = useSession();
  const user = session?.user;
  const initials = user?.name
    ? user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || "?";

  return (
    <header className="h-16 flex items-center px-6 shrink-0 bg-transparent relative z-20">
      <div className="absolute inset-x-4 top-2 bottom-2 glass rounded-2xl flex items-center px-4">
        <Link href="/" className="flex items-center gap-3 font-bold text-lg group">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-2 rounded-xl shadow-[0_0_15px_rgba(59,130,246,0.5)] group-hover:shadow-[0_0_25px_rgba(59,130,246,0.7)] group-hover:scale-105 transition-all duration-300">
            <Hammer className="h-4 w-4" />
          </div>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 tracking-tight">
          SpecForge
        </span>
      </Link>
      
      <div className="ml-auto flex items-center gap-4">
        <div className="flex items-center gap-3 bg-black/20 border border-white/5 px-3 py-1.5 rounded-full shadow-inner">
          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-[10px] font-bold text-white shadow-[0_0_10px_rgba(168,85,247,0.4)]">
            {initials}
          </div>
          <span className="text-sm font-medium text-slate-300 pr-2 max-w-[180px] truncate">
            {user?.email || "Loading..."}
          </span>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="p-2.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
          title="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
      </div>
    </header>
  );
}
