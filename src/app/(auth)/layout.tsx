import { Hammer } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 dark:bg-slate-900 px-4">
      <div className="mb-8 flex flex-col items-center">
        <Link href="/" className="flex items-center gap-2 mb-2 text-2xl font-bold">
          <Hammer className="h-8 w-8 text-blue-600" />
          <span>SpecForge</span>
        </Link>
        <p className="text-slate-500 text-center">
          The spec-to-execution OS for AI-assisted software delivery
        </p>
      </div>
      <div className="w-full max-w-md bg-white dark:bg-slate-950 rounded-xl shadow-sm border p-6 sm:p-8">
        {children}
      </div>
    </div>
  );
}
