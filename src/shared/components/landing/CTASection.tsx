"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export function CTASection() {
  return (
    <section className="py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-blue-600 dark:bg-blue-900/20 -z-10" />
      
      {/* Motif Lines */}
      <div className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M54.627 0l.83.83-54.627 54.627-.83-.83L54.627 0zM0 54.627l54.627-54.627.83.83L.83 55.457 0 54.627z' fill='%23ffffff' fill-rule='evenodd'/%3E%3C/svg%3E")`,
        }}
      />
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      <div className="absolute -top-48 -right-48 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-48 -left-48 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl" />

      <div className="max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight leading-tight mb-8">
            Stop vibe coding.
            <br />
            <span className="text-blue-200">Start engineering.</span>
          </h2>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12">
            <Link 
              href="/dashboard" 
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-50 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1"
            >
              Build with SpecForge <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
