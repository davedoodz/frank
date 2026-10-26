"use client";

import Icon from "@/components/ui/Icon";
import { BTN } from "@/components/ui/Button";
import { brLabel, ft2, typologyColor } from "@/lib/format";
import type { Floor, Unit } from "@/lib/types";

const ORIENTATION: Record<string, string> = {
  N: "Nord",
  S: "Sud",
  E: "Est",
  W: "Ouest",
  NE: "NE",
  NW: "NW",
  SE: "SE",
  SW: "SW",
};

const COLUMNS: [string, "left" | "right"][] = [
  ["Unité", "left"],
  ["Type", "left"],
  ["m²", "right"],
  ["ft²", "right"],
  ["Orient.", "left"],
  ["État", "left"],
];

/**
 * The floor read as a table. A row is the same selection as the outline on
 * the plan, so the schedule and the drawing stay one state.
 */
export default function UnitsTable({
  floor,
  units,
  selected,
  onSelect,
  onExport,
}: {
  floor: Floor;
  units: Unit[];
  selected: Unit | null;
  onSelect: (number: string | null) => void;
  onExport: string;
}) {
  return (
    <section className="panel flex shrink-0 flex-col">
      <div className="flex h-14 items-center gap-2 px-4">
        <h2 className="truncate text-[15px] font-semibold text-text">
          Tableau des unités — {floor.label}
        </h2>
        <span className="flex-1" />
        <a href={onExport} className={BTN}>
          <Icon name="export" size={14} />
          Exporter
        </a>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr className="border-y border-edge-2 bg-app/60">
            {COLUMNS.map(([label, align]) => (
              <th
                key={label}
                className={`cap h-9 px-2 font-normal ${
                  align === "right" ? "text-right" : "text-left"
                }`}
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {units.map((unit) => {
            const on = selected?.id === unit.id;
            return (
              <tr
                key={unit.id}
                onClick={() => onSelect(on ? null : unit.number)}
                className={`h-9 cursor-pointer border-b border-edge-2 text-[13px] transition-colors last:border-0 ${
                  on ? "bg-brand-soft" : "hover:bg-app"
                }`}
              >
                <td className="px-2">
                  <span className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ background: typologyColor(unit.type_qc.value) }}
                    />
                    <span
                      className="font-medium text-text"
                    >
                      {unit.number}
                    </span>
                  </span>
                </td>
                <td className="px-2 whitespace-nowrap text-text-2">
                  {brLabel(unit.type_qc.value)}
                </td>
                <td className="px-2 text-right text-text tabular-nums">
                  {unit.net_area_m2.value.toFixed(1)}
                </td>
                <td className="px-2 text-right text-text-2 tabular-nums">
                  {ft2(unit.net_area_m2.value)}
                </td>
                <td className="px-2 whitespace-nowrap text-text-2">
                  {ORIENTATION[unit.orientation.value] ?? unit.orientation.value}
                </td>
                <td className="px-2">
                  <span
                    className={`inline-flex items-center gap-1 whitespace-nowrap text-[12px] ${
                      unit.status === "verified" ? "text-ok" : "text-text-3"
                    }`}
                  >
                    {unit.status === "verified" ? (
                      <Icon name="check" size={12} />
                    ) : null}
                    {unit.status === "verified" ? "Vérifiée" : "Non vérifiée"}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
