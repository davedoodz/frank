import { notFound } from "next/navigation";
import LevelMapper from "@/components/sim/LevelMapper";
import {
  getBuildingLevelMaps,
  getFloors,
  getMassingModel,
  getProjects,
} from "@/lib/data";

/** Flow D step 02, simulated SketchUp: assign building levels to the massing. */
export default async function LevelsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const asked = Array.isArray(query.code) ? query.code[0] : query.code;

  const projects = await getProjects();
  const project =
    projects.find((p) => p.project_code === asked) ??
    projects.find((p) => p.drawings.some((d) => d.kind === "skp"));
  if (!project) notFound();

  const model = await getMassingModel(project.id);
  if (!model) notFound();

  const floors = await getFloors(project.id);
  const maps = await getBuildingLevelMaps(project.id);
  const assigned = floors
    .filter((f) => maps.some((m) => m.floor_id === f.id))
    .map((f) => f.level);

  return (
    <LevelMapper
      code={project.project_code}
      model={model}
      floors={floors.map((f) => ({ level: f.level, label: f.label }))}
      assigned={assigned}
    />
  );
}
