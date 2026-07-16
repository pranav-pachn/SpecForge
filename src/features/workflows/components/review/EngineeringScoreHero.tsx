"use client";

import { CheckCircle2, AlertTriangle } from "lucide-react";

export default function EngineeringScoreHero({ review }: { review: any }) {
  if (!review) return null;

  const score = review.overallScore;
  const isReady = score >= 80;
  const isWarning = score >= 60 && score < 80;

  const circumference = 2 * Math.PI * 52; // r=52
  const strokeDashoffset = circumference - (circumference * score) / 100;

  const ringColor = isReady ? "#22c55e" : isWarning ? "#f59e0b" : "#ef4444";
  const bgGlow = isReady
    ? "shadow-green-100 dark:shadow-green-900/20"
    : isWarning
    ? "shadow-yellow-100 dark:shadow-yellow-900/20"
    : "shadow-red-100 dark:shadow-red-900/20";

  const scoreBreakdown = [
    { label: 'Coverage',     weight: '30%', score: review.coverageScore },
    { label: 'Testing',      weight: '20%', score: review.testingScore },
    { label: 'Security',     weight: '20%', score: review.securityScore },
    { label: 'Performance',  weight: '10%', score: review.performanceScore },
    { label: 'Architecture', weight: '10%', score: review.architectureScore },
    { label: 'Deployment',   weight: '10%', score: review.deploymentScore },
  ];

  return (
    <div className={`glass border-white/10 rounded-2xl border border-white/10 shadow-lg ${bgGlow} p-6 md:p-8 flex flex-col md:flex-row items-center gap-8`}>

      {/* Radial Score */}
      <div className="flex flex-col items-center justify-center shrink-0">
        <div className="relative">
          <svg width="140" height="140" className="-rotate-90" viewBox="0 0 120 120">
            {/* Track */}
            <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="10" className="text-slate-100 dark:text-slate-800" />
            {/* Progress */}
            <circle
              cx="60" cy="60" r="52"
              fill="none"
              stroke={ringColor}
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-black text-slate-900 dark:text-slate-100 tabular-nums">{score}</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">/ 100</span>
          </div>
        </div>
        <div className={`mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold ${
          isReady
            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
            : isWarning
            ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-500'
            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
        }`}>
          {isReady ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {isReady ? 'Ready to Build' : isWarning ? 'Needs Attention' : 'Not Ready'}
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="flex-1 w-full space-y-4">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Score Breakdown</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
          {scoreBreakdown.map(({ label, weight, score: s }) => {
            let barColor = 'bg-green-500';
            if (s < 80) barColor = 'bg-yellow-500';
            if (s < 50) barColor = 'bg-red-500';
            return (
              <div key={label}>
                <div className="flex justify-between items-baseline mb-1.5">
                  <span className="text-sm font-semibold text-slate-300">{label}</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xs text-slate-400">{weight}</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100 tabular-nums w-6 text-right">{s}</span>
                  </div>
                </div>
                <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${barColor} rounded-full transition-all duration-700`}
                    style={{ width: `${s}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
