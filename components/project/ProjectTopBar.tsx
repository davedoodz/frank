"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import Icon from "@/components/ui/Icon";
import type { Project } from "@/lib/types";

const TAB_LABEL: Record<string, string> = {
  units: "Units",
  schedule: "Units",
  "office-dna": "Office DNA",
  drawings: "Drawings",
  building: "Building",
};

/**
 * The thin chrome above the work: where you are, and one search that jumps to
 * a unit. The project itself lives in the rail, so nothing is repeated here.
 */
export default function ProjectTopBar({
  project,
  units,
}: {
  project: Project;
  units: { number: string; level: number; label: string }[];
}) {
  const code = project.project_code;
  const pathname = usePathname();
  const params = useSearchParams();
  const router = useRouter();
  const [find, setFind] = useState("");

  const segment = pathname.split("/")[3] ?? "";
  const tab = TAB_LABEL[segment];
  const floorParam = params.get("floor");
  const unitParam = params.get("u");
  const floorLabel = units.find((u) => String(u.level) === floorParam)?.label;

  const crumbs: { label: string; href?: string }[] = [
    { label: "Projects", href: "/" },
    { label: project.display_name, href: `/p/${code}/units` },
  ];
  if (tab) crumbs.push({ label: tab, href: `/p/${code}/${segment}` });
  if (floorLabel) {
    crumbs.push({
      label: floorLabel,
      href: `/p/${code}/units?floor=${floorParam}`,
    });
  }
  if (unitParam && segment === "units") {
    crumbs.push({ label: `Unit ${unitParam}` });
  } else if (floorLabel && segment === "units") {
    crumbs.push({ label: "All Units" });
  }

  return (
    <header className="flex h-[60px] shrink-0 items-center gap-2 px-6">
      <nav className="flex min-w-0 items-center gap-2 text-[13px]">
        {crumbs.map((crumb, i) => {
          const last = i === crumbs.length - 1;
          return (
            <span key={`${crumb.label}-${i}`} className="flex items-center gap-2">
              {i > 0 ? (
                <Icon name="chevron-right" size={12} className="text-text-3" />
              ) : null}
              {crumb.href && !last ? (
                <Link
                  href={crumb.href}
                  className="truncate text-text-2 transition-colors hover:text-text"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span
                  className={
                    last ? "truncate font-medium text-text" : "truncate text-text-2"
                  }
                >
                  {crumb.label}
                </span>
              )}
            </span>
          );
        })}
      </nav>

      <div className="flex-1" />

      <label className="flex h-9 w-[300px] items-center gap-2 rounded-full border border-edge bg-panel px-3 text-text-3 focus-within:border-brand-line">
        <Icon name="search" size={14} />
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
          placeholder="Search units in this project..."
          aria-label="search units"
          className="w-full text-[13px] text-text outline-none placeholder:text-text-3"
        />
      </label>

      <button
        type="button"
        aria-label="notifications"
        className="flex h-9 w-9 items-center justify-center rounded-full text-text-2 transition-colors hover:bg-panel hover:text-text"
      >
        <Icon name="bell" />
      </button>

      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-nav text-[11px] font-medium text-white">
        JD
      </span>
    </header>
  );
}
