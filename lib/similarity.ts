/**
 * UnitSimilarity (PRD section 6, R3), computed from the indexed archive the
 * way the import would: same type, net area within range, corner flag, and
 * the proportion of the traced outline. One row per pair, the strongest basis
 * wins, and the score is only used to order results.
 */
import type { SimilarityBasis, Unit, UnitSimilarity } from "@/lib/types";

/** aspect of the outline's bounding box, long side over short side */
export function aspect(outline: [number, number][], widthPx: number, heightPx: number): number {
  const xs = outline.map((p) => p[0] * widthPx);
  const ys = outline.map((p) => p[1] * heightPx);
  const w = Math.max(...xs) - Math.min(...xs);
  const h = Math.max(...ys) - Math.min(...ys);
  if (w === 0 || h === 0) return 1;
  return Math.max(w, h) / Math.min(w, h);
}

export const BASIS_LABEL: Record<SimilarityBasis, string> = {
  layout: "close layout match",
  area: "close area match",
  configuration: "similar configuration",
  type: "same type",
};

type Shape = { unit: Unit; aspect: number };

/** 0 when the two values are equal, 1 when they are a full tolerance apart */
function spread(a: number, b: number): number {
  const base = Math.max(Math.abs(a), Math.abs(b), 0.001);
  return Math.abs(a - b) / base;
}

export function compare(
  source: Shape,
  candidate: Shape,
): { score: number; basis: SimilarityBasis } | null {
  const a = source.unit;
  const b = candidate.unit;

  const sameType = a.type_qc.value === b.type_qc.value;
  const sameBedrooms = a.bedrooms.value === b.bedrooms.value;
  if (!sameType && !sameBedrooms) return null;

  const areaGap = spread(a.net_area_m2.value, b.net_area_m2.value);
  if (areaGap > 0.25) return null;

  const aspectGap = spread(source.aspect, candidate.aspect);
  const cornerMatch = a.is_corner.value === b.is_corner.value;
  const bathMatch = a.bathrooms.value === b.bathrooms.value;

  // 1 is identical. Area and proportion carry the weight, the flags trim it.
  const score =
    0.42 * (1 - Math.min(areaGap / 0.25, 1)) +
    0.28 * (1 - Math.min(aspectGap / 0.5, 1)) +
    0.12 * (sameType ? 1 : 0) +
    0.08 * (sameBedrooms ? 1 : 0) +
    0.06 * (cornerMatch ? 1 : 0) +
    0.04 * (bathMatch ? 1 : 0);

  const basis: SimilarityBasis =
    sameType && cornerMatch && aspectGap <= 0.12 && areaGap <= 0.08
      ? "layout"
      : areaGap <= 0.1
        ? "area"
        : sameType || sameBedrooms
          ? "configuration"
          : "type";

  return { score: Math.round(score * 1000) / 1000, basis };
}

/**
 * Every current unit against every archived unit. The archive is 32 rows in
 * the fixture, so the full product is cheap and runs once per process.
 */
export function buildSimilarities(
  current: Unit[],
  archive: Unit[],
  dimensions: (unit: Unit) => { widthPx: number; heightPx: number },
): UnitSimilarity[] {
  const shape = (unit: Unit): Shape => {
    const { widthPx, heightPx } = dimensions(unit);
    return { unit, aspect: aspect(unit.outline, widthPx, heightPx) };
  };

  const candidates = archive.map(shape);
  const rows: UnitSimilarity[] = [];

  for (const source of current.map(shape)) {
    for (const candidate of candidates) {
      const hit = compare(source, candidate);
      if (!hit) continue;
      rows.push({
        unit_id: source.unit.id,
        similar_unit_id: candidate.unit.id,
        score: hit.score,
        basis: hit.basis,
      });
    }
  }

  return rows.sort((a, b) => b.score - a.score);
}
