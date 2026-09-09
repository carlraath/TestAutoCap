import type { SVGProps } from "react";

type IconProps = Omit<SVGProps<SVGSVGElement>, "children">;

const strokeProps = {
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

/** Tick mark used for selected tiles and the saved state. */
export function TickIcon(props: IconProps) {
  return (
    <svg {...strokeProps} {...props}>
      <path d="M4 10.5l4 4 8-9" />
    </svg>
  );
}

/** Six-dot grip drawn on drag handles. */
export function GripIcon(props: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" focusable={false} {...props}>
      <circle cx="7" cy="5" r="1.6" />
      <circle cx="13" cy="5" r="1.6" />
      <circle cx="7" cy="10" r="1.6" />
      <circle cx="13" cy="10" r="1.6" />
      <circle cx="7" cy="15" r="1.6" />
      <circle cx="13" cy="15" r="1.6" />
    </svg>
  );
}

/** Upward arrow for the ordering move buttons. */
export function ArrowUpIcon(props: IconProps) {
  return (
    <svg {...strokeProps} {...props}>
      <path d="M10 16V4" />
      <path d="M5 9l5-5 5 5" />
    </svg>
  );
}

/** Downward arrow for the ordering move buttons. */
export function ArrowDownIcon(props: IconProps) {
  return (
    <svg {...strokeProps} {...props}>
      <path d="M10 4v12" />
      <path d="M5 11l5 5 5-5" />
    </svg>
  );
}

/** Cross used on the return-to-tray chip control. */
export function CrossIcon(props: IconProps) {
  return (
    <svg {...strokeProps} {...props}>
      <path d="M5 5l10 10" />
      <path d="M15 5L5 15" />
    </svg>
  );
}

/** Small clock face for the timer chip. */
export function ClockIcon(props: IconProps) {
  return (
    <svg {...strokeProps} {...props}>
      <circle cx="10" cy="10" r="7" />
      <path d="M10 6v4l2.5 2" />
    </svg>
  );
}

/** Open arc used for the saving state. */
export function ArcIcon(props: IconProps) {
  return (
    <svg {...strokeProps} {...props}>
      <path d="M10 3a7 7 0 1 1-7 7" />
    </svg>
  );
}

/** Circle with an exclamation mark for the not-saved state. */
export function AlertIcon(props: IconProps) {
  return (
    <svg {...strokeProps} {...props}>
      <circle cx="10" cy="10" r="7" />
      <path d="M10 6.5v4" />
      <path d="M10 13.5h.01" />
    </svg>
  );
}
