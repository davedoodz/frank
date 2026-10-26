"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ACTION } from "@/components/ui/Action";
import { Chip } from "@/components/ui/Chip";
import Icon from "@/components/ui/Icon";
import { ft2 } from "@/lib/format";
import type { AreaUnit, Prefs } from "@/lib/prefs";

export type ScheduleRow = {
  id: string;
  number: string;
  level: number;
  floor_label: string;
  sheet: string;
  revision: string;
  status: string;
  type: string;
  type_c: number;
  bedrooms: number;
  bedrooms_c: number;
  bathrooms: number;
  bathrooms_c: number;
  rooms: number | null;
  rooms_c: number;
  net: number;
  net_c: number;
  gross: number | null;
  gross_c: number;
  orientation: string;
  orientation_c: number;
  corner: boolean;
  corner_c: number;
  balcony: boolean;
  balcony_c: number;
  balcony_area: number | null;
  balcony_area_c: number;
};

type Col = {
  key: string;
  label: string;
  numeric?: boolean;
  sort: (r: ScheduleRow) => string | number;
  cell: (r: ScheduleRow) => React.ReactNode;
  conf?: (r: ScheduleRow) => number;
  csv: (r: ScheduleRow) => string | number;
};

function buildCols(areaUnit: AreaUnit): Col[] {
  const netCols: Col[] =
    areaUnit === "ft2"
      ? [
          {
            key: "net_ft",
            label: "net ft²",
            numeric: true,
            sort: (r) => r.net,
            cell: (r) => <span className="font-mono text-meta">{ft2(r.net)}</span>,
            conf: (r) => r.net_c,
            csv: (r) => ft2(r.net),
          },
        ]
      : areaUnit === "m2"
        ? [
            {
              key: "net",
              label: "net m²",
              numeric: true,
              sort: (r) => r.net,
              cell: (r) => (
                <span className="font-mono text-meta">{r.net.toFixed(1)}</span>
              ),
              conf: (r) => r.net_c,
              csv: (r) => r.net.toFixed(1),
            },
          ]
        : [
            {
              key: "net",
              label: "net m²",
              numeric: true,
              sort: (r) => r.net,
              cell: (r) => (
                <span className="font-mono text-meta">{r.net.toFixed(1)}</span>
              ),
              conf: (r) => r.net_c,
              csv: (r) => r.net.toFixed(1),
            },
            {
              key: "net_ft",
              label: "net ft²",
              numeric: true,
              sort: (r) => r.net,
              cell: (r) => (
                <span className="font-mono text-meta text-ink-3">{ft2(r.net)}</span>
              ),
              csv: (r) => ft2(r.net),
            },
          ];

  const grossCol: Col =
    areaUnit === "ft2"
      ? {
          key: "gross",
          label: "brute ft²",
          numeric: true,
          sort: (r) => r.gross ?? 0,
          cell: (r) => (
            <span className="font-mono text-meta">
              {r.gross === null ? "—" : ft2(r.gross)}
            </span>
          ),
          conf: (r) => r.gross_c,
          csv: (r) => (r.gross === null ? "" : ft2(r.gross)),
        }
      : {
          key: "gross",
          label: "brute m²",
          numeric: true,
          sort: (r) => r.gross ?? 0,
          cell: (r) => (
            <span className="font-mono text-meta">
              {r.gross === null ? "—" : r.gross.toFixed(1)}
            </span>
          ),
          conf: (r) => r.gross_c,
          csv: (r) => (r.gross === null ? "" : r.gross.toFixed(1)),
        };

  return [
    {
      key: "number",
      label: "unité",
      sort: (r) => r.number,
      cell: (r) => <span className="font-mono text-meta text-ink">{r.number}</span>,
      csv: (r) => r.number,
    },
    {
      key: "floor",
      label: "étage",
      sort: (r) => r.level,
      cell: (r) => <span className="text-body whitespace-nowrap">{r.floor_label}</span>,
      csv: (r) => r.floor_label,
    },
    {
      key: "status",
      label: "statut",
      sort: (r) => r.status,
      cell: (r) => (
        <span className="font-mono text-meta text-ink-3 whitespace-nowrap">
          {r.status === "verified" ? "vérifiée" : "non vérifiée"}
        </span>
      ),
      csv: (r) => (r.status === "verified" ? "vérifiée" : "non vérifiée"),
    },
    {
      key: "type",
      label: "type",
      sort: (r) => r.type,
      cell: (r) => <span className="text-body">{r.type}</span>,
      conf: (r) => r.type_c,
      csv: (r) => r.type,
    },
    {
      key: "bedrooms",
      label: "ch",
      numeric: true,
      sort: (r) => r.bedrooms,
      cell: (r) => <span className="font-mono text-meta">{r.bedrooms}</span>,
      conf: (r) => r.bedrooms_c,
      csv: (r) => r.bedrooms,
    },
    {
      key: "bathrooms",
      label: "sdb",
      numeric: true,
      sort: (r) => r.bathrooms,
      cell: (r) => <span className="font-mono text-meta">{r.bathrooms}</span>,
      conf: (r) => r.bathrooms_c,
      csv: (r) => r.bathrooms,
    },
    {
      key: "rooms",
      label: "pièces",
      numeric: true,
      sort: (r) => r.rooms ?? 0,
      cell: (r) => <span className="font-mono text-meta">{r.rooms ?? "—"}</span>,
      conf: (r) => r.rooms_c,
      csv: (r) => r.rooms ?? "",
    },
    ...netCols,
    grossCol,
    {
      key: "orientation",
      label: "orient.",
      sort: (r) => r.orientation,
      cell: (r) => <span className="font-mono text-meta">{r.orientation}</span>,
      conf: (r) => r.orientation_c,
      csv: (r) => r.orientation,
    },
    {
      key: "corner",
      label: "coin",
      sort: (r) => String(r.corner),
      cell: (r) => <span className="text-body">{r.corner ? "oui" : "non"}</span>,
      conf: (r) => r.corner_c,
      csv: (r) => (r.corner ? "oui" : "non"),
    },
    {
      key: "balcony",
      label: "balcon",
      sort: (r) => String(r.balcony),
      cell: (r) => <span className="text-body">{r.balcony ? "oui" : "non"}</span>,
      conf: (r) => r.balcony_c,
      csv: (r) => (r.balcony ? "oui" : "non"),
    },
    {
      key: "balcony_area",
      label: "balcon m²",
      numeric: true,
      sort: (r) => r.balcony_area ?? 0,
      cell: (r) => (
        <span className="font-mono text-meta">
          {r.balcony_area === null ? "—" : r.balcony_area.toFixed(1)}
        </span>
      ),
      conf: (r) => r.balcony_area_c,
      csv: (r) => (r.balcony_area === null ? "" : r.balcony_area.toFixed(1)),
    },
    {
      key: "sheet",
      label: "feuille",
      sort: (r) => r.sheet,
      cell: (r) => <span className="font-mono text-meta text-ink-3">{r.sheet}</span>,
      csv: (r) => r.sheet,
    },
    {
      key: "revision",
      label: "révision",
      sort: (r) => r.revision,
      cell: (r) => <span className="font-mono text-meta text-ink-3">{r.revision}</span>,
      csv: (r) => r.revision,
    },
  ];
}

