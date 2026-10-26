import type { SimilarityBasis } from "@/lib/types";

/** Title-case match labels. The product chrome writes labels, not sentences. */
export const BASIS_TITLE: Record<SimilarityBasis, string> = {
  layout: "Disposition très proche",
  area: "Superficie très proche",
  configuration: "Configuration similaire",
  type: "Même type",
};

const TONE: Record<SimilarityBasis, string> = {
  layout: "bg-ok-soft text-ok",
  area: "bg-brand-soft text-brand",
  configuration: "bg-alt-soft text-alt",
  type: "bg-edge-2 text-text-2",
};

/** The match basis, carried as one soft pill wherever a result is shown. */
export default function Badge({
  basis,
  className = "",
}: {
  basis: SimilarityBasis;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex h-[22px] shrink-0 items-center rounded-full px-2.5 text-[11px] font-medium whitespace-nowrap ${TONE[basis]} ${className}`}
    >
      {BASIS_TITLE[basis]}
    </span>
  );
}

/** A neutral attribute chip: "2 bedrooms", "Corner unit", "Southwest". */
export function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex h-[22px] shrink-0 items-center rounded-md bg-app px-2 text-[11px] text-text-2">
      {children}
    </span>
  );
}
