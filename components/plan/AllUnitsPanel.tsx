import { TYPOLOGY_ORDER, ft2, typologyColor } from "@/lib/format";
import type { Floor, Unit } from "@/lib/types";

/**
 * The no-selection state of a floor: counted facts first, then the typology
 * split, then the drawing the floor was read from.
 */
export default function AllUnitsPanel({
  units,
  floor,
}: {
  units: Unit[];
  floor: Floor;
}) {
  const net = units.reduce((sum, u) => sum + u.net_area_m2.value, 0);
  const balconies = units.filter((u) => u.balcony_area_m2.value !== null);
  const balconyArea = balconies.reduce(
    (sum, u) => sum + (u.balcony_area_m2.value ?? 0),
    0,
  );
  const facings = [...new Set(units.map((u) => u.orientation.value))];
  const types = TYPOLOGY_ORDER.filter((t) =>
    units.some((u) => u.type_qc.value === t),
  );

  const tiles: [string, string, string][] = [
    [String(units.length), "units", ""],
    [
      `${units.filter((u) => u.status === "verified").length}`,
      "verified",
      `of ${units.length}`,
    ],
    [`${units.filter((u) => u.is_corner.value).length}`, "corner units", ""],
    [`${net.toFixed(1)} m²`, "net area", `${ft2(net)} ft²`],
    [`${(net / units.length).toFixed(1)} m²`, "average unit", ""],
    [
      balconies.length
        ? `${(balconyArea / balconies.length).toFixed(1)} m²`
        : "—",
      "average balcony",
      balconies.length ? `${balconies.length} units` : "none",
    ],
    [String(facings.length), "orientations", facings.join(" · ")],
  ];

  return (
    <>
      <section className="border-b border-line p-4">
        <div className="label-11 mb-2">floor statistics</div>
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-line">
          {tiles.map(([value, label, note], i) => (
            <div
              key={label}
              className={`bg-paper p-3 ${
                i === tiles.length - 1 && tiles.length % 2 === 1
                  ? "col-span-2"
                  : ""
              }`}
            >
              <div className="font-mono text-title text-ink tabular-nums">
                {value}
              </div>
              <div className="text-body text-ink-2">{label}</div>
              {note ? (
                <div className="font-mono text-meta text-ink-3">{note}</div>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className="border-b border-line p-4">
        <div className="label-11 mb-2">typology</div>
        {types.map((type) => {
          const of = units.filter((u) => u.type_qc.value === type);
          const area = of.reduce((sum, u) => sum + u.net_area_m2.value, 0);
          return (
            <div key={type} className="flex h-6 items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
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
      </section>

      <SourceFile floor={floor} />
    </>
  );
}

export function SourceFile({ floor }: { floor: Floor }) {
  return (
    <section className="p-4">
      <div className="label-11 mb-2">source file</div>
      <div className="flex items-start gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-fill-2 font-mono text-meta text-ink-3">
          dwg
        </span>
        <div className="min-w-0">
          <div className="truncate font-mono text-meta text-ink">
            {floor.source_file}
          </div>
          <div className="font-mono text-meta text-ink-3">
            {floor.sheet_number} · {floor.label} · {floor.revision_date}
          </div>
        </div>
      </div>
    </section>
  );
}
