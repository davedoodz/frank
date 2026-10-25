import { notFound } from "next/navigation";
import PlanView from "@/components/plan/PlanView";
import {
  getFloor,
  getFloorUnits,
  getFloors,
  getProject,
  getRooms,
  getUnits,
} from "@/lib/data";

export default async function UnitsPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ floor?: string; u?: string }>;
}) {
  const { code } = await params;
  const { floor: floorParam, u } = await searchParams;
  const project = await getProject(decodeURIComponent(code));
  if (!project) notFound();

  const floors = await getFloors(project.id);
  if (floors.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-13 text-ink-3">
        no floor indexed
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
  const rail = floors.map((f) => ({
    level: f.level,
    label: f.label,
    units: all.filter((x) => x.floor_id === f.id).map((x) => x.number),
  }));

  return (
    <PlanView
      code={project.project_code}
      floor={floor}
      units={units}
      selected={selected}
      rooms={rooms}
      rail={rail}
    />
  );
}
