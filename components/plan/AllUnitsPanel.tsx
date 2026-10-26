import Icon from "@/components/ui/Icon";
import { TYPOLOGY_ORDER, brLabel, typologyColor } from "@/lib/format";
import type { Unit } from "@/lib/types";

/**
 * The floor in numbers: how many units, how much area, and the typology
 * split. Every figure is counted from the indexed units, nothing is entered.
 */
export default function FloorMetrics({ units }: { units: Unit[] }) {
  const net = units.reduce((sum, u) => sum + u.net_area_m2.value, 0);
  const types = TYPOLOGY_ORDER.filter((t) =>
    units.some((u) => u.type_qc.value === t),
  );

  return (
    <section className="panel flex shrink-0 items-stretch">
      <Figure value={String(units.length)} label="Unités" />
      <Figure
        value={`${net.toFixed(1)} m²`}
        label="Superficie totale de l’étage"
        hint="Somme des superficies nettes indexées"
      />
      <Figure
        value={`${units.length ? (net / units.length).toFixed(1) : "0.0"} m²`}
        label="Unité moyenne"
      />

      <div className="flex min-w-0 flex-1 items-center gap-6 px-5 py-4">
        <div className="min-w-0">
          <div className="cap">Types d’unités</div>
          <div className="mt-2 flex flex-wrap items-center gap-5">
            {types.map((type) => {
              const count = units.filter((u) => u.type_qc.value === type).length;
              return (
                <div key={type} className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: typologyColor(type) }}
                  />
                  <span className="text-[13px] font-medium text-text">
                    {brLabel(type)}
                  </span>
                  <span className="text-[12px] text-text-2">
                    {count} unités ({Math.round((count / units.length) * 100)}&nbsp;%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function Figure({
  value,
  label,
  hint,
}: {
  value: string;
  label: string;
  hint?: string;
}) {
  return (
    <div className="shrink-0 border-r border-edge-2 px-5 py-4">
      <div className="text-[22px] font-semibold tracking-tight text-text tabular-nums">
        {value}
      </div>
      <div className="mt-0.5 flex items-center gap-1 text-[12px] text-text-2">
        {label}
        {hint ? (
          <span title={hint} className="text-text-3">
            <Icon name="info" size={12} />
          </span>
        ) : null}
      </div>
    </div>
  );
}

/** The colour key under the drawing. */
export function TypologyLegend({ units }: { units: Unit[] }) {
  const types = TYPOLOGY_ORDER.filter((t) =>
    units.some((u) => u.type_qc.value === t),
  );

  return (
    <div className="flex items-center justify-center gap-6 border-t border-edge-2 py-2.5">
      {types.map((type) => (
        <span key={type} className="flex items-center gap-2 text-[12px] text-text-2">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ background: typologyColor(type) }}
          />
          {brLabel(type)}
        </span>
      ))}
      <span className="flex items-center gap-2 text-[12px] text-text-2">
        <span className="h-2.5 w-2.5 rounded-full bg-ty-common" />
        Aire commune
      </span>
    </div>
  );
}
