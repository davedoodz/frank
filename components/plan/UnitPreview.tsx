"use client";

import Link from "next/link";
import PlanCrop from "@/components/dna/PlanCrop";
import Icon from "@/components/ui/Icon";
import { BTN, BTN_DARK } from "@/components/ui/Button";
import { bedroomLabel } from "@/lib/format";
import type { Floor, Unit } from "@/lib/types";

const ORIENTATION: Record<string, string> = {
  N: "Nord",
  S: "Sud",
  E: "Est",
  W: "Ouest",
  NE: "Nord-Est",
  NW: "Nord-Ouest",
  SE: "Sud-Est",
  SW: "Sud-Ouest",
};

/**
 * The hovering summary under the schedule: enough of the unit to decide
 * whether to open it, and the two ways out.
 */
export default function UnitPreview({
  unit,
  floor,
  code,
  onOpen,
}: {
  unit: Unit;
  floor: Floor;
  code: string;
  onOpen: () => void;
}) {
  const verified = unit.status === "verified";
  const rows: [string, string][] = [
    ["Superficie", `${unit.net_area_m2.value.toFixed(1)} m²`],
    [
      "Balcon",
      unit.balcony_area_m2.value === null
        ? "—"
        : `${unit.balcony_area_m2.value.toFixed(1)} m²`,
    ],
    ["Orientation", ORIENTATION[unit.orientation.value] ?? unit.orientation.value],
    ["Étage", floor.label],
    ["Position", unit.is_corner.value ? "Unité de coin" : "Unité d’extrémité"],
  ];

  return (
    <section className="panel flex shrink-0 flex-col p-4">
      <div className="flex items-center gap-3">
        <span className="h-12 w-16 shrink-0 overflow-hidden rounded-md border border-edge-2">
          <PlanCrop unit={unit} floor={floor} aspect={4 / 3} margin={0.08} />
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[17px] font-semibold text-text">
              Unité {unit.number}
            </span>
            <span
              className={`inline-flex h-5 items-center gap-1 rounded-full px-2 text-[11px] font-medium ${
                verified ? "bg-ok-soft text-ok" : "bg-app text-text-2 ring-1 ring-edge"
              }`}
            >
              {verified ? <Icon name="check" size={11} /> : null}
              {verified ? "Vérifiée" : "Non vérifiée"}
            </span>
          </div>
          <div className="text-[12px] text-text-2">
            {bedroomLabel(unit.type_qc.value)} ·{" "}
            {unit.net_area_m2.value.toFixed(1)} m² · {floor.label}
          </div>
        </div>
      </div>

      <div className="mt-3">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="flex items-center justify-between border-b border-edge-2 py-1.5 last:border-0"
          >
            <span className="text-[13px] text-text-2">{label}</span>
            <span className="text-[13px] font-medium text-text">{value}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button type="button" onClick={onOpen} className={`${BTN} justify-center`}>
          <Icon name="external" size={14} />
          Voir l’unité complète
        </button>
        <Link
          href={`/sim/autocad/retrieve?unit=${unit.id}&code=${encodeURIComponent(code)}`}
          className={BTN_DARK}
        >
          <Icon name="cad" size={14} />
          Ouvrir dans AutoCAD
        </Link>
      </div>
    </section>
  );
}
