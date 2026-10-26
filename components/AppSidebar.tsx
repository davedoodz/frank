"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon, { type IconName } from "@/components/ui/Icon";
import { projectThumb } from "@/lib/format";
import type { Project } from "@/lib/types";

export type NavKey =
  | "projects"
  | "overview"
  | "files"
  | "units"
  | "office-dna"
  | "project-dna"
  | "drawings"
  | "building"
  | "team"
  | "settings"
  | "library"
  | "none";

type Entry = [NavKey, string, IconName, string];

/**
 * The black rail. Two registers, always in the same order and always in the
 * same place: the agency at the top, the project you are inside below it,
 * then settings and you at the foot. Opening a project *adds* a group — it
 * never rearranges or replaces what was already there, so the rail reads as
 * one fixed map of the product rather than two screens that swap.
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

  const agency: Entry[] = [
    ["projects", "Projets", "grid", "/"],
    ["office-dna", "ADN de l’agence", "dna", "/office-dna"],
    ["library", "Bibliothèque", "table", "/library"],
  ];

  const inProject: Entry[] = code
    ? [
        ["overview", "Aperçu", "info", `/p/${code}`],
        ["files", "Fichiers", "file", `/p/${code}/files`],
        ["units", "Unités", "layers", `/p/${code}/units`],
        ["drawings", "Dessins", "drawing", `/p/${code}/drawings`],
        ["building", "Bâtiment", "building", `/p/${code}/building`],
        ["project-dna", "Précédents", "dna", `/p/${code}/office-dna`],
      ]
    : [];

  return (
    <aside className="flex w-[216px] shrink-0 flex-col bg-nav text-white">
      <Link
        href="/"
        className="flex h-[60px] shrink-0 items-center px-5 text-[18px] font-semibold tracking-tight"
      >
        ça fitte<span className="text-brand">.</span>
      </Link>

      <div className="min-h-0 flex-1 overflow-y-auto pb-2">
        <Group label="l’agence">
          {agency.map((item) => (
            <Item key={item[0]} item={item} current={current} />
          ))}
        </Group>

        {project ? (
          <Group label="le projet">
            <Link
              href={`/p/${project.project_code}`}
              className="mb-1 flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-white/5"
            >
              <span className="h-8 w-8 shrink-0 overflow-hidden rounded-md bg-nav-2">
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
            {inProject.map((item) => (
              <Item key={item[0]} item={item} current={current} />
            ))}
          </Group>
        ) : null}
      </div>

      <div className="shrink-0 px-2 py-2">
        <Item
          item={["settings", "Paramètres", "settings", "/settings"]}
          current={current}
        />
      </div>

      <div className="flex shrink-0 items-center gap-3 px-4 py-4">
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

/** A titled run of entries. The title is what makes the two registers read as two. */
function Group({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="px-2 pt-3">
      <p className="px-3 pb-1.5 text-[10px] tracking-[0.08em] text-nav-text uppercase">
        {label}
      </p>
      <nav className="flex flex-col gap-0.5">{children}</nav>
    </div>
  );
}

function Item({ item, current }: { item: Entry; current: NavKey }) {
  const [key, label, icon, href] = item;
  const on = key === current;
  return (
    <Link
      href={href}
      className={`flex h-9 items-center gap-3 rounded-lg px-3 text-[13px] transition-colors ${
        on
          ? "bg-nav-2 font-medium text-white"
          : "text-nav-text hover:bg-white/5 hover:text-white"
      }`}
    >
      {/* The green marks where you are, here as everywhere else. */}
      <span className={on ? "text-brand" : ""}>
        <Icon name={icon} />
      </span>
      {label}
    </Link>
  );
}

/** Which rail entry the current path belongs to. */
function sectionOf(pathname: string): NavKey {
  if (pathname.startsWith("/p/")) {
    const segment = pathname.split("/")[3] ?? "";
    if (segment === "") return "overview";
    if (segment === "files") return "files";
    if (segment === "office-dna") return "project-dna";
    if (segment === "drawings") return "drawings";
    if (segment === "building") return "building";
    return "units";
  }
  if (pathname.startsWith("/office-dna")) return "office-dna";
  if (pathname.startsWith("/library")) return "library";
  if (pathname.startsWith("/settings")) return "settings";
  return "projects";
}
