import type { SectionScore } from "@/engine/types";
import { MetIcon, UnmetIcon } from "./icons";

/** One section result as "5 / 6" with a tick when the threshold is met and a dash when it is not. */
export function ScoreCell({ score }: { score: SectionScore }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm"
      title={`${score.section}: ${score.score} of ${score.served}, threshold ${score.threshold}, ${score.met ? "met" : "not met"}`}
    >
      <span className="font-mono tabular-nums">
        {score.score} / {score.served}
      </span>
      {score.met ? (
        <MetIcon className="h-4 w-4 text-success" />
      ) : (
        <UnmetIcon className="h-4 w-4 text-ink-600" />
      )}
      <span className="sr-only">{score.met ? "threshold met" : "threshold not met"}</span>
    </span>
  );
}

/** Every section of one attempt, stacked. Shows an em dash when the attempt has no scores yet. */
export function ScoreCells({ scores }: { scores: SectionScore[] | null }) {
  if (!scores || scores.length === 0) return <span className="text-ink-600">—</span>;
  return (
    <span className="flex flex-col gap-1">
      {scores.map((score) => (
        <ScoreCell key={score.section} score={score} />
      ))}
    </span>
  );
}
