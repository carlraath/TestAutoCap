"use client";

export interface ReviewTile {
  /** 0-based position in the served paper. */
  index: number;
  itemId: string;
  answered: boolean;
}

export interface ReviewTilesProps {
  items: ReviewTile[];
  onJump: (index: number) => void;
}

/** Numbered tiles for the review screen: answered solid brand, unanswered outlined amber. Click or Enter jumps to the question. */
export function ReviewTiles({ items, onJump }: ReviewTilesProps) {
  return (
    <div data-testid="review-tiles">
      <ul className="grid grid-cols-5 gap-3 sm:grid-cols-10" aria-label="Questions">
        {items.map((tile) => {
          const number = tile.index + 1;
          const look = tile.answered
            ? "border-brand-500 bg-brand-500 text-white hover:bg-brand-600"
            : "border-attention bg-white text-attention-ink hover:bg-attention/10";
          return (
            <li key={tile.itemId}>
              <button
                type="button"
                data-testid={`review-tile-${number}`}
                data-answered={tile.answered ? "true" : "false"}
                aria-label={`Question ${number}, ${tile.answered ? "answered" : "unanswered"}. Go to question ${number}.`}
                onClick={() => onJump(tile.index)}
                className={`flex h-12 w-full items-center justify-center rounded-card border-2 text-base font-semibold tabular-nums ${look}`}
              >
                {number}
              </button>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-600">
        <span className="inline-flex items-center gap-2">
          <span aria-hidden="true" className="inline-block h-3.5 w-3.5 rounded-sm border-2 border-brand-500 bg-brand-500" />
          Answered
        </span>
        <span className="inline-flex items-center gap-2">
          <span aria-hidden="true" className="inline-block h-3.5 w-3.5 rounded-sm border-2 border-attention bg-white" />
          Unanswered
        </span>
      </p>
    </div>
  );
}
