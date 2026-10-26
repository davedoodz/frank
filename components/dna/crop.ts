/**
 * A result cell shows the unit, not the sheet. The crop is the outline's
 * bounding box grown to the cell's aspect so every cell is the same shape,
 * with a margin of surrounding linework for context. Coordinates stay
 * normalised 0 to 1 on the floor image, like the outlines themselves.
 */
import type { Floor, Unit } from "@/lib/types";

export type Box = { x: number; y: number; w: number; h: number };

export function bbox(outline: [number, number][]): Box {
  const xs = outline.map((p) => p[0]);
  const ys = outline.map((p) => p[1]);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
}

/** The unit in metres, from the outline and the sheet's px_per_m. */
export function dimensions(unit: Unit, floor: Floor): { w: number; h: number } {
  const b = bbox(unit.outline);
  return {
    w: (b.w * floor.width_px) / floor.px_per_m,
    h: (b.h * floor.height_px) / floor.px_per_m,
  };
}

/**
 * @param aspect width over height of the cell
 * @param margin share of the unit's longest side kept around it
 */
export function cropBox(
  unit: Unit,
  floor: Floor,
  aspect: number,
  margin = 0.14,
): Box {
  const b = bbox(unit.outline);
  const pxW = floor.width_px;
  const pxH = floor.height_px;

  // work in pixels: a normalised box is not square on a 6600 by 4800 sheet
  let w = b.w * pxW;
  let h = b.h * pxH;
  const pad = Math.max(w, h) * margin;
  w += pad * 2;
  h += pad * 2;

  if (w / h < aspect) w = h * aspect;
  else h = w / aspect;

  const cx = (b.x + b.w / 2) * pxW;
  const cy = (b.y + b.h / 2) * pxH;

  return {
    x: (cx - w / 2) / pxW,
    y: (cy - h / 2) / pxH,
    w: w / pxW,
    h: h / pxH,
  };
}

/**
 * The same crop, sized in metres instead of in sheet fractions: two units on
 * two sheets with different px_per_m come out at one real-world scale, which
 * is what the compare workspace needs.
 */
export function cropBoxMetres(
  unit: Unit,
  floor: Floor,
  aspect: number,
  widthM: number,
): Box {
  const b = bbox(unit.outline);
  const w = widthM * floor.px_per_m;
  const h = w / aspect;
  const cx = (b.x + b.w / 2) * floor.width_px;
  const cy = (b.y + b.h / 2) * floor.height_px;

  return {
    x: (cx - w / 2) / floor.width_px,
    y: (cy - h / 2) / floor.height_px,
    w: w / floor.width_px,
    h: h / floor.height_px,
  };
}
