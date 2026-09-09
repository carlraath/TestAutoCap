"use client";

export interface NavButtonsProps {
  onPrevious?: () => void;
  onNext?: () => void;
  onReview?: () => void;
  /** On the last question the primary action is Review instead of Next. */
  isLast: boolean;
  disabled?: boolean;
}

const base = "inline-flex h-11 min-w-28 items-center justify-center rounded-card px-5 text-base font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50";
const primary = `${base} bg-brand-500 text-white hover:bg-brand-600 disabled:hover:bg-brand-500`;
const secondary = `${base} border border-brand-300 bg-white text-ink-900 hover:bg-tint-200 disabled:hover:bg-white`;

/** Previous and Next, or Previous and Review on the last question. Absent callbacks render disabled so the layout never shifts. */
export function NavButtons({ onPrevious, onNext, onReview, isLast, disabled = false }: NavButtonsProps) {
  return (
    <div data-testid="nav-buttons" className="flex items-center justify-between gap-4">
      <button type="button" data-testid="nav-previous" onClick={onPrevious} disabled={disabled || !onPrevious} className={secondary}>
        Previous
      </button>
      {isLast ? (
        <button type="button" data-testid="nav-review" onClick={onReview} disabled={disabled || !onReview} className={primary}>
          Review
        </button>
      ) : (
        <button type="button" data-testid="nav-next" onClick={onNext} disabled={disabled || !onNext} className={primary}>
          Next
        </button>
      )}
    </div>
  );
}
