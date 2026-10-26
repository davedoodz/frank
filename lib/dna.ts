/**
 * Office DNA search (PRD section 12). The criteria are prefilled from the
 * current unit and live in the URL, so a result page, a compare page and a
 * handoff all carry the same search.
 */
import {
  getFloorById,
  getProjects,
  getSimilarities,
  getUnit,
} from "@/lib/data";
import type {
  Floor,
  Orientation,
  Project,
  SimilarityBasis,
  Unit,
} from "@/lib/types";

export type Criteria = {
  bedrooms: number | null;
  areaMin: number;
  areaMax: number;
  corner: boolean | null;
  orientation: Orientation | null;
};

export type Result = {
  unit: Unit;
  floor: Floor;
  project: Project;
  score: number;
  basis: SimilarityBasis;
};

export type Sort = "match" | "area" | "year" | "project";

export const SORTS: Sort[] = ["match", "area", "year", "project"];

/** One wording for the sort, shared by both result bars. */
export const SORT_LABEL: Record<Sort, string> = {
  match: "Meilleure correspondance",
  area: "Superficie",
  year: "Plus récent",
  project: "Projet",
};

const ORIENTATIONS: Orientation[] = ["N", "S", "E", "W", "NE", "NW", "SE", "SW"];

/** The orientations, written the way the interface labels them. */
export const ORIENTATION_LABEL: Record<Orientation, string> = {
  N: "Nord",
  S: "Sud",
  E: "Est",
  W: "Ouest",
  NE: "Nord-est",
  NW: "Nord-ouest",
  SE: "Sud-est",
  SW: "Sud-ouest",
};

/** The chips under a result card: configuration read off the record. */
export function unitChips(unit: Unit): string[] {
  return [
    unit.bedrooms.value === 0
      ? "Studio"
      : `${unit.bedrooms.value} chambre${unit.bedrooms.value === 1 ? "" : "s"}`,
    unit.is_corner.value ? "Unité de coin" : "Unité d’extrémité",
    ORIENTATION_LABEL[unit.orientation.value],
  ];
}

/** The search a technician starts from: this unit, ten percent of slack. */
export function defaultCriteria(unit: Unit): Criteria {
  const area = unit.net_area_m2.value;
  return {
    bedrooms: unit.bedrooms.value,
    areaMin: Math.floor((area * 0.9) / 5) * 5,
    areaMax: Math.ceil((area * 1.1) / 5) * 5,
    corner: unit.is_corner.value,
    orientation: unit.orientation.value,
  };
}

type Params = Record<string, string | string[] | undefined>;

function one(params: Params, key: string): string | undefined {
  const v = params[key];
  return Array.isArray(v) ? v[0] : v;
}

export function readCriteria(params: Params, unit: Unit): Criteria {
  const base = defaultCriteria(unit);
  const bed = one(params, "bed");
  const amin = Number(one(params, "amin"));
  const amax = Number(one(params, "amax"));
  const corner = one(params, "corner");
  const orient = one(params, "orient");

  return {
    bedrooms: bed === undefined ? base.bedrooms : bed === "any" ? null : Number(bed),
    areaMin: Number.isFinite(amin) && amin > 0 ? amin : base.areaMin,
    areaMax: Number.isFinite(amax) && amax > 0 ? amax : base.areaMax,
    corner:
      corner === undefined
        ? base.corner
        : corner === "any"
          ? null
          : corner === "yes",
    orientation:
      orient === undefined
        ? base.orientation
        : orient === "any"
          ? null
          : ORIENTATIONS.includes(orient as Orientation)
            ? (orient as Orientation)
            : base.orientation,
  };
}

/** Every criterion written out, so a link never falls back to a default. */
export function criteriaQuery(
  sourceNumber: string,
  c: Criteria,
  extra: Record<string, string | undefined> = {},
): string {
  const q = new URLSearchParams({
    u: sourceNumber,
    bed: c.bedrooms === null ? "any" : String(c.bedrooms),
    amin: String(c.areaMin),
    amax: String(c.areaMax),
    corner: c.corner === null ? "any" : c.corner ? "yes" : "no",
    orient: c.orientation ?? "any",
  });
  for (const [k, v] of Object.entries(extra)) if (v) q.set(k, v);
  return q.toString();
}

export function readSort(params: Params): Sort {
  const s = one(params, "sort");
  return SORTS.includes(s as Sort) ? (s as Sort) : "match";
}

export function readBasis(params: Params): SimilarityBasis | null {
  const b = one(params, "basis");
  const all: SimilarityBasis[] = ["layout", "area", "configuration", "type"];
  return all.includes(b as SimilarityBasis) ? (b as SimilarityBasis) : null;
}

function matches(unit: Unit, c: Criteria): boolean {
  if (c.bedrooms !== null && unit.bedrooms.value !== c.bedrooms) return false;
  const area = unit.net_area_m2.value;
  if (area < c.areaMin || area > c.areaMax) return false;
  if (c.corner !== null && unit.is_corner.value !== c.corner) return false;
  if (c.orientation !== null && unit.orientation.value !== c.orientation) {
    return false;
  }
  return true;
}

/** Archived units similar to this one, filtered by the criteria in the URL. */
export async function findSimilar(
  source: Unit,
  criteria: Criteria,
): Promise<Result[]> {
  const rows = await getSimilarities(source.id);
  const projects = await getProjects();
  const out: Result[] = [];

  for (const row of rows) {
    const unit = await getUnit(row.similar_unit_id);
    if (!unit || !matches(unit, criteria)) continue;
    const floor = await getFloorById(unit.floor_id);
    const project = projects.find((p) => p.id === unit.project_id);
    if (!floor || !project) continue;
    out.push({ unit, floor, project, score: row.score, basis: row.basis });
  }

  return out;
}

export function sortResults(results: Result[], sort: Sort): Result[] {
  const copy = [...results];
  if (sort === "area") {
    copy.sort((a, b) => a.unit.net_area_m2.value - b.unit.net_area_m2.value);
  } else if (sort === "year") {
    copy.sort((a, b) => b.project.year - a.project.year);
  } else if (sort === "project") {
    copy.sort(
      (a, b) =>
        a.project.display_name.localeCompare(b.project.display_name) ||
        a.unit.number.localeCompare(b.unit.number),
    );
  } else {
    copy.sort((a, b) => b.score - a.score);
  }
  return copy;
}

/** Configuration read off the record, used as the result's second caption. */
export function unitTags(unit: Unit): string[] {
  const tags = [`${unit.bedrooms.value} bed`];
  if (unit.is_corner.value) tags.push("corner unit");
  else tags.push("end unit");
  if (unit.has_balcony.value) tags.push("balcony");
  if (unit.bathrooms.value >= 2) tags.push("two bathrooms");
  return tags;
}
