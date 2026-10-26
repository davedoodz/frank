"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { projectThumb } from "@/lib/format";
import {
  SEARCH,
  SEGMENT,
  SEGMENT_OFF,
  SEGMENT_ON,
  SEGMENT_SHELL,
} from "@/components/ui/Action";
import type { Project } from "@/lib/types";

const tabs = [
  { slug: "units", label: "units" },
  { slug: "office-dna", label: "office dna" },
  { slug: "drawings", label: "drawings" },
  { slug: "building", label: "building" },
];

const typologyLabel: Record<Project["typology"], string> = {
  condo: "residential (condominium)",
  mixed_use: "mixed use",
  rental: "rental",
  other: "other",
};

export default function ProjectTopBar({
  project,
  units,
}: {
  project: Project;
  units: { number: string; level: number; label: string }[];
}) {
  const code = project.project_code;
  const thumb = projectThumb(code);
  const pathname = usePathname();
  const params = useSearchParams();
  const router = useRouter();
  const [find, setFind] = useState("");
  const onSchedule = pathname.startsWith(`/p/${code}/schedule`);
  const active = onSchedule
    ? "units"
    : tabs.find((t) => pathname.startsWith(`/p/${code}/${t.slug}`))?.slug;

  const floorParam = params.get("floor");
  const crumbFloor = units.find((u) => String(u.level) === floorParam)?.label;
  const lastImport = project.drawings.find((d) => d.status === "indexed");

  return (
    <header className="shrink-0 border-b border-line bg-surface">
      {/* breadcrumb */}
      <div className="flex h-8 items-center gap-2 px-6 font-mono text-meta">
        <Link
          href="/"
          className="text-ink-3 transition-colors duration-[80ms] hover:text-ink"
        >
          projects
        </Link>
        <span className="text-ink-3">›</span>
        <Link
          href={`/p/${code}/units`}
          className="text-ink-3 transition-colors duration-[80ms] hover:text-ink"
        >
          {project.display_name}
        </Link>
        {active ? (
          <>
            <span className="text-ink-3">›</span>
            <span className="text-ink">{active}</span>
          </>
        ) : null}
        {crumbFloor ? (
          <>
            <span className="text-ink-3">›</span>
            <span className="text-ink">{crumbFloor}</span>
          </>
        ) : null}

        <div className="flex-1" />

        <input
          type="search"
          value={find}
          onChange={(e) => setFind(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            const hit = units.find((u) => u.number === find.trim());
            if (hit) {
              router.push(`/p/${code}/units?floor=${hit.level}&u=${hit.number}`);
            }
          }}
          placeholder="find unit"
          aria-label="find unit"
          className={`w-[160px] ${SEARCH}`}
        />
      </div>

      {/* identity strip: placeholder render crop, or a flat block when none ships */}
      <div className="flex items-start gap-4 px-6 pt-2 pb-4">
        <div className="relative flex h-[72px] w-[112px] shrink-0 items-end overflow-hidden rounded-md bg-fill-2 p-1.5">
          {thumb ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={thumb}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <span className="font-mono text-meta text-ink-3">{code}</span>
          )}
        </div>

        <div className="min-w-0">
          <h1 className="text-title-lg text-ink">{project.display_name}</h1>
          <div className="mt-1 font-mono text-meta text-ink-2">
            {project.city} · {project.year}
          </div>
          <div className="font-mono text-meta text-ink-3">
            {project.floors_count} floors · {project.units_count} units ·{" "}
            {typologyLabel[project.typology]}
          </div>
        </div>

        <div className="flex-1" />

        <div className="flex min-w-[240px] flex-col gap-1 rounded-lg border border-line p-3">
          <span className="label-11">
            {project.last_import_at ? "last import" : "no import yet"}
          </span>
          <span className="font-mono text-meta text-ink">
            {lastImport?.filename ?? "—"}
          </span>
          <span className="font-mono text-meta text-ink-3">
            {project.last_import_at ??
              `${project.drawings.length} files connected`}
          </span>
        </div>
      </div>

      {/* tabs read as chips: active inverts, nothing underlines */}
      <div className="flex items-center gap-6 px-6 pb-2">
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

        {/* two segments in one stadium, no dropdown */}
        <div className={SEGMENT_SHELL}>
          <Link
            href={`/p/${code}/units`}
            className={`${SEGMENT} ${onSchedule ? SEGMENT_OFF : SEGMENT_ON}`}
          >
            plan
          </Link>
          <Link
            href={`/p/${code}/schedule`}
            className={`${SEGMENT} ${onSchedule ? SEGMENT_ON : SEGMENT_OFF}`}
          >
            schedule
          </Link>
        </div>
      </div>
    </header>
  );
}
