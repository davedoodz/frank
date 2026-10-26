import Link from "next/link";
import { TYPOLOGY_ORDER, area as formatArea, typologyColor } from "@/lib/format";
import type { AreaUnit } from "@/lib/prefs";
import type { Floor, Unit } from "@/lib/types";

type FloorRow = { floor: Floor; units: Unit[] };

/**
 * The building read as a stack: highest level first (floors arrive already
 * sorted that way from getFloors). Each row is a real link into the plan for
 * that level. The mix bar is flat segments inside one rounded shell, sized by
 * each typology's share of the floor's units — plain divs, no chart library.
 */
export default function FloorStack({
  code,
  floorRows,
  area,
}: {
  code: string;
  floorRows: FloorRow[];
  area: AreaUnit;
}) {
  const present = TYPOLOGY_ORDER.filter((t) =>
    floorRows.some((r) => r.units.some((u) => u.type_qc.value === t)),
  );

  return (
    <section>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="label-11">étages</div>
        <div className="flex flex-wrap items-center gap-3">
          {present.map((type) => (
            <span
              key={type}
              className="flex items-center gap-1.5 text-meta text-ink-2"
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: typologyColor(type) }}
              />
              {type}
            </span>
          ))}
        </div>
      </div>

      <div className="divide-y divide-line overflow-hidden rounded-lg border border-line">
        {floorRows.map(({ floor, units }) => {
          const net = units.reduce((sum, u) => sum + u.net_area_m2.value, 0);
          const types = TYPOLOGY_ORDER.filter((t) =>
            units.some((u) => u.type_qc.value === t),
          );
          const segments = types.map((type) => ({
            type,
            pct:
              (units.filter((u) => u.type_qc.value === type).length /
                Math.max(units.length, 1)) *
              100,
          }));

          return (
            <Link
              key={floor.id}
              href={`/p/${code}/units?floor=${floor.level}`}
              className="flex items-center gap-4 p-3 transition-colors duration-[80ms] hover:bg-fill-2"
            >
              <div className="w-36 shrink-0">
                <div className="text-body text-ink">{floor.label}</div>
                <div className="font-mono text-meta whitespace-nowrap text-ink-3">
                  {floor.sheet_number} · {floor.revision_date}
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex h-2 w-full overflow-hidden rounded-full bg-fill-2">
                  {segments.map((seg) => (
                    <div
                      key={seg.type}
                      style={{
                        width: `${seg.pct}%`,
                        backgroundColor: typologyColor(seg.type),
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="w-32 shrink-0 text-right">
                <div className="font-mono text-body text-ink">
                  {units.length} unités
                </div>
                <div className="font-mono text-meta text-ink-3">
                  {formatArea(net, area === "both" ? "m2" : area)}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
