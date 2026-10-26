"use client";

import Link from "next/link";
import Icon from "@/components/ui/Icon";
import { brLabel, typologyColor } from "@/lib/format";
import type { Unit } from "@/lib/types";

/**
 * Building navigation: every floor of the building, then the units of the
 * floor you are on. Picking a floor clears the unit selection; picking a unit
 * is the same selection the plan and the schedule carry.
 */
export default function LeftRail({
  code,
  level,
  rail,
  units,
  selected,
  onSelect,
}: {
  code: string;
  level: number;
  rail: { level: number; label: string; units: string[] }[];
  units: Unit[];
  selected: Unit | null;
  onSelect: (number: string | null) => void;
}) {
  const floorLabel = rail.find((f) => f.level === level)?.label ?? "";

  return (
    <nav className="panel flex w-[232px] shrink-0 flex-col overflow-y-auto">
      <div className="flex h-11 items-center justify-between px-4">
        <span className="text-[13px] font-semibold text-text">Building</span>
        <Icon name="chevron-down" size={14} className="text-text-3" />
      </div>

      <div className="px-2 pb-2">
        {rail.map((floor) => {
          const on = floor.level === level;
          return (
            <Link
              key={floor.level}
              href={`/p/${code}/units?floor=${floor.level}`}
              className={`flex h-9 items-center gap-2 rounded-lg px-2 text-[13px] transition-colors ${
                on
                  ? "bg-brand-soft font-medium text-brand"
                  : "text-text-2 hover:bg-app"
              }`}
            >
              <Icon name="file" size={14} className={on ? "" : "text-text-3"} />
              <span className="truncate">{floor.label}</span>
              <span className="flex-1" />
              <span className="text-[11px] text-text-3">
                {floor.units.length
                  ? `${floor.units.length} units`
                  : "—"}
              </span>
            </Link>
          );
        })}
      </div>

      <div className="mt-2 border-t border-edge-2 px-4 pt-3 pb-1">
        <span className="text-[13px] font-semibold text-text">
          Units ({floorLabel})
        </span>
      </div>

      <div className="px-2 pb-3">
        {units.map((unit) => {
          const on = selected?.id === unit.id;
          return (
            <button
              key={unit.id}
              type="button"
              onClick={() => onSelect(on ? null : unit.number)}
              className={`flex h-9 w-full items-center gap-2 rounded-lg px-2 text-left text-[13px] transition-colors ${
                on ? "bg-brand-soft font-medium text-text" : "hover:bg-app"
              }`}
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: typologyColor(unit.type_qc.value) }}
              />
              <span className="font-medium text-text">{unit.number}</span>
              <span className="text-text-2">{brLabel(unit.type_qc.value)}</span>
              <span className="flex-1" />
              <span className="text-[12px] text-text-2 tabular-nums">
                {unit.net_area_m2.value.toFixed(1)} m²
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
