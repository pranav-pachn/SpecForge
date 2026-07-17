"use client";

import { useEffect, useState } from "react";
import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { Hammer, Folder, Moon, Sun, Settings, LogOut, Code, Search } from "lucide-react";
import { useTheme } from "next-themes";
import { signOut } from "next-auth/react";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{workflows: any[], projects: any[]}>({ workflows: [], projects: [] });
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    if (query.length >= 2) {
      setLoading(true);
      const debounce = setTimeout(() => {
        fetch(`/api/search?q=${encodeURIComponent(query)}`)
          .then(res => res.json())
          .then(data => {
            if (data.workflows || data.projects) {
              setResults({ workflows: data.workflows || [], projects: data.projects || [] });
            }
          })
          .finally(() => setLoading(false));
      }, 300);
      return () => clearTimeout(debounce);
    } else {
      setResults({ workflows: [], projects: [] });
    }
  }, [query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[15vh]">
      <div 
        className="fixed inset-0" 
        onClick={() => setOpen(false)}
      />
      <Command 
        shouldFilter={false}
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-200"
        onKeyDown={(e) => {
          if (e.key === 'Escape') setOpen(false);
        }}
      >
        <div className="flex items-center border-b border-slate-200 dark:border-white/10 px-4">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <Command.Input 
            autoFocus
            value={query}
            onValueChange={setQuery}
            placeholder="Type a command or search workflows..." 
            className="w-full bg-transparent border-0 outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400 p-4 font-medium"
          />
          {loading && <div className="w-4 h-4 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin shrink-0 mx-2" />}
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 font-sans">
            ESC
          </kbd>
        </div>

        <Command.List className="max-h-[60vh] overflow-y-auto p-2 scrollbar-thin">
          <Command.Empty className="p-8 text-center text-slate-500 text-sm">
            {loading ? "Searching..." : "No results found."}
          </Command.Empty>

          {(results.workflows.length > 0 || results.projects.length > 0) && (
            <Command.Group heading="Search Results" className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2 py-2">
              {results.workflows.map(wf => (
                <Command.Item 
                  key={wf.id}
                  onSelect={() => { router.push(`/workflow/${wf.id}`); setOpen(false); }}
                  className="flex items-center gap-3 px-3 py-3 mt-1 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5 aria-selected:bg-slate-100 dark:aria-selected:bg-white/5 transition-colors group"
                >
                  <Hammer className="w-4 h-4 text-blue-500" />
                  <span className="font-medium text-sm text-slate-700 dark:text-slate-300 flex-1">{wf.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">{wf.status}</span>
                </Command.Item>
              ))}
            </Command.Group>
          )}

          <Command.Group heading="Navigation" className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2 py-2">
            <Command.Item 
              onSelect={() => { router.push("/dashboard"); setOpen(false); }}
              className="flex items-center gap-3 px-3 py-3 mt-1 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5 aria-selected:bg-slate-100 dark:aria-selected:bg-white/5 aria-selected:text-blue-600 dark:aria-selected:text-blue-400 transition-colors group"
            >
              <Hammer className="w-4 h-4 text-slate-400 group-aria-selected:text-blue-500" />
              <span className="font-medium text-sm text-slate-700 dark:text-slate-300 group-aria-selected:text-blue-600 dark:group-aria-selected:text-blue-400">Dashboard</span>
            </Command.Item>
            <Command.Item 
              onSelect={() => { router.push("/dashboard?new=true"); setOpen(false); }}
              className="flex items-center gap-3 px-3 py-3 mt-1 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5 aria-selected:bg-slate-100 dark:aria-selected:bg-white/5 aria-selected:text-blue-600 dark:aria-selected:text-blue-400 transition-colors group"
            >
              <Folder className="w-4 h-4 text-slate-400 group-aria-selected:text-blue-500" />
              <span className="font-medium text-sm text-slate-700 dark:text-slate-300 group-aria-selected:text-blue-600 dark:group-aria-selected:text-blue-400">Create New Project</span>
            </Command.Item>
          </Command.Group>

          <Command.Group heading="Preferences" className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2 py-2 mt-2">
            <Command.Item 
              onSelect={() => { setTheme("light"); setOpen(false); }}
              className="flex items-center gap-3 px-3 py-3 mt-1 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5 aria-selected:bg-slate-100 dark:aria-selected:bg-white/5 transition-colors group"
            >
              <Sun className="w-4 h-4 text-slate-400" />
              <span className="font-medium text-sm text-slate-700 dark:text-slate-300">Light Mode</span>
            </Command.Item>
            <Command.Item 
              onSelect={() => { setTheme("dark"); setOpen(false); }}
              className="flex items-center gap-3 px-3 py-3 mt-1 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5 aria-selected:bg-slate-100 dark:aria-selected:bg-white/5 transition-colors group"
            >
              <Moon className="w-4 h-4 text-slate-400" />
              <span className="font-medium text-sm text-slate-700 dark:text-slate-300">Dark Mode</span>
            </Command.Item>
            <Command.Item 
              onSelect={() => { setTheme("system"); setOpen(false); }}
              className="flex items-center gap-3 px-3 py-3 mt-1 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5 aria-selected:bg-slate-100 dark:aria-selected:bg-white/5 transition-colors group"
            >
              <Settings className="w-4 h-4 text-slate-400" />
              <span className="font-medium text-sm text-slate-700 dark:text-slate-300">System Theme</span>
            </Command.Item>
          </Command.Group>

          <Command.Group heading="Account" className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2 py-2 mt-2">
            <Command.Item 
              onSelect={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center gap-3 px-3 py-3 mt-1 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5 aria-selected:bg-red-500/10 aria-selected:text-red-600 dark:aria-selected:text-red-400 transition-colors group"
            >
              <LogOut className="w-4 h-4 text-slate-400 group-aria-selected:text-red-500" />
              <span className="font-medium text-sm text-slate-700 dark:text-slate-300 group-aria-selected:text-red-600 dark:group-aria-selected:text-red-400">Sign Out</span>
            </Command.Item>
          </Command.Group>
        </Command.List>
      </Command>
    </div>
  );
}
