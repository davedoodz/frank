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
          <span className="font-mono">{unit.net_area_m2.value.toFixed(1)} m²</span>{" "}
          <span className="font-mono text-ink-3">{ft2(unit.net_area_m2.value)} ft²</span>
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
            <span className="font-mono">{unit.gross_area_m2.value.toFixed(1)} m²</span>{" "}
            <span className="font-mono text-ink-3">{ft2(unit.gross_area_m2.value)} ft²</span>
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
    { label: "sheet", value: <span className="font-mono">{floor.sheet_number}</span> },
    { label: "revision", value: <span className="font-mono">{floor.revision_date}</span> },
    { label: "source file", value: <span className="font-mono">{floor.source_file}</span> },
    { label: "project", value: <span className="font-mono">{code}</span> },
  ];

  return (
    <>
      <div className="border-b border-line p-4">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-title-lg text-ink">{unit.number}</span>
          <span className="text-body text-ink">{unit.type_qc.value}</span>
          <span className="flex-1" />
          <span className="font-mono text-meta text-ink-2">{unit.status}</span>
        </div>
        <div className="mt-1 font-mono text-meta text-ink-3">
          {floor.label} · {floor.sheet_number} · {floor.revision_date} ·{" "}
          {floor.source_file}
        </div>
      </div>

      <div className="p-4">
        {rows.map((row) => (
          <PanelRow key={row.label} {...row} />
        ))}
      </div>

      <div className="flex items-center gap-2 border-t border-line p-4 text-body text-ink-3">
        <Disabled label="find similar units" round="round 3" />
        <span>·</span>
        <Disabled label="edit" round="round 2" />
      </div>
    </>
  );
}

/** Label 11 uppercase, value 13, confidence on hover of a low value. */
function PanelRow({ label, value, confidence }: Row) {
  const low = confidence !== undefined && confidence < LOW_CONFIDENCE;

  return (
    <div className="mb-4">
      <div className="label-11">{label}</div>
      <div className="mt-1 text-body">
        {low ? (
          <span className="group relative inline-block">
            <span className="low-confidence">{value}</span>
            <span className="pointer-events-none absolute left-full ml-2 hidden font-mono text-meta text-ink-3 group-hover:inline">
              {confidence.toFixed(2)}
            </span>
          </span>
        ) : (
          <span className="text-ink">{value}</span>
        )}
      </div>
    </div>
  );
}

function Disabled({ label, round }: { label: string; round: string }) {
  return (
    <span className="group relative">
      {label}
      <span className="pointer-events-none absolute bottom-full left-0 mb-1 hidden font-mono text-meta text-ink-3 group-hover:inline">
        {round}
      </span>
    </span>
  );
}
