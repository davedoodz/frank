import Link from "next/link";
import Badge, { Tag } from "@/components/dna/Badge";
import PlanCrop from "@/components/dna/PlanCrop";
import Icon from "@/components/ui/Icon";
import { criteriaQuery, unitChips, type Criteria, type Result } from "@/lib/dna";
import { brLabel } from "@/lib/format";
import type { Sort } from "@/lib/dna";
import type { SimilarityBasis } from "@/lib/types";

/**
 * The gallery of archived layouts. Every cell is a window on a real sheet,
 * cropped to the unit: badge for the match basis, the record underneath.
 * Clicking a cell puts it in the preview panel; the plan in that panel opens
 * the archived unit page.
 */
export default function ResultGrid({
  code,
  sourceNumber,
  criteria,
  basis,
  sort,
  view,
  results,
  selectedId,
}: {
  code: string;
  sourceNumber: string;
  criteria: Criteria;
  basis: SimilarityBasis | null;
  sort: Sort;
  view: "grid" | "list";
  results: Result[];
  selectedId: string | null;
}) {
  if (results.length === 0) {
    return (
      <div className="panel mt-4 px-6 py-16 text-center">
        <div className="text-[15px] font-semibold text-text">
          Aucune unité archivée ne correspond à ces critères
        </div>
        <p className="mt-1 text-[13px] text-text-2">
          Élargissez la plage de superficie ou retirez un critère pour voir
          davantage d’archives.
        </p>
      </div>
    );
  }

  const href = (unitId: string) =>
    `/p/${code}/office-dna?${criteriaQuery(sourceNumber, criteria, {
      basis: basis ?? undefined,
      sort,
      view: view === "list" ? "list" : undefined,
      sel: unitId,
    })}`;

  if (view === "list") {
    return (
      <div className="panel mt-4 overflow-hidden">
        {results.map((r) => {
          const on = r.unit.id === selectedId;
          return (
            <Link
              key={r.unit.id}
              href={href(r.unit.id)}
              scroll={false}
              className={`flex items-center gap-4 border-b border-edge-2 px-4 py-3 last:border-0 transition-colors ${
                on ? "bg-brand-soft" : "hover:bg-app"
              }`}
            >
              <span className="w-[72px] shrink-0 overflow-hidden rounded-md">
                <PlanCrop unit={r.unit} floor={r.floor} aspect={4 / 3} />
              </span>
              <span className="w-[84px] shrink-0 text-[14px] font-semibold text-text">
                Unité {r.unit.number}
              </span>
              <span className="min-w-0 flex-1 truncate text-[13px] text-text-2">
                {r.project.display_name}
              </span>
              <span className="w-[200px] shrink-0 text-[12px] text-text-3">
                {r.unit.net_area_m2.value.toFixed(1)} m² ·{" "}
                {brLabel(r.unit.type_qc.value)} · {r.floor.label} ·{" "}
                {r.project.year}
              </span>
              <Badge basis={r.basis} />
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
      {results.map((r) => {
        const on = r.unit.id === selectedId;
        return (
          <Link
            key={r.unit.id}
            href={href(r.unit.id)}
            scroll={false}
            className={`panel group overflow-hidden transition-colors ${
              on ? "border-brand ring-1 ring-brand" : "hover:border-text-3"
            }`}
          >
            <div className="relative bg-panel p-3">
              <PlanCrop
                unit={r.unit}
                floor={r.floor}
                aspect={4 / 3}
                margin={0.16}
              />
              <Badge basis={r.basis} className="absolute top-5 left-5" />
              <span
                aria-hidden="true"
                className="absolute top-5 right-5 flex h-7 w-7 items-center justify-center rounded-md border border-edge bg-panel text-text-3 transition-colors group-hover:text-text"
              >
                <Icon name="bookmark" size={14} />
              </span>
            </div>

            <div className="border-t border-edge-2 px-4 py-3">
              <div className="text-[17px] font-semibold text-text">
                Unité {r.unit.number}
              </div>
              <div className="mt-0.5 text-[13px] text-text-2">
                {r.project.display_name}
              </div>
              <div className="mt-1 text-[12px] text-text-3">
                {r.unit.net_area_m2.value.toFixed(1)} m² ·{" "}
                {brLabel(r.unit.type_qc.value)} · {r.floor.label} ·{" "}
                {r.project.year}
              </div>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {unitChips(r.unit).map((chip) => (
                  <Tag key={chip}>{chip}</Tag>
                ))}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
