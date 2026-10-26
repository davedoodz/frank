"use client";

import Link from "next/link";
import { useState } from "react";
import PlanCrop from "@/components/dna/PlanCrop";
import OpenInCadDialog from "@/components/plan/OpenInCadDialog";
import Icon from "@/components/ui/Icon";
import { BTN_DARK } from "@/components/ui/Button";
import VerifyButton from "@/components/plan/VerifyButton";
import { bedroomLabel, ft2 } from "@/lib/format";
import type { Floor, Room, Unit } from "@/lib/types";

type Tab = "overview" | "rooms" | "drawings" | "history";

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
 * The right panel on a selected unit: what the drawing says, where it came
 * from, and the two ways out — the office archive and AutoCAD.
 */
export default function UnitPanel({
  unit,
  floor,
  code,
  rooms,
  onStep,
}: {
  unit: Unit;
  floor: Floor;
  code: string;
  rooms: Room[];
  onStep: (direction: -1 | 1) => void;
}) {
  const [tab, setTab] = useState<Tab>("overview");
  const verified = unit.status === "verified";
  const interior =
    unit.net_area_m2.value - (unit.balcony_area_m2.value ?? 0);

  const rows: [string, React.ReactNode][] = [
    ["Type", bedroomLabel(unit.type_qc.value)],
    ["Superficie", `${unit.net_area_m2.value.toFixed(1)} m²`],
    ["Superficie intérieure", `${interior.toFixed(1)} m²`],
    [
      "Balcon",
      unit.balcony_area_m2.value === null
        ? "—"
        : `${unit.balcony_area_m2.value.toFixed(1)} m²`,
    ],
    ["Superficie (ft²)", `${ft2(unit.net_area_m2.value)} ft²`],
    ["Orientation", ORIENTATION[unit.orientation.value] ?? unit.orientation.value],
    ["Position", unit.is_corner.value ? "Unité de coin" : "Unité d’extrémité"],
    ["Étage", floor.label],
    ["Pièces", unit.rooms_count.value ?? rooms.length],
    [
      "État",
      <span key="s" className="inline-flex items-center gap-1.5">
        <span
          className={`h-2 w-2 rounded-full ${verified ? "bg-ok" : "bg-text-3"}`}
        />
        {verified ? "Vérifiée" : "Non vérifiée"}
      </span>,
    ],
  ];

  const tabs: [Tab, string][] = [
    ["overview", "Aperçu"],
    ["rooms", `Pièces (${rooms.length})`],
    ["drawings", "Dessins (1)"],
    ["history", "Historique"],
  ];

  return (
    <div className="panel flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="px-4 pt-4">
        <div className="flex items-center gap-2">
          <h2 className="text-[20px] font-semibold tracking-tight text-text">
            Unité {unit.number}
          </h2>
          <span
            className={`inline-flex h-6 items-center gap-1 rounded-full px-2 text-[11px] font-medium ${
              verified
                ? "bg-ok-soft text-ok"
                : "bg-app text-text-2 ring-1 ring-edge"
            }`}
          >
            {verified ? <Icon name="check" size={12} /> : null}
            {verified ? "Vérifiée" : "Non vérifiée"}
          </span>
          <span className="flex-1" />
          <button
            type="button"
            aria-label="Unité précédente"
            onClick={() => onStep(-1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-edge text-text-2 transition-colors hover:text-text"
          >
            <Icon name="chevron-left" size={13} />
          </button>
          <button
            type="button"
            aria-label="Unité suivante"
            onClick={() => onStep(1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-edge text-text-2 transition-colors hover:text-text"
          >
            <Icon name="chevron-right" size={13} />
          </button>
        </div>
        <div className="mt-1 text-[13px] text-text-2">
          {bedroomLabel(unit.type_qc.value)} · {unit.net_area_m2.value.toFixed(1)} m²
          · {floor.label}
        </div>
      </div>

      <nav className="mt-3 flex gap-4 border-b border-edge-2 px-4">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`-mb-px border-b-2 pb-2 text-[13px] transition-colors ${
              tab === key
                ? "border-brand font-medium text-brand"
                : "border-transparent text-text-2 hover:text-text"
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      {tab === "overview" ? (
        <>
          <div className="p-4">
            <div className="overflow-hidden rounded-lg border border-edge-2">
              <PlanCrop unit={unit} floor={floor} aspect={3 / 2} margin={0.03} />
            </div>
          </div>

          <div className="px-4">
            {rows.map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between border-b border-edge-2 py-2 last:border-0"
              >
                <span className="text-[13px] text-text-2">{label}</span>
                <span className="text-[13px] font-medium text-text">{value}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-edge-2 p-4">
            <div className="text-[13px] font-semibold text-text">
              Dessin source
            </div>
            <div className="mt-3 flex items-start gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-app text-text-2">
                <Icon name="dwg" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-medium text-text">
                  {floor.source_file}
                </div>
                <div className="text-[11px] text-text-3">
                  {floor.sheet_number} · {floor.label} · {floor.revision_date}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-edge-2 p-4">
            <div className="text-[13px] font-semibold text-text">Connexes</div>
            <Link
              href={`/p/${code}/office-dna?u=${unit.number}`}
              className="mt-2 flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-app"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-app text-text-2">
                <Icon name="search" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-medium text-text">
                  Trouver des unités similaires
                </span>
                <span className="block text-[11px] text-text-3">
                  Rechercher dans les projets précédents
                </span>
              </span>
              <Icon name="chevron-right" size={13} className="text-text-3" />
            </Link>
            <Link
              href={`/p/${code}/building?u=${unit.number}`}
              className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-app"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-app text-text-2">
                <Icon name="building" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-medium text-text">
                  Voir dans le contexte du bâtiment
                </span>
                <span className="block text-[11px] text-text-3">
                  Voir où se situe l’unité dans la tour
                </span>
              </span>
              <Icon name="chevron-right" size={13} className="text-text-3" />
            </Link>
          </div>
        </>
      ) : null}

      {tab === "rooms" ? (
        <div className="p-4">
          {rooms.length === 0 ? (
            <p className="text-[13px] text-text-2">
              Aucune pièce n’a été extraite pour cette unité.
            </p>
          ) : (
            rooms.map((room) => (
              <div
                key={room.id}
                className="flex items-center justify-between border-b border-edge-2 py-2 last:border-0"
              >
                <span className="text-[13px] text-text-2">{room.name}</span>
                <span className="text-[13px] font-medium text-text tabular-nums">
                  {room.area_m2?.toFixed(1) ?? "—"} m²
                </span>
              </div>
            ))
          )}
        </div>
      ) : null}

      {tab === "drawings" ? (
        <div className="p-4">
          <div className="flex items-start gap-3 rounded-lg border border-edge-2 p-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-app text-text-2">
              <Icon name="dwg" />
            </span>
            <div className="min-w-0">
              <div className="truncate text-[13px] font-medium text-text">
                {floor.source_file}
              </div>
              <div className="text-[11px] text-text-3">
                Feuille {floor.sheet_number} · {floor.scale} ·{" "}
                {floor.revision_date}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {tab === "history" ? (
        <div className="p-4 text-[13px] text-text-2">
          {verified ? (
            <>
              Vérifiée par {unit.verified_by ?? "—"} le{" "}
              {unit.verified_at ?? "—"}.
            </>
          ) : (
            <>Importée depuis {floor.source_file}. Pas encore vérifiée.</>
          )}
        </div>
      ) : null}

      <div className="mt-auto flex flex-col gap-2 border-t border-edge-2 p-4">
        <VerifyButton code={code} unitId={unit.id} status={unit.status} />
        <OpenInCadDialog
          code={code}
          unit={unit}
          floor={floor}
          className={BTN_DARK}
        />
      </div>
    </div>
  );
}
