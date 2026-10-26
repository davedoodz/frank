import type { AreaUnit } from "@/lib/prefs";
import type { TypeQc } from "@/lib/types";

/** The fallback threshold. The settings screen can move it per office. */
export const LOW_CONFIDENCE = 0.7;

/** Quebec drawings carry m²; marketing carries ft². Store m², show both. */
export function ft2(m2: number): number {
  return Math.round(m2 * 10.764);
}

/** One area, written the way the office asked for it on the settings screen. */
export function area(m2: number | null, unit: AreaUnit = "both"): string {
  if (m2 === null) return "—";
  if (unit === "m2") return `${m2.toFixed(1)} m²`;
  if (unit === "ft2") return `${ft2(m2)} ft²`;
  return `${m2.toFixed(1)} m² · ${ft2(m2)} ft²`;
}

export const TYPOLOGY_ORDER: TypeQc[] = ["studio", "3½", "4½", "5½", "6½", "other"];

/** One hue per apartment type, used on the plan, in dots and in legends. */
const TYPOLOGY_COLOR: Record<string, string> = {
  studio: "#f59e0b",
  "3½": "#22c55e",
  "4½": "#3b82f6",
  "5½": "#8b5cf6",
  "6½": "#ec4899",
  other: "#94a3b8",
};

export function typologyColor(type: string): string {
  return TYPOLOGY_COLOR[type] ?? TYPOLOGY_COLOR.other;
}

/** Plans are labelled in Quebec notation; the interface counts bedrooms. */
const BEDROOM_COUNT: Record<string, number> = {
  studio: 0,
  "3½": 1,
  "4½": 2,
  "5½": 3,
  "6½": 4,
};

/** Short form for the plan and the schedule: "2 CH". */
export function brLabel(type: string): string {
  const n = BEDROOM_COUNT[type];
  if (n === undefined) return type;
  return n === 0 ? "Studio" : `${n} CH`;
}

/** Long form for the unit panel: "2 chambres". */
export function bedroomLabel(type: string): string {
  const n = BEDROOM_COUNT[type];
  if (n === undefined) return type;
  if (n === 0) return "Studio";
  return n === 1 ? "1 chambre" : `${n} chambres`;
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
  "P-2023-01": true,
  "P-2020-06": true,
  "P-2018-09": true,
  "P-2024-02": true,
};

export function projectThumb(code: string): string | null {
  return PROJECT_THUMB[code] ? `/fixtures/projects/${code}.png` : null;
}

/**
 * The dashboard reads in elapsed time, not dates: the project modified today is
 * the one still open on someone's screen.
 */
export function since(isoDate: string): string {
  const days = Math.max(
    0,
    Math.round((Date.now() - Date.parse(`${isoDate}T12:00:00Z`)) / 86_400_000),
  );
  if (days === 0) return "modifié aujourd'hui";
  if (days === 1) return "modifié hier";
  if (days < 14) return `modifié il y a ${days} jours`;
  if (days < 60) return `modifié il y a ${Math.round(days / 7)} semaines`;
  return `modifié il y a ${Math.round(days / 30)} mois`;
}
