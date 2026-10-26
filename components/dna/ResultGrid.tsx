import Link from "next/link";
import PlanCrop from "@/components/dna/PlanCrop";
import { criteriaQuery, unitTags, type Criteria, type Result } from "@/lib/dna";
import { BASIS_LABEL } from "@/lib/similarity";
import { ft2 } from "@/lib/format";
import type { Sort } from "@/lib/dna";
import type { SimilarityBasis } from "@/lib/types";

/**
 * A dense grid of plan crops, 1 px of line between cells. Caption: project,
 * year, unit, area, type; then the match basis in monospace. No shadow, no
 * scale on hover, one inset outline instead.
 */
export default function ResultGrid({
  code,
  sourceNumber,
  criteria,
  basis,
  sort,
  results,
}: {
  code: string;
  sourceNumber: string;
  criteria: Criteria;
  basis: SimilarityBasis | null;
  sort: Sort;
  results: Result[];
}) {
  if (results.length === 0) {
    return (
      <div className="border-t border-line py-12 text-center text-body text-ink-3">
        no archived unit matches these criteria
      </div>
    );
  }

  const query = criteriaQuery(sourceNumber, criteria, {
    basis: basis ?? undefined,
    sort,
  });

  return (
    <div className="grid grid-cols-2 gap-px border border-line bg-line md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {results.map((r) => (
        <Link
          key={r.unit.id}
          href={`/p/${code}/office-dna/${r.unit.id}?${query}`}
          className="bg-surface p-3 outline-1 -outline-offset-1 outline-transparent transition-colors duration-[80ms] hover:outline-ink"
        >
          <PlanCrop unit={r.unit} floor={r.floor} aspect={4 / 3} />
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-body text-ink">{r.unit.number}</span>
            <span className="truncate text-body text-ink-2">
              {r.project.display_name}
            </span>
            <span className="flex-1" />
            <span className="font-mono text-meta text-ink-3">
              {r.project.year}
            </span>
          </div>
          <div className="mt-1 font-mono text-meta text-ink-2">
            {r.unit.net_area_m2.value.toFixed(1)} m²{" "}
            <span className="text-ink-3">
              {ft2(r.unit.net_area_m2.value)} ft²
            </span>{" "}
            · {r.unit.type_qc.value} · {unitTags(r.unit).slice(1).join(" · ")}
          </div>
          <div className="mt-1 font-mono text-meta text-ink-3">
            {BASIS_LABEL[r.basis]} · {r.score.toFixed(2)}
          </div>
        </Link>
      ))}
    </div>
  );
}
