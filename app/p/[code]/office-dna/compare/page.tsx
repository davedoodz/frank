import { notFound } from "next/navigation";
import CompareView, { type Side } from "@/components/dna/CompareView";
import {
  getFloorById,
  getProject,
  getProjects,
  getRooms,
  getSimilarities,
  getUnit,
  getUnits,
} from "@/lib/data";
import { criteriaQuery, readBasis, readCriteria, readSort } from "@/lib/dna";
import type { SimilarityBasis } from "@/lib/types";

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

  // the match basis that put these two units side by side, if any: written
  // from the current (live) unit toward the unit it is similar to
  async function matchBasis(a: Side, b: Side): Promise<SimilarityBasis | null> {
    const fromA = (await getSimilarities(a.unit.id)).find((r) => r.similar_unit_id === b.unit.id);
    if (fromA) return fromA.basis;
    const fromB = (await getSimilarities(b.unit.id)).find((r) => r.similar_unit_id === a.unit.id);
    return fromB ? fromB.basis : null;
  }
  const basis = await matchBasis(left, right);

  // the back-to-unit link only resolves for the archived side: the page that
  // reads it 404s on a unit that belongs to the current project
  const archivedSide = left.unit.project_id !== project.id ? left : right.unit.project_id !== project.id ? right : null;
  const unitBackHref = archivedSide
    ? `/p/${project.project_code}/office-dna/${archivedSide.unit.id}?${search}`
    : null;

  return (
    <CompareView
      left={left}
      right={right}
      leftBasis={basis}
      rightBasis={basis}
      projectCode={project.project_code}
      unitBackHref={unitBackHref}
      resultsHref={`/p/${project.project_code}/office-dna?${search}`}
      swapHref={`/p/${project.project_code}/office-dna/compare?a=${right.unit.id}&b=${left.unit.id}&${search}`}
    />
  );
}
