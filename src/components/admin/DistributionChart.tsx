export interface DistributionChartProps {
  /** One entry per possible score, 0 to served. */
  distribution: { score: number; count: number }[];
  threshold: number;
  /** Accessible description of what the chart shows. */
  caption: string;
}

const WIDTH = 320;
const HEIGHT = 120;
const PAD_LEFT = 24;
const PAD_BOTTOM = 20;
const PAD_TOP = 12;

/**
 * Score distribution for one section as an inline SVG bar chart: score on the x
 * axis, participants on the y axis, bars in brand primary, the threshold marked
 * with an amber line. No chart library, per docs/02.
 */
export function DistributionChart({ distribution, threshold, caption }: DistributionChartProps) {
  const max = Math.max(1, ...distribution.map((entry) => entry.count));
  const plotWidth = WIDTH - PAD_LEFT - 4;
  const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;
  const step = plotWidth / Math.max(1, distribution.length);
  const barWidth = Math.max(4, step - 6);
  const x = (index: number): number => PAD_LEFT + index * step + (step - barWidth) / 2;
  const thresholdIndex = distribution.findIndex((entry) => entry.score === threshold);
  const thresholdX = thresholdIndex >= 0 ? PAD_LEFT + thresholdIndex * step + (step - barWidth) / 2 - 3 : null;

  return (
    <figure className="m-0">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={caption} className="h-auto w-full max-w-md">
        <line x1={PAD_LEFT - 4} y1={PAD_TOP} x2={PAD_LEFT - 4} y2={HEIGHT - PAD_BOTTOM} stroke="var(--color-line)" strokeWidth="1" />
        <line x1={PAD_LEFT - 4} y1={HEIGHT - PAD_BOTTOM} x2={WIDTH - 2} y2={HEIGHT - PAD_BOTTOM} stroke="var(--color-line)" strokeWidth="1" />
        <text x={PAD_LEFT - 8} y={PAD_TOP + 8} textAnchor="end" fontSize="9" fill="var(--color-ink-600)">
          {max}
        </text>
        <text x={PAD_LEFT - 8} y={HEIGHT - PAD_BOTTOM} textAnchor="end" fontSize="9" fill="var(--color-ink-600)">
          0
        </text>
        {distribution.map((entry, index) => {
          const height = (entry.count / max) * plotHeight;
          return (
            <g key={entry.score}>
              <rect
                x={x(index)}
                y={HEIGHT - PAD_BOTTOM - height}
                width={barWidth}
                height={height}
                fill="var(--color-brand-500)"
                rx="1"
              />
              <text x={x(index) + barWidth / 2} y={HEIGHT - PAD_BOTTOM + 12} textAnchor="middle" fontSize="9" fill="var(--color-ink-600)">
                {entry.score}
              </text>
              {entry.count > 0 ? (
                <text x={x(index) + barWidth / 2} y={HEIGHT - PAD_BOTTOM - height - 3} textAnchor="middle" fontSize="9" fill="var(--color-ink-600)">
                  {entry.count}
                </text>
              ) : null}
            </g>
          );
        })}
        {thresholdX !== null ? (
          <line x1={thresholdX} y1={PAD_TOP - 4} x2={thresholdX} y2={HEIGHT - PAD_BOTTOM} stroke="var(--color-attention)" strokeWidth="1.5" strokeDasharray="3 3" />
        ) : null}
      </svg>
      <figcaption className="mt-2 text-xs text-ink-600">
        Score on the horizontal axis, participants on the vertical. The amber line marks the threshold of {threshold}.
      </figcaption>
    </figure>
  );
}
