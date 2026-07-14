import ReactMarkdown from "react-markdown";
import { formatDistanceToNow } from "date-fns";
import { VERSION_STATUS_COLORS } from "@/lib/constants";
import { ArtifactVersionStatus } from "@prisma/client";

export default function ArtifactViewer({ artifact }: { artifact: any }) {
  if (!artifact || !artifact.versions || artifact.versions.length === 0) {
    return (
      <div className="border rounded-xl p-8 bg-white dark:bg-slate-950 text-center text-slate-500">
        No content available for this artifact.
      </div>
    );
  }

  // Display the latest version
  const version = artifact.versions[0];
  const isDraftOrReview = version.status === "DRAFT" || version.status === "NEEDS_REVIEW";

  return (
    <div className="bg-white dark:bg-slate-950 border rounded-xl shadow-sm overflow-hidden flex flex-col h-full max-h-[800px]">
      <div className="border-b px-6 py-4 flex items-center justify-between shrink-0 bg-slate-50 dark:bg-slate-900">
        <div>
          <h2 className="text-xl font-bold">{artifact.title}</h2>
          <p className="text-sm text-slate-500 mt-1">
            Version {version.version} &bull; Updated {formatDistanceToNow(new Date(version.createdAt))} ago
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${VERSION_STATUS_COLORS[version.status as ArtifactVersionStatus]}`}>
            {version.status.replace("_", " ")}
          </span>
          {isDraftOrReview && (
            <button className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors">
              Approve Spec
            </button>
          )}
        </div>
      </div>

      <div className="p-8 overflow-y-auto flex-1 bg-white dark:bg-slate-950">
        {version.content ? (
          <article className="prose prose-slate max-w-none dark:prose-invert prose-headings:font-semibold prose-a:text-blue-600">
            <ReactMarkdown>{version.content}</ReactMarkdown>
          </article>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <p className="italic">Content is empty or still generating...</p>
          </div>
        )}
      </div>
    </div>
  );
}
