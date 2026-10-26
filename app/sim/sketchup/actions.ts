"use server";

import { redirect } from "next/navigation";
import { getFloors, getProject, syncBuildingLevels } from "@/lib/data";

/**
 * Sync building context, PRD section 12 "map levels": writes BuildingLevelMap
 * for the levels the technician approved. Floors only. The massing model never
 * contributes interior geometry, so nothing else is written.
 */
export async function syncLevels(formData: FormData): Promise<void> {
  const code = String(formData.get("code") ?? "");
  const modelRef = String(formData.get("model_ref") ?? "");
  const levels = formData
    .getAll("level")
    .map((value) => Number(value))
    .filter((level) => Number.isFinite(level));

  const project = await getProject(code);
  if (!project) redirect("/");

  const floors = await getFloors(project.id);
  const floorIds = floors
    .filter((floor) => levels.includes(floor.level))
    .map((floor) => floor.id);

  await syncBuildingLevels(project.id, modelRef, floorIds);
  redirect(`/sim/sketchup/publish?code=${encodeURIComponent(code)}`);
}
