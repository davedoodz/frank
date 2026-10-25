"use client";

import Link from "next/link";

/**
 * Building navigation. Each floor is a full-width stadium row with its unit
 * count in a concentric stadium field; the current floor inverts. Unit numbers
 * sit in a 4-column monospace grid under the open floor.
 */
export default function LeftRail({
  code,
  level,
  selected,
  rail,
}: {
  code: string;
  level: number;
  selected: string | null;
  rail: { level: number; label: string; units: string[] }[];
}) {
  const total = rail.reduce((sum, f) => sum + f.units.length, 0);

  return (
    <nav className="w-[200px] shrink-0 overflow-auto border-r border-line bg-surface p-2">
      <Row
        href={`/p/${code}/units?floor=${level}`}
        label="all units"
        count={total}
        active={selected === null}
      />

      <div className="my-2 border-t border-line" />

      {rail.map((floor) => {
        const current = floor.level === level;
        return (
          <div key={floor.level}>
            <Row
              href={`/p/${code}/units?floor=${floor.level}`}
              label={floor.label}
              count={floor.units.length}
              active={current && selected !== null}
            />
            {current ? (
              <div className="mt-1 mb-2 grid grid-cols-4 gap-px">
                {floor.units.map((number) => (
                  <Link
                    key={number}
                    href={`/p/${code}/units?floor=${floor.level}&u=${number}`}
                    className={`flex h-6 items-center justify-center rounded-full font-mono text-meta transition-colors duration-[80ms] ${
                      selected === number
                        ? "bg-ink text-paper"
                        : "text-ink-2 hover:bg-fill-2 hover:text-ink"
                    }`}
                  >
                    {number}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}

function Row({
  href,
  label,
  count,
  active,
}: {
  href: string;
  label: string;
  count: number;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group flex h-6 w-full items-center justify-between gap-2 rounded-full py-0 pr-[3px] pl-2.5 text-body transition-colors duration-[80ms] ${
        active ? "bg-ink text-paper" : "text-ink hover:bg-fill-2"
      }`}
    >
      <span className="truncate">{label}</span>
      <span
        className={`flex h-[18px] min-w-[18px] flex-none items-center justify-center rounded-full px-[5px] font-mono text-meta tabular-nums transition-colors duration-[80ms] ${
          active ? "bg-paper text-ink" : "bg-fill-2 text-ink-2 group-hover:bg-paper"
        }`}
      >
        {count}
      </span>
    </Link>
  );
}
