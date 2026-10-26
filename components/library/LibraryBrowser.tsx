"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SEARCH } from "@/components/ui/Action";
import { Chip } from "@/components/ui/Chip";
import Icon from "@/components/ui/Icon";
import { ft2 } from "@/lib/format";
import type { AreaUnit } from "@/lib/prefs";

export type LibraryRow = {
  id: string;
  projectCode: string;
  projectName: string;
  city: string;
  number: string;
  floorLevel: number;
  floorLabel: string;
  sheet: string;
  type: string;
  bedrooms: number;
  netM2: number;
  orientation: string;
  corner: boolean;
  status: string;
  href: string;
};

type Col = {
  key: string;
  label: string;
  numeric?: boolean;
  sort: (r: LibraryRow) => string | number;
  cell: (r: LibraryRow) => React.ReactNode;
};

const TYPOLOGIES = ["studio", "3½", "4½", "5½", "6½"];
const STATES = ["vérifiée", "non vérifiée"];

/** The ft² column is dropped when the office asked for one unit only. */
function columnsFor(unit: AreaUnit): Col[] {
  if (unit === "both") return cols;
  return cols.filter((c) => (unit === "m2" ? c.key !== "net_ft" : c.key !== "net"));
}

const cols: Col[] = [
  {
    key: "project",
    label: "projet",
    sort: (r) => r.projectName,
    cell: (r) => <span className="text-body">{r.projectName}</span>,
  },
  {
    key: "code",
    label: "code",
    sort: (r) => r.projectCode,
    cell: (r) => <span className="font-mono text-meta text-ink-3">{r.projectCode}</span>,
  },
  {
    key: "unit",
    label: "unité",
    sort: (r) => r.number,
    cell: (r) => <span className="font-mono text-meta text-ink">{r.number}</span>,
  },
  {
    key: "floor",
    label: "étage",
    numeric: true,
    sort: (r) => r.floorLevel,
    cell: (r) => <span className="text-body">{r.floorLabel}</span>,
  },
  {
    key: "type",
    label: "type",
    sort: (r) => r.type,
    cell: (r) => <span className="text-body">{r.type}</span>,
  },
  {
    key: "bedrooms",
    label: "CH",
    numeric: true,
    sort: (r) => r.bedrooms,
    cell: (r) => <span className="font-mono text-meta">{r.bedrooms}</span>,
  },
  {
    key: "net",
    label: "nette m²",
    numeric: true,
    sort: (r) => r.netM2,
    cell: (r) => <span className="font-mono text-meta">{r.netM2.toFixed(1)}</span>,
  },
  {
    key: "net_ft",
    label: "nette ft²",
    numeric: true,
    sort: (r) => r.netM2,
    cell: (r) => (
      <span className="font-mono text-meta text-ink-3">{ft2(r.netM2)}</span>
    ),
  },
  {
    key: "orientation",
    label: "orient.",
    sort: (r) => r.orientation,
    cell: (r) => <span className="font-mono text-meta">{r.orientation}</span>,
  },
  {
    key: "corner",
    label: "coin",
    sort: (r) => String(r.corner),
    cell: (r) => <span className="text-body">{r.corner ? "oui" : "non"}</span>,
  },
  {
    key: "state",
    label: "état",
    sort: (r) => r.status,
    cell: (r) => (
      <span className="font-mono text-meta text-ink-3">
        {r.status === "verified" ? "vérifiée" : "non vérifiée"}
      </span>
    ),
  },
  {
    key: "sheet",
    label: "feuille",
    sort: (r) => r.sheet,
    cell: (r) => <span className="font-mono text-meta text-ink-3">{r.sheet}</span>,
  },
];

const FACETS = ["typology", "project", "state"] as const;
type Facet = (typeof FACETS)[number];

function facetValue(row: LibraryRow, facet: Facet): string {
  switch (facet) {
    case "typology":
      return row.type;
    case "project":
      return row.projectCode;
    case "state":
      return row.status === "verified" ? "vérifiée" : "non vérifiée";
  }
}

