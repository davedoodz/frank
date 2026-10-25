/** Centroid of the outline's bounding box: enough to order units for arrow-key moves. */
export function centroid(outline: [number, number][]): [number, number] {
  const xs = outline.map((p) => p[0]);
  const ys = outline.map((p) => p[1]);
  return [
    (Math.min(...xs) + Math.max(...xs)) / 2,
    (Math.min(...ys) + Math.max(...ys)) / 2,
  ];
}
