"use client";

import { useState } from "react";
import Badge, { Tag } from "@/components/dna/Badge";
import PlanCrop from "@/components/dna/PlanCrop";
import { DimensionTable, RoomTable } from "@/components/dna/UnitTables";
import { ORIENTATION_TITLE, unitChips } from "@/lib/dna";
import { ft2 } from "@/lib/format";
import type { Drawing, Floor, Project, Room, SimilarityBasis, Unit } from "@/lib/types";

const STATUS_LABEL: Record<Drawing["status"], string> = {
  connected: "Connecté",
  indexed: "Indexé",
  outdated: "Périmé",
};

const STATUS_DOT: Record<Drawing["status"], string> = {
  connected: "bg-ok",
  indexed: "bg-brand",
  outdated: "bg-bad",
};

type Tab = "overview" | "rooms" | "dimensions" | "drawings";

/**
 * The right panel on an archived unit: what it is, how it is organised, and
 * where it comes from. Every value is a stored field or derived from the
 * outline; nothing here is editable, the record is a read-only reference.
 */
export default function ArchiveUnitPanel({
  unit,
  floor,
  project,
  rooms,
  basis,
}: {
  unit: Unit;
  floor: Floor;
  project: Project;
  rooms: Room[];
  basis: SimilarityBasis | null;
}) {
  const [tab, setTab] = useState<Tab>("overview");

  const attributes: [string, React.ReactNode][] = [
    ["Type d’unité", unit.type_qc.value],
    [
      "Superficie totale",
      unit.gross_area_m2.value === null
        ? "—"
        : `${unit.gross_area_m2.value.toFixed(1)} m²`,
    ],
    [
      "Superficie intérieure",
      <span key="interior" className="whitespace-nowrap">
        {unit.net_area_m2.value.toFixed(1)} m²{" "}
        <span className="text-text-3">({ft2(unit.net_area_m2.value)} ft²)</span>
      </span>,
    ],
    [
      "Superficie du balcon",
      unit.has_balcony.value
        ? `${unit.balcony_area_m2.value?.toFixed(1) ?? "—"} m²`
        : "Aucun",
    ],
    ["Chambres", unit.bedrooms.value],
    ["Salles de bain", unit.bathrooms.value],
    ["Orientation", ORIENTATION_TITLE[unit.orientation.value]],
    ["Étage", floor.label],
  ];

  const source: [string, React.ReactNode][] = [
    ["Projet", project.display_name],
    ["Dessin", <span key="drawing" className="font-mono">{floor.source_file}</span>],
    ["Feuille", floor.sheet_number],
    ["Date", floor.revision_date],
    [
      "Statut",
      <span key="status" className="inline-flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-text-3" />
        Référence en lecture seule
      </span>,
    ],
  ];

  const chips = [...unitChips(unit), ...(unit.has_balcony.value ? ["Balcon"] : [])];

  const tabs: [Tab, string][] = [
    ["overview", "Aperçu"],
    ["rooms", `Pièces (${rooms.length})`],
    ["dimensions", "Dimensions"],
    ["drawings", `Dessins (${project.drawings.length})`],
  ];

  return (
    <aside className="panel flex w-[360px] shrink-0 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-edge px-4 py-4">
        <div className="flex items-center gap-2">
          <h2 className="text-[20px] font-semibold text-text">Unité {unit.number}</h2>
          {basis ? <Badge basis={basis} /> : null}
        </div>
        <div className="mt-1 text-[13px] text-text-2">
          {project.display_name} · {project.city}, {project.province} · {project.year}
        </div>
      </div>

      <nav className="flex h-11 shrink-0 items-center gap-5 border-b border-edge px-4">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`relative flex h-11 items-center text-[13px] font-medium transition-colors ${
              tab === key ? "text-brand" : "text-text-2 hover:text-text"
            }`}
          >
            {label}
            {tab === key ? (
              <span className="absolute inset-x-0 -bottom-px h-0.5 bg-brand" />
            ) : null}
          </button>
        ))}
      </nav>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {tab === "overview" ? (
          <div className="p-4">
            <div className="grid grid-cols-[1fr_112px] gap-4">
              <div>
                {attributes.map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-baseline justify-between border-b border-edge-2 py-2 last:border-0"
                  >
                    <span className="text-[13px] text-text-2">{label}</span>
                    <span className="text-[13px] text-text">{value}</span>
                  </div>
                ))}
              </div>
              <div className="w-28 self-start overflow-hidden rounded-md border border-edge bg-panel">
                <PlanCrop
                  unit={unit}
                  floor={floor}
                  aspect={4 / 3}
                  margin={2.4}
                  fill="#2563eb"
                  fillOpacity={0.22}
                  stroke="#2563eb"
                  strokeWidth={1.5}
                />
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-[13px] font-semibold text-text">
                Organisation spatiale
              </h3>
              {unit.notes ? (
                <p className="mt-2 text-[13px] text-text-2">{unit.notes}</p>
              ) : null}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {chips.map((chip) => (
                  <Tag key={chip}>{chip}</Tag>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-[13px] font-semibold text-text">Projet source</h3>
              <div className="mt-2">
                {source.map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-baseline justify-between gap-3 border-b border-edge-2 py-2 last:border-0"
                  >
                    <span className="shrink-0 text-[13px] text-text-2">{label}</span>
                    <span className="truncate text-[13px] text-text">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {tab === "rooms" ? <RoomTable unit={unit} rooms={rooms} /> : null}
        {tab === "dimensions" ? <DimensionTable unit={unit} floor={floor} /> : null}
        {tab === "drawings" ? <DrawingsList drawings={project.drawings} /> : null}
      </div>
    </aside>
  );
}

function DrawingsList({ drawings }: { drawings: Drawing[] }) {
  if (drawings.length === 0) {
    return (
      <div className="p-4 text-[13px] text-text-3">
        Aucun dessin indexé pour ce projet.
      </div>
    );
  }

  return (
    <div className="p-4">
      {drawings.map((d) => (
        <div
          key={d.filename}
          className="flex items-center justify-between gap-3 border-b border-edge-2 py-2.5 last:border-0"
        >
          <div className="min-w-0">
            <div className="truncate font-mono text-[13px] text-text">{d.filename}</div>
            <div className="text-[12px] text-text-3">{d.role.replace("_", " ")}</div>
          </div>
          <span className="flex shrink-0 items-center gap-1.5 text-[12px] text-text-2">
            <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[d.status]}`} />
            {STATUS_LABEL[d.status]}
          </span>
        </div>
      ))}
    </div>
  );
}
