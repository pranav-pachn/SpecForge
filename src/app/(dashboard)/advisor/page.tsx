"use client";

import { useState } from "react";
import { Play, Activity, Database, GitMerge, AlertTriangle, ShieldCheck, CheckCircle2, XCircle } from "lucide-react";

export default function EngineeringAdvisorPage() {
  const [request, setRequest] = useState("Replace Redis with Valkey");
  const [workflowId, setWorkflowId] = useState("WF-DEMO-001");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleEvaluate = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/advisor/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ changeRequest: request, workflowId }),
      });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6 max-w-5xl mx-auto text-slate-800 dark:text-slate-200">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Activity className="h-8 w-8 text-blue-500" />
          Engineering Advisor Sandbox
        </h2>
      </div>
      
      <p className="text-slate-500">
        Simulate architectural changes, measure impact, and receive AI-driven engineering tradeoffs before committing.
      </p>

      {/* Input Section */}
      <div className="border rounded-lg shadow-sm bg-white dark:bg-slate-900 p-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <input 
              value={request} 
              onChange={(e: any) => setRequest(e.target.value)}
              placeholder="e.g. Replace Redis with Valkey" 
              className="w-full text-lg p-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700"
            />
          </div>
          <button 
            className="px-8 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 flex items-center disabled:opacity-50" 
            onClick={handleEvaluate} 
            disabled={isLoading || !request}
          >
            {isLoading ? "Analyzing..." : <><Play className="mr-2 h-4 w-4" /> Evaluate</>}
          </button>
        </div>
      </div>

      {/* Results Dashboard */}
      {result && (
        <div className="grid gap-6 md:grid-cols-2 mt-8 animate-in fade-in duration-500">
          
          {/* Left Column */}
          <div className="space-y-6">
            
            {/* Impact Analysis */}
            <div className="border rounded-lg shadow-sm bg-white dark:bg-slate-900 p-6">
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-4 border-b pb-2">
                <GitMerge className="h-5 w-5 text-indigo-500" />
                Blast Radius (Impact)
              </h3>
              <div className="text-3xl font-bold mb-2">{result.impact?.totalNodes || 0}</div>
              <div className="text-sm text-slate-500">Total connected entities affected</div>
              <div className="mt-4 flex flex-wrap gap-2">
                {result.impact?.nodes?.slice(0, 5).map((n: any, i: number) => (
                  <span key={i} className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md text-sm border">{n.type}: {n.id}</span>
                ))}
                {result.impact?.nodes?.length > 5 && <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md text-sm border border-dashed">+{result.impact.nodes.length - 5} more</span>}
              </div>
            </div>

            {/* Tradeoffs */}
            <div className="border rounded-lg shadow-sm bg-white dark:bg-slate-900 p-6">
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-4 border-b pb-2">
                <Database className="h-5 w-5 text-orange-500" />
                Tradeoffs
              </h3>
              <div className="space-y-4">
                {result.reasoning?.tradeoffs?.map((t: any, i: number) => (
                  <div key={i} className="space-y-2 border-b border-slate-100 dark:border-slate-800 pb-4 last:border-0 last:pb-0">
                    <div>
                      <span className="font-semibold text-green-600 flex items-center gap-1"><CheckCircle2 className="h-4 w-4"/> Benefit:</span>
                      <p className="text-sm mt-1">{t.benefit}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-red-600 flex items-center gap-1"><XCircle className="h-4 w-4"/> Cost:</span>
                      <p className="text-sm mt-1">{t.cost}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Risks */}
            <div className="border rounded-lg shadow-sm bg-white dark:bg-slate-900 p-6">
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-4 border-b pb-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Identified Risks
              </h3>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                {result.reasoning?.risks?.map((r: string, i: number) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>

          </div>

          {/* Right Column */}
          <div className="space-y-6">
            
            {/* Final Recommendation */}
            <div className="border border-blue-200 bg-blue-50 dark:bg-blue-900/20 shadow-md rounded-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <span className="flex items-center gap-2 font-bold text-lg">
                  <ShieldCheck className="h-6 w-6 text-blue-600" />
                  Recommendation
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${result.recommendation?.decision === 'PROCEED' ? 'bg-blue-600 text-white' : 'bg-red-600 text-white'}`}>
                  {result.recommendation?.decision}
                </span>
              </div>
              
              <div className="space-y-6">
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-medium">
                    <span>Recommendation Confidence</span>
                    <span>{result.recommendation?.confidence}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full" style={{ width: (result.recommendation?.confidence || 0) + '%' }}></div>
                  </div>
                </div>

                {/* SHAP-like Decision Factors */}
                {result.recommendation?.decisionFactors && (
                  <div className="space-y-2 pt-2">
                    <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Decision Factors</h5>
                    <div className="grid grid-cols-4 gap-2 text-center text-xs">
                      <div className="bg-white dark:bg-slate-800 p-2 rounded border">
                        <div className="text-indigo-500 font-bold">{Math.round(result.recommendation.decisionFactors.graph * 100)}%</div>
                        <div className="text-slate-500 truncate mt-1">Graph</div>
                      </div>
                      <div className="bg-white dark:bg-slate-800 p-2 rounded border">
                        <div className="text-emerald-500 font-bold">{Math.round(result.recommendation.decisionFactors.memory * 100)}%</div>
                        <div className="text-slate-500 truncate mt-1">Memory</div>
                      </div>
                      <div className="bg-white dark:bg-slate-800 p-2 rounded border">
                        <div className="text-amber-500 font-bold">{Math.round(result.recommendation.decisionFactors.documentation * 100)}%</div>
                        <div className="text-slate-500 truncate mt-1">Docs</div>
                      </div>
                      <div className="bg-white dark:bg-slate-800 p-2 rounded border">
                        <div className="text-rose-500 font-bold">{Math.round(result.recommendation.decisionFactors.reasoning * 100)}%</div>
                        <div className="text-slate-500 truncate mt-1">Reasoning</div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-3 pt-2">
                  <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Reasons</h4>
                  <ul className="space-y-2">
                    {result.recommendation?.reasons?.map((r: string, i: number) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Alternatives */}
                {result.recommendation?.alternatives && result.recommendation.alternatives.length > 0 && (
                  <div className="space-y-3 pt-4 border-t border-blue-200 dark:border-blue-800">
                    <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Considered Alternatives</h4>
                    <div className="flex flex-col gap-2">
                      {result.recommendation.alternatives.map((a: any, i: number) => (
                        <div key={i} className="bg-white dark:bg-slate-900 rounded-md p-3 text-sm border shadow-sm">
                          <span className="font-semibold">{a.name}</span>: <span className="text-slate-600 dark:text-slate-400">{a.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Evidence Confidence */}
            <div className="border rounded-lg shadow-sm bg-white dark:bg-slate-900 p-6">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Evidence Strength</h3>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-500"><span>Graph & Architecture</span><span>{result.recommendation?.evidenceConfidence?.graph}%</span></div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-indigo-500 h-full" style={{ width: (result.recommendation?.evidenceConfidence?.graph || 0) + '%' }}></div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-500"><span>Historical Memory</span><span>{result.recommendation?.evidenceConfidence?.memory}%</span></div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full" style={{ width: (result.recommendation?.evidenceConfidence?.memory || 0) + '%' }}></div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-500"><span>RAG Documentation</span><span>{result.recommendation?.evidenceConfidence?.rag}%</span></div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full" style={{ width: (result.recommendation?.evidenceConfidence?.rag || 0) + '%' }}></div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-500"><span>Gateway Reasoning</span><span>{result.recommendation?.evidenceConfidence?.reasoning}%</span></div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-rose-500 h-full" style={{ width: (result.recommendation?.evidenceConfidence?.reasoning || 0) + '%' }}></div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
