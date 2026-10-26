import { ft2 } from "@/lib/format";
import type { Room, Unit } from "@/lib/types";

/**
 * The rooms of the selected unit, as the drawing labels them. Names stay in
 * French because that is what is printed on the sheet; areas are indexed, not
 * measured here, so a room without an area reads as a dash.
 */
export default function RoomsStrip({
  unit,
  rooms,
}: {
  unit: Unit;
  rooms: Room[];
}) {
  const total = rooms.reduce((sum, r) => sum + (r.area_m2 ?? 0), 0);

  return (
    <section className="panel shrink-0 px-4 py-3">
      <div className="flex items-center gap-2">
        <h2 className="text-[13px] font-semibold text-text">
          Pièces ({rooms.length})
        </h2>
        <span className="text-[12px] text-text-3">
          Unité {unit.number} · telle qu’indiquée sur la feuille
        </span>
      </div>
      {rooms.length === 0 ? (
        <p className="mt-2 text-[13px] text-text-2">
          Aucune pièce n’a été extraite pour cette unité.
        </p>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          {rooms.map((room) => {
            const share =
              total > 0 && room.area_m2
                ? Math.round((room.area_m2 / total) * 100)
                : null;
            return (
              <div
                key={room.id}
                className="min-w-[132px] flex-1 rounded-lg border border-edge-2 px-3 py-2"
              >
                <div className="truncate text-[13px] font-medium text-text">
                  {room.name}
                </div>
                <div className="mt-0.5 text-[13px] text-text tabular-nums">
                  {room.area_m2 === null ? "—" : `${room.area_m2.toFixed(1)} m²`}
                </div>
                <div className="text-[11px] text-text-3 tabular-nums">
                  {room.area_m2 === null ? "aucune superficie" : `${ft2(room.area_m2)} ft²`}
                  {share === null ? "" : ` · ${share}\u00a0%`}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
