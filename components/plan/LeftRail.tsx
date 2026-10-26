"use client";

import Link from "next/link";

/**
 * Building navigation: one stadium row per floor, highest level first, each
 * carrying its unit count. Picking a floor clears the unit selection, which is
 * how the plan returns to the typology view.
 */
export default function LeftRail({
  code,
  level,
  rail,
}: {
  code: string;
  level: number;
  rail: { level: number; label: string; units: string[] }[];
}) {
  return (
    <nav className="w-[200px] shrink-0 overflow-auto border-r border-line bg-surface p-2">
      <div className="label-11 px-2.5 pt-1 pb-2">floors</div>

      {rail.map((floor) => {
        const active = floor.level === level;
        return (
          <Link
            key={floor.level}
            href={`/p/${code}/units?floor=${floor.level}`}
            className={`group flex h-7 w-full items-center justify-between gap-2 rounded-full py-0 pr-[3px] pl-2.5 text-body transition-colors duration-[80ms] ${
              active ? "bg-ink text-paper" : "text-ink hover:bg-fill-2"
            }`}
          >
            <span className="truncate">{floor.label}</span>
            <span
              className={`flex h-[18px] min-w-[18px] flex-none items-center justify-center rounded-full px-[5px] font-mono text-meta tabular-nums transition-colors duration-[80ms] ${
                active
                  ? "bg-paper text-ink"
                  : "bg-fill-2 text-ink-2 group-hover:bg-paper"
              }`}
            >
              {floor.units.length}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
