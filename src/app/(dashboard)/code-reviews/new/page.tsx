import { ManualReviewForm } from "@/features/reviews/ManualReviewForm";

export default function NewCodeReviewPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-bold text-slate-100">Manual review</h1>
      <p className="text-sm text-slate-400">
        Paste a unified diff or a code snippet. The review cites only what is in the submission.
      </p>
      <ManualReviewForm />
    </div>
  );
}
