"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon, { type IconName } from "@/components/ui/Icon";
import { projectThumb } from "@/lib/format";
import type { Project } from "@/lib/types";

export type NavKey =
  | "projects"
  | "overview"
  | "units"
  | "office-dna"
  | "drawings"
  | "building"
  | "team"
  | "settings"
  | "library"
  | "none";

/**
 * The dark rail: wordmark, the project you are inside, then the sections of
 * that project. Outside a project only the global entries are live.
 */
export default function AppSidebar({
  active,
  project,
}: {
  /** Override for pages that are not under /p/[code]. */
  active?: NavKey;
  project?: Project | null;
}) {
  const pathname = usePathname();
  const code = project?.project_code;
  const thumb = code ? projectThumb(code) : null;
  const current: NavKey = active ?? sectionOf(pathname);

  const items: [NavKey, string, IconName, string][] = code
    ? [
        ["projects", "Projects", "grid", "/"],
        ["units", "Units", "layers", `/p/${code}/units`],
        ["office-dna", "Office DNA", "dna", `/p/${code}/office-dna`],
        ["drawings", "Drawings", "drawing", `/p/${code}/drawings`],
        ["building", "Building", "building", `/p/${code}/building`],
        ["library", "Library", "table", "/library"],
        ["settings", "Settings", "settings", "/settings"],
      ]
    : [
        ["projects", "Projects", "grid", "/"],
        ["office-dna", "Office DNA", "dna", "/office-dna"],
        ["library", "Library", "layers", "/library"],
        ["settings", "Settings", "settings", "/settings"],
      ];

  return (
    <aside className="flex w-[200px] shrink-0 flex-col bg-nav text-white">
      <Link
        href="/"
        className="flex h-[60px] items-center px-5 text-[19px] font-semibold tracking-tight"
      >
        fitte<span className="text-brand">.</span>
      </Link>

      {project ? (
        <Link
          href={`/p/${project.project_code}/units`}
          className="mx-2 mb-2 flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-nav-2"
        >
          <span className="h-9 w-9 shrink-0 overflow-hidden rounded-md bg-nav-2">
            {thumb ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={thumb} alt="" className="h-full w-full object-cover" />
            ) : null}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[13px] font-medium text-white">
              {project.display_name}
            </span>
            <span className="block truncate text-[11px] text-nav-text">
              {project.city}
            </span>
          </span>
        </Link>
      ) : null}

      <nav className="flex flex-col gap-0.5 px-2">
        {items.map(([key, label, icon, href]) => {
          const on = key === current;
          return (
            <Link
              key={key}
              href={href}
              className={`flex h-9 items-center gap-3 rounded-lg px-3 text-[13px] transition-colors ${
                on
                  ? "bg-nav-2 font-medium text-white"
                  : "text-nav-text hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon name={icon} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex items-center gap-3 border-t border-white/10 px-4 py-4">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-nav-2 text-[11px] font-medium text-white">
          JD
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[13px] text-white">
            Julie Dubois
          </span>
          <span className="block truncate text-[11px] text-nav-text">
            Atelier Nord
          </span>
        </span>
      </div>
    </aside>
  );
}

/** Which rail entry the current path belongs to. */
function sectionOf(pathname: string): NavKey {
  if (pathname.startsWith("/p/")) {
    const segment = pathname.split("/")[3] ?? "";
    if (segment === "office-dna") return "office-dna";
    if (segment === "drawings") return "drawings";
    if (segment === "building") return "building";
    return "units";
  }
  if (pathname.startsWith("/office-dna")) return "office-dna";
  if (pathname.startsWith("/library")) return "library";
  if (pathname.startsWith("/settings")) return "settings";
  return "projects";
}
