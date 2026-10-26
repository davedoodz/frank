/** Shapes mirror PRD.md section 6. The fixture and a future Postgres row use the same fields. */

export type Confident<T> = { value: T; confidence: number };

export type DrawingKind = "dwg" | "skp" | "pdf";
export type DrawingRole = "floor_plan" | "massing" | "other";
export type DrawingStatus = "connected" | "indexed" | "outdated";

export type Drawing = {
  filename: string;
  kind: DrawingKind;
  role: DrawingRole;
  floor_level: number | null;
  status: DrawingStatus;
  indexed_at: string | null;
};

export type ProjectTypology = "condo" | "mixed_use" | "rental" | "other";
export type IngestMethod = "dxf" | "vision" | "manual" | "mixed";

export type Project = {
  id: string;
  project_code: string;
  display_name: string;
  city: string;
  year: number;
  typology: ProjectTypology;
  floors_count: number;
  units_count: number;
  verified_count: number;
  ingest_method: IngestMethod;
  drawings: Drawing[];
  last_import_at: string | null;
  notes: string | null;
};

export type Floor = {
  id: string;
  project_id: string;
  level: number;
  label: string;
  sheet_number: string;
  source_file: string;
  revision_date: string;
  image_url: string;
  width_px: number;
  height_px: number;
  scale: string;
  px_per_m: number;
};

export type UnitStatus = "unverified" | "verified";
export type TypeQc = "studio" | "3½" | "4½" | "5½" | "6½" | "other";
export type Orientation = "N" | "S" | "E" | "W" | "NE" | "NW" | "SE" | "SW";

export type Unit = {
  id: string;
  project_id: string;
  floor_id: string;
  number: string;
  status: UnitStatus;
  type_qc: Confident<TypeQc>;
  bedrooms: Confident<number>;
  bathrooms: Confident<number>;
  rooms_count: Confident<number | null>;
  net_area_m2: Confident<number>;
  gross_area_m2: Confident<number | null>;
  orientation: Confident<Orientation>;
  is_corner: Confident<boolean>;
  has_balcony: Confident<boolean>;
  balcony_area_m2: Confident<number | null>;
  outline: [number, number][];
  label_pos: [number, number];
  computed_area_m2: number | null;
  verified_at: string | null;
  verified_by: string | null;
  notes: string | null;
};

export type Room = {
  id: string;
  unit_id: string;
  name: string;
  area_m2: number | null;
  outline: [number, number][] | null;
};

export type NewProjectInput = {
  display_name: string;
  project_code: string;
  city: string;
  year: number;
  floors_count: number;
};

/** R3. Written at import, one row per candidate pair, best basis per pair. */
export type SimilarityBasis = "layout" | "area" | "configuration" | "type";

export type UnitSimilarity = {
  unit_id: string;
  similar_unit_id: string;
  score: number;
  basis: SimilarityBasis;
};

export type Collection = {
  id: string;
  project_id: string;
  name: string;
  created_at: string;
};

export type CollectionItem = {
  collection_id: string;
  unit_id: string;
  note: string | null;
  added_at: string;
};
