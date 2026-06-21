import Link from "next/link";
import { 
  FileText, 
  GitPullRequest, 
  LayoutDashboard, 
  Settings,
  ShieldCheck,
  CheckSquare,
  Activity
} from "lucide-react";

export default function Sidebar() {
  return (
    <aside className="w-64 border-r bg-slate-50 dark:bg-slate-900 flex flex-col h-full shrink-0">
      <nav className="flex-1 p-4 space-y-4">
        <div className="space-y-1">
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
            <LayoutDashboard className="h-4 w-4" />
            <span className="text-sm font-medium">Dashboard</span>
          </Link>
          <Link href="/workflows" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
            <GitPullRequest className="h-4 w-4" />
            <span className="text-sm font-medium">Workflows</span>
          </Link>
          <Link href="/artifacts" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
            <FileText className="h-4 w-4" />
            <span className="text-sm font-medium">Artifacts</span>
          </Link>
        </div>

        <div>
          <h3 className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Quality</h3>
          <div className="space-y-1">
            <Link href="/review" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
              <CheckSquare className="h-4 w-4" />
              <span className="text-sm font-medium">Review</span>
            </Link>
            <Link href="/validation" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
              <ShieldCheck className="h-4 w-4" />
              <span className="text-sm font-medium">Validation</span>
            </Link>
            <Link href="/drift" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
              <Activity className="h-4 w-4" />
              <span className="text-sm font-medium">Drift</span>
            </Link>
          </div>
        </div>
      </nav>
      <div className="p-4 border-t">
        <Link href="/settings" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-slate-500">
          <Settings className="h-4 w-4" />
          <span className="text-sm font-medium">Settings</span>
        </Link>
      </div>
    </aside>
  );
}
