"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Project } from "@/lib/types";
import NewProjectPanel from "./NewProjectPanel";

type Column = {
  key: string;
  label: string;
  numeric?: boolean;
  value: (p: Project) => string | number;
  render?: (p: Project) => React.ReactNode;
};

const columns: Column[] = [
  {
    key: "display_name",
    label: "project",
    value: (p) => p.display_name,
  },
  {
    key: "project_code",
    label: "code",
    value: (p) => p.project_code,
    render: (p) => <span className="mono text-11">{p.project_code}</span>,
  },
  { key: "city", label: "city", value: (p) => p.city },
  {
    key: "year",
    label: "year",
    numeric: true,
    value: (p) => p.year,
    render: (p) => <span className="mono text-11">{p.year}</span>,
  },
  {
    key: "floors_count",
    label: "floors",
    numeric: true,
    value: (p) => p.floors_count,
    render: (p) => <span className="mono text-11">{p.floors_count}</span>,
  },
  {
    key: "units_count",
    label: "units",
    numeric: true,
    value: (p) => p.units_count,
    render: (p) => <span className="mono text-11">{p.units_count}</span>,
  },
  {
    key: "verified_count",
    label: "verified",
    numeric: true,
    value: (p) => p.verified_count,
    render: (p) => (
      <span className="mono text-11">
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
        <span className="mono text-11">
          {p.drawings.length}
          {dwg ? <span className="text-ink-2"> dwg {dwg}</span> : null}
          {skp ? <span className="text-ink-2"> skp {skp}</span> : null}
        </span>
      );
    },
  },
  {
    key: "last_import_at",
    label: "last import",
    value: (p) => p.last_import_at ?? "",
    render: (p) => (
      <span className="mono text-11">{p.last_import_at ?? "—"}</span>
    ),
  },
];

export default function Dashboard({ projects }: { projects: Project[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 }>({
    key: "display_name",
    dir: 1,
  });
  const [panelOpen, setPanelOpen] = useState(false);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const column = columns.find((c) => c.key === sort.key) ?? columns[0];
    return projects
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
  }, [projects, query, sort]);

  return (
    <div className="flex h-screen flex-col bg-surface">
      <header className="flex h-12 shrink-0 items-center gap-6 border-b border-line bg-paper px-4">
        <span className="text-13 text-ink">fitte.</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="search projects"
          className="h-6 w-[220px] border border-line bg-paper px-2 text-13 outline-none focus:border-ink"
        />
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => setPanelOpen(true)}
          className="text-13 text-ink"
        >
          + new project
        </button>
      </header>

      <div className="flex min-h-0 flex-1">
        <div className="min-w-0 flex-1 overflow-auto">
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
                    className={`label h-8 cursor-pointer border-b border-line px-3 ${
                      c.numeric ? "text-right" : "text-left"
                    } ${sort.key === c.key ? "text-ink" : ""}`}
                  >
                    {c.label}
                    {sort.key === c.key ? (
                      <span className="mono"> {sort.dir === 1 ? "+" : "−"}</span>
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
                  className="h-8 cursor-pointer border-b border-line hover:bg-paper"
                >
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={`px-3 text-13 ${c.numeric ? "text-right" : "text-left"}`}
                    >
                      {c.render ? c.render(p) : c.value(p)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 ? (
            <div className="px-3 py-3 text-13 text-ink-3">no match</div>
          ) : null}
        </div>

        {panelOpen ? (
          <NewProjectPanel onClose={() => setPanelOpen(false)} />
        ) : null}
      </div>
    </div>
  );
}
