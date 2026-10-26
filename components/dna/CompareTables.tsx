import Badge from "@/components/dna/Badge";
import PlanCrop from "@/components/dna/PlanCrop";
import type { Side } from "@/components/dna/CompareView";
import { ORIENTATION_LABEL } from "@/lib/dna";
import { ft2 } from "@/lib/format";
import type { Room, SimilarityBasis } from "@/lib/types";

export type LengthUnit = "metric" | "imperial";
type MeasureKind = "area" | "length" | "count" | "percent";

const M_TO_FT = 3.2808;

function measureValue(raw: number, unit: LengthUnit, kind: MeasureKind): number {
  if (kind === "area") return unit === "metric" ? raw : ft2(raw);
  if (kind === "length") return unit === "metric" ? raw : raw * M_TO_FT;
  return raw;
}

function measureUnitLabel(unit: LengthUnit, kind: MeasureKind): string {
  if (kind === "area") return unit === "metric" ? "m\u00b2" : "pi\u00b2";
  if (kind === "length") return unit === "metric" ? "m" : "pi";
  if (kind === "percent") return "%";
  return "";
}

function measureDecimals(unit: LengthUnit, kind: MeasureKind): number {
  if (kind === "count" || kind === "percent") return 0;
  if (kind === "area") return unit === "metric" ? 1 : 0;
  return unit === "metric" ? 2 : 1;
}

/** One value, formatted in the office's chosen unit. "\u2014" when the record has nothing. */
function fmtMeasure(raw: number | null, unit: LengthUnit, kind: MeasureKind): string {
  if (raw === null) return "\u2014";
  const v = measureValue(raw, unit, kind);
  const label = measureUnitLabel(unit, kind);
  return `${v.toFixed(measureDecimals(unit, kind))}${label ? ` ${label}` : ""}`;
}

/** The right value against the left, in ink that says which way it moved. */
function DiffCell({
  left,
  right,
  unit,
  kind,
}: {
  left: number | null;
  right: number | null;
  unit: LengthUnit;
  kind: MeasureKind;
}) {
  if (left === null || right === null) {
    return <span className="text-text-3">—</span>;
  }
  const lv = measureValue(left, unit, kind);
  const rv = measureValue(right, unit, kind);
  const delta = rv - lv;
  if (Math.abs(delta) < 0.05) return <span className="text-text-3">—</span>;

  const decimals = measureDecimals(unit, kind);
  const label = measureUnitLabel(unit, kind);
  const pct = kind !== "percent" && lv !== 0 ? (delta / lv) * 100 : null;
  const cls = delta > 0 ? "text-ok" : "text-bad";
  const sign = delta > 0 ? "+" : "\u2212";
  const suffix = kind === "percent" ? " pt" : label ? ` ${label}` : "";

  return (
    <span className={cls}>
      {sign}
      {Math.abs(delta).toFixed(decimals)}
      {suffix}
      {pct !== null ? ` (${delta > 0 ? "+" : "\u2212"}${Math.abs(Math.round(pct))} %)` : ""}
    </span>
  );
}

function tint(left: number | null, right: number | null, isRight: boolean, on: boolean): string {
  if (!on || left === null || right === null) return "";
  const delta = right - left;
  if (Math.abs(delta) < 0.001) return "";
  const ahead = delta > 0;
  if (isRight) return ahead ? "bg-ok-wash" : "bg-bad-wash";
  return ahead ? "bg-bad-wash" : "bg-ok-wash";
}

function UnitHeaderCell({
  side,
  basis,
}: {
  side: Side;
  basis: SimilarityBasis | null;
}) {
  return (
    <th className="w-48 py-2 pr-4 text-left align-bottom font-normal">
      <PlanCrop
        unit={side.unit}
        floor={side.floor}
        aspect={4 / 3}
        margin={0.3}
        className="h-12 w-16 rounded-md"
      />
      <div className="mt-1.5 flex items-center gap-1.5">
        <span className="text-[13px] font-medium text-text">Unité {side.unit.number}</span>
        {basis ? <Badge basis={basis} /> : null}
      </div>
      <div className="mt-0.5 truncate text-[11px] text-text-3">
        Projet {side.project.display_name} · {side.project.year}
      </div>
    </th>
  );
}

type Row = {
  label: string;
  kind: MeasureKind;
  left: number | null;
  right: number | null;
  leftDisplay?: string;
  rightDisplay?: string;
};

