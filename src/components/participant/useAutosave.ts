"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SavedState } from "@/components/assessment";
import type { Answer } from "@/engine/types";

/**
 * Autosave for one attempt.
 *
 * Every change is held for one second per item and then PUT to
 * `/api/attempts/[id]/answers/[itemId]`. Moving between questions, hiding the
 * tab or leaving the page flushes immediately. A failed save is retried with an
 * exponential back-off (1s, 2s, 4s, 8s, then every 10s) and the indicator says
 * so; a 409 means the attempt has been finalised and the caller navigates away.
 *
 * The queue lives in refs so that a save in flight is never restarted by a
 * re-render, and the visible state is recomputed from the queue after every
 * change so the indicator can never claim "Saved" while work is outstanding.
 */

const DEBOUNCE_MS = 1000;
const FIRST_RETRY_MS = 1000;
const MAX_RETRY_MS = 10_000;

export interface Autosave {
  state: SavedState;
  /** When the server last acknowledged a save. */
  savedAt: Date | undefined;
  /** How many saves the server has acknowledged. Used by the tests as a settled signal. */
  saves: number;
  /** Records a change and schedules its save. */
  queue: (itemId: string, answer: Answer) => void;
  /** Sends everything outstanding now, cancelling the debounce. Resolves once those requests have settled. */
  flushNow: () => Promise<void>;
}

interface Retry {
  attempts: number;
  timer: number;
}

interface SaveResponse {
  savedAt?: string;
}

/** Autosave queue for one attempt. `onFinalised` fires when the server says the attempt is closed. */
export function useAutosave(attemptId: string, onFinalised: () => void): Autosave {
  const [state, setState] = useState<SavedState>("saved");
  const [savedAt, setSavedAt] = useState<Date | undefined>(undefined);
  const [saves, setSaves] = useState(0);

  const pending = useRef(new Map<string, Answer>());
  const debounces = useRef(new Map<string, number>());
  const inFlight = useRef(new Set<string>());
  const retries = useRef(new Map<string, Retry>());
  const finalised = useRef(false);
  const onFinalisedRef = useRef(onFinalised);

  useEffect(() => {
    onFinalisedRef.current = onFinalised;
  }, [onFinalised]);

  const sync = useCallback(() => {
    if (retries.current.size > 0) setState("error");
    else if (inFlight.current.size > 0 || pending.current.size > 0) setState("saving");
    else setState("saved");
  }, []);

  const url = useCallback((itemId: string) => `/api/attempts/${encodeURIComponent(attemptId)}/answers/${encodeURIComponent(itemId)}`, [attemptId]);

  // A retry has to call the sender again. Going through a ref keeps that one
  // recursive hop out of the callback's own dependencies.
  const sendRef = useRef<(itemId: string) => Promise<void>>(async () => undefined);

  const send = useCallback(
    async (itemId: string): Promise<void> => {
      if (finalised.current) return;
      const answer = pending.current.get(itemId);
      if (answer === undefined) return;
      pending.current.delete(itemId);
      const existing = debounces.current.get(itemId);
      if (existing !== undefined) {
        window.clearTimeout(existing);
        debounces.current.delete(itemId);
      }
      inFlight.current.add(itemId);
      sync();
      try {
        const response = await fetch(url(itemId), {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(answer),
        });
        if (response.status === 409) {
          finalised.current = true;
          inFlight.current.delete(itemId);
          pending.current.clear();
          for (const retry of retries.current.values()) window.clearTimeout(retry.timer);
          retries.current.clear();
          sync();
          onFinalisedRef.current();
          return;
        }
        if (!response.ok) throw new Error(`The server answered ${response.status}.`);
        const body: unknown = await response.json();
        const stamp = typeof (body as SaveResponse)?.savedAt === "string" ? new Date((body as SaveResponse).savedAt as string) : new Date();
        const retry = retries.current.get(itemId);
        if (retry) {
          window.clearTimeout(retry.timer);
          retries.current.delete(itemId);
        }
        inFlight.current.delete(itemId);
        setSavedAt(Number.isNaN(stamp.getTime()) ? new Date() : stamp);
        setSaves((n) => n + 1);
        sync();
      } catch {
        inFlight.current.delete(itemId);
        // Put the answer back unless a newer one is already waiting, and try again shortly.
        if (!pending.current.has(itemId)) pending.current.set(itemId, answer);
        const attempts = (retries.current.get(itemId)?.attempts ?? 0) + 1;
        const previous = retries.current.get(itemId);
        if (previous) window.clearTimeout(previous.timer);
        const delay = Math.min(FIRST_RETRY_MS * 2 ** (attempts - 1), MAX_RETRY_MS);
        const timer = window.setTimeout(() => {
          void sendRef.current(itemId);
        }, delay);
        retries.current.set(itemId, { attempts, timer });
        sync();
      }
    },
    [sync, url],
  );

  useEffect(() => {
    sendRef.current = send;
  }, [send]);

  const queue = useCallback(
    (itemId: string, answer: Answer) => {
      if (finalised.current) return;
      pending.current.set(itemId, answer);
      const existing = debounces.current.get(itemId);
      if (existing !== undefined) window.clearTimeout(existing);
      // A retry already running for this item keeps its own schedule; the newer
      // answer simply replaces the one it will send.
      if (!retries.current.has(itemId)) {
        debounces.current.set(
          itemId,
          window.setTimeout(() => {
            void send(itemId);
          }, DEBOUNCE_MS),
        );
      }
      sync();
    },
    [send, sync],
  );

  const flushNow = useCallback(async (): Promise<void> => {
    const outstanding = Array.from(pending.current.keys()).filter((itemId) => !retries.current.has(itemId));
    await Promise.all(outstanding.map((itemId) => send(itemId)));
  }, [send]);

  // Leaving the page: send what is outstanding with keepalive so the request
  // survives the navigation. Hiding the tab simply flushes normally.
  useEffect(() => {
    const beacon = () => {
      for (const [itemId, answer] of pending.current) {
        try {
          void fetch(url(itemId), {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(answer),
            keepalive: true,
          }).catch(() => undefined);
        } catch {
          // Nothing more can be done as the page goes away.
        }
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        beacon();
        void flushNow();
      }
    };
    window.addEventListener("pagehide", beacon);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", beacon);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [flushNow, url]);

  // Clear every timer on unmount so a navigation cannot leave work running.
  useEffect(() => {
    const debounceTimers = debounces.current;
    const retryTimers = retries.current;
    return () => {
      for (const timer of debounceTimers.values()) window.clearTimeout(timer);
      for (const retry of retryTimers.values()) window.clearTimeout(retry.timer);
      debounceTimers.clear();
      retryTimers.clear();
    };
  }, []);

  return { state, savedAt, saves, queue, flushNow };
}
