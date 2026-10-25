/**
 * The only module that knows where unit data comes from.
 * Today: fixtures/units.seed.json, loaded once per process.
 * Later: Supabase. The getters keep their signatures, the callers do not change.
 */
import seed from "@/fixtures/units.seed.json";
import type {
  Floor,
  NewProjectInput,
  Project,
  Room,
  Unit,
} from "@/lib/types";

type SeedShape = {
  projects: Record<string, unknown>[];
  floors: Record<string, unknown>[];
  units: Record<string, unknown>[];
  rooms: Record<string, unknown>[];
};

const raw = seed as unknown as SeedShape;

const floors: Floor[] = raw.floors.map((f) => f as unknown as Floor);
const units: Unit[] = raw.units.map((u) => u as unknown as Unit);
const rooms: Room[] = raw.rooms.map((r) => r as unknown as Room);

const projects: Project[] = raw.projects.map((p) => {
  const row = p as unknown as Project & { units_count?: number };
  const seeded = units.filter((u) => u.project_id === row.id);
  return {
    ...row,
    units_count: row.units_count ?? seeded.length,
    verified_count: seeded.filter((u) => u.status === "verified").length,
  };
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

export async function getProjects(): Promise<Project[]> {
  return [...projects, ...sessionProjects];
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
    .sort((a, b) => a.number.localeCompare(b.number));
}

export async function getFloorUnits(floorId: string): Promise<Unit[]> {
  return units
    .filter((u) => u.floor_id === floorId)
    .sort((a, b) => a.number.localeCompare(b.number));
}

export async function getRooms(unitId: string): Promise<Room[]> {
  return rooms.filter((r) => r.unit_id === unitId);
}
