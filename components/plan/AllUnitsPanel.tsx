import { TYPOLOGY_ORDER, ft2, typologyColor } from "@/lib/format";
import type { Floor, Unit } from "@/lib/types";

export default function AllUnitsPanel({
  units,
  floor,
}: {
  units: Unit[];
  floor: Floor;
}) {
  const net = units.reduce((sum, u) => sum + u.net_area_m2.value, 0);
  const types = TYPOLOGY_ORDER.filter((t) =>
    units.some((u) => u.type_qc.value === t),
  );

  return (
    <aside className="flex w-[360px] shrink-0 flex-col border-l border-line bg-paper">
      <div className="border-b border-line p-4">
        <div className="text-15 text-ink">all units</div>
        <div className="mono mt-1 text-11 text-ink-2">
          {floor.label} · {floor.sheet_number} · {floor.revision_date} ·{" "}
          {floor.source_file}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="label mb-2">typology</div>
        {types.map((type) => {
          const of = units.filter((u) => u.type_qc.value === type);
          const area = of.reduce((sum, u) => sum + u.net_area_m2.value, 0);
          return (
            <div key={type} className="mb-2 flex items-center gap-2">
              <span
                className="h-3 w-3 shrink-0"
                style={{ background: typologyColor(type) }}
              />
              <span className="w-12 text-13 text-ink">{type}</span>
              <span className="mono w-8 text-right text-11 text-ink">{of.length}</span>
              <span className="mono flex-1 text-right text-11 text-ink-2">
                {(area / of.length).toFixed(1)} m² avg
              </span>
            </div>
          );
        })}

        <div className="label mb-2 mt-6">floor</div>
        <div className="flex items-center justify-between py-1">
          <span className="text-13 text-ink">units</span>
          <span className="mono text-11">{units.length}</span>
        </div>
        <div className="flex items-center justify-between py-1">
          <span className="text-13 text-ink">verified</span>
          <span className="mono text-11">
            {units.filter((u) => u.status === "verified").length} / {units.length}
          </span>
        </div>
        <div className="flex items-center justify-between py-1">
          <span className="text-13 text-ink">net area</span>
          <span className="mono text-11">
            {net.toFixed(1)} m² <span className="text-ink-2">{ft2(net)} ft²</span>
          </span>
        </div>
        <div className="flex items-center justify-between py-1">
          <span className="text-13 text-ink">corner units</span>
          <span className="mono text-11">
            {units.filter((u) => u.is_corner.value).length}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 border-t border-line p-4 text-13 text-ink-3">
        <span className="tip" data-tip="round 3">
          find similar units
        </span>
        <span>·</span>
        <span className="tip" data-tip="round 2">
          edit
        </span>
      </div>
    </aside>
  );
}
