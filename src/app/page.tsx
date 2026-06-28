import Link from "next/link";
import { ArrowRight, Hammer, Layers, LayoutTemplate, ShieldCheck, Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen font-sans animate-in">
      {/* Hero Section */}
      <section className="relative px-6 py-24 md:py-32 lg:py-40 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-blue-50 to-transparent dark:from-blue-900/20 dark:to-transparent -z-10" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-200 dark:bg-purple-900/20 rounded-full blur-3xl opacity-50 -z-10" />
        <div className="absolute top-48 -left-24 w-72 h-72 bg-blue-200 dark:bg-blue-900/20 rounded-full blur-3xl opacity-50 -z-10" />

        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold text-sm mb-8 shadow-sm">
            <Hammer className="w-4 h-4" />
            <span>SpecForge is now in Beta</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-8 leading-tight">
            Stop coding in <br className="hidden md:block" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">the dark.</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 mb-12 max-w-3xl mx-auto leading-relaxed">
            The spec-to-execution workflow OS for AI-assisted software development. Turn messy ideas into structured specs, decompose them into tasks, and hand off perfect context to Cursor, Windsurf, or Copilot.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/dashboard" 
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
            >
              Start Forging <ArrowRight className="h-5 w-5" />
            </Link>
            <a 
              href="https://github.com/pranav-pachn/SpecForge" 
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 px-8 py-4 rounded-xl font-bold text-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm"
            >
              View on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* Value Prop & Features */}
      <section className="py-24 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              A structured pipeline for AI engineering
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              LLMs are great at writing code, but terrible at figuring out what to build. SpecForge forces you to clarify your intent before the AI starts typing.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-slate-950 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                <LayoutTemplate className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">1. Specification</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Dump your messy feature ideas. SpecForge uses AI to organize them into a clean, structured PRD with clear goals, non-goals, and constraints.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-950 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow relative">
              <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/30 text-purple-600 rounded-xl flex items-center justify-center mb-6">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">2. Decomposition</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Break the approved spec down into a technical architecture and a sequenced list of execution tasks that an AI coding agent can follow.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-950 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-green-50 dark:bg-green-900/30 text-green-600 rounded-xl flex items-center justify-center mb-6">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">3. Execution Handoff</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Generate highly-contextualized "Execution Packs" for Cursor or Windsurf, giving the AI exactly what it needs for each specific task.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-200 dark:border-slate-800 text-center text-slate-500">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Hammer className="w-5 h-5 text-slate-400" />
          <span className="font-bold text-slate-700 dark:text-slate-300">SpecForge</span>
        </div>
        <p className="text-sm">Built for the AI-assisted developer.</p>
      </footer>
    </div>
  );
}
