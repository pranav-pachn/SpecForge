"use client";

import { CheckCircle2, AlertTriangle, ShieldCheck, Zap, Activity } from "lucide-react";

export default function ValidationScoreHero({ report }: { report: any }) {
  if (!report) return null;

  const { confidence, risk, recommendation } = report;
  
  const isSafe = recommendation === "SAFE_TO_APPLY";
  const isWarning = recommendation === "NEEDS_REVIEW";
  
  const bgGlow = isSafe
    ? "shadow-green-500/20"
    : isWarning
    ? "shadow-yellow-500/20"
    : "shadow-red-500/20";

  return (
    <div className={`glass border-white/10 rounded-2xl border shadow-xl ${bgGlow} overflow-hidden`}>
      <div className="bg-slate-900/50 p-4 border-b border-white/5 flex items-center justify-center">
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Validation Result</h3>
      </div>
      
      <div className="p-8 md:p-12 flex flex-col items-center justify-center gap-8 text-center relative overflow-hidden">
        {/* Background Decorative Rings */}
        <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
           <div className={`w-[400px] h-[400px] rounded-full border-4 ${isSafe ? 'border-green-500' : 'border-yellow-500'}`} />
        </div>
        
        <div className="flex items-center gap-12 md:gap-24 relative z-10">
          {/* Confidence */}
          <div className="flex flex-col items-center gap-2">
            <div className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-400 to-indigo-600">
              {confidence.overall}%
            </div>
            <div className="flex items-center gap-1.5 text-sm font-bold text-slate-400 uppercase tracking-widest">
              <Activity className="w-4 h-4 text-blue-500" /> Confidence
            </div>
          </div>
          
          {/* Divider */}
          <div className="w-px h-24 bg-gradient-to-b from-transparent via-white/20 to-transparent hidden md:block" />
          
          {/* Risk */}
          <div className="flex flex-col items-center gap-2">
            <div className={`text-5xl md:text-6xl font-black ${
              risk.level === 'LOW' ? 'text-green-400' : 
              risk.level === 'MEDIUM' ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {risk.level}
            </div>
            <div className="flex items-center gap-1.5 text-sm font-bold text-slate-400 uppercase tracking-widest">
              <ShieldCheck className="w-4 h-4 text-slate-500" /> Risk
            </div>
          </div>
        </div>
        
        {/* Recommendation Badge */}
        <div className={`mt-4 inline-flex items-center gap-3 px-6 py-3 rounded-full text-lg font-bold shadow-lg ${
          isSafe
            ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border border-green-500/30'
            : isWarning
            ? 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-yellow-400 border border-yellow-500/30'
            : 'bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-400 border border-red-500/30'
        }`}>
          {isSafe ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
          {isSafe ? '✓ SAFE TO APPLY' : recommendation.replace(/_/g, ' ')}
        </div>
      </div>
    </div>
  );
}
