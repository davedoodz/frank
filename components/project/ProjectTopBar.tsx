"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { SEARCH } from "@/components/ui/Action";

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
  const onSchedule = pathname.startsWith(`/p/${code}/schedule`);
  const active = onSchedule
    ? "units"
    : tabs.find((t) => pathname.startsWith(`/p/${code}/${t.slug}`))?.slug;

  return (
    <header className="flex h-12 shrink-0 items-center gap-6 border-b border-line bg-surface px-3">
      <Link href="/" className="wordmark">
        fitte.
      </Link>
      <div className="flex items-baseline gap-2">
        <span className="text-body text-ink">{displayName}</span>
        <span className="font-mono text-meta text-ink-3">{code}</span>
      </div>

      {/* Tabs read as chips: active inverts, nothing underlines. */}
      <nav className="flex items-center gap-1">
        {tabs.map((t) => (
          <Link
            key={t.slug}
            href={`/p/${code}/${t.slug}`}
            className={`flex h-6 items-center rounded-full px-2.5 text-body transition-colors duration-[80ms] ${
              active === t.slug
                ? "bg-ink text-paper"
                : "text-ink-2 hover:bg-fill-2 hover:text-ink"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      <div className="flex-1" />

      {/* Two segments, one border, no dropdown. */}
      <div className="flex shrink-0 border border-line">
        <Link
          href={`/p/${code}/units`}
          className={`flex h-6 items-center px-2 text-body transition-colors duration-[80ms] ${
            onSchedule
              ? "text-ink-3 hover:bg-fill-2 hover:text-ink"
              : "bg-ink text-paper"
          }`}
        >
          plan
        </Link>
        <Link
          href={`/p/${code}/schedule`}
          className={`flex h-6 items-center px-2 text-body transition-colors duration-[80ms] ${
            onSchedule
              ? "bg-ink text-paper"
              : "text-ink-3 hover:bg-fill-2 hover:text-ink"
          }`}
        >
          schedule
        </Link>
      </div>

      <input
        type="search"
        value={find}
        onChange={(e) => setFind(e.target.value)}
        onKeyDown={(e) => {
          if (e.key !== "Enter") return;
          const hit = units.find((u) => u.number === find.trim());
          if (hit) router.push(`/p/${code}/units?floor=${hit.level}&u=${hit.number}`);
        }}
        placeholder="find unit"
        aria-label="find unit"
        className={`w-[140px] ${SEARCH}`}
      />
    </header>
  );
}
