/**
 * The only module that knows where unit data comes from.
 * Today: fixtures/units.seed.json for the live project and
 * fixtures/archive.seed.json for the indexed past projects, loaded once per
 * process. Later: Supabase. The getters keep their signatures, the callers do
 * not change.
 */
import archiveSeed from "@/fixtures/archive.seed.json";
import seed from "@/fixtures/units.seed.json";
import { buildSimilarities } from "@/lib/similarity";
import type {
  Collection,
  CollectionItem,
  Floor,
  NewProjectInput,
  Project,
  Room,
  Unit,
  UnitSimilarity,
} from "@/lib/types";

type SeedShape = {
  projects?: Record<string, unknown>[];
  floors: Record<string, unknown>[];
  units: Record<string, unknown>[];
  rooms: Record<string, unknown>[];
};

const raw = seed as unknown as SeedShape;
const archiveRaw = archiveSeed as unknown as SeedShape;

const liveFloors: Floor[] = raw.floors.map((f) => f as unknown as Floor);
const liveUnits: Unit[] = raw.units.map((u) => u as unknown as Unit);

/** Archived rows: same shapes, read-only, never shown in the plan view. */
const archiveFloors: Floor[] = archiveRaw.floors.map((f) => f as unknown as Floor);
const archiveUnits: Unit[] = archiveRaw.units.map((u) => u as unknown as Unit);

const floors: Floor[] = [...liveFloors, ...archiveFloors];
const units: Unit[] = [...liveUnits, ...archiveUnits];
const rooms: Room[] = [...raw.rooms, ...archiveRaw.rooms].map(
  (r) => r as unknown as Room,
);

const floorById = new Map(floors.map((f) => [f.id, f] as const));

/** UnitSimilarity, materialised once, the way an import would write it. */
const similarities: UnitSimilarity[] = buildSimilarities(
  liveUnits,
  archiveUnits,
  (unit) => {
    const floor = floorById.get(unit.floor_id);
    return { widthPx: floor?.width_px ?? 1, heightPx: floor?.height_px ?? 1 };
  },
);

/**
 * Verification is the one write the interface makes against an indexed unit.
 * It lives beside the session projects until a database exists, and every
 * getter reads through it, so a unit verified on the plan is already verified
 * in the schedule, the card count and the floor statistics.
 */
type Verification = { at: string; by: string };
const verifyStore = globalThis as typeof globalThis & {
  __fitteVerified?: Map<string, Verification>;
};
const verified: Map<string, Verification> = (verifyStore.__fitteVerified ??=
  new Map());

function withStatus(unit: Unit): Unit {
  const row = verified.get(unit.id);
  if (!row) return unit;
  return {
    ...unit,
    status: "verified",
    verified_at: row.at,
    verified_by: row.by,
  };
}

export async function setUnitVerified(
  unitId: string,
  on: boolean,
  by = "office",
): Promise<void> {
  if (on) verified.set(unitId, { at: new Date().toISOString(), by });
  else verified.delete(unitId);
}

const projectRows: Project[] = (raw.projects ?? []).map((p) => {
  const row = p as unknown as Project & { units_count?: number };
  const seeded = units.filter((u) => u.project_id === row.id);
  return { ...row, units_count: row.units_count ?? seeded.length };
});

/**
 * Projects created in the interface live here until a database exists.
 * Server actions and RSC renders are bundled in separate layers, so the array
 * hangs off globalThis to stay the same array in both.
 */
const globalStore = globalThis as typeof globalThis & {
  __fitteSessionProjects?: Project[];
};
const sessionProjects: Project[] = (globalStore.__fitteSessionProjects ??= []);

/** The verified count is counted at read time, never cached at import. */
function countVerified(projectId: string): number {
  return units.filter((u) => u.project_id === projectId && withStatus(u).status === "verified")
    .length;
}

export async function getProjects(): Promise<Project[]> {
  return [...projectRows, ...sessionProjects].map((p) => ({
    ...p,
    verified_count: countVerified(p.id),
  }));
}

export async function getProject(code: string): Promise<Project | null> {
  const all = await getProjects();
  return all.find((p) => p.project_code === code) ?? null;
}

export async function createProject(input: NewProjectInput): Promise<Project> {
  const project: Project = {
    id: `local-${input.project_code}`,
    project_code: input.project_code,
    display_name: input.display_name,
    city: input.city,
    year: input.year,
    typology: "condo",
    floors_count: input.floors_count,
    units_count: 0,
    verified_count: 0,
    ingest_method: "manual",
    drawings: [],
    last_import_at: null,
    notes: null,
  };
  sessionProjects.push(project);
  return project;
}

