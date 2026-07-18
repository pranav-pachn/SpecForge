"use client";

import Link from "next/link";
import { Hammer } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { motion } from "framer-motion";

export function Header() {
  return (
    <header className="absolute top-0 inset-x-0 h-20 px-6 flex items-center justify-between z-50 max-w-7xl mx-auto w-full">
      <Link href="/" className="flex items-center gap-2 font-bold text-xl group">
        <motion.div 
          animate={{ rotate: [0, 5, 0, -5, 0] }}
          transition={{ repeat: Infinity, repeatDelay: 4, duration: 0.5 }}
          className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-2 rounded-xl shadow-[0_0_15px_rgba(59,130,246,0.5)]"
        >
          <Hammer className="h-5 w-5" />
        </motion.div>
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 tracking-tight">
          SpecForge
        </span>
      </Link>
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <Link 
          href="/login" 
          className="text-sm font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors"
        >
          Log in
        </Link>
        <Link 
          href="/login?demo=true" 
          className="text-sm font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors hidden sm:block"
        >
          View Demo
        </Link>
        <Link 
          href="/signup" 
          className="text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg transition-colors shadow-sm"
        >
          Sign up
        </Link>
      </div>
    </header>
  );
}
