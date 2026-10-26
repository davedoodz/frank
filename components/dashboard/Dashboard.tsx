"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import AppSidebar from "@/components/AppSidebar";
import Icon from "@/components/ui/Icon";
import { BTN, BTN_BRAND, BTN_ICON, BTN_ON } from "@/components/ui/Button";
import { since } from "@/lib/format";
import type { Project } from "@/lib/types";
import NewProjectDialog from "./NewProjectDialog";
import ProjectCard from "./ProjectCard";

const filters = [
  { key: "all", label: "Tous" },
  { key: "active", label: "En cours" },
  { key: "archived", label: "Archivé" },
] as const;

type Filter = (typeof filters)[number]["key"];

const sorts = [
  { key: "updated_at", label: "Modifié récemment" },
  { key: "display_name", label: "Nom" },
  { key: "units_count", label: "Unités" },
  { key: "year", label: "Année" },
];

/**
 * Everything the office holds, one card per project. A project is a render, a
 * place, a size and when it last moved; what has actually been indexed shows
 * on the project itself.
 */
export default function Dashboard({ projects }: { projects: Project[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [sort, setSort] = useState("updated_at");
  const [dialog, setDialog] = useState(false);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects
      .filter((p) => filter === "all" || p.status === filter)
      .filter(
        (p) =>
          !q ||
          `${p.display_name} ${p.project_code} ${p.city} ${p.year}`
            .toLowerCase()
            .includes(q),
      )
      .sort((a, b) => {
        if (sort === "display_name") {
          return a.display_name.localeCompare(b.display_name);
        }
        if (sort === "units_count") return b.units_count - a.units_count;
        if (sort === "year") return b.year - a.year;
        return b.updated_at.localeCompare(a.updated_at);
      });
  }, [projects, query, filter, sort]);

  const counts: Record<Filter, number> = {
    all: projects.length,
    active: projects.filter((p) => p.status === "active").length,
    archived: projects.filter((p) => p.status === "archived").length,
  };

  return (
    <div className="flex h-screen bg-app">
      <AppSidebar active="projects" />

      <div className="flex min-w-0 flex-1 flex-col overflow-auto">
        <header className="flex items-start gap-4 px-6 pt-6 pb-4">
          <div>
            <h1 className="text-[22px] font-semibold tracking-tight text-text">
              Projets
            </h1>
            <p className="mt-1 text-[13px] text-text-2">
              Tous les projets de l’agence, au même endroit.
            </p>
          </div>

          <span className="flex-1" />

          <label className="flex h-9 w-[260px] items-center gap-2 rounded-lg border border-edge bg-panel px-3">
            <Icon name="search" size={14} className="text-text-3" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un projet…"
              aria-label="rechercher des projets"
              className="min-w-0 flex-1 text-[13px] outline-none [&::-webkit-search-cancel-button]:appearance-none"
            />
          </label>

          <button
            type="button"
            onClick={() => setDialog(true)}
            className={BTN_BRAND}
          >
            <Icon name="plus" size={14} />
            Nouveau projet
          </button>
        </header>

        <div className="flex items-center gap-2 px-6 pb-4">
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={filter === f.key ? BTN_ON : BTN}
            >
              {f.label}
              <span className="text-[11px] text-text-3">{counts[f.key]}</span>
            </button>
          ))}

          <span className="flex-1" />

          <span className="text-[13px] text-text-2">Trier par</span>
          <label className="flex h-9 items-center rounded-lg border border-edge bg-panel px-3">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              aria-label="trier les projets"
              className="bg-transparent text-[13px] font-medium text-text outline-none"
            >
              {sorts.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-center gap-1">
            {(["grid", "list"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                aria-label={v === "grid" ? "vue en grille" : "vue en liste"}
                className={`${BTN_ICON} ${
                  view === v ? "border-brand-line bg-brand-soft text-text" : ""
                }`}
              >
                <Icon name={v === "grid" ? "grid" : "table"} size={16} />
              </button>
            ))}
          </div>
        </div>

        <div className="px-6 pb-6">
          {view === "grid" ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(248px,1fr))] gap-4">
              {rows.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
              <button
                type="button"
                onClick={() => setDialog(true)}
                className="flex min-h-[260px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-edge bg-panel/60 px-6 text-center transition-colors hover:border-brand-line hover:bg-brand-soft/40"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft text-text">
                  <Icon name="plus" size={18} />
                </span>
                <span className="text-[13px] font-medium text-text">
                  Nouveau projet
                </span>
                <span className="text-[12px] text-text-2">
                  Créez un projet et connectez vos fichiers AutoCAD et SketchUp.
                </span>
              </button>
            </div>
          ) : (
            <div className="panel overflow-hidden">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-edge-2">
                    {["Projet", "Emplacement", "Unités", "Étages", "Statut", "Modifié"].map(
                      (label, i) => (
                        <th
                          key={label}
                          className={`cap h-10 px-4 font-normal ${
                            i === 2 || i === 3 ? "text-right" : "text-left"
                          }`}
                        >
                          {label}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => router.push(`/p/${p.project_code}`)}
                      className="h-11 cursor-pointer border-b border-edge-2 transition-colors last:border-0 hover:bg-app"
                    >
                      <td className="px-4">
                        <span className="text-[13px] font-medium text-text">
                          {p.display_name}
                        </span>
                        <span className="ml-2 text-[11px] text-text-3">
                          {p.project_code}
                        </span>
                      </td>
                      <td className="px-4 text-[13px] text-text-2">
                        {p.city}, {p.province}
                      </td>
                      <td className="px-4 text-right text-[13px] text-text-2">
                        {p.units_count}
                      </td>
                      <td className="px-4 text-right text-[13px] text-text-2">
                        {p.floors_count}
                      </td>
                      <td className="px-4">
                        <StatusChip status={p.status} />
                      </td>
                      <td className="px-4 text-[13px] text-text-2">
                        {since(p.updated_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="pt-4 text-[12px] text-text-3">
            {rows.length === projects.length
              ? `${projects.length} projet${projects.length === 1 ? "" : "s"}`
              : `${rows.length} sur ${projects.length} projet${projects.length === 1 ? "" : "s"}`}
          </p>
        </div>
      </div>

      {dialog ? <NewProjectDialog onClose={() => setDialog(false)} /> : null}
    </div>
  );
}

export function StatusChip({ status }: { status: Project["status"] }) {
  return (
    <span
      className={`inline-flex h-[22px] items-center rounded-md px-2 text-[11px] font-medium ${
        status === "active"
          ? "bg-brand-soft text-ok"
          : "bg-app text-text-2"
      }`}
    >
      {status === "active" ? "En cours" : "Archivé"}
    </span>
  );
}
