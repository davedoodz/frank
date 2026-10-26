"use client";

import { useState } from "react";
import MassingStage from "@/components/sim/MassingStage";
import SketchUpChrome from "@/components/sim/SketchUpChrome";
import Icon from "@/components/ui/Icon";
import { syncLevels } from "@/app/sim/sketchup/actions";
import type { MassingModel } from "@/lib/types";

type FloorRow = { level: number; label: string };

/**
 * Flow D step 02, simulated SketchUp: map geometry groups to building levels.
 * fitte proposes an assignment where a group names a level the project has
 * indexed; everything else is assigned by hand after selecting the geometry.
 * The selected band is outlined in SketchUp's selection blue.
 */
export default function LevelMapper({
  code,
  model,
  floors,
  assigned,
}: {
  code: string;
  model: MassingModel;
  floors: FloorRow[];
  /** Levels already synced for this project. */
  assigned: number[];
}) {
  const indexed = new Set(floors.map((f) => f.level));
  const mappable = model.groups.filter(
    (g) => g.level !== null && indexed.has(g.level),
  );

  const [levels, setLevels] = useState<number[]>(assigned);
  const [group, setGroup] = useState<string | null>(
    mappable[0]?.name ?? model.groups[0]?.name ?? null,
  );
  const [target, setTarget] = useState<number>(
    mappable[0]?.level ?? floors[0]?.level ?? 1,
  );

  const current = model.groups.find((g) => g.name === group) ?? null;
  const pending = levels.includes(target) ? [] : [target];

  function assign() {
    setLevels((rows) => (rows.includes(target) ? rows : [...rows, target]));
  }

  function propose() {
    setLevels(
      mappable
        .map((g) => g.level)
        .filter((level): level is number => level !== null),
    );
  }

  function drop(level: number) {
    setLevels((rows) => rows.filter((l) => l !== level));
  }

  return (
    <SketchUpChrome
      title={`${model.model_ref} — SketchUp Pro 2024`}
      status={
        current
          ? `Select objects: 1 group selected · ${current.name}`
          : "Select objects: 0 selected"
      }
      measurement={current ? `Niveau ${String(target).padStart(2, "0")}` : ""}
      tray={
        <form action={syncLevels} className="text-[13px] text-text">
          <input type="hidden" name="code" value={code} />
          <input type="hidden" name="model_ref" value={model.model_ref} />

          <div className="text-[15px] font-semibold">Associer les étages du bâtiment</div>
          <p className="mt-1 text-[12px] text-text-2">
            fitte enregistre la bande de géométrie extérieure qui appartient à
            un étage. Il ne crée pas d’unités à l’intérieur de la volumétrie.
          </p>

          <button
            type="button"
            onClick={propose}
            className="mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-edge bg-panel text-[13px] font-medium transition-colors hover:bg-app"
          >
            <Icon name="layers" size={14} />
            Proposer une association ({mappable.length})
          </button>

          <div className="mt-4 text-[11px] tracking-[0.02em] text-text-3">
            GÉOMÉTRIE DU MODÈLE
          </div>
          <div className="mt-1 overflow-hidden rounded-lg border border-edge bg-panel">
            {model.groups.map((g) => (
              <button
                key={g.name}
                type="button"
                onClick={() => {
                  setGroup(g.name);
                  if (g.level !== null && indexed.has(g.level)) setTarget(g.level);
                }}
                className={`flex w-full items-center gap-2 border-b border-edge-2 px-2.5 py-2 text-left text-[12px] last:border-0 transition-colors ${
                  group === g.name ? "bg-brand-soft text-brand" : "hover:bg-app"
                }`}
              >
                <Icon name="cube" size={13} />
                <span className="min-w-0 flex-1 truncate font-mono">
                  {g.name}
                </span>
                {g.level !== null && levels.includes(g.level) ? (
                  <Icon name="check" size={13} />
                ) : null}
              </button>
            ))}
          </div>

          <div className="mt-3 flex items-center gap-2">
            <label className="flex h-9 flex-1 items-center gap-2 rounded-lg border border-edge bg-panel px-2.5">
              <select
                value={target}
                onChange={(e) => setTarget(Number(e.target.value))}
                aria-label="Étage à associer"
                className="select-pill w-full bg-transparent pr-5 text-[13px] font-medium outline-none"
              >
                {floors.map((f) => (
                  <option key={f.level} value={f.level}>
                    {f.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={assign}
              className="flex h-9 items-center rounded-lg border border-edge bg-panel px-3 text-[13px] font-medium transition-colors hover:bg-app"
            >
              Associer
            </button>
          </div>

          <div className="mt-4 text-[11px] tracking-[0.02em] text-text-3">
            ÉTAGES ASSOCIÉS
          </div>
          {levels.length === 0 ? (
            <p className="mt-1 text-[12px] text-text-2">
              Aucun étage associé pour l’instant.
            </p>
          ) : (
            <div className="mt-1 overflow-hidden rounded-lg border border-edge bg-panel">
              {[...levels]
                .sort((a, b) => a - b)
                .map((level) => {
                  const floor = floors.find((f) => f.level === level);
                  return (
                    <div
                      key={level}
                      className="flex items-center gap-2 border-b border-edge-2 px-2.5 py-2 text-[12px] last:border-0"
                    >
                      <input type="hidden" name="level" value={level} />
                      <span className="h-2 w-2 rounded-full bg-[#4A90E2]" />
                      <span className="flex-1 truncate">
                        {floor?.label ?? `Étage ${level}`}
                      </span>
                      <button
                        type="button"
                        onClick={() => drop(level)}
                        aria-label={`Retirer l’étage ${level}`}
                        className="text-text-3 transition-colors hover:text-text"
                      >
                        <Icon name="close" size={12} />
                      </button>
                    </div>
                  );
                })}
            </div>
          )}

          <button
            type="submit"
            disabled={levels.length === 0}
            className="mt-4 flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-brand text-[13px] font-medium text-white transition-colors hover:bg-brand-2 disabled:opacity-50"
          >
            <Icon name="external" size={14} />
            Synchroniser le contexte du bâtiment
          </button>
        </form>
      }
    >
      <MassingStage model={model} highlight={levels} pending={pending} />
    </SketchUpChrome>
  );
}
