"use client";

import { CheckCircle2, AlertTriangle, XCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import EngineeringFindingRow from "./EngineeringFindingRow";

interface Props {
  title: string;
  emoji: string;
  score: number;
  data: any;
  findings: any[];
  onFixGenerated?: () => void;
}

export default function EngineeringCategoryCard({ title, emoji, score, data, findings, onFixGenerated }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (!data) return null;

  const isGood = score >= 80;
  const isWarn = score >= 50 && score < 80;
  const isBad = score < 50;

  const statusConfig = isGood
    ? { ring: 'ring-green-200 dark:ring-green-800', bg: 'bg-green-50 dark:bg-green-900/10', text: 'text-green-700 dark:text-green-400' }
    : isWarn
    ? { ring: 'ring-yellow-200 dark:ring-yellow-800', bg: 'bg-yellow-50 dark:bg-yellow-900/10', text: 'text-yellow-700 dark:text-yellow-500' }
    : { ring: 'ring-red-200 dark:ring-red-800', bg: 'bg-red-50 dark:bg-red-900/10', text: 'text-red-700 dark:text-red-400' };

  const hasIssues = findings.length > 0;
  const fixedCount = findings.filter(f => f.taskId).length;
  const unresolvedCount = findings.filter(f => !f.taskId).length;

  return (
    <div className={`glass border-white/10 border rounded-2xl overflow-hidden shadow-sm transition-all ${
      expanded ? 'border-blue-200 dark:border-blue-800 shadow-md' : 'border-white/10'
    }`}>

      {/* Card Header — always visible */}
      <button
        type="button"
        className="w-full p-5 flex items-center justify-between gap-4 text-left hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-4 min-w-0">
          {/* Score ring badge */}
          <div className={`shrink-0 w-12 h-12 rounded-xl ring-2 ${statusConfig.ring} ${statusConfig.bg} flex items-center justify-center`}>
            <span className={`text-base font-black tabular-nums ${statusConfig.text}`}>{score}</span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-base">{emoji}</span>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 truncate">{title}</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {hasIssues
                ? unresolvedCount > 0
                  ? `${unresolvedCount} open · ${fixedCount} fixed`
                  : '✓ All issues resolved'
                : '✓ All checks passed'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Issue count badge */}
          {unresolvedCount > 0 && (
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-md">
              {unresolvedCount} open
            </span>
          )}
          {expanded
            ? <ChevronUp className="w-5 h-5 text-slate-400" />
            : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </div>
      </button>

      {/* Expanded Body */}
      {expanded && (
        <div className="border-t border-slate-100 dark:border-slate-800">

          {/* Check list */}
          <div className="p-5 space-y-3">
            {data.items?.map((item: any, i: number) => {
              const isPass = item.status === 'pass';
              const isItemWarn = item.status === 'warn';
              const isFail = item.status === 'fail';
              return (
                <div key={i} className={`flex gap-3 p-3 rounded-xl text-sm ${
                  isPass ? 'bg-green-50 dark:bg-green-900/10' :
                  isItemWarn ? 'bg-yellow-50 dark:bg-yellow-900/10' :
                  'bg-red-50 dark:bg-red-900/10'
                }`}>
                  <div className="shrink-0 mt-0.5">
                    {isPass && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                    {isItemWarn && <AlertTriangle className="w-4 h-4 text-yellow-600" />}
                    {isFail && <XCircle className="w-4 h-4 text-red-600" />}
                  </div>
                  <div>
                    <p className={`font-semibold ${
                      isPass ? 'text-green-900 dark:text-green-300' :
                      isItemWarn ? 'text-yellow-900 dark:text-yellow-300' :
                      'text-red-900 dark:text-red-300'
                    }`}>{item.label}</p>
                    {item.detail && <p className="text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{item.detail}</p>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Actionable Findings */}
          {hasIssues && (
            <div className="border-t border-dashed border-white/10 p-5 bg-slate-50/50 dark:bg-slate-900/30">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Actionable Findings</p>
              <div className="space-y-3">
                {findings.map(finding => (
                  <EngineeringFindingRow
                    key={finding.id}
                    finding={finding}
                    onFixGenerated={onFixGenerated}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
