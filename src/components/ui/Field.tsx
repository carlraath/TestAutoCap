import type { InputHTMLAttributes, LabelHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

const CONTROL =
  "block w-full rounded-card border border-line bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-600/60 focus:border-brand-500 focus:outline-none focus-visible:outline-2 focus-visible:outline-brand-500";

/** A form label. */
export function Label({ className = "", ...rest }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={`block text-sm font-medium text-ink-900 ${className}`.trim()} {...rest} />;
}

/** A text-like input with the shared control styling. */
export function Input({ className = "", ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${CONTROL} ${className}`.trim()} {...rest} />;
}

/** A textarea with the shared control styling. */
export function Textarea({ className = "", ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${CONTROL} ${className}`.trim()} {...rest} />;
}

export interface FieldProps {
  id: string;
  label: string;
  hint?: string;
  children: ReactNode;
}

/** Label, control and optional hint stacked with the standard rhythm. The child must carry the matching id. */
export function Field({ id, label, hint, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint ? (
        <p id={`${id}-hint`} className="text-xs text-ink-600">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
