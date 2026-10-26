import { BASIS_LABEL } from "@/lib/similarity";
import type { SimilarityBasis } from "@/lib/types";

/**
 * How strong the match is, read as weight rather than as four categories:
 * the closest match carries the office green, the next a wash of it, and the
 * two weak ones stay grey. One label set, `BASIS_LABEL`, is shared with the
 * filter bars so a result and its filter never word the same thing twice.
 */
const TONE: Record<SimilarityBasis, string> = {
  layout: "bg-brand text-text",
  area: "bg-brand-soft text-text",
  configuration: "bg-edge-2 text-text-2",
  type: "bg-edge-2 text-text-3",
};

/** The match basis, carried as one pill wherever a result is shown. */
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
      {BASIS_LABEL[basis]}
    </span>
  );
}

/** A neutral attribute chip: "2 chambres", "unité de coin", "sud-ouest". */
export function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex h-[22px] shrink-0 items-center rounded-md bg-app px-2 text-[11px] text-text-2">
      {children}
    </span>
  );
}