function TableShell({
  left,
  right,
  leftBasis,
  rightBasis,
  rows,
  highlight,
  unit,
}: {
  left: Side;
  right: Side;
  leftBasis: SimilarityBasis | null;
  rightBasis: SimilarityBasis | null;
  rows: Row[];
  highlight: boolean;
  unit: LengthUnit;
}) {
  return (
    <table className="w-full border-collapse text-[13px]">
      <thead>
        <tr className="border-b border-edge">
          <th className="w-44 py-2 pr-4 text-left text-[12px] font-medium text-text-3">
            Attribut
          </th>
          <UnitHeaderCell side={left} basis={leftBasis} />
          <UnitHeaderCell side={right} basis={rightBasis} />
          <th className="w-44 py-2 pl-4 text-left text-[12px] font-medium text-text-3">
            Différence
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.label} className="border-b border-edge-2 last:border-0">
            <td className="py-2 pr-4 text-text-2">{row.label}</td>
            <td className={`py-2 pr-4 text-text ${tint(row.left, row.right, false, highlight)}`}>
              {row.leftDisplay ?? fmtMeasure(row.left, unit, row.kind)}
            </td>
            <td className={`py-2 pr-4 text-text ${tint(row.left, row.right, true, highlight)}`}>
              {row.rightDisplay ?? fmtMeasure(row.right, unit, row.kind)}
            </td>
            <td className="py-2 pl-4">
              <DiffCell left={row.left} right={row.right} unit={unit} kind={row.kind} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function livingArea(rooms: Room[]): number | null {
  return rooms.find((r) => r.name.toLowerCase().startsWith("salon"))?.area_m2 ?? null;
}

function kitchenArea(rooms: Room[]): number | null {
  const room = rooms.find((r) => {
    const name = r.name.toLowerCase();
    return name.includes("cuisine") && !name.includes("salon");
  });
  return room?.area_m2 ?? null;
}

function circulationArea(rooms: Room[]): number | null {
  const matches = rooms.filter((r) => {
    const name = r.name.toLowerCase();
    return (
      name.includes("entr\u00e9e") ||
      name.includes("circulation") ||
      name.includes("corridor")
    );
  });
  const withArea = matches.filter((r) => r.area_m2 !== null);
  if (withArea.length === 0) return null;
  return withArea.reduce((sum, r) => sum + (r.area_m2 ?? 0), 0);
}

/** Superficie totale, superficie intérieure, chambres, familles de pièces, orientation. */
export function KeyAttributesTable({
  left,
  right,
  leftBasis,
  rightBasis,
  highlight,
  unit,
}: {
  left: Side;
  right: Side;
  leftBasis: SimilarityBasis | null;
  rightBasis: SimilarityBasis | null;
  highlight: boolean;
  unit: LengthUnit;
}) {
  const lCirc = circulationArea(left.rooms);
  const rCirc = circulationArea(right.rooms);
  const lNet = left.unit.net_area_m2.value;
  const rNet = right.unit.net_area_m2.value;

  const rows: Row[] = [
    {
      label: "Superficie de plancher (totale)",
      kind: "area",
      left: left.unit.gross_area_m2.value,
      right: right.unit.gross_area_m2.value,
    },
    { label: "Superficie intérieure", kind: "area", left: lNet, right: rNet },
    {
      label: "Superficie du balcon",
      kind: "area",
      left: left.unit.has_balcony.value ? left.unit.balcony_area_m2.value : null,
      right: right.unit.has_balcony.value ? right.unit.balcony_area_m2.value : null,
    },
    {
      label: "Chambres",
      kind: "count",
      left: left.unit.bedrooms.value,
      right: right.unit.bedrooms.value,
    },
    {
      label: "Salles de bain",
      kind: "count",
      left: left.unit.bathrooms.value,
      right: right.unit.bathrooms.value,
    },
    {
      label: "Superficie séjour et repas",
      kind: "area",
      left: livingArea(left.rooms),
      right: livingArea(right.rooms),
    },
    {
      label: "Superficie cuisine",
      kind: "area",
      left: kitchenArea(left.rooms),
      right: kitchenArea(right.rooms),
    },
    {
      label: "Superficie de circulation",
      kind: "area",
      left: lCirc,
      right: rCirc,
      leftDisplay:
        lCirc === null
          ? "\u2014"
          : `${fmtMeasure(lCirc, unit, "area")} (${Math.round((lCirc / lNet) * 100)} % de la superficie nette)`,
      rightDisplay:
        rCirc === null
          ? "\u2014"
          : `${fmtMeasure(rCirc, unit, "area")} (${Math.round((rCirc / rNet) * 100)} % de la superficie nette)`,
    },
    {
      label: "Orientation",
      kind: "count",
      left: null,
      right: null,
      leftDisplay: ORIENTATION_LABEL[left.unit.orientation.value],
      rightDisplay: ORIENTATION_LABEL[right.unit.orientation.value],
    },
  ];

  return (
    <TableShell
      left={left}
      right={right}
      leftBasis={leftBasis}
      rightBasis={rightBasis}
      rows={rows}
      highlight={highlight}
      unit={unit}
    />
  );
}

/** Chaque nom de pièce trouvé sur l'un ou l'autre feuillet, en français comme sur le plan. */
export function RoomAreasTable({
  left,
  right,
  leftBasis,
  rightBasis,
  highlight,
  unit,
}: {
  left: Side;
  right: Side;
  leftBasis: SimilarityBasis | null;
  rightBasis: SimilarityBasis | null;
  highlight: boolean;
  unit: LengthUnit;
}) {
  const names = Array.from(
    new Set([...left.rooms.map((r) => r.name), ...right.rooms.map((r) => r.name)]),
  );

  const sum = (rooms: Room[], name: string) => {
    const matches = rooms.filter((r) => r.name === name && r.area_m2 !== null);
    if (matches.length === 0) return null;
    return matches.reduce((s, r) => s + (r.area_m2 ?? 0), 0);
  };

  const rows: Row[] = names.map((name) => ({
    label: name,
    kind: "area",
    left: sum(left.rooms, name),
    right: sum(right.rooms, name),
  }));

  return (
    <TableShell
      left={left}
      right={right}
      leftBasis={leftBasis}
      rightBasis={rightBasis}
      rows={rows}
      highlight={highlight}
      unit={unit}
    />
  );
}

export function DimensionsTable({
  left,
  right,
  leftBasis,
  rightBasis,
  highlight,
  unit,
  sizes,
}: {
  left: Side;
  right: Side;
  leftBasis: SimilarityBasis | null;
  rightBasis: SimilarityBasis | null;
  highlight: boolean;
  unit: LengthUnit;
  sizes: { left: { w: number; h: number }; right: { w: number; h: number } };
}) {
  const rows: Row[] = [
    { label: "Largeur hors tout", kind: "length", left: sizes.left.w, right: sizes.right.w },
    { label: "Profondeur hors tout", kind: "length", left: sizes.left.h, right: sizes.right.h },
    {
      label: "Proportion (largeur : profondeur)",
      kind: "count",
      left: null,
      right: null,
      leftDisplay: (sizes.left.w / sizes.left.h).toFixed(2),
      rightDisplay: (sizes.right.w / sizes.right.h).toFixed(2),
    },
  ];

  return (
    <TableShell
      left={left}
      right={right}
      leftBasis={leftBasis}
      rightBasis={rightBasis}
      rows={rows}
      highlight={highlight}
      unit={unit}
    />
  );
}

export function CirculationTable({
  left,
  right,
  leftBasis,
  rightBasis,
  highlight,
  unit,
}: {
  left: Side;
  right: Side;
  leftBasis: SimilarityBasis | null;
  rightBasis: SimilarityBasis | null;
  highlight: boolean;
  unit: LengthUnit;
}) {
  const lCirc = circulationArea(left.rooms);
  const rCirc = circulationArea(right.rooms);
  const lShare = lCirc === null ? null : (lCirc / left.unit.net_area_m2.value) * 100;
  const rShare = rCirc === null ? null : (rCirc / right.unit.net_area_m2.value) * 100;

  const rows: Row[] = [
    { label: "Superficie de circulation", kind: "area", left: lCirc, right: rCirc },
    { label: "Part de la superficie nette", kind: "percent", left: lShare, right: rShare },
  ];

  return (
    <TableShell
      left={left}
      right={right}
      leftBasis={leftBasis}
      rightBasis={rightBasis}
      rows={rows}
      highlight={highlight}
      unit={unit}
    />
  );
}

/** Les deux feuillets sources, en lecture seule : fitte n'écrit jamais dans un fichier de dessin. */
export function DrawingsTable({
  left,
  right,
  leftBasis,
  rightBasis,
}: {
  left: Side;
  right: Side;
  leftBasis: SimilarityBasis | null;
  rightBasis: SimilarityBasis | null;
}) {
  const rows: [string, string, string, boolean][] = [
    ["Nom du fichier", left.floor.source_file, right.floor.source_file, true],
    ["Feuillet", left.floor.sheet_number, right.floor.sheet_number, true],
    ["Révision", left.floor.revision_date, right.floor.revision_date, false],
    ["Statut", "Référence en lecture seule", "Référence en lecture seule", false],
  ];

  return (
    <table className="w-full border-collapse text-[13px]">
      <thead>
        <tr className="border-b border-edge">
          <th className="w-44 py-2 pr-4 text-left text-[12px] font-medium text-text-3">
            Attribut
          </th>
          <UnitHeaderCell side={left} basis={leftBasis} />
          <UnitHeaderCell side={right} basis={rightBasis} />
          <th className="w-44 py-2 pl-4 text-left text-[12px] font-medium text-text-3">
            Différence
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([label, l, r, mono]) => (
          <tr key={label} className="border-b border-edge-2 last:border-0">
            <td className="py-2 pr-4 text-text-2">{label}</td>
            <td className={`py-2 pr-4 text-text ${mono ? "font-mono text-[12px]" : ""}`}>{l}</td>
            <td className={`py-2 pr-4 text-text ${mono ? "font-mono text-[12px]" : ""}`}>{r}</td>
            <td className="py-2 pl-4 text-text-3">—</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
