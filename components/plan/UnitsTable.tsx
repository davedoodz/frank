"use client";

import { typologyColor } from "@/lib/format";
import type { Unit } from "@/lib/types";

/**
 * The floor read as a list. Every row is the same selection as clicking the
 * outline on the plan, so the table and the drawing stay one state.
 */
export default function UnitsTable({
  units,
  selected,
  onSelect,
}: {
  units: Unit[];
  selected: Unit | null;
  onSelect: (number: string | null) => void;
}) {
  return (
    <table className="w-full table-fixed border-collapse">
      <colgroup>
        <col className="w-[66px]" />
        <col className="w-[52px]" />
        <col className="w-[48px]" />
        <col className="w-[56px]" />
        <col className="w-[40px]" />
        <col />
      </colgroup>
      <thead>
        <tr>
          {["unit", "type", "m²", "balc", "dir", "state"].map(
            (label, i) => (
              <th
                key={label}
                className={`label-11 h-7 border-b border-line px-2 ${
                  i >= 2 && i <= 3 ? "text-right" : "text-left"
                }`}
              >
                {label}
              </th>
            ),
          )}
        </tr>
      </thead>
      <tbody>
        {units.map((unit) => {
          const active = selected?.id === unit.id;
          return (
            <tr
              key={unit.id}
              onClick={() => onSelect(active ? null : unit.number)}
              className={`h-7 cursor-pointer border-b border-line transition-colors duration-[80ms] ${
                active ? "bg-ink text-paper" : "hover:bg-fill-2"
              }`}
            >
              <td className="px-2">
                <span className="flex items-center gap-1.5">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ background: typologyColor(unit.type_qc.value) }}
                  />
                  <span className="font-mono text-meta">{unit.number}</span>
                </span>
              </td>
              <td className="px-2 text-body">{unit.type_qc.value}</td>
              <td className="px-2 text-right font-mono text-meta tabular-nums">
                {unit.net_area_m2.value.toFixed(1)}
              </td>
              <td
                className={`px-2 text-right font-mono text-meta tabular-nums ${
                  active ? "" : "text-ink-2"
                }`}
              >
                {unit.balcony_area_m2.value?.toFixed(1) ?? "—"}
              </td>
              <td
                className={`px-2 font-mono text-meta ${active ? "" : "text-ink-2"}`}
              >
                {unit.orientation.value}
              </td>
              <td
                className={`px-2 font-mono text-meta ${
                  active ? "" : unit.status === "verified" ? "text-ink" : "text-ink-3"
                }`}
              >
                {unit.status}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
