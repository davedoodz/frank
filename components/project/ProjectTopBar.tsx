"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import Icon from "@/components/ui/Icon";
import type { Project } from "@/lib/types";

/**
 * Every section of a project, including the two that have no sub-navigation.
 * The empty key is the overview; leaving it out is what made Fichiers and
 * Aperçu end their trail at the project name while the others did not, so
 * the same click depth looked like two different depths.
 */
const TAB_LABEL: Record<string, string> = {
  "": "Aperçu",
  files: "Fichiers",
  units: "Unités",
  schedule: "Unités",
  "office-dna": "Précédents",
  drawings: "Dessins",
  building: "Bâtiment",
};

/**
 * The thin chrome above the work: where you are. The project itself lives in
 * the rail, so nothing is repeated here.
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

  const segment = pathname.split("/")[3] ?? "";
  const tab = TAB_LABEL[segment];
  const floorParam = params.get("floor");
  const unitParam = params.get("u");
  const floorLabel = units.find((u) => String(u.level) === floorParam)?.label;

  const crumbs: { label: string; href?: string }[] = [
    { label: "Projets", href: "/" },
    { label: project.display_name, href: `/p/${code}` },
  ];
  if (tab) crumbs.push({ label: tab, href: `/p/${code}/${segment}` });
  if (floorLabel) {
    crumbs.push({
      label: floorLabel,
      href: `/p/${code}/units?floor=${floorParam}`,
    });
  }
  if (unitParam && segment === "units") {
    crumbs.push({ label: `Unité ${unitParam}` });
  } else if (floorLabel && segment === "units") {
    crumbs.push({ label: "Toutes les unités" });
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

    </header>
  );
}
