"use client";

import Link from "next/link";
import { useState } from "react";
import PlanCrop from "@/components/dna/PlanCrop";
import { NorthArrow, ScaleBar } from "@/components/dna/CompareScale";
import {
  CirculationTable,
  DimensionsTable,
  DrawingsTable,
  KeyAttributesTable,
  RoomAreasTable,
  type LengthUnit,
} from "@/components/dna/CompareTables";
import { cropBox, dimensions } from "@/components/dna/crop";
import Badge from "@/components/dna/Badge";
import Icon from "@/components/ui/Icon";
import { BTN, BTN_ICON, BTN_ON, BTN_QUIET } from "@/components/ui/Button";
import type { Floor, Project, Room, SimilarityBasis, Unit } from "@/lib/types";

export type Side = {
  unit: Unit;
  floor: Floor;
  project: Project;
  rooms: Room[];
};

type Sizes = { w: number; h: number };

const TABS = ["attributes", "rooms", "dimensions", "circulation", "drawings"] as const;
type Tab = (typeof TABS)[number];

const TAB_LABEL: Record<Tab, string> = {
  attributes: "Attributs clés",
  rooms: "Surfaces des pièces",
  dimensions: "Dimensions",
  circulation: "Circulation",
  drawings: "Dessins et fichiers",
};

/**
 * Two drawings at one real-world scale, from px_per_m. Orientation is kept as
 * drawn; rotation is a deliberate toggle on the right unit only, never a
 * default. Highlighting a difference tints the two value cells, not just the
 * difference column.
 */
