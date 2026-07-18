"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";

export function BuiltForSection() {
  const AUDIENCES = [
    "AI Engineers",
    "Full Stack Developers",
    "Startups",
    "Hackathons"
  ];

  const USE_CASES = [
    "Web Apps",
    "APIs",
    "AI Products",
    "Internal Tools"
  ];

  return (
    <section className="py-24 bg-white dark:bg-[#020408] border-t border-slate-100 dark:border-white/5">
      <div className="max-w-xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col items-center text-center"
        >
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-8">
            Built For
          </h2>
          
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4">
            {AUDIENCES.map((audience, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Check className="w-5 h-5 text-blue-500" />
                <span className="font-semibold text-slate-700 dark:text-slate-300 text-lg">{audience}</span>
              </div>
            ))}
          </div>

          <div className="mt-16 w-full max-w-lg mx-auto border-t border-slate-100 dark:border-white/10 pt-16">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-8">
              Used to build
            </h2>
            
            <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-4">
              {USE_CASES.map((useCase, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">{useCase}</span>
                  {idx < USE_CASES.length - 1 && (
                    <span className="text-slate-300 dark:text-slate-700 font-bold">·</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
