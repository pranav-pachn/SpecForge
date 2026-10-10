import { ReviewDetail } from "@/features/reviews/ReviewDetail";

export default function CodeReviewPage({ params }: { params: { id: string } }) {
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-6 text-2xl font-bold text-slate-100">Review</h1>
      <ReviewDetail id={params.id} />
    </div>
  );
}
