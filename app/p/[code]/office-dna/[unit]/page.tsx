import Link from "next/link";
import { notFound } from "next/navigation";
import AddToCollectionDialog from "@/components/dna/AddToCollectionDialog";
import ArchiveUnitPanel from "@/components/dna/ArchiveUnitPanel";
import CropViewer from "@/components/dna/CropViewer";
import DrawingTabs from "@/components/dna/DrawingTabs";
import OpenDrawingDialog from "@/components/dna/OpenDrawingDialog";
import SimilarRail from "@/components/dna/SimilarRail";
import { DimensionTable, RoomTable } from "@/components/dna/UnitTables";
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
} from "@/lib/dna";

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
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex h-12 shrink-0 items-center gap-4 border-b border-line px-6">
        <Link
          href={`/p/${project.project_code}/office-dna?${search}`}
          className="text-body text-ink-2 transition-colors duration-[80ms] hover:text-ink"
        >
          back to results
        </Link>
        <span className="font-mono text-meta text-ink-3">
          unit {archived.number} · {sourceProject.display_name} ·{" "}
          {sourceProject.year}
        </span>

        <span className="flex-1" />

        <Link
          href={`/p/${project.project_code}/office-dna/compare?a=${archived.id}&b=${source.id}&${search}`}
          className="text-body text-ink transition-colors duration-[80ms] hover:text-accent"
        >
          compare with unit {source.number}
        </Link>
        <span className="text-ink-3">·</span>
        <OpenDrawingDialog
          code={project.project_code}
          unitId={archived.id}
          unitNumber={archived.number}
          projectName={sourceProject.display_name}
          sheet={floor.sheet_number}
          filename={floor.source_file}
          revision={floor.revision_date}
          drawingStatus={drawingStatus}
        />
        <span className="text-ink-3">·</span>
        <AddToCollectionDialog
          code={project.project_code}
          unitId={archived.id}
          unitNumber={archived.number}
          projectName={sourceProject.display_name}
          summary={`${archived.type_qc.value} · ${archived.net_area_m2.value.toFixed(1)} m² · ${floor.label}`}
          collections={collections.map((c) => c.collection)}
          saved={saved}
        />
      </div>

      <div className="flex min-h-0 flex-1">
        <SimilarRail
          code={project.project_code}
          query={search}
          results={results}
          currentId={archived.id}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <DrawingTabs
            plan={<CropViewer unit={archived} floor={floor} />}
            rooms={<RoomTable unit={archived} rooms={rooms} />}
            dimensions={<DimensionTable unit={archived} floor={floor} />}
          />
        </div>

        <ArchiveUnitPanel
          unit={archived}
          floor={floor}
          project={sourceProject}
          basis={hit?.basis ?? null}
          score={hit?.score ?? null}
          sourceNumber={source.number}
          sourceArea={source.net_area_m2.value}
        />
      </div>
    </div>
  );
}
