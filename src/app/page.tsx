import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto py-12">
      <h1 className="text-4xl font-bold mb-4">Welcome to SpecForge</h1>
      <p className="text-xl text-slate-600 dark:text-slate-400 mb-8">
        The spec-to-execution workflow OS for AI-assisted software development.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <div className="border rounded-lg p-6 bg-slate-50 dark:bg-slate-900">
          <h2 className="text-xl font-semibold mb-2">Start a Workflow</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Convert a raw feature request into a structured spec, plan, and execution pack.
          </p>
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-blue-600 hover:underline font-medium">
            Go to Dashboard <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
