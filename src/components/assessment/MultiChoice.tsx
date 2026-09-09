"use client";

import type { MultiAnswer, ServedMulti } from "@/engine/types";
import { OptionTile } from "./OptionTile";

export interface MultiChoiceProps {
  item: ServedMulti;
  value?: MultiAnswer;
  onChange: (answer: MultiAnswer) => void;
  disabled?: boolean;
}

/** Checkbox tiles for a multiple-answer item, labelled "Select all that apply." Selected ids are kept in presentation order. */
export function MultiChoice({ item, value, onChange, disabled = false }: MultiChoiceProps) {
  const selected = new Set(value?.optionIds ?? []);
  const name = `multi-${item.id}`;

  function toggle(optionId: string) {
    const next = new Set(selected);
    if (next.has(optionId)) next.delete(optionId);
    else next.add(optionId);
    const optionIds = item.options.filter((o) => next.has(o.id)).map((o) => o.id);
    onChange({ type: "multi", optionIds });
  }

  return (
    <div data-testid={`multi-${item.id}`}>
      <p className="mb-3 text-sm font-medium text-ink-600">Select all that apply.</p>
      <div role="group" aria-label="Answer options. Select all that apply." className="grid gap-3">
        {item.options.map((option) => (
          <OptionTile
            key={option.id}
            kind="checkbox"
            name={name}
            value={option.id}
            text={option.text}
            checked={selected.has(option.id)}
            disabled={disabled}
            onSelect={() => toggle(option.id)}
            testId={`multi-option-${item.id}-${option.id}`}
          />
        ))}
      </div>
    </div>
  );
}
