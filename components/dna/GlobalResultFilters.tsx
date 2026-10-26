"use client";

import { useRouter } from "next/navigation";
import { Chip } from "@/components/ui/Chip";
import { SELECT } from "@/components/ui/Action";
import { SORTS, SORT_LABEL, criteriaQuery, type Criteria, type Sort } from "@/lib/dna";
import { BASIS_LABEL } from "@/lib/similarity";
import type { SimilarityBasis } from "@/lib/types";

const BASES: SimilarityBasis[] = ["layout", "area", "configuration", "type"];

/**
 * Same control as ResultFilters, forked only because the office-wide search
 * lives at the top-level `/office-dna?p=...` route instead of a project's
 * `/p/[code]/office-dna`.
 */
export default function GlobalResultFilters({
  code,
  sourceNumber,
  criteria,
  basis,
  sort,
  total,
  counts,
}: {
  code: string;
  sourceNumber: string;
  criteria: Criteria;
  basis: SimilarityBasis | null;
  sort: Sort;
  total: number;
  counts: Record<SimilarityBasis, number>;
}) {
  const router = useRouter();

  function go(next: { basis?: SimilarityBasis | null; sort?: Sort }) {
    const query = criteriaQuery(sourceNumber, criteria, {
      basis: (next.basis === undefined ? basis : next.basis) ?? undefined,
      sort: next.sort ?? sort,
    });
    router.replace(`/office-dna?p=${encodeURIComponent(code)}&${query}`, {
      scroll: false,
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Chip
        label="Tous les résultats"
        count={total}
        active={basis === null}
        onClick={() => go({ basis: null })}
      />
      {BASES.map((b) => (
        <Chip
          key={b}
          label={BASIS_LABEL[b]}
          count={counts[b]}
          active={basis === b}
          onClick={() => go({ basis: basis === b ? null : b })}
        />
      ))}

      <div className="flex-1" />

      <label className="flex items-center gap-2">
        <span className="label-11">Trier par</span>
        <select
          value={sort}
          onChange={(e) => go({ sort: e.target.value as Sort })}
          className={SELECT}
        >
          {SORTS.map((s) => (
            <option key={s} value={s}>
              {SORT_LABEL[s]}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
