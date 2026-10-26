"use client";

import { useEffect, useRef } from "react";
import Icon from "@/components/ui/Icon";

/**
 * A modal panel in the product chrome: white, 16 px radius, one soft lift, the
 * page behind it dimmed by ink, not blurred. Escape and a click outside close
 * it; the caller owns the actions in the footer.
 */
export default function Dialog({
  title,
  subtitle,
  onClose,
  children,
  width = 520,
}: {
  title: string;
  subtitle?: string;
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-text/25 p-6"
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
        className="max-h-full overflow-y-auto rounded-2xl border border-edge bg-panel p-6 shadow-[0_24px_60px_rgba(15,23,42,0.18)] outline-none"
      >
        <div className="flex items-start gap-2 pb-4">
          <div className="min-w-0">
            <h2 className="text-[20px] font-semibold tracking-tight text-text">
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-1 text-[13px] text-text-2">{subtitle}</p>
            ) : null}
          </div>
          <span className="flex-1" />
          <button
            type="button"
            onClick={onClose}
            aria-label="fermer"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-text-3 transition-colors hover:bg-app hover:text-text"
          >
            <Icon name="close" size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
