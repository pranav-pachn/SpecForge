"use client";

import { motion } from "framer-motion";
import { FileCode2, Sparkles, RefreshCcw } from "lucide-react";

export function BenefitsSection() {
  const containerVariants: any = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.15 } },
  };

  const itemVariants: any = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } },
  };

  const BENEFITS = [
    {
      icon: FileCode2,
      title: "Specification First",
      desc: "No more prompt chaos. Define what to build before the AI starts typing.",
      color: "text-blue-500",
      bg: "bg-blue-50 dark:bg-blue-900/20"
    },
    {
      icon: Sparkles,
      title: "Execution Ready",
      desc: "Generate per-task bundles with exact requirements, architecture, and tests.",
      color: "text-amber-500",
      bg: "bg-amber-50 dark:bg-amber-900/20"
    },
    {
      icon: RefreshCcw,
      title: "Stay in Sync",
      desc: "When requirements change, SpecForge flags stale artifacts and regenerates.",
      color: "text-green-500",
      bg: "bg-green-50 dark:bg-green-900/20"
    }
  ];

  return (
    <section className="py-24 bg-white dark:bg-[#020408]">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid md:grid-cols-3 gap-8"
        >
          {BENEFITS.map((benefit, idx) => {
            const Icon = benefit.icon;
            return (
              <motion.div key={idx} variants={itemVariants} className="p-8 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 shadow-sm">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${benefit.bg}`}>
                  <Icon className={`w-6 h-6 ${benefit.color}`} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                  {benefit.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {benefit.desc}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
