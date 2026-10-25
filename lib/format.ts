import type { TypeQc } from "@/lib/types";

/** Fields extracted below this confidence render muted with a dotted underline. */
export const LOW_CONFIDENCE = 0.7;

/** Quebec drawings carry m²; marketing carries ft². Store m², show both. */
export function ft2(m2: number): number {
  return Math.round(m2 * 10.764);
}

export const TYPOLOGY_ORDER: TypeQc[] = ["studio", "3½", "4½", "5½", "6½", "other"];

const TYPOLOGY_COLOR: Record<string, string> = {
  studio: "#8a8a85",
  "3½": "#5b7a99",
  "4½": "#6f8f5e",
  "5½": "#a3733f",
  "6½": "#b06a8a",
  other: "#b06a8a",
};

export function typologyColor(type: string): string {
  return TYPOLOGY_COLOR[type] ?? TYPOLOGY_COLOR.other;
}
