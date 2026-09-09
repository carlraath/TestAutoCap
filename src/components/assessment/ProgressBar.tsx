export interface ProgressBarProps {
  /** 1-based number of the question on screen. */
  current: number;
  total: number;
  /** One flag per question, in served order. */
  answered: boolean[];
}

/** "Question N of M" with a segmented bar: answered segments filled, the current one outlined, the rest neutral. */
export function ProgressBar({ current, total, answered }: ProgressBarProps) {
  const count = Math.max(0, total);
  const answeredCount = answered.filter(Boolean).length;
  return (
    <div data-testid="progress-bar" className="flex flex-col gap-2">
      <p className="text-sm font-medium text-ink-900">
        Question {current} of {total}
      </p>
      <div role="img" aria-label={`${answeredCount} of ${total} answered`} className="flex h-2 gap-1">
        {Array.from({ length: count }, (_, i) => {
          const isAnswered = answered[i] === true;
          const isCurrent = i + 1 === current;
          const fill = isAnswered ? "bg-brand-500" : isCurrent ? "bg-white" : "bg-tint-200";
          const outline = isCurrent ? "outline-2 outline-offset-1 outline-brand-500" : "";
          return <span key={i} aria-hidden="true" className={`h-2 flex-1 rounded-full ${fill} ${outline}`} />;
        })}
      </div>
    </div>
  );
}
