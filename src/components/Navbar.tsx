import Link from "next/link";
import { Hammer } from "lucide-react";

export default function Navbar() {
  return (
    <header className="h-14 border-b flex items-center px-6 shrink-0 bg-background">
      <Link href="/" className="flex items-center gap-2 font-semibold">
        <Hammer className="h-5 w-5" />
        <span>SpecForge</span>
      </Link>
      <div className="ml-auto flex items-center gap-4">
        {/* User profile, workspace selector, etc. */}
        <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-800" />
      </div>
    </header>
  );
}
