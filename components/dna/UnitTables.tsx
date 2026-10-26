import { dimensions } from "@/components/dna/crop";
import { ft2 } from "@/lib/format";
import type { Floor, Room, Unit } from "@/lib/types";

/** Room areas as labelled on the sheet. French names stay as drawn. */
export function RoomTable({ unit, rooms }: { unit: Unit; rooms: Room[] }) {
  const named = rooms.reduce((s, r) => s + (r.area_m2 ?? 0), 0);
  const circulation = Math.round((unit.net_area_m2.value - named) * 10) / 10;

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-6">
      <table className="w-full">
        <thead>
          <tr className="border-b border-line">
            <th className="label-11 h-7 text-left">room</th>
            <th className="label-11 h-7 text-right">m²</th>
            <th className="label-11 h-7 text-right">ft²</th>
            <th className="label-11 h-7 text-right">share</th>
          </tr>
        </thead>
        <tbody>
          {rooms.map((room) => (
            <tr key={room.id} className="border-b border-line hover:bg-paper">
              <td className="h-7 text-body text-ink">{room.name}</td>
              <td className="h-7 text-right font-mono text-meta text-ink">
                {room.area_m2?.toFixed(1) ?? "—"}
              </td>
              <td className="h-7 text-right font-mono text-meta text-ink-2">
                {room.area_m2 === null ? "—" : ft2(room.area_m2)}
              </td>
              <td className="h-7 text-right font-mono text-meta text-ink-2">
                {room.area_m2 === null
                  ? "—"
                  : `${Math.round((room.area_m2 / unit.net_area_m2.value) * 100)}%`}
              </td>
            </tr>
          ))}
          <tr className="border-b border-line">
            <td className="h-7 text-body text-ink-2">circulation</td>
            <td className="h-7 text-right font-mono text-meta text-ink-2">
              {circulation.toFixed(1)}
            </td>
            <td className="h-7 text-right font-mono text-meta text-ink-3">
              {ft2(circulation)}
            </td>
            <td className="h-7 text-right font-mono text-meta text-ink-2">
              {Math.round((circulation / unit.net_area_m2.value) * 100)}%
            </td>
          </tr>
          <tr className="border-t border-ink">
            <td className="h-7 text-body text-ink">net area</td>
            <td className="h-7 text-right font-mono text-meta text-ink">
              {unit.net_area_m2.value.toFixed(1)}
            </td>
            <td className="h-7 text-right font-mono text-meta text-ink-2">
              {ft2(unit.net_area_m2.value)}
            </td>
            <td className="h-7 text-right font-mono text-meta text-ink-2">
              100%
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

/** Overall sizes, read off the outline and the sheet's px_per_m. */
export function DimensionTable({ unit, floor }: { unit: Unit; floor: Floor }) {
  const size = dimensions(unit, floor);
  const rows: [string, string][] = [
    ["overall width", `${size.w.toFixed(2)} m`],
    ["overall depth", `${size.h.toFixed(2)} m`],
    ["proportion", (Math.max(size.w, size.h) / Math.min(size.w, size.h)).toFixed(2)],
    ["perimeter", `${(2 * (size.w + size.h)).toFixed(2)} m`],
    [
      "outline area",
      unit.computed_area_m2 === null
        ? "—"
        : `${unit.computed_area_m2.toFixed(1)} m²`,
    ],
    ["net area", `${unit.net_area_m2.value.toFixed(1)} m²`],
    [
      "gross area",
      unit.gross_area_m2.value === null
        ? "—"
        : `${unit.gross_area_m2.value.toFixed(1)} m²`,
    ],
    [
      "balcony",
      unit.has_balcony.value
        ? `${unit.balcony_area_m2.value?.toFixed(1) ?? "—"} m²`
        : "none",
    ],
    ["drawing scale", floor.scale],
    ["pixels per metre", floor.px_per_m.toFixed(1)],
  ];

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-6">
      <table className="w-full">
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label} className="border-b border-line hover:bg-paper">
              <td className="h-7 text-body text-ink-2">{label}</td>
              <td className="h-7 text-right font-mono text-meta text-ink">
                {value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-4 max-w-[60ch] text-body text-ink-2">
        Overall sizes come from the traced outline and the sheet scale, not
        from a dimension string on the drawing. Treat them as approximate until
        the unit is verified.
      </p>
    </div>
  );
}