export default function LibraryBrowser({
  rows,
  projects,
  area,
}: {
  rows: LibraryRow[];
  projects: { code: string; name: string }[];
  area: AreaUnit;
}) {
  const shown = columnsFor(area);
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<Record<string, Set<string>>>({});
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 }>({
    key: "project",
    dir: 1,
  });

  const q = query.trim().toLowerCase();

  const searchFiltered = useMemo(
    () =>
      rows.filter(
        (row) =>
          !q ||
          `${row.number} ${row.projectName} ${row.projectCode} ${row.city} ${row.type}`
            .toLowerCase()
            .includes(q),
      ),
    [rows, q],
  );

  const filtered = useMemo(
    () =>
      searchFiltered.filter((row) =>
        FACETS.every((facet) => {
          const set = active[facet];
          return !set || set.size === 0 || set.has(facetValue(row, facet));
        }),
      ),
    [searchFiltered, active],
  );

  const sorted = useMemo(() => {
    const col = cols.find((c) => c.key === sort.key) ?? cols[0];
    return [...filtered].sort((a, b) => {
      const av = col.sort(a);
      const bv = col.sort(b);
      return typeof av === "number" && typeof bv === "number"
        ? (av - bv) * sort.dir
        : String(av).localeCompare(String(bv)) * sort.dir;
    });
  }, [filtered, sort]);

  function toggle(facet: Facet, value: string) {
    setActive((state) => {
      const set = new Set(state[facet] ?? []);
      if (set.has(value)) set.delete(value);
      else set.add(value);
      return { ...state, [facet]: set };
    });
  }

  // counts follow the other facets and the search text, so a chip shows what
  // choosing it would leave
  function chipsFor(facet: Facet, values: string[]) {
    return values.map((value) => ({
      facet,
      value,
      count: searchFiltered.filter(
        (row) =>
          facetValue(row, facet) === value &&
          FACETS.every((other) => {
            if (other === facet) return true;
            const set = active[other];
            return !set || set.size === 0 || set.has(facetValue(row, other));
          }),
      ).length,
    }));
  }

  const projectValues = projects.map((p) => p.code);
  const chips = [
    ...chipsFor("typology", TYPOLOGIES),
    ...chipsFor("project", projectValues),
    ...chipsFor("state", STATES),
  ];

  const totalNet = filtered.reduce((sum, r) => sum + r.netM2, 0);
  const avgNet = filtered.length ? totalNet / filtered.length : 0;
  const distinctProjects = new Set(filtered.map((r) => r.projectCode)).size;

  const figures: [string, string][] = [
    ["unités", String(filtered.length)],
    ["projets", String(distinctProjects)],
    area === "ft2"
      ? ["nette ft²", String(ft2(totalNet))]
      : ["nette m²", totalNet.toFixed(1)],
    area === "ft2"
      ? ["moy. ft²", String(ft2(avgNet))]
      : ["moy. m²", avgNet.toFixed(1)],
    ...TYPOLOGIES.map(
      (t): [string, string] => [t, String(filtered.filter((r) => r.type === t).length)],
    ),
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-3 border-b border-line px-6 py-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="rechercher une unité, un projet, un code ou une ville"
          className={`w-[320px] ${SEARCH}`}
        />
      </div>

      <div className="flex h-16 shrink-0 items-center overflow-x-auto border-b border-line bg-surface">
        {figures.map(([label, value]) => (
          <div key={label} className="h-full border-r border-line px-4 py-3">
            <div className="font-mono text-title-lg text-ink">{value}</div>
            <div className="label-11">{label}</div>
          </div>
        ))}
      </div>

      <div className="flex h-10 shrink-0 items-center gap-1 overflow-x-auto border-b border-line bg-surface px-6">
        {chips.map((chip) => (
          <Chip
            key={`${chip.facet}:${chip.value}`}
            label={
              chip.facet === "project"
                ? (projects.find((p) => p.code === chip.value)?.name ?? chip.value)
                : chip.value
            }
            count={chip.count}
            active={active[chip.facet]?.has(chip.value) ?? false}
            onClick={() => toggle(chip.facet, chip.value)}
          />
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        {sorted.length === 0 ? (
          <div className="px-6 py-4 text-meta text-ink-2">aucune unité ne correspond</div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="sticky top-0 z-10 bg-surface">
                {shown.map((c) => (
                  <th
                    key={c.key}
                    onClick={() =>
                      setSort((s) =>
                        s.key === c.key
                          ? { key: c.key, dir: s.dir === 1 ? -1 : 1 }
                          : { key: c.key, dir: 1 },
                      )
                    }
                    className={`label-11 h-7 cursor-pointer border-b border-line px-3 ${
                      c.numeric ? "text-right" : "text-left"
                    } ${sort.key === c.key ? "text-ink" : ""}`}
                  >
                    <span className="inline-flex items-center gap-1">
                      {c.label}
                      {sort.key === c.key ? (
                        <Icon
                          name={sort.dir === 1 ? "arrow-up" : "arrow-down"}
                          size={11}
                        />
                      ) : null}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => router.push(row.href)}
                  className="h-8 cursor-pointer border-b border-line transition-colors duration-[80ms] hover:bg-fill-2"
                >
                  {shown.map((c) => (
                    <td
                      key={c.key}
                      className={`px-3 ${c.numeric ? "text-right" : "text-left"}`}
                    >
                      {c.cell(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
