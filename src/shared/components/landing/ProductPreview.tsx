"use client";

import { motion } from "framer-motion";
import { Copy, CheckCircle2, ChevronRight, Circle } from "lucide-react";

export function ProductPreview() {
  const containerVariants: any = {
    hidden: { opacity: 0, y: 40 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut", staggerChildren: 0.2 } },
  };

  const itemVariants: any = {
    hidden: { opacity: 0, x: -10 },
    show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 100 } },
  };

  return (
    <section className="py-24 bg-[#0a0a0f] border-y border-white/5 relative overflow-hidden text-white">
      {/* Visual Motif: Background Flow Lines */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M54.627 0l.83.83-54.627 54.627-.83-.83L54.627 0zM0 54.627l54.627-54.627.83.83L.83 55.457 0 54.627z' fill='%23ffffff' fill-rule='evenodd'/%3E%3C/svg%3E")`,
        }}
      />
      
      <div className="max-w-4xl mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Give your AI the context it actually needs.
          </h2>
          <p className="text-slate-400">
            Export an Execution Pack and never paste a generic prompt again.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="max-w-2xl mx-auto glass-panel !bg-[#0f111a]/90 !border-white/10 p-1 rounded-2xl shadow-2xl relative"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-transparent rounded-2xl pointer-events-none" />
          
          <div className="bg-[#050508] rounded-xl p-6 sm:p-8 relative z-10 border border-white/5 font-mono">
            {/* Header */}
            <div className="flex items-start sm:items-center justify-between flex-col sm:flex-row gap-4 mb-6 pb-6 border-b border-white/10">
              <div>
                <div className="text-slate-500 text-xs mb-1 font-sans font-semibold tracking-wider">TASK-04</div>
                <h3 className="text-xl font-bold text-slate-200">Implement Login API</h3>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-400 rounded-full text-xs font-sans">
                <Circle className="w-2 h-2 fill-green-400 text-green-400 animate-pulse" />
                Ready
              </div>
            </div>

            {/* Progress */}
            <div className="mb-8">
              <div className="flex justify-between items-center text-xs font-sans text-slate-400 mb-2">
                <span>Progress</span>
                <span>5 / 5 checks passed</span>
              </div>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  whileInView={{ width: "100%" }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                  className="h-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"
                />
              </div>
            </div>

            {/* Content list */}
            <div className="space-y-4 text-sm">
              {[
                { label: "Requirements", detail: "From §2.1 of spec" },
                { label: "Architecture", detail: "AuthService module" },
                { label: "Constraints", detail: "Rate limit: 5/min" },
                { label: "Acceptance", detail: "JWT, Audit, 429" },
                { label: "Tests", detail: "3 auto-generated" },
              ].map((item, idx) => (
                <motion.div key={idx} variants={itemVariants} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="text-slate-300 font-sans font-medium">{item.label}</span>
                  </div>
                  <div className="text-slate-500 flex items-center gap-2">
                    {item.detail}
                    <ChevronRight className="w-3 h-3 text-slate-700" />
                  </div>
                </motion.div>
              ))}
            </div>
            
            {/* Action */}
            <motion.button 
              variants={itemVariants}
              className="w-full mt-8 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-sans font-bold transition-colors"
            >
              <Copy className="w-4 h-4" /> Copy to Cursor
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