export default function CompareView({
  left,
  right,
  leftBasis,
  rightBasis,
  projectCode,
  unitBackHref,
  resultsHref,
  swapHref,
}: {
  left: Side;
  right: Side;
  leftBasis: SimilarityBasis | null;
  rightBasis: SimilarityBasis | null;
  projectCode: string;
  unitBackHref: string | null;
  resultsHref: string;
  swapHref: string;
}) {
  const [sameScale, setSameScale] = useState(true);
  const [rotateRight, setRotateRight] = useState(false);
  const [showOutline, setShowOutline] = useState(true);
  const [showAreaLabels, setShowAreaLabels] = useState(true);
  const [showDims, setShowDims] = useState(true);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [lengthUnit, setLengthUnit] = useState<LengthUnit>("metric");
  const [highlight, setHighlight] = useState(true);
  const [tab, setTab] = useState<Tab>("attributes");

  const aspect = 4 / 3;
  const margin = 0.2;
  const sizes = { left: dimensions(left.unit, left.floor), right: dimensions(right.unit, right.floor) };
  // one field of view, wide enough for the larger of the two units, with the
  // surrounding linework a technician reads for context
  const widthM =
    Math.max(
      sizes.left.w,
      sizes.right.w,
      sizes.left.h * aspect,
      sizes.right.h * aspect,
    ) * 1.45;

  const fieldWidthM = (side: Side) => {
    if (sameScale) return widthM;
    const box = cropBox(side.unit, side.floor, aspect, margin);
    return (box.w * side.floor.width_px) / side.floor.px_per_m;
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-app">
      <div className="flex flex-wrap items-start justify-between gap-4 p-6">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight text-text">
            Comparer les aménagements
          </h1>
          <p className="mt-1 text-[13px] text-text-2">
            Comparez les plans et les attributs clés des unités, à une échelle commune.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {unitBackHref ? (
              <Link href={unitBackHref} className={BTN_QUIET}>
                <Icon name="chevron-left" size={14} />
                Retour à l'unité {left.unit.number}
              </Link>
            ) : null}
            <Link href={swapHref} className={BTN_QUIET}>
              Inverser les côtés
            </Link>
            <Link href={resultsHref} className={BTN_QUIET}>
              Retour aux résultats
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <select
              value={lengthUnit}
              onChange={(e) => setLengthUnit(e.target.value as LengthUnit)}
              className={`${BTN} appearance-none pr-8`}
            >
              <option value="metric">Métrique (m, m²)</option>
              <option value="imperial">Impérial (pi, pi²)</option>
            </select>
            <Icon
              name="chevron-down"
              size={14}
              className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-text-2"
            />
          </div>

          <button
            type="button"
            onClick={() => setSameScale((v) => !v)}
            className={sameScale ? BTN_ON : BTN}
          >
            <Icon name="scale" size={14} />
            Même échelle
          </button>

          <button type="button" onClick={() => setRotateRight((v) => !v)} className={BTN}>
            <Icon name="rotate" size={14} />
            Faire pivoter l'unité de droite
          </button>

          <div className="relative">
            <button type="button" onClick={() => setOverlayOpen((v) => !v)} className={BTN}>
              Options de superposition
              <Icon name="chevron-down" size={14} />
            </button>
            {overlayOpen ? (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setOverlayOpen(false)} />
                <div className="absolute right-0 top-[calc(100%+4px)] z-20 w-60 rounded-xl border border-edge bg-panel p-2 shadow-lg">
                  <OverlayCheck
                    label="Limites des pièces"
                    checked={showOutline}
                    onChange={setShowOutline}
                  />
                  <OverlayCheck
                    label="Étiquettes de surface"
                    checked={showAreaLabels}
                    onChange={setShowAreaLabels}
                  />
                  <OverlayCheck
                    label="Dimensions hors tout"
                    checked={showDims}
                    onChange={setShowDims}
                  />
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 px-6 lg:grid-cols-2">
        <ComparePanel
          side={left}
          basis={leftBasis}
          projectCode={projectCode}
          aspect={aspect}
          margin={margin}
          widthM={sameScale ? widthM : undefined}
          fieldWidthM={fieldWidthM(left)}
          rotated={false}
          showOutline={showOutline}
          showAreaLabels={showAreaLabels}
          showDims={showDims}
          lengthUnit={lengthUnit}
          size={sizes.left}
        />
        <ComparePanel
          side={right}
          basis={rightBasis}
          projectCode={projectCode}
          aspect={aspect}
          margin={margin}
          widthM={sameScale ? widthM : undefined}
          fieldWidthM={fieldWidthM(right)}
          rotated={rotateRight}
          showOutline={showOutline}
          showAreaLabels={showAreaLabels}
          showDims={showDims}
          lengthUnit={lengthUnit}
          size={sizes.right}
        />
      </div>

      <div className="panel mx-6 my-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-edge px-5">
          <nav className="flex gap-5">
            {TABS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`relative h-12 text-[13px] font-medium transition-colors ${
                  tab === t ? "text-brand" : "text-text-2 hover:text-text"
                }`}
              >
                {TAB_LABEL[t]}
                {tab === t ? (
                  <span className="absolute inset-x-0 -bottom-px h-0.5 bg-brand" />
                ) : null}
              </button>
            ))}
          </nav>
          <label className="flex items-center gap-2 py-3 text-[13px] text-text-2">
            Mettre en évidence les différences
            <Switch checked={highlight} onChange={setHighlight} />
          </label>
        </div>

        <div className="overflow-x-auto p-5">
          {tab === "attributes" ? (
            <KeyAttributesTable
              left={left}
              right={right}
              leftBasis={leftBasis}
              rightBasis={rightBasis}
              highlight={highlight}
              unit={lengthUnit}
            />
          ) : null}
          {tab === "rooms" ? (
            <RoomAreasTable
              left={left}
              right={right}
              leftBasis={leftBasis}
              rightBasis={rightBasis}
              highlight={highlight}
              unit={lengthUnit}
            />
          ) : null}
          {tab === "dimensions" ? (
            <DimensionsTable
              left={left}
              right={right}
              leftBasis={leftBasis}
              rightBasis={rightBasis}
              highlight={highlight}
              unit={lengthUnit}
              sizes={sizes}
            />
          ) : null}
          {tab === "circulation" ? (
            <CirculationTable
              left={left}
              right={right}
              leftBasis={leftBasis}
              rightBasis={rightBasis}
              highlight={highlight}
              unit={lengthUnit}
            />
          ) : null}
          {tab === "drawings" ? (
            <DrawingsTable left={left} right={right} leftBasis={leftBasis} rightBasis={rightBasis} />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ComparePanel({
  side,
  basis,
  projectCode,
  aspect,
  margin,
  widthM,
  fieldWidthM,
  rotated,
  showOutline,
  showAreaLabels,
  showDims,
  lengthUnit,
  size,
}: {
  side: Side;
  basis: SimilarityBasis | null;
  projectCode: string;
  aspect: number;
  margin: number;
  widthM: number | undefined;
  fieldWidthM: number;
  rotated: boolean;
  showOutline: boolean;
  showAreaLabels: boolean;
  showDims: boolean;
  lengthUnit: LengthUnit;
  size: Sizes;
}) {
  const fmtLen = (m: number) =>
    lengthUnit === "metric" ? `${m.toFixed(2)} m` : `${(m * 3.2808).toFixed(1)} pi`;
  const fmtArea = (m2: number) =>
    lengthUnit === "metric" ? `${m2.toFixed(1)} m²` : `${Math.round(m2 * 10.764)} pi²`;

  const plan = (
    <div>
      <div className="relative">
        <div
          style={
            rotated
              ? { transform: "rotate(90deg)", transformOrigin: "center" }
              : undefined
          }
        >
          <PlanCrop
            unit={side.unit}
            floor={side.floor}
            aspect={aspect}
            margin={widthM === undefined ? margin : undefined}
            widthM={widthM}
            outline={showOutline}
          />
        </div>
        <NorthArrow className="absolute right-2 bottom-2" />
      </div>
      <div className="mt-2 flex justify-end">
        <ScaleBar fieldWidthM={fieldWidthM} />
      </div>
    </div>
  );

  return (
    <div className="panel flex flex-col p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[20px] font-semibold text-text">Unité {side.unit.number}</span>
            {basis ? <Badge basis={basis} /> : null}
          </div>
          <div className="mt-0.5 truncate text-[12px] text-text-2">
            Projet {side.project.display_name} · {side.project.city}, {side.project.province} ·{" "}
            {side.project.year}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href={`/sim/autocad/retrieve?unit=${side.unit.id}&code=${projectCode}`}
            className={BTN}
          >
            <Icon name="external" size={14} />
            Ouvrir dans AutoCAD
          </Link>
          <MoreMenu side={side} />
        </div>
      </div>

      <div className="mt-4">
        {showDims ? (
          <div className="grid grid-cols-[22px_1fr] grid-rows-[20px_1fr]">
            <div />
            <div className="flex items-center justify-center border-b border-edge-2 pb-1 font-mono text-[11px] text-text-3">
              {fmtLen(size.w)}
            </div>
            <div className="flex items-center justify-center border-r border-edge-2 pr-1">
              <span className="-rotate-90 whitespace-nowrap font-mono text-[11px] text-text-3">
                {fmtLen(size.h)}
              </span>
            </div>
            {plan}
          </div>
        ) : (
          plan
        )}
      </div>

      {showAreaLabels ? (
        <div className="mt-2 text-[12px] text-text-2">
          {fmtArea(side.unit.net_area_m2.value)} net
          {side.rooms.length
            ? ` · ${[...side.rooms]
                .filter((r) => r.area_m2 !== null)
                .sort((a, b) => (b.area_m2 ?? 0) - (a.area_m2 ?? 0))
                .slice(0, 3)
                .map((r) => `${r.name} ${fmtArea(r.area_m2 ?? 0)}`)
                .join(" · ")}`
            : ""}
        </div>
      ) : null}
    </div>
  );
}

function MoreMenu({ side }: { side: Side }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={BTN_ICON}
        aria-label="Plus d'actions"
      >
        <Icon name="more" size={14} />
      </button>
      {open ? (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-[calc(100%+4px)] z-20 w-56 rounded-xl border border-edge bg-panel p-1 shadow-lg">
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(side.unit.number);
                setOpen(false);
              }}
              className="flex w-full items-center rounded-md px-2.5 py-1.5 text-left text-[13px] text-text hover:bg-app"
            >
              Copier le numéro d'unité
            </button>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(side.floor.source_file);
                setOpen(false);
              }}
              className="flex w-full items-center rounded-md px-2.5 py-1.5 text-left text-[13px] text-text hover:bg-app"
            >
              Copier le nom du fichier
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}

function OverlayCheck({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-text hover:bg-app">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-3.5 w-3.5 accent-brand"
      />
      {label}
    </label>
  );
}

function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-[22px] w-10 shrink-0 rounded-full transition-colors ${
        checked ? "bg-brand" : "bg-edge-2"
      }`}
    >
      <span
        className={`absolute top-0.5 h-[18px] w-[18px] rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-[20px]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
