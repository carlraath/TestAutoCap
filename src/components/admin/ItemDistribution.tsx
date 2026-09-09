import type { ItemDistribution } from "@/lib/reports";
import { MetIcon } from "./icons";

/** The answer distribution for one item, compact enough for a table cell. */
export function ItemDistributionCell({ distribution }: { distribution: ItemDistribution }) {
  if (distribution.kind === "options") {
    const total = distribution.options.reduce((sum, option) => sum + option.count, 0);
    if (total === 0 && distribution.unanswered === 0) return <span className="text-ink-600">Not served yet</span>;
    return (
      <ul className="flex flex-wrap gap-1.5">
        {distribution.options.map((option) => (
          <li
            key={option.id}
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${
              option.isKey ? "border-success bg-white text-success" : "border-line bg-white text-ink-600"
            }`}
            title={option.text}
          >
            {option.isKey ? <MetIcon className="h-3 w-3" /> : null}
            <span className="font-mono">{option.id}</span>
            <span className="tabular-nums">{option.count}</span>
          </li>
        ))}
        {distribution.unanswered > 0 ? (
          <li className="inline-flex items-center gap-1 rounded-full border border-line bg-surface px-2 py-0.5 text-xs text-ink-600">
            Unanswered <span className="tabular-nums">{distribution.unanswered}</span>
          </li>
        ) : null}
      </ul>
    );
  }

  if (distribution.correct + distribution.incorrect === 0) return <span className="text-ink-600">Not served yet</span>;
  return (
    <div className="space-y-1 text-xs">
      <p className="text-ink-900">
        <span className="text-success">Correct {distribution.correct}</span>
        <span aria-hidden="true"> · </span>
        <span className="text-ink-600">Incorrect {distribution.incorrect}</span>
        {distribution.unanswered > 0 ? <span className="text-ink-600"> · Unanswered {distribution.unanswered}</span> : null}
      </p>
      {distribution.topIncorrect.length > 0 ? (
        <p className="text-ink-600">
          Commonest wrong: {distribution.topIncorrect.map((entry) => `${entry.label} (${entry.count})`).join(", ")}
        </p>
      ) : null}
    </div>
  );
}
