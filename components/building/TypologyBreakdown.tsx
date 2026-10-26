import { TYPOLOGY_ORDER, area as formatArea, typologyColor } from "@/lib/format";
import type { AreaUnit } from "@/lib/prefs";
import type { Unit } from "@/lib/types";

/**
 * Every typology present in the building, in the fixed PRD order, with its
 * count, its share of all units, and its average net area.
 */
export default function TypologyBreakdown({
  units,
  area: unit,
}: {
  units: Unit[];
  area: AreaUnit;
}) {
  const total = units.length;
  const types = TYPOLOGY_ORDER.filter((t) =>
    units.some((u) => u.type_qc.value === t),
  );

  return (
    <section>
      <div className="label-11 mb-2">répartition par typologie</div>
      <div className="divide-y divide-line rounded-lg border border-line">
        {types.map((type) => {
          const of = units.filter((u) => u.type_qc.value === type);
          const area = of.reduce((sum, u) => sum + u.net_area_m2.value, 0);
          const share = total ? (of.length / total) * 100 : 0;
          return (
            <div key={type} className="flex h-8 items-center gap-3 px-3">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: typologyColor(type) }}
              />
              <span className="w-10 shrink-0 text-body text-ink">{type}</span>
              <span className="w-10 shrink-0 text-right font-mono text-meta text-ink">
                {of.length}
              </span>
              <span className="w-14 shrink-0 text-right font-mono text-meta text-ink-2">
                {share.toFixed(0)}%
              </span>
              <span className="flex-1 text-right font-mono text-meta text-ink-3">
                {formatArea(area / of.length, unit === "both" ? "m2" : unit)} moy.
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
