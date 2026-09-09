import type { HTMLAttributes, ReactNode } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

/** A white card with the brand border and shadow. */
export function Card({ className = "", children, ...rest }: CardProps) {
  return (
    <div className={`rounded-card border border-brand-500/20 bg-white shadow-card ${className}`.trim()} {...rest}>
      {children}
    </div>
  );
}

/** A card heading row: title on the left, optional actions on the right. */
export function CardHeader({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-4">
      <h2 className="text-lg">{title}</h2>
      {children ? <div className="flex items-center gap-3">{children}</div> : null}
    </div>
  );
}
