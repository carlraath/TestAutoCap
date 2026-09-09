"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

export interface DialogProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/**
 * Accessible modal built on the native dialog element: role dialog, labelled
 * by its title, focus trapped by showModal(), Escape closes, backdrop click
 * closes. Focus returns to the previously focused element on close.
 */
export function Dialog({ open, title, onClose, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onCancel = (event: Event) => {
      event.preventDefault();
      onClose();
    };
    el.addEventListener("cancel", onCancel);
    return () => el.removeEventListener("cancel", onCancel);
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      className="m-auto w-full max-w-lg rounded-card border border-brand-500/20 bg-white p-0 text-ink-900 shadow-card backdrop:bg-ink-900/50"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="p-6">
        <h2 id={titleId} className="text-lg">
          {title}
        </h2>
        <div className="mt-4">{children}</div>
      </div>
    </dialog>
  );
}
