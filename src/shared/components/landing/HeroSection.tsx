"use client";

import Link from "next/link";
import { ArrowRight, Hammer } from "lucide-react";
import { WorkflowTransformation } from "./WorkflowTransformation";
import { motion } from "framer-motion";

export function HeroSection() {
  return (
    <section className="relative px-6 pt-32 pb-24 md:pt-40 md:pb-32 overflow-hidden min-h-[90vh] flex items-center">
      {/* Background motif: flowing lines */}
      <div className="absolute inset-0 pointer-events-none opacity-20 dark:opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M54.627 0l.83.83-54.627 54.627-.83-.83L54.627 0zM0 54.627l54.627-54.627.83.83L.83 55.457 0 54.627z' fill='%233B82F6' fill-rule='evenodd'/%3E%3C/svg%3E")`,
        }}
      />
      <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-white to-transparent dark:from-[#0a0a0f] dark:to-transparent -z-10" />

      <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-16 lg:gap-8 items-center relative z-10">
        {/* Left Side: Messaging */}
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold text-sm mb-8 border border-blue-100 dark:border-blue-800/50">
            <Hammer className="w-4 h-4" />
            <span>SpecForge is now in Beta</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6 leading-[1.1]">
            AI writes code.<br />
            <span className="text-slate-400">SpecForge tells it</span><br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">what to build.</span>
          </h1>
          
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-6 max-w-xl leading-relaxed">
            Transform rough ideas into engineering-ready specifications, plans, tasks, and AI execution packs.
          </p>

          <p className="text-slate-500 dark:text-slate-500 text-sm italic mb-10 max-w-xl leading-relaxed">
            Software projects fail because requirements, architecture, and implementation drift apart. SpecForge keeps them aligned.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <Link 
              href="/dashboard" 
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
            >
              Start Building <ArrowRight className="h-5 w-5" />
            </Link>
            <Link 
              href="/login?demo=true" 
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white dark:bg-[#0f111a] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 px-8 py-4 rounded-xl font-bold text-lg hover:bg-slate-50 dark:hover:bg-white/5 transition-all shadow-sm"
            >
              View Demo
            </Link>
          </div>
        </div>

        {/* Right Side: Animated Workflow Transformation */}
        <div className="relative z-10 w-full flex justify-center lg:justify-end">
          <WorkflowTransformation />
        </div>
      </div>
    </section>
  );
}
