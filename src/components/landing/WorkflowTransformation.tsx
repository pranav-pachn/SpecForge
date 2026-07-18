"use client";

import { motion } from "framer-motion";
import { Check, CheckCircle2, FileText, Code2, Workflow, ShieldCheck, ChevronDown } from "lucide-react";

export function WorkflowTransformation() {
  const containerVariants: any = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 1.2,
      },
    },
  };

  const itemVariants: any = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } },
  };

  const nodeVariants: any = {
    hidden: { opacity: 0, scale: 0.8 },
    show: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 120 } },
  };

  const lineVariants: any = {
    hidden: { height: 0 },
    show: { height: 40, transition: { duration: 0.8, ease: "easeInOut" } },
  };

  const PIPELINE = [
    { id: "spec", label: "Specification", icon: FileText, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
    { id: "plan", label: "Architecture", icon: Workflow, color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-900/20" },
    { id: "tasks", label: "Tasks", icon: CheckCircle2, color: "text-violet-500", bg: "bg-violet-50 dark:bg-violet-900/20" },
    { id: "execution", label: "Execution", sub: "Cursor · Claude Code · Windsurf", icon: Code2, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
    { id: "validation", label: "Validation", icon: ShieldCheck, color: "text-green-500", bg: "bg-green-50 dark:bg-green-900/20" },
  ];

  return (
    <div className="relative w-full max-w-sm mx-auto min-h-[500px] flex flex-col items-center justify-center p-6">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
        className="w-full flex flex-col items-center"
      >
        {/* Phase 1: Messy Idea */}
        <motion.div variants={itemVariants} className="w-full relative z-10 mb-2">
          <div className="bg-yellow-100 dark:bg-yellow-900/20 p-4 rounded-lg shadow-sm border border-yellow-200 dark:border-yellow-700/30 transform -rotate-2">
            <p className="font-handwriting text-yellow-900 dark:text-yellow-200/80 text-sm leading-relaxed">
              💡 Need authentication with Google, roles maybe admin, rate limiting?
            </p>
          </div>
        </motion.div>

        {/* The transformation line */}
        <motion.div variants={lineVariants} className="w-px bg-gradient-to-b from-yellow-300 to-blue-500 relative flex items-center justify-center">
           <ChevronDown className="absolute bottom-0 translate-y-full w-4 h-4 text-blue-500" />
        </motion.div>
        
        {/* Spacer for chevron */}
        <div className="h-6" />

        {/* Phase 2: Pipeline Nodes */}
        {PIPELINE.map((node, idx) => {
          const Icon = node.icon;
          const isLast = idx === PIPELINE.length - 1;

          return (
            <div key={node.id} className="w-full flex flex-col items-center">
              <motion.div variants={nodeVariants} className="w-full max-w-[240px] relative">
                {/* Connecting line TO next element, if not last */}
                {!isLast && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-px h-8 z-0 overflow-hidden">
                    <motion.div
                      initial={{ height: 0 }}
                      whileInView={{ height: 32 }}
                      viewport={{ once: true }}
                      transition={{ delay: (idx + 1) * 1.2 + 0.5, duration: 0.6 }}
                      className="absolute top-0 left-0 w-full bg-gradient-to-b from-blue-200 to-blue-200 dark:from-white/10 dark:to-white/10"
                    />
                    
                    {/* Glowing Pulse */}
                    <motion.div
                      initial={{ top: "-10px", opacity: 0 }}
                      animate={{ top: "100%", opacity: [0, 0.6, 0] }}
                      transition={{ 
                        repeat: Infinity, 
                        duration: 1.5, 
                        delay: (idx + 1) * 1.2 + 1.5, // Start pulsing after line is drawn
                        repeatDelay: 3
                      }}
                      className="absolute left-1/2 -translate-x-1/2 w-2 h-2 bg-blue-400 rounded-full blur-[1px]"
                    />
                  </div>
                )}

                <div className="glass-panel p-3 rounded-xl flex items-center justify-between border border-slate-200 dark:border-white/10 shadow-sm relative z-10 bg-white/80 dark:bg-[#0f111a]/80">
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg ${node.bg}`}>
                      <Icon className={`w-4 h-4 ${node.color}`} />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">{node.label}</span>
                      {node.sub && (
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{node.sub}</span>
                      )}
                    </div>
                  </div>
                  <motion.div
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: (idx + 1) * 1.2 + 0.3, type: "spring" }}
                  >
                    <Check className="w-4 h-4 text-green-500" />
                  </motion.div>
                </div>
              </motion.div>
              
              {/* Gap between nodes to match line length */}
              {!isLast && <div className="h-8" />}
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}
