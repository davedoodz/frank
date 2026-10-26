"use client";

import { useRouter } from "next/navigation";
import { BASIS_TITLE } from "@/components/dna/Badge";
import Icon from "@/components/ui/Icon";
import { SORTS, criteriaQuery, type Criteria, type Sort } from "@/lib/dna";
import type { SimilarityBasis } from "@/lib/types";

const BASES: SimilarityBasis[] = ["layout", "area", "configuration", "type"];

const SORT_LABEL: Record<Sort, string> = {
  match: "Meilleure correspondance",
  area: "Superficie",
  year: "Plus récent",
  project: "Projet",
};

/**
 * The result set, cut by match basis. The counts come from the unfiltered
 * search so a tab never hides how much the archive holds.
 */
export default function ResultFilters({
  code,
  sourceNumber,
  criteria,
  basis,
  sort,
  view,
  selectedId,
  total,
  counts,
}: {
  code: string;
  sourceNumber: string;
  criteria: Criteria;
  basis: SimilarityBasis | null;
  sort: Sort;
  view: "grid" | "list";
  selectedId: string | null;
  total: number;
  counts: Record<SimilarityBasis, number>;
}) {
  const router = useRouter();

  function go(next: {
    basis?: SimilarityBasis | null;
    sort?: Sort;
    view?: "grid" | "list";
  }) {
    const nextView = next.view ?? view;
    const query = criteriaQuery(sourceNumber, criteria, {
      basis: (next.basis === undefined ? basis : next.basis) ?? undefined,
      sort: next.sort ?? sort,
      view: nextView === "list" ? "list" : undefined,
      sel: selectedId ?? undefined,
    });
    router.replace(`/p/${code}/office-dna?${query}`, { scroll: false });
  }

  const tabs: [SimilarityBasis | null, string, number][] = [
    [null, "Tous les résultats", total],
    ...BASES.filter((b) => counts[b] > 0).map(
      (b) => [b, BASIS_TITLE[b], counts[b]] as [SimilarityBasis, string, number],
    ),
  ];

  return (
    <div className="mt-6 flex items-end gap-6 border-b border-edge">
      <nav className="flex min-w-0 items-end gap-6 overflow-x-auto">
        {tabs.map(([key, label, count]) => {
          const on = key === basis;
          return (
            <button
              key={label}
              type="button"
              onClick={() => go({ basis: key })}
              className={`-mb-px flex h-10 shrink-0 items-center border-b-2 text-[13px] whitespace-nowrap transition-colors ${
                on
                  ? "border-brand font-medium text-brand"
                  : "border-transparent text-text-2 hover:text-text"
              }`}
            >
              {label} ({count})
            </button>
          );
        })}
      </nav>

      <div className="flex flex-1 items-center justify-end gap-2 pb-2">
        <span className="text-[12px] text-text-2">Trier par</span>
        <select
          value={sort}
          aria-label="trier les résultats"
          onChange={(e) => go({ sort: e.target.value as Sort })}
          className="select-pill h-9 rounded-lg border border-edge bg-panel pr-7 pl-3 text-[13px] font-medium text-text"
        >
          {SORTS.map((s) => (
            <option key={s} value={s}>
              {SORT_LABEL[s]}
            </option>
          ))}
        </select>

        <div className="flex h-9 items-center gap-1 rounded-lg border border-edge bg-panel p-[3px]">
          {(["grid", "list"] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-label={`vue ${v === "grid" ? "grille" : "liste"}`}
              aria-pressed={view === v}
              onClick={() => go({ view: v })}
              className={`flex h-[27px] w-[27px] items-center justify-center rounded-md transition-colors ${
                view === v
                  ? "bg-brand-soft text-brand"
                  : "text-text-3 hover:text-text"
              }`}
            >
              <Icon name={v === "grid" ? "grid" : "list"} size={15} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
