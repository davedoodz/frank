"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const tabs = [
  { slug: "units", label: "units" },
  { slug: "office-dna", label: "office dna" },
  { slug: "drawings", label: "drawings" },
  { slug: "building", label: "building" },
];

export default function ProjectTopBar({
  code,
  displayName,
  units,
}: {
  code: string;
  displayName: string;
  units: { number: string; level: number }[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [find, setFind] = useState("");
  const active = tabs.find((t) => pathname.startsWith(`/p/${code}/${t.slug}`))?.slug;
  const onSchedule = pathname.startsWith(`/p/${code}/schedule`);

  return (
    <header className="flex h-12 shrink-0 items-center gap-6 border-b border-line bg-paper px-4">
      <Link href="/" className="text-13 text-ink">
        fitte.
      </Link>
      <div className="flex items-baseline gap-2">
        <span className="text-13 text-ink">{displayName}</span>
        <span className="mono text-11 text-ink-2">{code}</span>
      </div>

      <nav className="flex items-center gap-4">
        {tabs.map((t) => (
          <Link
            key={t.slug}
            href={`/p/${code}/${t.slug}`}
            className={`text-13 ${
              active === t.slug && !onSchedule
                ? "border-b border-ink text-ink"
                : "text-ink-2"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      <div className="flex-1" />

      <div className="flex items-center gap-2 text-13">
        <Link
          href={`/p/${code}/units`}
          className={onSchedule ? "text-ink-2" : "text-ink"}
        >
          plan
        </Link>
        <span className="text-ink-3">·</span>
        <Link
          href={`/p/${code}/schedule`}
          className={onSchedule ? "text-ink" : "text-ink-2"}
        >
          schedule
        </Link>
      </div>

      <input
        value={find}
        onChange={(e) => setFind(e.target.value)}
        onKeyDown={(e) => {
          if (e.key !== "Enter") return;
          const hit = units.find((u) => u.number === find.trim());
          if (hit) router.push(`/p/${code}/units?floor=${hit.level}&u=${hit.number}`);
        }}
        placeholder="find unit"
        className="h-6 w-[140px] border border-line bg-paper px-2 text-13 outline-none focus:border-ink"
      />
    </header>
  );
}
