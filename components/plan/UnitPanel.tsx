import { LOW_CONFIDENCE, ft2 } from "@/lib/format";
import type { Floor, Room, Unit } from "@/lib/types";

type Row = {
  label: string;
  value: React.ReactNode;
  confidence?: number;
};

export default function UnitPanel({
  unit,
  floor,
  code,
  rooms,
}: {
  unit: Unit;
  floor: Floor;
  code: string;
  rooms: Room[];
}) {
  const rows: Row[] = [
    { label: "type", value: unit.type_qc.value, confidence: unit.type_qc.confidence },
    { label: "bedrooms", value: unit.bedrooms.value, confidence: unit.bedrooms.confidence },
    { label: "bathrooms", value: unit.bathrooms.value, confidence: unit.bathrooms.confidence },
    {
      label: "rooms",
      value: unit.rooms_count.value ?? (rooms.length || "—"),
      confidence: unit.rooms_count.confidence,
    },
    {
      label: "net area",
      value: (
        <>
          <span className="mono">{unit.net_area_m2.value.toFixed(1)} m²</span>{" "}
          <span className="mono text-ink-2">{ft2(unit.net_area_m2.value)} ft²</span>
        </>
      ),
      confidence: unit.net_area_m2.confidence,
    },
    {
      label: "gross area",
      value:
        unit.gross_area_m2.value === null ? (
          "—"
        ) : (
          <>
            <span className="mono">{unit.gross_area_m2.value.toFixed(1)} m²</span>{" "}
            <span className="mono text-ink-2">{ft2(unit.gross_area_m2.value)} ft²</span>
          </>
        ),
      confidence: unit.gross_area_m2.confidence,
    },
    {
      label: "balcony",
      value: unit.has_balcony.value
        ? `yes · ${unit.balcony_area_m2.value?.toFixed(1) ?? "—"} m²`
        : "no",
      confidence: unit.has_balcony.confidence,
    },
    { label: "floor", value: floor.label },
    { label: "orientation", value: unit.orientation.value, confidence: unit.orientation.confidence },
    { label: "corner", value: unit.is_corner.value ? "yes" : "no", confidence: unit.is_corner.confidence },
    { label: "sheet", value: <span className="mono">{floor.sheet_number}</span> },
    { label: "revision", value: <span className="mono">{floor.revision_date}</span> },
    { label: "source file", value: <span className="mono">{floor.source_file}</span> },
    { label: "project", value: <span className="mono">{code}</span> },
  ];

  return (
    <aside className="flex w-[360px] shrink-0 flex-col border-l border-line bg-paper">
      <div className="border-b border-line p-4">
        <div className="flex items-baseline gap-2">
          <span className="mono text-20 text-ink">{unit.number}</span>
          <span className="text-13 text-ink">{unit.type_qc.value}</span>
          <span className="flex-1" />
          <span className="mono text-11 text-ink-2">{unit.status}</span>
        </div>
        <div className="mono mt-1 text-11 text-ink-2">
          {floor.label} · {floor.sheet_number} · {floor.revision_date} ·{" "}
          {floor.source_file}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {rows.map((row) => {
          const low = row.confidence !== undefined && row.confidence < LOW_CONFIDENCE;
          return (
            <div key={row.label} className="mb-4">
              <div className="label">{row.label}</div>
              <div
                className={`tip mt-1 inline-block text-13 ${low ? "low-conf" : "text-ink"}`}
                data-tip={row.confidence !== undefined ? row.confidence.toFixed(2) : undefined}
              >
                {row.value}
              </div>
            </div>
          );
        })}
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