const FACETS = ["floor", "type", "bedrooms", "balcony", "status", "review"] as const;
type Facet = (typeof FACETS)[number];

function facetValue(row: ScheduleRow, facet: Facet, lowConfidence: number): string {
  switch (facet) {
    case "floor":
      return row.floor_label;
    case "type":
      return row.type;
    case "bedrooms":
      return `${row.bedrooms} ch`;
    case "balcony":
      return row.balcony ? "balcon" : "sans balcon";
    case "status":
      return row.status === "verified" ? "vérifiée" : "non vérifiée";
    case "review":
      return needsReview(row, lowConfidence) ? "à réviser" : "conforme";
  }
}

function needsReview(row: ScheduleRow, lowConfidence: number): boolean {
  return [
    row.type_c,
    row.bedrooms_c,
    row.bathrooms_c,
    row.rooms_c,
    row.net_c,
    row.gross_c,
    row.orientation_c,
    row.corner_c,
    row.balcony_c,
    row.balcony_area_c,
  ].some((c) => c < lowConfidence);
}

export default function ScheduleTable({
  code,
  rows,
  prefs,
}: {
  code: string;
  rows: ScheduleRow[];
  prefs: Prefs;
}) {
  const router = useRouter();
  const [active, setActive] = useState<Record<string, Set<string>>>({});
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 }>({
    key: "number",
    dir: 1,
  });

  const lowConfidence = prefs.lowConfidence;
  const cols = useMemo(() => buildCols(prefs.area), [prefs.area]);
  const rowH = prefs.density === "dense" ? "h-6" : "h-7";
  const groupH = prefs.density === "dense" ? "h-7" : "h-8";

  const filtered = useMemo(
    () =>
      rows.filter((row) =>
        FACETS.every((facet) => {
          const set = active[facet];
          return !set || set.size === 0 || set.has(facetValue(row, facet, lowConfidence));
        }),
      ),
    [rows, active, lowConfidence],
  );

  const groups = useMemo(() => {
    const col = cols.find((c) => c.key === sort.key) ?? cols[0];
    const byFloor = new Map<string, ScheduleRow[]>();
    for (const row of filtered) {
      const list = byFloor.get(row.floor_label) ?? [];
      list.push(row);
      byFloor.set(row.floor_label, list);
    }
    return [...byFloor.entries()]
      .sort((a, b) => b[1][0].level - a[1][0].level)
      .map(([label, list]) => ({
        label,
        rows: [...list].sort((x, y) => {
          const xv = col.sort(x);
          const yv = col.sort(y);
          return typeof xv === "number" && typeof yv === "number"
            ? (xv - yv) * sort.dir
            : String(xv).localeCompare(String(yv)) * sort.dir;
        }),
      }));
  }, [filtered, sort, cols]);

  function toggle(facet: Facet, value: string) {
    setActive((state) => {
      const set = new Set(state[facet] ?? []);
      if (set.has(value)) set.delete(value);
      else set.add(value);
      return { ...state, [facet]: set };
    });
  }

  function exportCsv() {
    const header = cols.map((c) => c.label).join(",");
    const body = filtered
      .map((row) => cols.map((c) => `"${String(c.csv(row))}"`).join(","))
      .join("\n");
    const blob = new Blob([`${header}\n${body}\n`], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${code}_unit_schedule.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const totalNet = filtered.reduce((sum, r) => sum + r.net, 0);
  const figures: [string, string][] = [
    ["unités", String(filtered.length)],
    ["vérifiées", String(filtered.filter((r) => r.status === "verified").length)],
    ["studio", String(filtered.filter((r) => r.type === "studio").length)],
    ["3½", String(filtered.filter((r) => r.type === "3½").length)],
    ["4½", String(filtered.filter((r) => r.type === "4½").length)],
    ["5½", String(filtered.filter((r) => r.type === "5½").length)],
    ["net m²", totalNet.toFixed(1)],
  ];

  // counts follow the other facets, so a chip shows what it would leave
  const chips = FACETS.flatMap((facet) =>
    [
      ...new Set(
        rows
          .map((row) => facetValue(row, facet, lowConfidence))
          .filter((value) => facet !== "review" || value === "needs review"),
      ),
    ]
      .sort((a, b) => a.localeCompare(b))
      .map((value) => ({
        facet,
        value,
        count: rows.filter(
          (row) =>
            facetValue(row, facet, lowConfidence) === value &&
            FACETS.every((other) => {
              if (other === facet) return true;
              const set = active[other];
              return !set || set.size === 0 || set.has(facetValue(row, other, lowConfidence));
            }),
        ).length,
      })),
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex h-16 shrink-0 items-center border-b border-line bg-surface">
        {figures.map(([label, value]) => (
          <div key={label} className="h-full border-r border-line px-4 py-3">
            <div className="font-mono text-title-lg text-ink">{value}</div>
            <div className="label-11">{label}</div>
          </div>
        ))}
        <div className="flex-1" />
        <div className="px-3">
          <button type="button" onClick={exportCsv} className={ACTION}>
            exporter csv
          </button>
        </div>
      </div>

      <div className="flex h-10 shrink-0 items-center gap-1 overflow-x-auto border-b border-line bg-surface px-3">
        {chips.map((chip) => (
          <Chip
            key={`${chip.facet}:${chip.value}`}
            label={chip.value}
            count={chip.count}
            active={active[chip.facet]?.has(chip.value) ?? false}
            onClick={() => toggle(chip.facet, chip.value)}
          />
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="sticky top-0 z-10 bg-surface">
              {cols.map((c) => (
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
            {groups.map((group) => (
              <FloorGroup
                key={group.label}
                group={group}
                cols={cols}
                lowConfidence={lowConfidence}
                rowH={rowH}
                groupH={groupH}
                onOpen={(row) =>
                  router.push(`/p/${code}/units?floor=${row.level}&u=${row.number}`)
                }
              />
            ))}
            <tr className={`${rowH} border-t border-ink`}>
              <td className="px-3 text-body text-ink">total du projet</td>
              <td className="px-3 font-mono text-meta">{filtered.length}</td>
              {cols.slice(2).map((c) => (
                <td key={c.key} className="px-3 text-right">
                  {c.key === "net" ? (
                    <span className="font-mono text-meta text-ink">
                      {totalNet.toFixed(1)}
                    </span>
                  ) : c.key === "net_ft" ? (
                    <span className="font-mono text-meta text-ink-3">
                      {ft2(totalNet)}
                    </span>
                  ) : null}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
        {filtered.length === 0 ? (
          <div className="px-3 py-4 text-meta text-ink-2">aucune unité ne correspond</div>
        ) : null}
      </div>
    </div>
  );
}

function FloorGroup({
  group,
  cols,
  lowConfidence,
  rowH,
  groupH,
  onOpen,
}: {
  group: { label: string; rows: ScheduleRow[] };
  cols: Col[];
  lowConfidence: number;
  rowH: string;
  groupH: string;
  onOpen: (row: ScheduleRow) => void;
}) {
  const net = group.rows.reduce((sum, r) => sum + r.net, 0);
  const netCols = cols.filter((c) => c.key === "net" || c.key === "net_ft");
  const labelSpan = cols.length - 7 - netCols.length;

  return (
    <>
      <tr className={`${groupH} bg-fill-2`}>
        <td className="px-3 text-body text-ink" colSpan={7}>
          {group.label}
        </td>
        {netCols.map((c) => (
          <td
            key={c.key}
            className={`px-3 text-right font-mono text-meta ${
              c.key === "net" ? "text-ink" : "text-ink-3"
            }`}
          >
            {c.key === "net" ? net.toFixed(1) : ft2(net)}
          </td>
        ))}
        <td className="label-11 px-3 text-right" colSpan={labelSpan}>
          {group.rows.length} unités
        </td>
      </tr>
      {group.rows.map((row) => (
        <tr
          key={row.id}
          onClick={() => onOpen(row)}
          className={`${rowH} cursor-pointer border-b border-line transition-colors duration-[80ms] hover:bg-fill-2`}
        >
          {cols.map((c) => {
            const conf = c.conf?.(row);
            const low = conf !== undefined && conf < lowConfidence;
            return (
              <td
                key={c.key}
                className={`px-3 ${c.numeric ? "text-right" : "text-left"}`}
              >
                <span className={low ? "low-confidence" : ""}>{c.cell(row)}</span>
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}
