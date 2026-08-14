"use client";

import { useState } from "react";
import { Info, CheckCircle2, AlertTriangle } from "lucide-react";

interface ConfidenceBadgeProps {
  score: number;
  evidence: string[];
  riskFactors?: string[];
  align?: "left" | "right";
}

export function ConfidenceBadge({ score, evidence, riskFactors = [], align = "right" }: ConfidenceBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const isHigh = score >= 90;
  const isMedium = score >= 70 && score < 90;
  
  const colorClass = isHigh ? "text-blue-400" : isMedium ? "text-yellow-400" : "text-red-400";
  const bgClass = isHigh ? "bg-blue-500/10" : isMedium ? "bg-yellow-500/10" : "bg-red-500/10";
  const dotColor = isHigh ? "bg-blue-500" : isMedium ? "bg-yellow-500" : "bg-red-500";

  return (
    <div className="relative inline-block" onMouseLeave={() => setIsOpen(false)}>
      <button
        type="button"
        onMouseEnter={() => setIsOpen(true)}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2 py-0.5 rounded-full hover:bg-white/5 transition-colors group cursor-help"
      >
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor} opacity-70 group-hover:opacity-100 transition-opacity`} />
        <span className="text-xs font-bold text-slate-500 group-hover:text-slate-300 transition-colors">{score}% Complete</span>
      </button>

      {isOpen && (
        <div className={`absolute top-full mt-2 w-72 glass border border-white/10 rounded-xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 ${align === 'right' ? 'right-0' : 'left-0'}`}>
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/10">
            <span className="text-sm font-bold text-slate-200">Completeness Score</span>
            <span className={`text-lg font-black ${colorClass} ${bgClass} px-2 py-0.5 rounded`}>{score}%</span>
          </div>

          <div className="space-y-4">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3" /> Evidence
              </div>
              <ul className="space-y-1.5">
                {evidence.map((ev, i) => (
                  <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span className="leading-relaxed">{ev}</span>
                  </li>
                ))}
              </ul>
            </div>

            {riskFactors.length > 0 && (
              <div>
                <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-3 h-3 text-yellow-500" /> Risk Factors
                </div>
                <ul className="space-y-1.5">
                  {riskFactors.map((risk, i) => (
                    <li key={i} className="text-xs text-slate-400 flex items-start gap-2">
                      <span className="text-yellow-500 mt-0.5">•</span>
                      <span className="leading-relaxed">{risk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
