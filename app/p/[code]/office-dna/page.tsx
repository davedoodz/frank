import { notFound } from "next/navigation";
import CollectionList from "@/components/dna/CollectionList";
import CriteriaBar from "@/components/dna/CriteriaBar";
import ResultFilters from "@/components/dna/ResultFilters";
import ResultGrid from "@/components/dna/ResultGrid";
import ResultPanel from "@/components/dna/ResultPanel";
import {
  getCollectionItems,
  getFloorById,
  getProject,
  getProjects,
  getUnits,
} from "@/lib/data";
import {
  criteriaQuery,
  defaultCriteria,
  findSimilar,
  readBasis,
  readCriteria,
  readSort,
  sortResults,
} from "@/lib/dna";
import { brLabel, projectThumb } from "@/lib/format";
import type { SimilarityBasis } from "@/lib/types";

/**
 * Office DNA (flow C, step 2). The search arrives prefilled from the unit open
 * in AutoCAD, the gallery holds real archived sheets, and the panel on the
 * right is the quick reading of whichever result is selected.
 */
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
      <div className="flex-1 p-6">
        <div className="panel px-6 py-16 text-center text-[13px] text-text-2">
          Ce projet n’a pas encore d’unité indexée à partir de laquelle effectuer une recherche.
        </div>
      </div>
    );
  }

  const one = (key: string) => {
    const v = query[key];
    return Array.isArray(v) ? v[0] : v;
  };

  const source = units.find((u) => u.number === one("u")) ?? units[0];
  const criteria = readCriteria(query, source);
  const basis = readBasis(query);
  const sort = readSort(query);
  const view = one("view") === "list" ? "list" : "grid";

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

  const asked = one("sel");
  const index = Math.max(
    0,
    results.findIndex((r) => r.unit.id === asked),
  );
  const selected = asked === "none" ? null : (results[index] ?? null);

  const sourceFloor = await getFloorById(source.floor_id);
  const projects = await getProjects();
  const indexed = projects.filter(
    (p) => p.id !== project.id && p.drawings.some((d) => d.status === "indexed"),
  );
  const collections = await getCollectionItems(project.id);

  const search = criteriaQuery(source.number, criteria, {
    basis: basis ?? undefined,
    sort,
  });
  const link = (sel: string | undefined) =>
    `/p/${project.project_code}/office-dna?${criteriaQuery(
      source.number,
      criteria,
      {
        basis: basis ?? undefined,
        sort,
        view: view === "list" ? "list" : undefined,
        sel,
      },
    )}`;

  const drawingStatus = selected
    ? (selected.project.drawings.find(
        (d) => d.filename === selected.floor.source_file,
      )?.status ?? "connected")
    : "connected";

  return (
    <div className="flex min-h-0 flex-1">
      <div className="min-w-0 flex-1 overflow-y-auto px-6 pb-10">
        {/* Named "Précédents", not "ADN de l’agence": the rail already has an
            agency-wide entry under that name, and two live entries with one
            name is what made the rail unreadable. This one is narrower — it
            searches the archive for units like a unit in *this* project. */}
        <header className="pt-1">
          <h1 className="text-[28px] font-semibold tracking-tight text-text">
            Précédents
          </h1>
          <p className="mt-1 text-[13px] text-text-2">
            Unités d’anciens projets semblables à l’unité {source.number} ·{" "}
            {indexed.length}{" "}
            {indexed.length === 1 ? "projet indexé" : "projets indexés"}
          </p>
        </header>

        <CriteriaBar
          code={project.project_code}
          sourceNumber={source.number}
          sourceArea={source.net_area_m2.value}
          criteria={criteria}
          defaults={defaultCriteria(source)}
          extra={{
            basis: basis ?? undefined,
            sort,
            view: view === "list" ? "list" : undefined,
            sel: selected?.unit.id,
          }}
          sources={units.map((u) => ({
            number: u.number,
            summary: `${brLabel(u.type_qc.value)} · ${u.net_area_m2.value.toFixed(1)} m²`,
          }))}
        />

        <p className="mt-2 text-[12px] text-text-3">
          {source.net_area_m2.value.toFixed(1)} m² ·{" "}
          {brLabel(source.type_qc.value)}
          {sourceFloor ? ` · ${sourceFloor.label} · ${sourceFloor.sheet_number}` : ""}
        </p>

        <ResultFilters
          code={project.project_code}
          sourceNumber={source.number}
          criteria={criteria}
          basis={basis}
          sort={sort}
          view={view}
          selectedId={selected?.unit.id ?? null}
          total={all.length}
          counts={counts}
        />

        <ResultGrid
          code={project.project_code}
          sourceNumber={source.number}
          criteria={criteria}
          basis={basis}
          sort={sort}
          view={view}
          results={results}
          selectedId={selected?.unit.id ?? null}
        />

        <CollectionList
          code={project.project_code}
          search={search}
          collections={collections}
        />
      </div>

      {selected ? (
        <ResultPanel
          code={project.project_code}
          result={selected}
          source={source}
          search={search}
          closeHref={link("none")}
          prevHref={index > 0 ? link(results[index - 1].unit.id) : null}
          nextHref={
            index < results.length - 1 ? link(results[index + 1].unit.id) : null
          }
          collections={collections.map((c) => c.collection)}
          saved={collections.some((c) =>
            c.items.some((i) => i.unit_id === selected.unit.id),
          )}
          drawingStatus={drawingStatus}
          currentProject={{
            display_name: project.display_name,
            city: project.city,
            thumb: projectThumb(project.project_code),
          }}
        />
      ) : null}
    </div>
  );
}
