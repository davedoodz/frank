import Link from "next/link";
import PlanCrop from "@/components/dna/PlanCrop";
import type { Result } from "@/lib/dna";
import { BASIS_LABEL } from "@/lib/similarity";

/** The result set, kept beside the unit so the technician can walk it. */
export default function SimilarRail({
  code,
  query,
  results,
  currentId,
}: {
  code: string;
  query: string;
  results: Result[];
  currentId: string;
}) {
  return (
    <aside className="w-[200px] shrink-0 overflow-y-auto border-r border-line">
      <div className="flex h-10 items-center gap-2 border-b border-line px-3">
        <span className="label-11">results</span>
        <span className="font-mono text-meta text-ink-3">{results.length}</span>
      </div>

      {results.map((r) => {
        const current = r.unit.id === currentId;
        return (
          <Link
            key={r.unit.id}
            href={`/p/${code}/office-dna/${r.unit.id}?${query}`}
            className={`flex gap-2 border-b border-line p-2 transition-colors duration-[80ms] ${
              current ? "border-l-2 border-l-accent bg-paper" : "hover:bg-paper"
            }`}
          >
            <div className="w-[56px] shrink-0">
              <PlanCrop unit={r.unit} floor={r.floor} aspect={1} />
            </div>
            <div className="min-w-0">
              <div className="font-mono text-meta text-ink">{r.unit.number}</div>
              <div className="truncate text-meta text-ink-2">
                {r.project.display_name}
              </div>
              <div className="font-mono text-meta text-ink-3">
                {r.unit.net_area_m2.value.toFixed(1)} m² · {r.unit.type_qc.value}
              </div>
              <div className="truncate font-mono text-meta text-ink-3">
                {BASIS_LABEL[r.basis]}
              </div>
            </div>
          </Link>
        );
      })}
    </aside>
  );
}
