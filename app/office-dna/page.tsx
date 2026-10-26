import Link from "next/link";
import AppSidebar from "@/components/AppSidebar";
import GlobalCriteriaBar from "@/components/dna/GlobalCriteriaBar";
import GlobalResultFilters from "@/components/dna/GlobalResultFilters";
import GlobalSourcePicker from "@/components/dna/GlobalSourcePicker";
import ResultGrid from "@/components/dna/ResultGrid";
import { getAllUnits, getFloorById, getProjects, getUnits } from "@/lib/data";
import {
  defaultCriteria,
  findSimilar,
  readBasis,
  readCriteria,
  readSort,
  sortResults,
} from "@/lib/dna";
import type { Project, SimilarityBasis, Unit } from "@/lib/types";

type Query = Record<string, string | string[] | undefined>;

function one(query: Query, key: string): string | undefined {
  const v = query[key];
  return Array.isArray(v) ? v[0] : v;
}

/**
 * Office-wide entry to the similarity search: pick any unit from any indexed
 * project in the office, not just the one you happen to have open, and search
 * the whole archive from it. `?p=` and `?u=` carry the source; the criteria
 * and result params read by `lib/dna` carry the rest, exactly as they do
 * inside a project.
 */
export default async function GlobalOfficeDnaPage({
  searchParams,
}: {
  searchParams: Promise<Query>;
}) {
  const query = await searchParams;

  const [projects, allUnits] = await Promise.all([
    getProjects(),
    getAllUnits(),
  ]);

  const withUnits: { project: Project; units: Unit[] }[] = [];
  for (const project of projects) {
    const units = await getUnits(project.id);
    if (units.length > 0) withUnits.push({ project, units });
  }

  if (withUnits.length === 0) {
    return (
      <div className="flex h-screen">
        <AppSidebar active="office-dna" />
        <div className="flex min-w-0 flex-1 items-center justify-center bg-surface text-meta text-ink-2">
          aucune unité indexée dans l’agence pour l’instant
        </div>
      </div>
    );
  }

  const askedProject = one(query, "p");
  const picked =
    withUnits.find((e) => e.project.project_code === askedProject) ??
    withUnits[0];
  const projectDefaulted = picked.project.project_code !== askedProject;

  const askedUnit = one(query, "u");
  const source =
    picked.units.find((u) => u.number === askedUnit) ?? picked.units[0];
  const unitDefaulted = source.number !== askedUnit;

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
  const indexedProjects = projects.filter((p) =>
    p.drawings.some((d) => d.status === "indexed"),
  );

  return (
    <div className="flex h-screen">
      <AppSidebar active="office-dna" />

      <div className="flex min-w-0 flex-1 flex-col bg-surface">
        <header className="px-6 pt-6 pb-4">
          <h1 className="text-title-lg text-ink">ADN de l’agence</h1>
          <p className="mt-1 text-body text-ink-2">
            {indexedProjects.length}{" "}
            {indexedProjects.length === 1 ? "projet" : "projets"} indexés
            dans l’agence · {allUnits.length} unités conservées
          </p>
        </header>

        {/* One strip for the source. The picker already names the project and
            the unit, so the line beside it carries only what the picker
            cannot: the size, where it sits, and the sheet it came from. */}
        <div className="border-b border-line px-6 py-3">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <GlobalSourcePicker
              projects={withUnits.map((e) => e.project)}
              projectCode={picked.project.project_code}
              units={picked.units}
              unitNumber={source.number}
            />
            <span className="font-mono text-meta text-ink-3">
              {source.net_area_m2.value.toFixed(1)} m²
              {sourceFloor
                ? ` · ${sourceFloor.label} · ${sourceFloor.sheet_number}`
                : ""}{" "}
              ·{" "}
              <Link
                href={`/p/${picked.project.project_code}/units?floor=${
                  sourceFloor?.level ?? 0
                }&u=${source.number}`}
                className="text-ink-2 underline-offset-2 transition-colors duration-[80ms] hover:text-ink hover:underline"
              >
                ouvrir sur le plan
              </Link>
            </span>
          </div>

          {projectDefaulted || unitDefaulted ? (
            <p className="mt-2 font-mono text-meta text-ink-3">
              aucune source choisie — première unité indexée de l’agence
            </p>
          ) : null}

          <div className="mt-3">
            <GlobalCriteriaBar
              code={picked.project.project_code}
              sourceNumber={source.number}
              criteria={criteria}
              defaults={defaultCriteria(source)}
              extra={{ basis: basis ?? undefined, sort }}
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="border-b border-line px-6 py-3">
            <GlobalResultFilters
              code={picked.project.project_code}
              sourceNumber={source.number}
              criteria={criteria}
              basis={basis}
              sort={sort}
              total={all.length}
              counts={counts}
            />
          </div>

          <div className="p-6">
            <ResultGrid
              code={picked.project.project_code}
              sourceNumber={source.number}
              criteria={criteria}
              basis={basis}
              sort={sort}
              view="grid"
              selectedId={null}
              results={results}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
