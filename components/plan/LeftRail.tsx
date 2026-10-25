"use client";

import Link from "next/link";

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
  return (
    <nav className="w-[200px] shrink-0 overflow-auto border-r border-line bg-paper">
      <Link
        href={`/p/${code}/units?floor=${level}`}
        className={`flex h-7 items-center border-l-2 px-3 text-13 ${
          selected === null ? "border-accent text-ink" : "border-transparent text-ink-2"
        }`}
      >
        all units
      </Link>

      {rail.map((floor) => {
        const current = floor.level === level;
        return (
          <div key={floor.level}>
            <Link
              href={`/p/${code}/units?floor=${floor.level}`}
              className={`flex h-7 items-center justify-between border-l-2 px-3 text-13 ${
                current ? "border-accent text-ink" : "border-transparent text-ink-2"
              }`}
            >
              <span>{floor.label}</span>
              <span className="mono text-11 text-ink-2">{floor.units.length}</span>
            </Link>
            {current ? (
              <div className="grid grid-cols-4 border-b border-line pb-2">
                {floor.units.map((number) => (
                  <Link
                    key={number}
                    href={`/p/${code}/units?floor=${floor.level}&u=${number}`}
                    className={`mono flex h-6 items-center justify-center text-11 ${
                      selected === number ? "text-accent" : "text-ink-2"
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
