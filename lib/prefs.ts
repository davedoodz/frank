/**
 * Office preferences, the shapes only. One cookie holds them. These are the
 * only settings that exist: if a control is on the settings screen, it changes
 * what the schedule, the plan panel and the floor statistics render.
 *
 * Reading and writing the cookie lives in `lib/prefs.server.ts`, so a client
 * component can import these types and labels without pulling `next/headers`
 * into the browser bundle.
 */

export const PREFS_COOKIE = "fitte_prefs";

export type AreaUnit = "m2" | "ft2" | "both";
export type Density = "regular" | "dense";

export type Prefs = {
  /** Which area unit the interface shows. Storage stays m² either way. */
  area: AreaUnit;
  /** A field extracted below this renders muted with a dotted underline. */
  lowConfidence: number;
  /** Row height in the schedule and the unit table. */
  density: Density;
  /** Typology fills on the plan, on by default. */
  typologyFills: boolean;
};

export const DEFAULT_PREFS: Prefs = {
  area: "both",
  lowConfidence: 0.7,
  density: "regular",
  typologyFills: true,
};

export const AREA_LABEL: Record<AreaUnit, string> = {
  m2: "mètres carrés",
  ft2: "pieds carrés",
  both: "les deux, m² d’abord",
};

export const DENSITY_LABEL: Record<Density, string> = {
  regular: "normale",
  dense: "dense",
};

export function coercePrefs(raw: unknown): Prefs {
  const row = (raw ?? {}) as Partial<Prefs>;
  const area: AreaUnit =
    row.area === "m2" || row.area === "ft2" || row.area === "both"
      ? row.area
      : DEFAULT_PREFS.area;
  const low = Number(row.lowConfidence);
  return {
    area,
    lowConfidence:
      Number.isFinite(low) && low > 0 && low <= 1
        ? low
        : DEFAULT_PREFS.lowConfidence,
    density: row.density === "dense" ? "dense" : "regular",
    typologyFills: row.typologyFills !== false,
  };
}
