import { Hammer } from "lucide-react";

export function Footer() {
  return (
    <footer className="py-12 border-t border-slate-200 dark:border-slate-800 text-center text-slate-500">
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="flex items-center justify-center gap-2">
          <Hammer className="w-5 h-5 text-slate-400" />
          <span className="font-bold text-slate-700 dark:text-slate-300 tracking-tight">SpecForge</span>
        </div>
        <p className="text-sm font-medium">Built for the AI-assisted developer.</p>
        <div className="flex gap-6 text-xs mt-2">
          <a href="https://github.com/pranav-pachn/SpecForge" target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 dark:hover:text-white transition-colors">
            GitHub
          </a>
          <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">
            Documentation
          </a>
          <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">
            Twitter
          </a>
        </div>
      </div>
    </footer>
  );
}
