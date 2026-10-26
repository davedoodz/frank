import { area as formatArea } from "@/lib/format";
import type { AreaUnit } from "@/lib/prefs";
import type { Floor, Project, Unit } from "@/lib/types";

/**
 * Building-wide facts, read at request time from the same rows the stack
 * below renders. No figure here is computed anywhere else.
 */
export default function BuildingSummary({
  project,
  floors,
  units,
  area,
}: {
  project: Project;
  floors: Floor[];
  units: Unit[];
  area: AreaUnit;
}) {
  const net = units.reduce((sum, u) => sum + u.net_area_m2.value, 0);
  const verified = units.filter((u) => u.status === "verified").length;
  const typologies = new Set(units.map((u) => u.type_qc.value)).size;

  const tiles: [string, string, string][] = [
    [`${floors.length}`, "étages indexés", `sur ${project.floors_count}`],
    [`${units.length}`, "unités", ""],
    [
      formatArea(net, area === "both" ? "m2" : area),
      "superficie nette totale",
      area === "both" ? formatArea(net, "ft2") : "",
    ],
    [
      units.length
        ? formatArea(net / units.length, area === "both" ? "m2" : area)
        : "—",
      "unité moyenne",
      "",
    ],
    [`${verified}`, "vérifiées", `sur ${units.length}`],
    [`${typologies}`, "typologies", ""],
  ];

  return (
    <section>
      <div className="label-11 mb-2">bâtiment</div>
      <div className="grid grid-cols-3 gap-px overflow-hidden rounded-lg bg-line sm:grid-cols-6">
        {tiles.map(([value, label, note]) => (
          <div key={label} className="bg-paper p-3">
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
  );
}
