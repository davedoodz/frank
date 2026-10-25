"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { LOW_CONFIDENCE, ft2 } from "@/lib/format";

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

const cols: Col[] = [
  {
    key: "number",
    label: "unit",
    sort: (r) => r.number,
    cell: (r) => <span className="mono text-11 text-ink">{r.number}</span>,
    csv: (r) => r.number,
  },
  {
    key: "floor",
    label: "floor",
    sort: (r) => r.level,
    cell: (r) => <span className="text-13">{r.floor_label}</span>,
    csv: (r) => r.floor_label,
  },
  {
    key: "status",
    label: "status",
    sort: (r) => r.status,
    cell: (r) => <span className="mono text-11 text-ink-2">{r.status}</span>,
    csv: (r) => r.status,
  },
  {
    key: "type",
    label: "type",
    sort: (r) => r.type,
    cell: (r) => <span className="text-13">{r.type}</span>,
    conf: (r) => r.type_c,
    csv: (r) => r.type,
  },
  {
    key: "bedrooms",
    label: "bed",
    numeric: true,
    sort: (r) => r.bedrooms,
    cell: (r) => <span className="mono text-11">{r.bedrooms}</span>,
    conf: (r) => r.bedrooms_c,
    csv: (r) => r.bedrooms,
  },
  {
    key: "bathrooms",
    label: "bath",
    numeric: true,
    sort: (r) => r.bathrooms,
    cell: (r) => <span className="mono text-11">{r.bathrooms}</span>,
    conf: (r) => r.bathrooms_c,
    csv: (r) => r.bathrooms,
  },
  {
    key: "rooms",
    label: "rooms",
    numeric: true,
    sort: (r) => r.rooms ?? 0,
    cell: (r) => <span className="mono text-11">{r.rooms ?? "—"}</span>,
    conf: (r) => r.rooms_c,
    csv: (r) => r.rooms ?? "",
  },
  {
    key: "net",
    label: "net m²",
    numeric: true,
    sort: (r) => r.net,
    cell: (r) => <span className="mono text-11">{r.net.toFixed(1)}</span>,
    conf: (r) => r.net_c,
    csv: (r) => r.net.toFixed(1),
  },
  {
    key: "net_ft",
    label: "net ft²",
    numeric: true,
    sort: (r) => r.net,
    cell: (r) => <span className="mono text-11 text-ink-2">{ft2(r.net)}</span>,
    csv: (r) => ft2(r.net),
  },
  {
    key: "gross",
    label: "gross m²",
    numeric: true,
    sort: (r) => r.gross ?? 0,
    cell: (r) => (
      <span className="mono text-11">{r.gross === null ? "—" : r.gross.toFixed(1)}</span>
    ),
    conf: (r) => r.gross_c,
    csv: (r) => (r.gross === null ? "" : r.gross.toFixed(1)),
  },
  {
    key: "orientation",
    label: "orient",
    sort: (r) => r.orientation,
    cell: (r) => <span className="mono text-11">{r.orientation}</span>,
    conf: (r) => r.orientation_c,
    csv: (r) => r.orientation,
  },
  {
    key: "corner",
    label: "corner",
    sort: (r) => String(r.corner),
    cell: (r) => <span className="text-13">{r.corner ? "yes" : "no"}</span>,
    conf: (r) => r.corner_c,
    csv: (r) => (r.corner ? "yes" : "no"),
  },
  {
    key: "balcony",
    label: "balcony",
    sort: (r) => String(r.balcony),
    cell: (r) => <span className="text-13">{r.balcony ? "yes" : "no"}</span>,
    conf: (r) => r.balcony_c,
    csv: (r) => (r.balcony ? "yes" : "no"),
  },
  {
    key: "balcony_area",
    label: "balcony m²",
    numeric: true,
    sort: (r) => r.balcony_area ?? 0,
    cell: (r) => (
      <span className="mono text-11">
        {r.balcony_area === null ? "—" : r.balcony_area.toFixed(1)}
      </span>
    ),
    conf: (r) => r.balcony_area_c,
    csv: (r) => (r.balcony_area === null ? "" : r.balcony_area.toFixed(1)),
  },
  {
    key: "sheet",
    label: "sheet",
    sort: (r) => r.sheet,
    cell: (r) => <span className="mono text-11 text-ink-2">{r.sheet}</span>,
    csv: (r) => r.sheet,
  },
  {
    key: "revision",
    label: "revision",
    sort: (r) => r.revision,
    cell: (r) => <span className="mono text-11 text-ink-2">{r.revision}</span>,
    csv: (r) => r.revision,
  },
];

const FACETS = ["floor", "type", "bedrooms", "balcony", "status", "review"] as const;
type Facet = (typeof FACETS)[number];

function facetValue(row: ScheduleRow, facet: Facet): string {
  switch (facet) {
    case "floor":
      return row.floor_label;
    case "type":
      return row.type;
    case "bedrooms":
      return `${row.bedrooms} bed`;
    case "balcony":
      return row.balcony ? "balcony" : "no balcony";
    case "status":
      return row.status;
    case "review":
      return needsReview(row) ? "needs review" : "clear";
  }
}

