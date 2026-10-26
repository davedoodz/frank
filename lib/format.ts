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

/**
 * Placeholder renders, cropped from reference imagery and shipped with the
 * fixture. A project created in this session has none and falls back to a flat
 * block carrying its code.
 */
const PROJECT_THUMB: Record<string, true> = {
  "P-2022-04": true,
  "P-2019-03": true,
  "P-2021-07": true,
};

export function projectThumb(code: string): string | null {
  return PROJECT_THUMB[code] ? `/fixtures/projects/${code}.png` : null;
}
