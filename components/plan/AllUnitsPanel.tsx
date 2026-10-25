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

  const facts: [string, React.ReactNode][] = [
    ["units", units.length],
    [
      "verified",
      `${units.filter((u) => u.status === "verified").length} / ${units.length}`,
    ],
    [
      "net area",
      <>
        {net.toFixed(1)} m² <span className="text-ink-3">{ft2(net)} ft²</span>
      </>,
    ],
    ["corner units", units.filter((u) => u.is_corner.value).length],
  ];

  return (
    <aside className="flex w-[360px] shrink-0 flex-col border-l border-line bg-paper">
      <div className="border-b border-line p-4">
        <div className="text-title text-ink">all units</div>
        <div className="mt-1 font-mono text-meta text-ink-3">
          {floor.label} · {floor.sheet_number} · {floor.revision_date} ·{" "}
          {floor.source_file}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="label-11 mb-2">typology</div>
        {types.map((type) => {
          const of = units.filter((u) => u.type_qc.value === type);
          const area = of.reduce((sum, u) => sum + u.net_area_m2.value, 0);
          return (
            <div key={type} className="flex h-6 items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0"
                style={{ background: typologyColor(type) }}
              />
              <span className="w-12 text-body text-ink">{type}</span>
              <span className="w-8 text-right font-mono text-meta text-ink">
                {of.length}
              </span>
              <span className="flex-1 text-right font-mono text-meta text-ink-3">
                {(area / of.length).toFixed(1)} m² avg
              </span>
            </div>
          );
        })}

        <div className="label-11 mt-6 mb-2">floor</div>
        {facts.map(([label, value]) => (
          <div key={label} className="flex h-6 items-center justify-between">
            <span className="text-body text-ink">{label}</span>
            <span className="font-mono text-meta text-ink">{value}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 border-t border-line p-4 text-body text-ink-3">
        <span>find similar units</span>
        <span>·</span>
        <span>edit</span>
      </div>
    </aside>
  );
}
