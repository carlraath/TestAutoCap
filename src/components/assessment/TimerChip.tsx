"use client";

import { useEffect, useRef, useState } from "react";
import { TIMER_AMBER_SECONDS } from "@/engine/structure";
import { ClockIcon } from "./icons";

export interface TimerChipProps {
  /** ISO timestamp when the attempt ends (server authoritative). */
  endAt: string;
  /** ISO server time at the moment the page data was loaded. */
  serverNow: string;
  /** Called exactly once when the countdown reaches zero. */
  onExpire: () => void;
}

/** Announcement marks in seconds remaining, largest first. */
const MARKS = [300, 120, 60] as const;

/** Formats whole seconds as mm:ss, capped at 99:59 so the chip never grows. */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.min(totalSeconds, 99 * 60 + 59));
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

/** Fixed-width countdown chip driven by server time. Turns amber under two minutes, announces at 5, 2 and 1 minutes, calls onExpire once at zero. */
export function TimerChip({ endAt, serverNow, onExpire }: TimerChipProps) {
  const end = Date.parse(endAt);
  const server = Date.parse(serverNow);
  const valid = Number.isFinite(end) && Number.isFinite(server);

  const [remainingMs, setRemainingMs] = useState(() => (valid ? Math.max(0, end - server) : 0));
  const [announcement, setAnnouncement] = useState("");
  const offsetRef = useRef<number | null>(null);
  const expiredRef = useRef(false);
  const announcedRef = useRef(new Set<number>());
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    if (!valid) return;
    // Offset between the server clock and this device, measured once at mount.
    if (offsetRef.current === null) offsetRef.current = server - Date.now();
    const tick = () => {
      const now = Date.now() + (offsetRef.current ?? 0);
      const ms = Math.max(0, end - now);
      setRemainingMs(ms);
      const seconds = Math.ceil(ms / 1000);
      let message: string | null = null;
      for (const mark of MARKS) {
        if (seconds <= mark && ms > 0 && !announcedRef.current.has(mark)) {
          announcedRef.current.add(mark);
          message = `${mark / 60} minute${mark === 60 ? "" : "s"} remaining.`;
        }
      }
      if (ms <= 0 && !expiredRef.current) {
        expiredRef.current = true;
        message = "Time is up.";
        window.clearInterval(interval);
        onExpireRef.current();
      }
      if (message !== null) setAnnouncement(message);
    };
    const interval = window.setInterval(tick, 250);
    return () => window.clearInterval(interval);
  }, [end, server, valid]);

  const seconds = Math.ceil(remainingMs / 1000);
  const amber = valid && seconds < TIMER_AMBER_SECONDS;
  const tone = amber ? "border-attention text-attention-ink" : "border-line text-ink-900";

  return (
    <>
      <div
        data-testid="timer-chip"
        data-state={amber ? "attention" : "normal"}
        role="timer"
        aria-label="Time remaining"
        className={`inline-flex h-9 w-28 shrink-0 items-center justify-center gap-1.5 rounded-full border bg-white text-sm font-semibold tabular-nums transition-colors ${tone}`}
      >
        <ClockIcon className="h-4 w-4" />
        <span>{valid ? formatClock(seconds) : "--:--"}</span>
      </div>
      <span role="status" aria-live="polite" className="sr-only">
        {announcement}
      </span>
    </>
  );
}
