import Link from "next/link";
import Badge from "@/components/dna/Badge";
import PlanCrop from "@/components/dna/PlanCrop";
import type { Result } from "@/lib/dna";

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
    <aside className="panel flex w-[232px] shrink-0 flex-col overflow-hidden">
      <div className="flex h-12 shrink-0 items-center border-b border-edge px-4">
        <h2 className="text-[15px] font-semibold text-text">
          Unités similaires ({results.length})
        </h2>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {results.map((r) => {
          const current = r.unit.id === currentId;
          return (
            <Link
              key={r.unit.id}
              href={`/p/${code}/office-dna/${r.unit.id}?${query}`}
              className={`mb-1 flex gap-3 rounded-lg border p-2 transition-colors last:mb-0 ${
                current
                  ? "border-brand-line bg-brand-soft"
                  : "border-transparent hover:bg-app"
              }`}
            >
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md">
                <PlanCrop unit={r.unit} floor={r.floor} aspect={1} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-medium text-text">
                  Unité {r.unit.number}
                </div>
                <div className="truncate text-[12px] text-text-2">
                  {r.project.display_name}
                </div>
                <div className="text-[12px] text-text-3">
                  {r.unit.net_area_m2.value.toFixed(1)} m² · {r.unit.bedrooms.value} CH
                </div>
                <div className="mt-1.5">
                  <Badge basis={r.basis} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
