import Link from "next/link";
import { notFound } from "next/navigation";
import AddToCollectionDialog from "@/components/dna/AddToCollectionDialog";
import ArchiveUnitPanel from "@/components/dna/ArchiveUnitPanel";
import Badge from "@/components/dna/Badge";
import DrawingTabs from "@/components/dna/DrawingTabs";
import OpenDrawingDialog from "@/components/dna/OpenDrawingDialog";
import SimilarRail from "@/components/dna/SimilarRail";
import { BTN, BTN_ICON } from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import {
  getCollectionItems,
  getFloorById,
  getProject,
  getProjects,
  getRooms,
  getUnit,
  getUnits,
} from "@/lib/data";
import {
  criteriaQuery,
  findSimilar,
  readBasis,
  readCriteria,
  readSort,
  sortResults,
  unitChips,
} from "@/lib/dna";
import { projectThumb } from "@/lib/format";

export default async function ArchiveUnitPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string; unit: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { code, unit: unitId } = await params;
  const query = await searchParams;
  const project = await getProject(decodeURIComponent(code));
  if (!project) notFound();

  const archived = await getUnit(unitId);
  const floor = archived ? await getFloorById(archived.floor_id) : null;
  if (!archived || !floor || archived.project_id === project.id) notFound();

  const sourceProject = (await getProjects()).find(
    (p) => p.id === archived.project_id,
  );
  if (!sourceProject) notFound();

  const units = await getUnits(project.id);
  const asked = Array.isArray(query.u) ? query.u[0] : query.u;
  const source = units.find((u) => u.number === asked) ?? units[0];
  const criteria = readCriteria(query, source);
  const basis = readBasis(query);
  const sort = readSort(query);

  const all = await findSimilar(source, criteria);
  const results = sortResults(
    basis ? all.filter((r) => r.basis === basis) : all,
    sort,
  );
  const hit = all.find((r) => r.unit.id === archived.id) ?? null;

  /** The unit on screen stays in the rail even when the filter excludes it. */
  const rail = results.some((r) => r.unit.id === archived.id)
    ? results
    : [
        {
          unit: archived,
          floor,
          project: sourceProject,
          score: hit?.score ?? 0,
          basis: hit?.basis ?? ("type" as const),
        },
        ...results,
      ];

  const rooms = await getRooms(archived.id);
  const collections = await getCollectionItems(project.id);
  const saved = collections.some((c) =>
    c.items.some((i) => i.unit_id === archived.id),
  );

  const search = criteriaQuery(source.number, criteria, {
    basis: basis ?? undefined,
    sort,
  });
  const drawingStatus =
    sourceProject.drawings.find((d) => d.filename === floor.source_file)
      ?.status ?? "connected";

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-app">
      <header className="flex shrink-0 items-start justify-between gap-6 px-6 py-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[28px] font-semibold tracking-tight text-text">
              Unité {archived.number}
            </h1>
            {hit ? <Badge basis={hit.basis} /> : null}
          </div>
          <div className="mt-1 text-[13px] text-text-2">
            {sourceProject.display_name} · {sourceProject.city},{" "}
            {sourceProject.province} · {sourceProject.year}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/p/${project.project_code}/office-dna?${search}`}
            className={BTN}
          >
            <Icon name="chevron-left" size={14} />
            Retour aux résultats
          </Link>
          <Link
            href={`/p/${project.project_code}/office-dna/compare?a=${archived.id}&b=${source.id}&${search}`}
            className={BTN}
          >
            <Icon name="compare" size={14} />
            Comparer
          </Link>
          <OpenDrawingDialog
            code={project.project_code}
            unitId={archived.id}
            unitNumber={archived.number}
            projectName={sourceProject.display_name}
            city={sourceProject.city}
            year={sourceProject.year}
            sheet={floor.sheet_number}
            filename={floor.source_file}
            revision={floor.revision_date}
            drawingStatus={drawingStatus}
            variant="dark"
          />
          <AddToCollectionDialog
            code={project.project_code}
            unitId={archived.id}
            unitNumber={archived.number}
            projectName={sourceProject.display_name}
            city={sourceProject.city}
            year={sourceProject.year}
            filename={floor.source_file}
            revision={floor.revision_date}
            summary={`${archived.type_qc.value} · ${archived.net_area_m2.value.toFixed(1)} m² · ${floor.label}`}
            chips={unitChips(archived)}
            collections={collections.map((c) => c.collection)}
            saved={saved}
            preview={{ unit: archived, floor }}
            basis={hit?.basis ?? null}
            currentProject={{
              display_name: project.display_name,
              city: project.city,
              thumb: projectThumb(project.project_code),
            }}
            variant="plain"
          />
          <button type="button" aria-label="Plus d’actions" className={BTN_ICON}>
            <Icon name="more" size={14} />
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 gap-4 px-6 pb-6">
        <SimilarRail
          code={project.project_code}
          query={search}
          results={rail}
          currentId={archived.id}
        />

        <DrawingTabs unit={archived} floor={floor} rooms={rooms} />

        <ArchiveUnitPanel
          unit={archived}
          floor={floor}
          project={sourceProject}
          rooms={rooms}
          basis={hit?.basis ?? null}
        />
      </div>
    </div>
  );
}
