"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppSidebar from "@/components/AppSidebar";
import {
  ACTION,
  SEARCH,
  SEGMENT,
  SEGMENT_OFF,
  SEGMENT_ON,
  SEGMENT_SHELL,
  SELECT,
} from "@/components/ui/Action";
import { Chip } from "@/components/ui/Chip";
import type { Project } from "@/lib/types";
import NewProjectPanel from "./NewProjectPanel";
import ProjectCard from "./ProjectCard";

type Column = {
  key: string;
  label: string;
  numeric?: boolean;
  value: (p: Project) => string | number;
  render?: (p: Project) => React.ReactNode;
};

const columns: Column[] = [
  { key: "display_name", label: "project", value: (p) => p.display_name },
  {
    key: "project_code",
    label: "code",
    value: (p) => p.project_code,
    render: (p) => <span className="font-mono text-meta">{p.project_code}</span>,
  },
  { key: "city", label: "city", value: (p) => p.city },
  {
    key: "year",
    label: "year",
    numeric: true,
    value: (p) => p.year,
    render: (p) => <span className="font-mono text-meta">{p.year}</span>,
  },
  {
    key: "floors_count",
    label: "floors",
    numeric: true,
    value: (p) => p.floors_count,
    render: (p) => <span className="font-mono text-meta">{p.floors_count}</span>,
  },
  {
    key: "units_count",
    label: "units",
    numeric: true,
    value: (p) => p.units_count,
    render: (p) => <span className="font-mono text-meta">{p.units_count}</span>,
  },
  {
    key: "verified_count",
    label: "verified",
    numeric: true,
    value: (p) => p.verified_count,
    render: (p) => (
      <span className="font-mono text-meta">
        {p.verified_count} / {p.units_count}
      </span>
    ),
  },
  {
    key: "drawings",
    label: "files",
    numeric: true,
    value: (p) => p.drawings.length,
    render: (p) => {
      const dwg = p.drawings.filter((d) => d.kind === "dwg").length;
      const skp = p.drawings.filter((d) => d.kind === "skp").length;
      return (
        <span className="font-mono text-meta">
          {p.drawings.length}
          {dwg ? <span className="text-ink-3"> dwg {dwg}</span> : null}
          {skp ? <span className="text-ink-3"> skp {skp}</span> : null}
        </span>
      );
    },
  },
  {
    key: "last_import_at",
    label: "last import",
    value: (p) => p.last_import_at ?? "",
    render: (p) => (
      <span className="font-mono text-meta text-ink-2">
        {p.last_import_at ?? "—"}
      </span>
    ),
  },
];

const states = ["all", "indexed", "connected"] as const;
type State = (typeof states)[number];

function stateOf(p: Project): Exclude<State, "all"> {
  return p.verified_count > 0 || p.last_import_at !== null
    ? "indexed"
    : "connected";
}

const sorts = [
  { key: "last_import_at", label: "last import" },
  { key: "display_name", label: "name" },
  { key: "units_count", label: "units" },
  { key: "year", label: "year" },
];

export default function Dashboard({ projects }: { projects: Project[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [state, setState] = useState<State>("all");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 }>({
    key: "display_name",
    dir: 1,
  });
  const [panelOpen, setPanelOpen] = useState(false);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const column = columns.find((c) => c.key === sort.key) ?? columns[0];
    return projects
      .filter((p) => state === "all" || stateOf(p) === state)
      .filter(
        (p) =>
          !q ||
          `${p.display_name} ${p.project_code} ${p.city} ${p.year}`
            .toLowerCase()
            .includes(q),
      )
      .sort((a, b) => {
        const av = column.value(a);
        const bv = column.value(b);
        if (typeof av === "number" && typeof bv === "number") {
          return (av - bv) * sort.dir;
        }
        return String(av).localeCompare(String(bv)) * sort.dir;
      });
  }, [projects, query, state, sort]);

  const counts = {
    all: projects.length,
    indexed: projects.filter((p) => stateOf(p) === "indexed").length,
    connected: projects.filter((p) => stateOf(p) === "connected").length,
  };

  return (
    <div className="flex h-screen">
      <AppSidebar active="projects" />

      <div className="flex min-w-0 flex-1 flex-col bg-surface">
        <header className="flex items-start gap-6 px-6 pt-6 pb-4">
          <div>
            <h1 className="text-title-lg text-ink">projects</h1>
            <p className="mt-1 text-body text-ink-2">
              every project the office has indexed, and every one still waiting
              on its drawings.
            </p>
          </div>
          <div className="flex-1" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="search projects"
            className={`w-[220px] ${SEARCH}`}
          />
          <button type="button" onClick={() => setPanelOpen(true)} className={ACTION}>
            new project
          </button>
        </header>

        <div className="flex items-center gap-1 border-y border-line px-6 py-2">
          {states.map((s) => (
            <Chip
              key={s}
              label={s}
              count={counts[s]}
              active={state === s}
              onClick={() => setState(s)}
            />
          ))}

          <div className="flex-1" />

          <span className="label-11 mr-2">sort</span>
          <select
            value={sort.key}
            onChange={(e) => setSort({ key: e.target.value, dir: 1 })}
            className={SELECT}
          >
            {sorts.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>

          <div className={`ml-2 ${SEGMENT_SHELL}`}>
            {(["grid", "list"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={`${SEGMENT} ${view === v ? SEGMENT_ON : SEGMENT_OFF}`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        <div className="flex min-h-0 flex-1">
          <div className="min-w-0 flex-1 overflow-auto">
            {view === "grid" ? (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3 p-6">
                {rows.map((p) => (
                  <ProjectCard key={p.id} project={p} />
                ))}
                <button
                  type="button"
                  onClick={() => setPanelOpen(true)}
                  className="flex flex-col justify-end rounded-lg border border-dashed border-line p-3 text-left text-body text-ink-3 transition-colors duration-[80ms] hover:border-ink hover:text-ink"
                >
                  new project
                </button>
              </div>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="sticky top-0 bg-surface">
                    {columns.map((c) => (
                      <th
                        key={c.key}
                        onClick={() =>
                          setSort((s) =>
                            s.key === c.key
                              ? { key: c.key, dir: s.dir === 1 ? -1 : 1 }
                              : { key: c.key, dir: 1 },
                          )
                        }
                        className={`label-11 h-8 cursor-pointer border-b border-line px-3 ${
                          c.numeric ? "text-right" : "text-left"
                        } ${sort.key === c.key ? "text-ink" : ""}`}
                      >
                        {c.label}
                        {sort.key === c.key ? (
                          <span className="font-mono">
                            {" "}
                            {sort.dir === 1 ? "+" : "−"}
                          </span>
                        ) : null}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => router.push(`/p/${p.project_code}/units`)}
                      className="h-8 cursor-pointer border-b border-line transition-colors duration-[80ms] hover:bg-fill-2"
                    >
                      {columns.map((c) => (
                        <td
                          key={c.key}
                          className={`px-3 text-body ${
                            c.numeric ? "text-right" : "text-left"
                          }`}
                        >
                          {c.render ? c.render(p) : c.value(p)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div className="px-6 pb-6 text-meta text-ink-2">
              {rows.length === projects.length
                ? `${projects.length} projects`
                : `${rows.length} of ${projects.length} projects`}
            </div>
          </div>

          {panelOpen ? (
            <NewProjectPanel onClose={() => setPanelOpen(false)} />
          ) : null}
        </div>
      </div>
    </div>
  );
}
