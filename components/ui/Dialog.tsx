"use client";

import { useEffect, useRef } from "react";

/**
 * A dialog is a container, so it takes the 20 px container radius, a 1 px line
 * border and no shadow. The page behind it is dimmed by the surface colour,
 * not blurred.
 */
export default function Dialog({
  title,
  onClose,
  children,
  width = 520,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  width?: number;
}) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    panel.current?.focus();
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/20 p-6"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{ width }}
        className="max-h-full overflow-y-auto rounded-[20px] border border-line bg-surface p-3 outline-none"
      >
        <div className="flex items-baseline gap-2 px-3 pt-2 pb-3">
          <span className="text-title text-ink">{title}</span>
          <span className="flex-1" />
          <button
            type="button"
            onClick={onClose}
            aria-label="close"
            className="flex h-6 w-6 items-center justify-center rounded-full text-body text-ink-3 transition-colors duration-[80ms] hover:bg-fill-2 hover:text-ink"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
