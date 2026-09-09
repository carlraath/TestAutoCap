import type { SVGProps } from "react";

type IconProps = Omit<SVGProps<SVGSVGElement>, "children">;

const stroke = {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 20 20",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  focusable: false,
} as const;

/** Tick: a section threshold met, or a key marked correct. */
export function MetIcon(props: IconProps) {
  return (
    <svg {...stroke} {...props}>
      <path d="M4 10.5l4 4 8-9" />
    </svg>
  );
}

/** Dash: a section threshold not met. Calmer than a cross for a result that is simply lower. */
export function UnmetIcon(props: IconProps) {
  return (
    <svg {...stroke} {...props}>
      <path d="M5 10h10" />
    </svg>
  );
}

/** Triangle with an exclamation mark: an item flagged for attention. */
export function AttentionIcon(props: IconProps) {
  return (
    <svg {...stroke} {...props}>
      <path d="M10 3.5L18 16.5H2z" />
      <path d="M10 8.5v3.5" />
      <path d="M10 14.5h.01" />
    </svg>
  );
}

/** Downward tray arrow for the export buttons. */
export function DownloadIcon(props: IconProps) {
  return (
    <svg {...stroke} {...props}>
      <path d="M10 3v9" />
      <path d="M6 9l4 4 4-4" />
      <path d="M3.5 16.5h13" />
    </svg>
  );
}

/** Right chevron for the expand link. */
export function ChevronRightIcon(props: IconProps) {
  return (
    <svg {...stroke} {...props}>
      <path d="M8 5l5 5-5 5" />
    </svg>
  );
}