export async function getFloors(projectId: string): Promise<Floor[]> {
  return floors
    .filter((f) => f.project_id === projectId)
    .sort((a, b) => b.level - a.level);
}

export async function getFloor(
  projectId: string,
  level: number,
): Promise<Floor | null> {
  return (
    floors.find((f) => f.project_id === projectId && f.level === level) ?? null
  );
}

export async function getUnits(projectId: string): Promise<Unit[]> {
  return units
    .filter((u) => u.project_id === projectId)
    .map(withStatus)
    .sort((a, b) => a.number.localeCompare(b.number));
}

/** Every indexed unit the office holds, live project and archive together. */
export async function getAllUnits(): Promise<Unit[]> {
  return units.map(withStatus);
}

export async function getFloorUnits(floorId: string): Promise<Unit[]> {
  return units
    .filter((u) => u.floor_id === floorId)
    .map(withStatus)
    .sort((a, b) => a.number.localeCompare(b.number));
}

export async function getRooms(unitId: string): Promise<Room[]> {
  return rooms.filter((r) => r.unit_id === unitId);
}

export async function getUnit(unitId: string): Promise<Unit | null> {
  const unit = units.find((u) => u.id === unitId);
  return unit ? withStatus(unit) : null;
}

export async function getFloorById(floorId: string): Promise<Floor | null> {
  return floorById.get(floorId) ?? null;
}

/** UnitSimilarity rows for one current unit, strongest first. */
export async function getSimilarities(unitId: string): Promise<UnitSimilarity[]> {
  return similarities.filter((s) => s.unit_id === unitId);
}

/**
 * Collections live beside the session projects until a database exists. Every
 * project starts with the one collection PRD section 12 names.
 */
const collectionStore = globalThis as typeof globalThis & {
  __fitteCollections?: Collection[];
  __fitteCollectionItems?: CollectionItem[];
};
const collections: Collection[] = (collectionStore.__fitteCollections ??= []);
const collectionItems: CollectionItem[] = (collectionStore.__fitteCollectionItems ??=
  []);

export async function getCollections(projectId: string): Promise<Collection[]> {
  if (!collections.some((c) => c.project_id === projectId)) {
    collections.push({
      id: `col-${projectId}-default`,
      project_id: projectId,
      name: "design references",
      created_at: new Date().toISOString(),
    });
  }
  return collections.filter((c) => c.project_id === projectId);
}

export async function createCollection(
  projectId: string,
  name: string,
): Promise<Collection> {
  const existing = (await getCollections(projectId)).find(
    (c) => c.name.toLowerCase() === name.toLowerCase(),
  );
  if (existing) return existing;
  const collection: Collection = {
    id: `col-${projectId}-${collections.length + 1}`,
    project_id: projectId,
    name,
    created_at: new Date().toISOString(),
  };
  collections.push(collection);
  return collection;
}

export async function getCollectionItems(
  projectId: string,
): Promise<{ collection: Collection; items: (CollectionItem & { unit: Unit })[] }[]> {
  const cols = await getCollections(projectId);
  return cols.map((collection) => ({
    collection,
    items: collectionItems
      .filter((i) => i.collection_id === collection.id)
      .map((i) => ({ ...i, unit: units.find((u) => u.id === i.unit_id) }))
      .filter((i): i is CollectionItem & { unit: Unit } => Boolean(i.unit))
      .sort((a, b) => b.added_at.localeCompare(a.added_at)),
  }));
}

export async function addCollectionItem(
  collectionId: string,
  unitId: string,
  note: string | null,
): Promise<void> {
  const at = collectionItems.findIndex(
    (i) => i.collection_id === collectionId && i.unit_id === unitId,
  );
  const row: CollectionItem = {
    collection_id: collectionId,
    unit_id: unitId,
    note,
    added_at: new Date().toISOString(),
  };
  if (at >= 0) collectionItems[at] = row;
  else collectionItems.push(row);
}

export async function removeCollectionItem(
  collectionId: string,
  unitId: string,
): Promise<void> {
  const at = collectionItems.findIndex(
    (i) => i.collection_id === collectionId && i.unit_id === unitId,
  );
  if (at >= 0) collectionItems.splice(at, 1);
}
