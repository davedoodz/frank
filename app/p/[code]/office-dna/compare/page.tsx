import Link from "next/link";
import { notFound } from "next/navigation";
import CompareView, { type Side } from "@/components/dna/CompareView";
import {
  getFloorById,
  getProject,
  getProjects,
  getRooms,
  getUnit,
  getUnits,
} from "@/lib/data";
import {
  criteriaQuery,
  readBasis,
  readCriteria,
  readSort,
} from "@/lib/dna";

export default async function ComparePage({
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

  const projects = await getProjects();

  async function side(unitId: string | undefined): Promise<Side | null> {
    if (!unitId) return null;
    const unit = await getUnit(unitId);
    if (!unit) return null;
    const floor = await getFloorById(unit.floor_id);
    const owner = projects.find((p) => p.id === unit.project_id);
    if (!floor || !owner) return null;
    return { unit, floor, project: owner, rooms: await getRooms(unit.id) };
  }

  const one = (key: string) => {
    const v = query[key];
    return Array.isArray(v) ? v[0] : v;
  };

  const left = await side(one("a"));
  const right = await side(one("b"));
  if (!left || !right) notFound();

  const units = await getUnits(project.id);
  const source =
    units.find((u) => u.number === one("u")) ??
    (right.unit.project_id === project.id ? right.unit : units[0]);
  const search = criteriaQuery(source.number, readCriteria(query, source), {
    basis: readBasis(query) ?? undefined,
    sort: readSort(query),
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex h-12 shrink-0 items-center gap-4 border-b border-line px-6">
        <Link
          href={`/p/${project.project_code}/office-dna/${left.unit.id}?${search}`}
          className="text-body text-ink-2 transition-colors duration-[80ms] hover:text-ink"
        >
          back to unit {left.unit.number}
        </Link>
        <span className="font-mono text-meta text-ink-3">
          {left.unit.number} {left.project.display_name} ·{" "}
          {right.unit.number} {right.project.display_name}
        </span>
        <span className="flex-1" />
        <Link
          href={`/p/${project.project_code}/office-dna/compare?a=${right.unit.id}&b=${left.unit.id}&${search}`}
          className="text-body text-ink-2 transition-colors duration-[80ms] hover:text-ink"
        >
          swap sides
        </Link>
        <span className="text-ink-3">·</span>
        <Link
          href={`/p/${project.project_code}/office-dna?${search}`}
          className="text-body text-ink-2 transition-colors duration-[80ms] hover:text-ink"
        >
          back to results
        </Link>
      </div>

      <CompareView left={left} right={right} />
    </div>
  );
}
