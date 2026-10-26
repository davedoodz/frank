import { dimensions } from "@/components/dna/crop";
import { ft2 } from "@/lib/format";
import type { Floor, Room, Unit } from "@/lib/types";

/** Room areas as labelled on the sheet. French names stay as drawn. */
export function RoomTable({ unit, rooms }: { unit: Unit; rooms: Room[] }) {
  const named = rooms.reduce((s, r) => s + (r.area_m2 ?? 0), 0);
  const circulation = Math.round((unit.net_area_m2.value - named) * 10) / 10;

  return (
    <div className="p-6">
      <table className="w-full">
        <thead>
          <tr className="border-b border-edge-2">
            <th className="h-8 text-left text-[12px] font-medium text-text-2">Pièce</th>
            <th className="h-8 text-right text-[12px] font-medium text-text-2">m²</th>
            <th className="h-8 text-right text-[12px] font-medium text-text-2">pi²</th>
            <th className="h-8 text-right text-[12px] font-medium text-text-2">Part</th>
          </tr>
        </thead>
        <tbody>
          {rooms.map((room) => (
            <tr key={room.id} className="border-b border-edge-2">
              <td className="h-8 text-[13px] text-text">{room.name}</td>
              <td className="h-8 text-right font-mono text-[12px] text-text">
                {room.area_m2?.toFixed(1) ?? "—"}
              </td>
              <td className="h-8 text-right font-mono text-[12px] text-text-2">
                {room.area_m2 === null ? "—" : ft2(room.area_m2)}
              </td>
              <td className="h-8 text-right font-mono text-[12px] text-text-2">
                {room.area_m2 === null
                  ? "—"
                  : `${Math.round((room.area_m2 / unit.net_area_m2.value) * 100)}%`}
              </td>
            </tr>
          ))}
          <tr className="border-b border-edge-2">
            <td className="h-8 text-[13px] text-text-2">Circulation</td>
            <td className="h-8 text-right font-mono text-[12px] text-text-2">
              {circulation.toFixed(1)}
            </td>
            <td className="h-8 text-right font-mono text-[12px] text-text-3">
              {ft2(circulation)}
            </td>
            <td className="h-8 text-right font-mono text-[12px] text-text-2">
              {Math.round((circulation / unit.net_area_m2.value) * 100)}%
            </td>
          </tr>
          <tr className="border-t border-text">
            <td className="h-8 text-[13px] font-medium text-text">Superficie nette</td>
            <td className="h-8 text-right font-mono text-[12px] font-medium text-text">
              {unit.net_area_m2.value.toFixed(1)}
            </td>
            <td className="h-8 text-right font-mono text-[12px] text-text-2">
              {ft2(unit.net_area_m2.value)}
            </td>
            <td className="h-8 text-right font-mono text-[12px] text-text-2">100%</td>
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
    ["Largeur hors tout", `${size.w.toFixed(2)} m`],
    ["Profondeur hors tout", `${size.h.toFixed(2)} m`],
    ["Proportion", (Math.max(size.w, size.h) / Math.min(size.w, size.h)).toFixed(2)],
    ["Périmètre", `${(2 * (size.w + size.h)).toFixed(2)} m`],
    [
      "Superficie du contour",
      unit.computed_area_m2 === null
        ? "—"
        : `${unit.computed_area_m2.toFixed(1)} m²`,
    ],
    ["Superficie nette", `${unit.net_area_m2.value.toFixed(1)} m²`],
    [
      "Superficie brute",
      unit.gross_area_m2.value === null
        ? "—"
        : `${unit.gross_area_m2.value.toFixed(1)} m²`,
    ],
    [
      "Balcon",
      unit.has_balcony.value
        ? `${unit.balcony_area_m2.value?.toFixed(1) ?? "—"} m²`
        : "Aucun",
    ],
    ["Échelle du dessin", floor.scale],
    ["Pixels par mètre", floor.px_per_m.toFixed(1)],
  ];

  return (
    <div className="p-6">
      <table className="w-full">
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label} className="border-b border-edge-2">
              <td className="h-8 text-[13px] text-text-2">{label}</td>
              <td className="h-8 text-right font-mono text-[12px] text-text">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-4 max-w-[60ch] text-[12px] text-text-3">
        Les dimensions hors tout proviennent du contour tracé et de l’échelle
        de la feuille, et non d’une cote inscrite sur le dessin. Considérez-les
        comme approximatives tant que l’unité n’est pas vérifiée.
      </p>
    </div>
  );
}