function needsReview(row: ScheduleRow): boolean {
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
  ].some((c) => c < LOW_CONFIDENCE);
}

export default function ScheduleTable({
  code,
  rows,
}: {
  code: string;
  rows: ScheduleRow[];
}) {
  const router = useRouter();
  const [active, setActive] = useState<Record<string, Set<string>>>({});
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 }>({
    key: "number",
    dir: 1,
  });

  const filtered = useMemo(
    () =>
      rows.filter((row) =>
        FACETS.every((facet) => {
          const set = active[facet];
          return !set || set.size === 0 || set.has(facetValue(row, facet));
        }),
      ),
    [rows, active],
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
  }, [filtered, sort]);

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
    ["units", String(filtered.length)],
    ["verified", String(filtered.filter((r) => r.status === "verified").length)],
    ["studio", String(filtered.filter((r) => r.type === "studio").length)],
    ["3½", String(filtered.filter((r) => r.type === "3½").length)],
    ["4½", String(filtered.filter((r) => r.type === "4½").length)],
    ["5½", String(filtered.filter((r) => r.type === "5½").length)],
    ["net m²", totalNet.toFixed(1)],
  ];

  const chips = FACETS.flatMap((facet) => {
    const counts = new Map<string, number>();
    for (const row of rows) {
      const value = facetValue(row, facet);
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
    const values = [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    return values
      .filter(([value]) => facet !== "review" || value === "needs review")
      .map(([value, count]) => ({ facet, value, count }));
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex h-16 shrink-0 items-center border-b border-line bg-paper">
        {figures.map(([label, value]) => (
          <div key={label} className="border-r border-line px-4">
            <div className="mono text-20 text-ink">{value}</div>
            <div className="label">{label}</div>
          </div>
        ))}
        <div className="flex-1" />
        <button type="button" onClick={exportCsv} className="px-4 text-13 text-ink">
          export csv
        </button>
      </div>

      <div className="flex h-10 shrink-0 items-center gap-2 overflow-x-auto border-b border-line bg-paper px-4">
        {chips.map((chip) => {
          const on = active[chip.facet]?.has(chip.value) ?? false;
          return (
            <button
              key={`${chip.facet}:${chip.value}`}
              type="button"
              onClick={() => toggle(chip.facet, chip.value)}
              className={`flex h-6 shrink-0 items-center gap-1 border px-2 text-13 ${
                on ? "border-accent text-accent" : "border-line text-ink-2"
              } ${chip.count === 0 ? "text-ink-3" : ""}`}
            >
              {chip.value}
              <span className="mono text-11">· {chip.count}</span>
            </button>
          );
        })}
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
                  className={`label h-7 cursor-pointer border-b border-line px-3 ${
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
            {groups.map((group) => (
              <FloorGroup
                key={group.label}
                group={group}
                onOpen={(row) =>
                  router.push(`/p/${code}/units?floor=${row.level}&u=${row.number}`)
                }
              />
            ))}
            <tr className="h-7 border-t border-ink">
              <td className="px-3 text-13 text-ink">project total</td>
              <td className="mono px-3 text-11">{filtered.length}</td>
              {cols.slice(2).map((c) => (
                <td key={c.key} className="px-3 text-right">
                  {c.key === "net" ? (
                    <span className="mono text-11 text-ink">{totalNet.toFixed(1)}</span>
                  ) : c.key === "net_ft" ? (
                    <span className="mono text-11 text-ink-2">{ft2(totalNet)}</span>
                  ) : null}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
        {filtered.length === 0 ? (
          <div className="px-3 py-3 text-13 text-ink-3">no match</div>
        ) : null}
      </div>
    </div>
  );
}

function FloorGroup({
  group,
  onOpen,
}: {
  group: { label: string; rows: ScheduleRow[] };
  onOpen: (row: ScheduleRow) => void;
}) {
  const net = group.rows.reduce((sum, r) => sum + r.net, 0);

  return (
    <>
      <tr className="h-8 bg-surface">
        <td className="px-3 text-13 text-ink" colSpan={7}>
          {group.label}
        </td>
        <td className="mono px-3 text-right text-11 text-ink">{net.toFixed(1)}</td>
        <td className="mono px-3 text-right text-11 text-ink-2">{ft2(net)}</td>
        <td className="label px-3 text-right" colSpan={cols.length - 9}>
          {group.rows.length} units
        </td>
      </tr>
      {group.rows.map((row) => (
        <tr
          key={row.id}
          onClick={() => onOpen(row)}
          className="h-7 cursor-pointer border-b border-line hover:bg-paper"
        >
          {cols.map((c) => {
            const conf = c.conf?.(row);
            const low = conf !== undefined && conf < LOW_CONFIDENCE;
            return (
              <td
                key={c.key}
                className={`px-3 ${c.numeric ? "text-right" : "text-left"}`}
              >
                <span className={low ? "low-conf" : ""}>{c.cell(row)}</span>
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}
