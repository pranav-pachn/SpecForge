"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/shared/utils";

const adminLinks = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/infrastructure", label: "Infrastructure" },
  { href: "/admin/events", label: "Events" },
  { href: "/admin/observability", label: "Observability" },
  { href: "/admin/graph", label: "Graph Explorer" },
  { href: "/admin/mcp", label: "MCP Broker" },
  { href: "/admin/evaluation", label: "Evaluation" },
  { href: "/admin/runtime", label: "Runtime" },
  { href: "/admin/gateway", label: "Gateway" },
  { href: "/admin/context", label: "Context" },
  { href: "/admin/memory", label: "Memory" },
  { href: "/admin/playgrounds", label: "Playgrounds" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full space-y-6 max-w-7xl mx-auto w-full">
      <div>
        <h1 className="text-3xl font-bold text-slate-100 tracking-tight mb-2">Platform Diagnostics</h1>
        <p className="text-slate-400">Monitor and debug the SpecForge platform layers.</p>
      </div>

      <nav className="flex space-x-1 overflow-x-auto border-b border-slate-800 pb-px">
        {adminLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "px-4 py-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap",
                isActive
                  ? "border-purple-500 text-purple-400"
                  : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700"
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex-1 overflow-y-auto pb-12">
        {children}
      </div>
    </div>
  );
}
