"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import PipelineStages from "@/components/workflows/PipelineStages";
import { FileText, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import ArtifactViewer from "@/components/artifacts/ArtifactViewer";

export default function WorkflowPage() {
  const params = useParams();
  const [workflow, setWorkflow] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedArtifact, setSelectedArtifact] = useState<any>(null);

  useEffect(() => {
    const fetchWorkflow = async () => {
      try {
        const res = await fetch(`/api/workflows/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setWorkflow(data);
          
          // Select the SPEC artifact by default if it exists
          const spec = data.artifacts.find((a: any) => a.type === "SPEC");
          if (spec) setSelectedArtifact(spec);
        }
      } catch (err) {
        console.error("Failed to load workflow");
      } finally {
        setLoading(false);
      }
    };
    
    fetchWorkflow();
  }, [params.id]);

  if (loading) {
    return <div className="p-8 flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;
  }

  if (!workflow) {
    return <div className="p-8 text-center text-slate-500">Workflow not found</div>;
  }

  return (
    <div className="max-w-6xl mx-auto py-8">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      <div className="mb-12">
        <h1 className="text-3xl font-bold mb-2">{workflow.name}</h1>
        <p className="text-slate-500 text-sm">Created {formatDistanceToNow(new Date(workflow.createdAt))} ago</p>
        
        <div className="mt-8 overflow-x-auto pb-8">
          <div className="min-w-[800px] px-4">
            <PipelineStages currentStatus={workflow.status} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 border-r pr-4">
          <h3 className="font-semibold text-lg mb-4">Artifacts</h3>
          <div className="space-y-2">
            {workflow.artifacts.map((artifact: any) => (
              <button
                key={artifact.id}
                onClick={() => setSelectedArtifact(artifact)}
                className={`w-full text-left px-3 py-2 rounded-md flex items-center gap-3 transition-colors ${
                  selectedArtifact?.id === artifact.id 
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" 
                    : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                }`}
              >
                <FileText className="w-4 h-4 shrink-0" />
                <span className="truncate text-sm font-medium">{artifact.title}</span>
              </button>
            ))}
          </div>
        </div>
        
        <div className="lg:col-span-3">
          {selectedArtifact ? (
            <ArtifactViewer artifact={selectedArtifact} />
          ) : (
            <div className="border-2 border-dashed rounded-xl p-12 text-center bg-slate-50 dark:bg-slate-900/50">
              <FileText className="w-8 h-8 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Artifact Selected</h3>
              <p className="text-slate-500 text-sm">Select an artifact from the sidebar to view its contents.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}