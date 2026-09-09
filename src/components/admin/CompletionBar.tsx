export interface CompletionBarProps {
  submitted: number;
  inProgress: number;
  notStarted: number;
}

const SEGMENTS = [
  { key: "submitted", label: "Submitted", fill: "var(--color-brand-500)" },
  { key: "inProgress", label: "In progress", fill: "var(--color-brand-300)" },
  { key: "notStarted", label: "Not started", fill: "var(--color-line)" },
] as const;

/**
 * Completion for one assessment as a single inline SVG bar: submitted in brand
 * primary, in progress in the brand tint, not started in the neutral line
 * colour. No chart library, per docs/02.
 */
export function CompletionBar({ submitted, inProgress, notStarted }: CompletionBarProps) {
  const total = Math.max(1, submitted + inProgress + notStarted);
  const counts: Record<(typeof SEGMENTS)[number]["key"], number> = { submitted, inProgress, notStarted };
  const width = 100;
  const label = `${submitted} submitted, ${inProgress} in progress, ${notStarted} not started`;

  return (
    <div>
      <div className="overflow-hidden rounded-full">
        <svg viewBox={`0 0 ${width} 8`} preserveAspectRatio="none" role="img" aria-label={label} className="block h-2 w-full">
          <rect x="0" y="0" width={width} height="8" fill="var(--color-line)" />
          {SEGMENTS.map((segment, index) => {
            const before = SEGMENTS.slice(0, index).reduce((sum, earlier) => sum + counts[earlier.key], 0);
            return (
              <rect
                key={segment.key}
                x={(before / total) * width}
                y="0"
                width={Math.max(0, (counts[segment.key] / total) * width)}
                height="8"
                fill={segment.fill}
              />
            );
          })}
        </svg>
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-600">
        {SEGMENTS.map((segment) => (
          <li key={segment.key} className="flex items-center gap-1.5">
            <span aria-hidden="true" className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: segment.fill }} />
            {segment.label} {counts[segment.key]}
          </li>
        ))}
      </ul>
    </div>
  );
}
