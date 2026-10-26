"use client";

import Link from "next/link";
import { useState } from "react";
import Icon from "@/components/ui/Icon";
import { hasAnchor, levelBand, unitMarker } from "@/lib/massing";
import type { MassingModel } from "@/lib/types";

/**
 * 3D building context. The massing model gives the band of exterior volume a
 * level occupies, and nothing else: there is no interior geometry in the SKP,
 * so a unit gets an approximate marker only where the office mapped one. The
 * render is static; zoom and pan are real, the level band and the marker are
 * drawn from BuildingLevelMap and the massing fixture.
 */
export default function MassingViewer({
  model,
  levels,
  level,
  onLevel,
  unitNumber,
  mapped,
  code,
}: {
  model: MassingModel;
  levels: { level: number; label: string }[];
  level: number;
  onLevel: (level: number) => void;
  unitNumber: string | null;
  mapped: boolean;
  code: string;
}) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);
  const [showLevel, setShowLevel] = useState(true);
  const [showUnit, setShowUnit] = useState(true);

  const band = mapped ? levelBand(model, level) : null;
  const marker =
    mapped && unitNumber ? unitMarker(model, level, unitNumber) : null;
  const unmapped = Boolean(unitNumber) && !hasAnchor(model, unitNumber ?? "");

  function reset() {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }

  return (
    <div className="panel relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start gap-3 p-4">
        <div className="min-w-0">
          <div className="text-[15px] font-semibold text-text">
            Contexte 3D du bâtiment
          </div>
          <div className="text-[12px] text-text-2">
            Volumétrie du bâtiment, d’après {model.model_ref}
          </div>
        </div>
        <span className="flex-1" />
        <label className="pointer-events-auto flex h-9 items-center gap-1 rounded-lg border border-edge bg-panel px-2.5 text-[13px] font-medium text-text">
          <select
            value={level}
            onChange={(e) => onLevel(Number(e.target.value))}
            aria-label="Étage affiché dans la volumétrie"
            className="select-pill bg-transparent pr-5 text-[13px] font-medium text-text outline-none"
          >
            {levels.map((l) => (
              <option key={l.level} value={l.level}>
                {l.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div
        className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-app"
        onPointerDown={(e) => {
          setDrag({ x: e.clientX - pan.x, y: e.clientY - pan.y });
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!drag) return;
          setPan({ x: e.clientX - drag.x, y: e.clientY - drag.y });
        }}
        onPointerUp={() => setDrag(null)}
        onDoubleClick={reset}
      >
        <div
          className="relative max-h-full w-full"
          style={{
            aspectRatio: `${model.render_width} / ${model.render_height}`,
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "center",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={model.render_url}
            alt={`Exterior massing, ${model.model_ref}`}
            draggable={false}
            className="block h-full w-full select-none object-fill"
          />

          <svg
            viewBox="0 0 1 1"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-0 h-full w-full"
          >
            {band && showLevel ? (
              <polygon
                points={band}
                fill="var(--color-brand)"
                fillOpacity={0.22}
                stroke="var(--color-brand-2)"
                strokeWidth={1.5}
                vectorEffect="non-scaling-stroke"
              />
            ) : null}
            {marker && showUnit ? (
              <g>
                <circle
                  cx={marker.x}
                  cy={marker.y}
                  r={0.012}
                  fill="var(--color-panel)"
                  stroke="var(--color-text)"
                  strokeWidth={2}
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            ) : null}
          </svg>

          {marker && showUnit ? (
            <span
              className="pointer-events-none absolute -translate-y-1/2 translate-x-3 rounded-lg bg-brand px-2 py-1 text-[12px] font-medium text-text"
              style={{ left: `${marker.x * 100}%`, top: `${marker.y * 100}%` }}
            >
              Unité {unitNumber}
            </span>
          ) : null}
        </div>

        {!mapped ? (
          <div className="absolute inset-x-6 bottom-20 rounded-lg border border-edge bg-panel/95 p-3 text-[13px] text-text-2">
            Les étages ne sont pas encore associés à ce modèle.{" "}
            <Link
              href={`/sim/sketchup/connect?code=${encodeURIComponent(code)}`}
              className="font-medium text-text hover:underline"
            >
              Les associer dans SketchUp
            </Link>
            .
          </div>
        ) : null}

        {mapped && unmapped ? (
          <div className="absolute inset-x-6 bottom-20 rounded-lg border border-edge bg-panel/95 p-3 text-[13px] text-text-2">
            L’unité {unitNumber} n’a aucune position cartographiée dans la
            volumétrie. La bande d’étage ne montre que le volume extérieur.
          </div>
        ) : null}

        <div className="absolute right-4 bottom-16 flex flex-col overflow-hidden rounded-lg border border-edge bg-panel">
          <button
            type="button"
            onClick={reset}
            aria-label="Ajuster à la vue"
            className="flex h-9 w-9 items-center justify-center text-text-2 transition-colors hover:bg-app hover:text-text"
          >
            <Icon name="expand" size={14} />
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(z * 1.25, 4))}
            aria-label="Zoom avant"
            className="flex h-9 w-9 items-center justify-center border-t border-edge text-text-2 transition-colors hover:bg-app hover:text-text"
          >
            <Icon name="plus" size={14} />
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(z / 1.25, 1))}
            aria-label="Zoom arrière"
            className="flex h-9 w-9 items-center justify-center border-t border-edge text-text-2 transition-colors hover:bg-app hover:text-text"
          >
            <Icon name="minus" size={14} />
          </button>
        </div>

        <div className="absolute right-4 bottom-4 flex h-9 w-9 items-center justify-center rounded-full border border-edge bg-panel">
          <span
            className="block h-4 w-[2px] bg-text"
            style={{ transform: `rotate(${model.north_deg}deg)` }}
          />
          <span className="absolute top-0.5 text-[8px] text-text-2">N</span>
        </div>

        <div className="absolute bottom-4 left-4 flex items-center gap-1 rounded-lg border border-edge bg-panel p-1">
          <button
            type="button"
            onClick={() => setShowLevel((v) => !v)}
            aria-pressed={showLevel}
            className={`flex h-7 items-center gap-1.5 rounded-md px-2 text-[12px] transition-colors ${
              showLevel ? "bg-brand-soft text-text" : "text-text-2 hover:bg-app"
            }`}
          >
            <Icon name="layers" size={13} />
            Bande d’étage
          </button>
          <button
            type="button"
            onClick={() => setShowUnit((v) => !v)}
            aria-pressed={showUnit}
            disabled={!marker}
            className={`flex h-7 items-center gap-1.5 rounded-md px-2 text-[12px] transition-colors disabled:opacity-40 ${
              showUnit && marker
                ? "bg-brand-soft text-text"
                : "text-text-2 hover:bg-app"
            }`}
          >
            <Icon name="pin" size={13} />
            Repère d’unité
          </button>
        </div>

        <span className="pointer-events-none absolute bottom-16 left-4 font-mono text-[11px] text-text-3">
          simulé
        </span>
      </div>
    </div>
  );
}
