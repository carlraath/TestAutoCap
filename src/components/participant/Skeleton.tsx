/**
 * Loading placeholders. They occupy the same space as the real content so the
 * screen never jumps when the data arrives, and they hold still for anyone who
 * has asked for reduced motion.
 */

function Bar({ className = "" }: { className?: string }) {
  return <span aria-hidden="true" className={`block animate-pulse rounded-full bg-tint-200 motion-reduce:animate-none ${className}`.trim()} />;
}

/** Dashboard placeholder: greeting, purpose line and three assessment cards. */
export function DashboardSkeleton() {
  return (
    <div role="status" aria-label="Loading your assessments" className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Bar className="h-7 w-64" />
        <Bar className="h-4 w-96 max-w-full" />
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center justify-between gap-6 rounded-card border border-brand-500/20 bg-white p-6 shadow-card">
          <span className="flex min-w-0 flex-1 flex-col gap-2">
            <Bar className="h-5 w-56 max-w-full" />
            <Bar className="h-4 w-40" />
          </span>
          <Bar className="h-9 w-24 shrink-0 rounded-card" />
        </div>
      ))}
    </div>
  );
}

/** Attempt placeholder: the same header, progress bar, question card and buttons the attempt draws. */
export function AttemptSkeleton() {
  return (
    <div role="status" aria-label="Loading this assessment" className="flex flex-col gap-6">
      <div className="flex h-10 items-center justify-between gap-4">
        <Bar className="h-5 w-64 max-w-full" />
        <Bar className="h-9 w-28 shrink-0 rounded-full" />
      </div>
      <div className="flex flex-col gap-2">
        <Bar className="h-4 w-36" />
        <Bar className="h-2 w-full" />
      </div>
      <div className="min-h-[26rem] rounded-card border border-brand-500/20 bg-white p-6 shadow-card sm:p-8">
        <Bar className="h-5 w-3/4" />
        <span className="mt-6 flex flex-col gap-3">
          {[0, 1, 2, 3].map((i) => (
            <Bar key={i} className="h-14 w-full rounded-card" />
          ))}
        </span>
      </div>
      <div className="flex h-8 items-center justify-end">
        <Bar className="h-4 w-24" />
      </div>
      <div className="flex items-center justify-between gap-4">
        <Bar className="h-11 w-28 rounded-card" />
        <Bar className="h-11 w-28 rounded-card" />
      </div>
    </div>
  );
}
