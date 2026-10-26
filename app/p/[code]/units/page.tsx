import { notFound } from "next/navigation";
import PlanView from "@/components/plan/PlanView";
import {
  getBuildingLevelMaps,
  getFloor,
  getFloorUnits,
  getFloors,
  getMassingModel,
  getProject,
  getRooms,
  getUnits,
} from "@/lib/data";
import { getPrefs } from "@/lib/prefs.server";

export default async function UnitsPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ floor?: string; u?: string; view?: string }>;
}) {
  const { code } = await params;
  const { floor: floorParam, u, view } = await searchParams;
  const project = await getProject(decodeURIComponent(code));
  if (!project) notFound();

  const floors = await getFloors(project.id);
  if (floors.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-meta text-ink-2">
        aucun étage indexé
      </div>
    );
  }

  const level = Number(floorParam);
  const floor =
    (Number.isFinite(level) ? await getFloor(project.id, level) : null) ??
    floors[0];
  const units = await getFloorUnits(floor.id);
  const selected = u ? (units.find((x) => x.number === u) ?? null) : null;
  const rooms = selected ? await getRooms(selected.id) : [];

  const all = await getUnits(project.id);
  const prefs = await getPrefs();
  const rail = floors.map((f) => ({
    level: f.level,
    label: f.label,
    units: all.filter((x) => x.floor_id === f.id).map((x) => x.number),
  }));

  const massing = await getMassingModel(project.id);
  const levelMaps = await getBuildingLevelMaps(project.id);

  return (
    <PlanView
      code={project.project_code}
      floor={floor}
      units={units}
      selected={selected}
      rooms={rooms}
      rail={rail}
      prefs={prefs}
      massing={massing}
      levelsMapped={levelMaps.some((m) => m.floor_id === floor.id)}
      view={view === "3d" && massing ? "3d" : "2d"}
    />
  );
}
