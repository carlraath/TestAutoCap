import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "danger";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-brand-500 text-white hover:bg-brand-600 disabled:hover:bg-brand-500",
  secondary: "border border-brand-300 text-ink-900 bg-white hover:bg-tint-200 disabled:hover:bg-white",
  danger: "bg-danger text-white hover:bg-[#921f18] disabled:hover:bg-danger",
};

/** Class string for a button-looking element. Shared with links styled as buttons. */
export function buttonClasses(variant: ButtonVariant = "primary", extra = ""): string {
  return `inline-flex items-center justify-center gap-2 rounded-card px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant]} ${extra}`.trim();
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

/** A plain button in one of three variants. Defaults to type="button" so forms only submit on purpose. */
export function Button({ variant = "primary", className = "", type = "button", ...rest }: ButtonProps) {
  return <button type={type} className={buttonClasses(variant, className)} {...rest} />;
}
