"use client";

import { useState } from "react";

/**
 * Three readings of the same archived drawing. Switching is instant: the
 * content is already rendered on the server, the tab only chooses which one
 * stays in the flow.
 */
export default function DrawingTabs({
  plan,
  rooms,
  dimensions,
}: {
  plan: React.ReactNode;
  rooms: React.ReactNode;
  dimensions: React.ReactNode;
}) {
  const [tab, setTab] = useState<"plan" | "rooms" | "dimensions">("plan");

  const tabs: [typeof tab, string][] = [
    ["plan", "floor plan"],
    ["rooms", "room areas"],
    ["dimensions", "dimensions"],
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <nav className="flex h-10 shrink-0 items-center gap-1 border-b border-line px-4">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`flex h-6 items-center rounded-full px-3 text-body transition-colors duration-[80ms] ${
              tab === key
                ? "bg-ink text-paper"
                : "text-ink-2 hover:bg-fill-2 hover:text-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      <div className="flex min-h-0 flex-1 flex-col">
        {tab === "plan" ? plan : tab === "rooms" ? rooms : dimensions}
      </div>
    </div>
  );
}
