"use client";

import { TickIcon } from "./icons";

export interface OptionTileProps {
  kind: "radio" | "checkbox";
  name: string;
  value: string;
  text: string;
  checked: boolean;
  disabled: boolean;
  onSelect: () => void;
  testId?: string;
}

/** One selectable option: a label wrapping a visually hidden native input, so keyboard and screen readers work natively. */
export function OptionTile({ kind, name, value, text, checked, disabled, onSelect, testId }: OptionTileProps) {
  const surface = checked
    ? "border-brand-500 bg-tint-100 shadow-[inset_0_0_0_1px_var(--color-brand-500)]"
    : "border-line bg-white hover:border-brand-300 hover:bg-tint-100/60";
  const cursor = disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer";
  const box = checked ? "border-brand-500 bg-brand-500 text-white" : "border-ink-600/60 bg-white";
  return (
    <label
      data-testid={testId}
      className={`relative flex min-h-14 items-start gap-3 rounded-card border px-4 py-3.5 text-base leading-relaxed text-ink-900 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand-500 ${surface} ${cursor}`}
    >
      <input
        type={kind}
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={onSelect}
        className="sr-only"
      />
      <span
        aria-hidden="true"
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border-2 ${kind === "radio" ? "rounded-full" : "rounded"} ${box}`}
      >
        {checked ? <TickIcon className="h-3.5 w-3.5" strokeWidth={3} /> : null}
      </span>
      <span className="min-w-0 flex-1 whitespace-pre-wrap">{text}</span>
    </label>
  );
}
