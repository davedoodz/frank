"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";
import type { Floor, Room, Unit } from "@/lib/types";
import AllUnitsPanel from "./AllUnitsPanel";
import LeftRail from "./LeftRail";
import PlanViewer from "./PlanViewer";
import UnitPanel from "./UnitPanel";
import { centroid } from "./geometry";

export default function PlanView({
  code,
  floor,
  units,
  selected,
  rooms,
  rail,
}: {
  code: string;
  floor: Floor;
  units: Unit[];
  selected: Unit | null;
  rooms: Room[];
  rail: { level: number; label: string; units: string[] }[];
}) {
  const router = useRouter();

  const select = useCallback(
    (number: string | null) => {
      const url = number
        ? `/p/${code}/units?floor=${floor.level}&u=${number}`
        : `/p/${code}/units?floor=${floor.level}`;
      router.replace(url, { scroll: false });
    },
    [code, floor.level, router],
  );

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
        return;
      }
      if (event.key === "Escape") {
        select(null);
        return;
      }
      const dirs: Record<string, [number, number]> = {
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
        ArrowUp: [0, -1],
        ArrowDown: [0, 1],
      };
      const dir = dirs[event.key];
      if (!dir) return;
      event.preventDefault();

      if (!selected) {
        if (units.length > 0) select(units[0].number);
        return;
      }
      const from = centroid(selected.outline);
      let best: { unit: Unit; cost: number } | null = null;
      for (const unit of units) {
        if (unit.id === selected.id) continue;
        const to = centroid(unit.outline);
        const dx = to[0] - from[0];
        const dy = to[1] - from[1];
        const along = dx * dir[0] + dy * dir[1];
        if (along <= 0.001) continue;
        const across = Math.abs(dx * dir[1] - dy * dir[0]);
        if (across > along * 2) continue;
        const cost = along + across * 2;
        if (!best || cost < best.cost) best = { unit, cost };
      }
      if (best) select(best.unit.number);
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, units, select]);

  return (
    <div className="flex min-h-0 flex-1">
      <LeftRail code={code} level={floor.level} selected={selected?.number ?? null} rail={rail} />

      <div className="flex min-w-0 flex-1 flex-col">
        {!selected ? <Summary units={units} /> : null}
        <PlanViewer
          floor={floor}
          units={units}
          selected={selected}
          onSelect={select}
          typologyFills={!selected}
        />
      </div>

      {selected ? (
        <UnitPanel unit={selected} floor={floor} code={code} rooms={rooms} />
      ) : (
        <AllUnitsPanel units={units} floor={floor} />
      )}
    </div>
  );
}

function Summary({ units }: { units: Unit[] }) {
  const verified = units.filter((u) => u.status === "verified").length;
  const net = units.reduce((sum, u) => sum + u.net_area_m2.value, 0);
  const figures: [string, string][] = [
    ["units", String(units.length)],
    ["verified", `${verified}`],
    ["net m²", net.toFixed(1)],
  ];

  return (
    <div className="flex h-16 shrink-0 items-center border-b border-line bg-surface">
      {figures.map(([label, value]) => (
        <div key={label} className="h-full border-r border-line px-4 py-3">
          <div className="font-mono text-title-lg text-ink">{value}</div>
          <div className="label-11">{label}</div>
        </div>
      ))}
      <Distribution units={units} />
    </div>
  );
}

function Distribution({ units }: { units: Unit[] }) {
  const counts = new Map<string, number>();
  for (const u of units) {
    counts.set(u.type_qc.value, (counts.get(u.type_qc.value) ?? 0) + 1);
  }
  return (
    <div className="flex h-full items-center gap-6 px-4 py-3">
      {[...counts.entries()].map(([type, count]) => (
        <div key={type}>
          <div className="font-mono text-title-lg text-ink">{count}</div>
          <div className="label-11">{type}</div>
        </div>
      ))}
    </div>
  );
}
