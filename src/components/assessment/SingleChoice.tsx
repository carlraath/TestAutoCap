"use client";

import type { ServedSingle, SingleAnswer } from "@/engine/types";
import { OptionTile } from "./OptionTile";

export interface SingleChoiceProps {
  item: ServedSingle;
  value?: SingleAnswer;
  onChange: (answer: SingleAnswer) => void;
  disabled?: boolean;
}

/** Radio group of option tiles for a single-answer item. Controlled: the parent stores the answer and passes it back as value. */
export function SingleChoice({ item, value, onChange, disabled = false }: SingleChoiceProps) {
  const name = `single-${item.id}`;
  return (
    <div role="radiogroup" aria-label="Answer options" data-testid={`single-${item.id}`} className="grid gap-3">
      {item.options.map((option) => (
        <OptionTile
          key={option.id}
          kind="radio"
          name={name}
          value={option.id}
          text={option.text}
          checked={value?.optionId === option.id}
          disabled={disabled}
          onSelect={() => onChange({ type: "single", optionId: option.id })}
          testId={`single-option-${item.id}-${option.id}`}
        />
      ))}
    </div>
  );
}
