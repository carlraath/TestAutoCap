import type { ReactNode } from "react";

export type NoticeTone = "info" | "success" | "attention" | "danger";

const TONES: Record<NoticeTone, string> = {
  info: "border-brand-300 bg-tint-100 text-ink-900",
  success: "border-success/40 bg-[#eef7ee] text-ink-900",
  attention: "border-attention/40 bg-[#fdf4e7] text-ink-900",
  danger: "border-danger/40 bg-[#fbeeed] text-ink-900",
};

export interface NoticeProps {
  tone?: NoticeTone;
  title?: string;
  children: ReactNode;
  className?: string;
}

/** A calm inline notice. Danger and attention tones announce as alerts; info and success as status. */
export function Notice({ tone = "info", title, children, className = "" }: NoticeProps) {
  const role = tone === "danger" || tone === "attention" ? "alert" : "status";
  return (
    <div role={role} className={`rounded-card border px-4 py-3 text-sm ${TONES[tone]} ${className}`.trim()}>
      {title ? <p className="font-semibold">{title}</p> : null}
      <div className={title ? "mt-1" : ""}>{children}</div>
    </div>
  );
}
