import Link from "next/link";
import { notFound } from "next/navigation";
import CollectionList from "@/components/dna/CollectionList";
import CriteriaBar from "@/components/dna/CriteriaBar";
import ResultFilters from "@/components/dna/ResultFilters";
import ResultGrid from "@/components/dna/ResultGrid";
import {
  getCollectionItems,
  getFloorById,
  getProject,
  getProjects,
  getUnits,
} from "@/lib/data";
import {
  defaultCriteria,
  findSimilar,
  readBasis,
  readCriteria,
  readSort,
  sortResults,
} from "@/lib/dna";
import type { SimilarityBasis } from "@/lib/types";

export default async function OfficeDnaTab({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { code } = await params;
  const query = await searchParams;
  const project = await getProject(decodeURIComponent(code));
  if (!project) notFound();

  const units = await getUnits(project.id);
  if (units.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-meta text-ink-2">
        no unit indexed in this project
      </div>
    );
  }

  const asked = Array.isArray(query.u) ? query.u[0] : query.u;
  const source = units.find((u) => u.number === asked) ?? units[0];
  const criteria = readCriteria(query, source);
  const basis = readBasis(query);
  const sort = readSort(query);

  const all = await findSimilar(source, criteria);
  const counts = all.reduce(
    (acc, r) => {
      acc[r.basis] += 1;
      return acc;
    },
    { layout: 0, area: 0, configuration: 0, type: 0 } as Record<
      SimilarityBasis,
      number
    >,
  );
  const results = sortResults(
    basis ? all.filter((r) => r.basis === basis) : all,
    sort,
  );

  const sourceFloor = await getFloorById(source.floor_id);
  const projects = await getProjects();
  const indexed = projects.filter(
    (p) =>
      p.id !== project.id &&
      p.drawings.some((d) => d.status === "indexed"),
  );
  const collections = await getCollectionItems(project.id);


  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="border-b border-line px-6 py-3">
        <CriteriaBar
          code={project.project_code}
          sourceNumber={source.number}
          criteria={criteria}
          defaults={defaultCriteria(source)}
          extra={{ basis: basis ?? undefined, sort }}
        />
        <div className="mt-2 font-mono text-meta text-ink-3">
          {source.number} · {source.type_qc.value} ·{" "}
          {source.net_area_m2.value.toFixed(1)} m² ·{" "}
          {sourceFloor ? `${sourceFloor.label} · ${sourceFloor.sheet_number}` : "—"}{" "}
          ·{" "}
          <Link
            href={`/p/${project.project_code}/units?floor=${sourceFloor?.level ?? 0}&u=${source.number}`}
            className="text-ink-2 transition-colors duration-[80ms] hover:text-ink"
          >
            open on the plan
          </Link>
        </div>
      </div>

      <div className="border-b border-line px-6 py-3">
        <ResultFilters
          code={project.project_code}
          sourceNumber={source.number}
          criteria={criteria}
          basis={basis}
          sort={sort}
          total={all.length}
          counts={counts}
        />
        <div className="mt-2 font-mono text-meta text-ink-3">
          searching {indexed.length} indexed past{" "}
          {indexed.length === 1 ? "project" : "projects"} ·{" "}
          {indexed.map((p) => `${p.display_name} ${p.year}`).join(" · ")}
        </div>
      </div>

      <div className="p-6">
        <ResultGrid
          code={project.project_code}
          sourceNumber={source.number}
          criteria={criteria}
          basis={basis}
          sort={sort}
          results={results}
        />

        <CollectionList
          code={project.project_code}
          collections={collections}
        />
      </div>
    </div>
  );
}
