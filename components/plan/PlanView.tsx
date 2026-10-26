"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import FloorMetrics, { TypologyLegend } from "./AllUnitsPanel";
import LeftRail from "./LeftRail";
import MassingViewer from "./MassingViewer";
import PlanViewer from "./PlanViewer";
import RoomsStrip from "./RoomsStrip";
import UnitPanel from "./UnitPanel";
import UnitPreview from "./UnitPreview";
import UnitsTable from "./UnitsTable";
import { centroid } from "./geometry";
import OpenInCadDialog from "@/components/plan/OpenInCadDialog";
import Icon from "@/components/ui/Icon";
import { BTN, BTN_ON } from "@/components/ui/Button";
import { TYPOLOGY_ORDER, brLabel } from "@/lib/format";
import type { Prefs } from "@/lib/prefs";
import type { Floor, MassingModel, Room, Unit } from "@/lib/types";

/**
 * The floor, three ways at once: where you are in the building, the drawing,
 * and the unit you picked. Selection lives in the URL, so the plan, the rail
 * and the schedule are never out of step, and a link can land on a unit.
 */
export default function PlanView({
  code,
  floor,
  units,
  selected,
  rooms,
  rail,
  prefs,
  massing,
  levelsMapped,
  view,
}: {
  code: string;
  floor: Floor;
  units: Unit[];
  selected: Unit | null;
  rooms: Room[];
  rail: { level: number; label: string; units: string[] }[];
  prefs: Prefs;
  massing: MassingModel | null;
  /** A BuildingLevelMap row exists for this floor. */
  levelsMapped: boolean;
  view: "2d" | "3d";
}) {
  const router = useRouter();
  const [typology, setTypology] = useState<string>("all");
  const [showLabels, setShowLabels] = useState(false);

  const href = useCallback(
    (level: number, number: string | null, next: "2d" | "3d") => {
      const query = new URLSearchParams({ floor: String(level) });
      if (number) query.set("u", number);
      if (next === "3d") query.set("view", "3d");
      return `/p/${code}/units?${query.toString()}`;
    },
    [code],
  );

  const select = useCallback(
    (number: string | null) => {
      router.replace(href(floor.level, number, view), { scroll: false });
    },
    [floor.level, href, router, view],
  );

  const setView = useCallback(
    (next: "2d" | "3d") => {
      router.replace(href(floor.level, selected?.number ?? null, next), {
        scroll: false,
      });
    },
    [floor.level, href, router, selected],
  );

  const setLevel = useCallback(
    (level: number) => {
      router.replace(href(level, null, view), { scroll: false });
    },
    [href, router, view],
  );

  const step = useCallback(
    (direction: -1 | 1) => {
      if (units.length === 0) return;
      const at = units.findIndex((u) => u.id === selected?.id);
      const next = (at + direction + units.length) % units.length;
      select(units[next].number);
    },
    [selected, units, select],
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

  const types = TYPOLOGY_ORDER.filter((t) =>
    units.some((u) => u.type_qc.value === t),
  );
  const shown =
    typology === "all" ? units : units.filter((u) => u.type_qc.value === typology);

  return (
    <div className="flex min-h-0 flex-1 gap-4 px-6 pb-6">
      <LeftRail
        code={code}
        level={floor.level}
        rail={rail}
        units={units}
        selected={selected}
        onSelect={select}
      />

      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <div className="flex shrink-0 items-center gap-3">
          <div className="min-w-0">
            <h1 className="text-[22px] font-semibold tracking-tight text-text">
              {floor.label}
            </h1>
            <p className="truncate text-[13px] text-text-2">
              Plan résidentiel · {units.length} unités
            </p>
          </div>
          <span className="flex-1" />
          {selected ? (
            <OpenInCadDialog
              code={code}
              unit={selected}
              floor={floor}
              className={BTN}
            />
          ) : null}
          <Link href={`/p/${code}/schedule`} className={BTN}>
            <Icon name="table" size={14} />
            Tableau des unités
          </Link>
          <Link href={`/p/${code}/building`} className={BTN}>
            <Icon name="cube" size={14} />
            Contexte 3D
          </Link>
        </div>

        {massing ? (
          <div className="flex shrink-0 justify-center">
            <div className="flex items-center gap-1 rounded-xl border border-edge bg-panel p-1">
              {([["2d", "Plan d’étage 2D"], ["3d", "Contexte 3D du bâtiment"]] as const).map(
                ([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setView(key)}
                    aria-pressed={view === key}
                    className={`flex h-8 items-center rounded-lg px-4 text-[13px] font-medium transition-colors ${
                      view === key
                        ? "bg-brand text-white"
                        : "text-text-2 hover:bg-app hover:text-text"
                    }`}
                  >
                    {label}
                  </button>
                ),
              )}
            </div>
          </div>
        ) : null}

        {selected ? null : <FloorMetrics units={units} />}

        <div
          className={`grid min-h-0 flex-1 gap-4 [&>*]:min-w-0 ${
            view === "3d" && massing ? "grid-cols-2" : "grid-cols-1"
          }`}
        >
          <PlanViewer
            floor={floor}
            units={shown}
            selected={selected}
            onSelect={select}
            typologyFills={prefs.typologyFills}
            showLabels={showLabels}
            toolbar={
              <>
                <label className="flex h-9 items-center gap-2 rounded-lg border border-edge px-2.5 text-[13px] text-text-2">
                  Typologie
                  <select
                    value={typology}
                    onChange={(e) => setTypology(e.target.value)}
                    aria-label="Filtre de typologie"
                    className="bg-transparent text-[13px] font-medium text-text outline-none"
                  >
                    <option value="all">Tous les types</option>
                    {types.map((type) => (
                      <option key={type} value={type}>
                        {brLabel(type)} ({type})
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  onClick={() => setShowLabels((v) => !v)}
                  aria-pressed={showLabels}
                  className={showLabels ? BTN_ON : BTN}
                >
                  <Icon name="label" size={14} />
                  Afficher les étiquettes
                </button>
              </>
            }
          />

          {view === "3d" && massing ? (
            <MassingViewer
              model={massing}
              levels={rail.map((r) => ({ level: r.level, label: r.label }))}
              level={floor.level}
              onLevel={setLevel}
              unitNumber={selected?.number ?? null}
              mapped={levelsMapped}
              code={code}
            />
          ) : null}
        </div>

        {selected ? (
          <RoomsStrip unit={selected} rooms={rooms} />
        ) : (
          <div className="panel shrink-0">
            <TypologyLegend units={units} />
          </div>
        )}
      </div>

      <aside className="flex w-[380px] shrink-0 flex-col gap-4 overflow-y-auto">
        {selected ? (
          <UnitPanel
            unit={selected}
            floor={floor}
            code={code}
            rooms={rooms}
            onStep={step}
          />
        ) : (
          <>
            <UnitsTable
              floor={floor}
              units={shown}
              selected={selected}
              onSelect={select}
              onExport={`/p/${code}/schedule`}
            />
            {units[0] ? (
              <UnitPreview
                unit={units[0]}
                floor={floor}
                code={code}
                onOpen={() => select(units[0].number)}
              />
            ) : null}
          </>
        )}
      </aside>
    </div>
  );
}
