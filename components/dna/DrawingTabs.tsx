"use client";

import { useState } from "react";
import CropViewer from "@/components/dna/CropViewer";
import { DimensionTable, RoomTable } from "@/components/dna/UnitTables";
import Icon from "@/components/ui/Icon";
import { BTN_ICON } from "@/components/ui/Button";
import type { Floor, Room, Unit } from "@/lib/types";

const ZOOM_STEPS = [1, 1.5, 2, 3, 4];

type Tab = "plan" | "rooms" | "dimensions" | "3d";

const TABS: [Tab, string][] = [
  ["plan", "Plan d’étage"],
  ["rooms", "Superficies des pièces"],
  ["dimensions", "Dimensions"],
  ["3d", "Contexte 3D"],
];

/**
 * The centre panel: four readings of the same archived drawing, and the
 * AutoCAD-style model/layout footer that never changes underneath them. The
 * zoom chrome belongs to the plan reading only; the other tabs leave it blank.
 */
export default function DrawingTabs({
  unit,
  floor,
  rooms,
}: {
  unit: Unit;
  floor: Floor;
  rooms: Room[];
}) {
  const [tab, setTab] = useState<Tab>("plan");
  const [zoomStep, setZoomStep] = useState(0);
  const [outline, setOutline] = useState(true);

  return (
    <div className="panel flex min-w-0 flex-1 flex-col overflow-hidden">
      <nav className="flex h-12 shrink-0 items-center gap-5 border-b border-edge px-4">
        {TABS.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`relative flex h-12 items-center text-[13px] font-medium transition-colors ${
              tab === key ? "text-text" : "text-text-2 hover:text-text"
            }`}
          >
            {label}
            {tab === key ? (
              <span className="absolute inset-x-0 -bottom-px h-0.5 bg-brand" />
            ) : null}
          </button>
        ))}

        <span className="flex-1" />

        {tab === "plan" ? (
          <div className="flex items-center gap-1 rounded-lg border border-edge bg-panel p-1">
            <button
              type="button"
              aria-label="Zoom arrière"
              onClick={() => setZoomStep((s) => Math.max(0, s - 1))}
              className="flex h-7 w-7 items-center justify-center rounded-md text-text-2 transition-colors hover:bg-app hover:text-text"
            >
              <Icon name="zoom" size={14} />
            </button>
            <span className="w-10 text-center text-[12px] text-text-2 tabular-nums">
              {Math.round(ZOOM_STEPS[zoomStep] * 100)}%
            </span>
            <button
              type="button"
              aria-label="Zoom avant"
              onClick={() => setZoomStep((s) => Math.min(ZOOM_STEPS.length - 1, s + 1))}
              className="flex h-7 w-7 items-center justify-center rounded-md text-text-2 transition-colors hover:bg-app hover:text-text"
            >
              <Icon name="plus" size={14} />
            </button>
            <button
              type="button"
              aria-label="Ajuster au cadre"
              onClick={() => setZoomStep(0)}
              className="flex h-7 w-7 items-center justify-center rounded-md text-text-2 transition-colors hover:bg-app hover:text-text"
            >
              <Icon name="expand" size={14} />
            </button>
            <button
              type="button"
              aria-label="Afficher ou masquer le contour"
              onClick={() => setOutline((o) => !o)}
              className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
                outline ? "bg-brand-soft text-text" : "text-text-2 hover:bg-app hover:text-text"
              }`}
            >
              <Icon name="layers" size={14} />
            </button>
          </div>
        ) : null}
      </nav>

      <div className="flex min-h-0 flex-1 flex-col">
        {tab === "plan" ? (
          <CropViewer unit={unit} floor={floor} zoom={ZOOM_STEPS[zoomStep]} outline={outline} />
        ) : null}
        {tab === "rooms" ? (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <RoomTable unit={unit} rooms={rooms} />
          </div>
        ) : null}
        {tab === "dimensions" ? (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <DimensionTable unit={unit} floor={floor} />
          </div>
        ) : null}
        {tab === "3d" ? (
          <div className="flex min-h-0 flex-1 items-center justify-center">
            <p className="max-w-[40ch] text-center text-[13px] text-text-3">
              Le contexte 3D n’est pas disponible. Aucun modèle SketchUp
              n’est connecté pour ce projet.
            </p>
          </div>
        ) : null}
      </div>

      <div className="flex h-9 shrink-0 items-center gap-1 border-t border-edge bg-app px-3">
        <span className="flex h-7 items-center rounded-t-md border border-b-0 border-edge bg-panel px-3 text-[12px] font-medium text-text">
          Modèle
        </span>
        <span className="flex h-7 items-center px-3 text-[12px] text-text-3">
          Layout1
        </span>
      </div>
    </div>
  );
}
