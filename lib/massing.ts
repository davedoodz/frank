/**
 * Geometry for the 3D building context view. A massing render is a flat image,
 * so a level is described by the three visible vertical edges of the facade:
 * each edge carries the top of the highest level and the ground, and every
 * level band is a linear step between them. This is deliberately coarse. The
 * massing says which band of exterior volume a floor occupies, nothing about
 * the rooms inside it.
 */
import type { MassingCorner, MassingModel } from "@/lib/types";

export type Point = { x: number; y: number };

/** Corner heights for one level, normalised 0 to 1 on the render. */
function edge(
  corner: MassingCorner,
  level: number,
  levels: number,
  model: MassingModel,
): { x: number; top: number; bottom: number } {
  const step = (corner.base - corner.top) / levels;
  return {
    x: corner.x / model.render_width,
    top: (corner.base - level * step) / model.render_height,
    bottom: (corner.base - (level - 1) * step) / model.render_height,
  };
}

/** The band of exterior volume one level occupies, as an SVG polygon in 0–1 space. */
export function levelBand(model: MassingModel, level: number): string | null {
  if (level < 1 || level > model.levels_in_render) return null;
  const edges = model.corners.map((c) =>
    edge(c, level, model.levels_in_render, model),
  );
  const top = edges.map((e) => `${e.x},${e.top}`);
  const bottom = [...edges].reverse().map((e) => `${e.x},${e.bottom}`);
  return [...top, ...bottom].join(" ");
}

/**
 * Approximate position of a unit on the facade: a point on the level band at
 * `t`, measured along the corner polyline. Only units the office mapped
 * explicitly have one; the rest get no marker rather than a guess.
 */
export function unitMarker(
  model: MassingModel,
  level: number,
  unitNumber: string,
): Point | null {
  const anchor = model.unit_anchors.find((a) => a.unit_number === unitNumber);
  if (!anchor || level < 1 || level > model.levels_in_render) return null;

  const edges = model.corners.map((c) =>
    edge(c, level, model.levels_in_render, model),
  );
  if (edges.length < 2) return null;

  const u = Math.min(Math.max(anchor.t, 0), 1) * (edges.length - 1);
  const i = Math.min(Math.floor(u), edges.length - 2);
  const f = u - i;
  const a = edges[i];
  const b = edges[i + 1];

  return {
    x: a.x + (b.x - a.x) * f,
    y:
      (a.top + (b.top - a.top) * f + (a.bottom + (b.bottom - a.bottom) * f)) /
      2,
  };
}

/** Whether a unit has a mapped position in the massing at all. */
export function hasAnchor(model: MassingModel, unitNumber: string): boolean {
  return model.unit_anchors.some((a) => a.unit_number === unitNumber);
}
