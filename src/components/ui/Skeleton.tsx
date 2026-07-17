import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-slate-200 dark:bg-slate-800", className)}
      {...props}
    />
  );
}

function SkeletonText({ className, lines = 3 }: { className?: string; lines?: number }) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          className={cn("h-4", i === lines - 1 ? "w-2/3" : "w-full")} 
        />
      ))}
    </div>
  );
}

function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border border-white/10 bg-white/5 p-6 space-y-4", className)}>
      <Skeleton className="h-6 w-1/3" />
      <SkeletonText lines={2} />
      <div className="flex gap-2 pt-4">
        <Skeleton className="h-8 w-20 rounded-md" />
        <Skeleton className="h-8 w-20 rounded-md" />
      </div>
    </div>
  );
}

function SkeletonTable({ className, rows = 5 }: { className?: string; rows?: number }) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex gap-4 border-b border-slate-200 dark:border-white/10 pb-4">
        <Skeleton className="h-5 w-1/4" />
        <Skeleton className="h-5 w-1/4" />
        <Skeleton className="h-5 w-1/2" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 items-center">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export { Skeleton, SkeletonText, SkeletonCard, SkeletonTable };
