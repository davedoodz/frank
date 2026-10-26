import { dimensions } from "@/components/dna/crop";
import { ORIENTATION_LABEL, unitTags } from "@/lib/dna";
import { ft2 } from "@/lib/format";
import { BASIS_LABEL } from "@/lib/similarity";
import type { Floor, Project, SimilarityBasis, Unit } from "@/lib/types";

/**
 * The right panel on an archived unit: what it is, how it is organised, and
 * where it comes from. Every value is a stored field or derived from the
 * outline; nothing here is editable, the record is a read-only reference.
 */
export default function ArchiveUnitPanel({
  unit,
  floor,
  project,
  basis,
  score,
  sourceNumber,
  sourceArea,
}: {
  unit: Unit;
  floor: Floor;
  project: Project;
  basis: SimilarityBasis | null;
  score: number | null;
  sourceNumber: string;
  sourceArea: number;
}) {
  const size = dimensions(unit, floor);
  const delta = unit.net_area_m2.value - sourceArea;

  const attributes: [string, React.ReactNode][] = [
    ["unit type", unit.type_qc.value],
    [
      "net area",
      <>
        <span className="font-mono">{unit.net_area_m2.value.toFixed(1)} m²</span>{" "}
        <span className="font-mono text-ink-3">
          {ft2(unit.net_area_m2.value)} ft²
        </span>
      </>,
    ],
    [
      "gross area",
      unit.gross_area_m2.value === null ? (
        "—"
      ) : (
        <span className="font-mono">
          {unit.gross_area_m2.value.toFixed(1)} m²
        </span>
      ),
    ],
    [
      "balcony",
      unit.has_balcony.value ? (
        <span className="font-mono">
          {unit.balcony_area_m2.value?.toFixed(1) ?? "—"} m²
        </span>
      ) : (
        "none"
      ),
    ],
    ["bedrooms", unit.bedrooms.value],
    ["bathrooms", unit.bathrooms.value],
    ["orientation", ORIENTATION_LABEL[unit.orientation.value]],
    ["position", unit.is_corner.value ? "corner unit" : "end unit"],
    ["floor", floor.label],
    [
      "overall",
      <span className="font-mono">
        {size.w.toFixed(1)} × {size.h.toFixed(1)} m
      </span>,
    ],
  ];

  const source: [string, React.ReactNode][] = [
    ["project", project.display_name],
    ["project code", <span className="font-mono">{project.project_code}</span>],
    ["city, year", `${project.city} · ${project.year}`],
    ["sheet", <span className="font-mono">{floor.sheet_number}</span>],
    ["drawing", <span className="font-mono">{floor.source_file}</span>],
    ["revision", <span className="font-mono">{floor.revision_date}</span>],
    ["record", `${unit.status} · read-only reference`],
  ];

  return (
    <aside className="w-[360px] shrink-0 overflow-y-auto border-l border-line">
      <div className="border-b border-line p-4">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-title-lg text-ink">{unit.number}</span>
          <span className="text-body text-ink">{unit.type_qc.value}</span>
          <span className="flex-1" />
          <span className="font-mono text-meta text-ink-2">
            {basis ? BASIS_LABEL[basis] : "archived unit"}
          </span>
        </div>
        <div className="mt-1 font-mono text-meta text-ink-3">
          {project.display_name} · {project.year} · {floor.label} ·{" "}
          {floor.sheet_number}
        </div>
        {score !== null ? (
          <div className="mt-2 font-mono text-meta text-ink-2">
            score {score.toFixed(2)} · {delta >= 0 ? "+" : "−"}
            {Math.abs(delta).toFixed(1)} m² against unit {sourceNumber}
          </div>
        ) : null}
      </div>

      <div className="border-b border-line p-4">
        <div className="label-11">attributes</div>
        <div className="mt-3">
          {attributes.map(([label, value]) => (
            <div
              key={label}
              className="flex items-baseline justify-between border-b border-line py-1.5 last:border-0"
            >
              <span className="text-body text-ink-2">{label}</span>
              <span className="text-body text-ink">{value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="border-b border-line p-4">
        <div className="label-11">spatial organisation</div>
        {unit.notes ? (
          <p className="mt-2 text-body text-ink">{unit.notes}</p>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-1">
          {unitTags(unit).map((tag) => (
            <span
              key={tag}
              className="flex h-6 items-center rounded-full border border-line px-3 font-mono text-meta text-ink-2"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="p-4">
        <div className="label-11">source</div>
        <div className="mt-3">
          {source.map(([label, value]) => (
            <div
              key={label}
              className="flex items-baseline justify-between gap-4 border-b border-line py-1.5 last:border-0"
            >
              <span className="shrink-0 text-body text-ink-2">{label}</span>
              <span className="truncate text-body text-ink">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
