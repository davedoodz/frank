import AppSidebar from "@/components/AppSidebar";
import LibraryBrowser, { type LibraryRow } from "@/components/library/LibraryBrowser";
import { getAllUnits, getFloors, getProjects } from "@/lib/data";
import { getPrefs } from "@/lib/prefs.server";
import type { Floor } from "@/lib/types";

// verification and projects created in the session change between requests
export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const [projects, allUnits] = await Promise.all([getProjects(), getAllUnits()]);
  const prefs = await getPrefs();

  const floorsByProject = await Promise.all(
    projects.map(async (project) => ({
      project,
      floors: await getFloors(project.id),
    })),
  );

  const floorMap = new Map<string, Floor>();
  const planByProject = new Map<string, boolean>();
  for (const { project, floors } of floorsByProject) {
    for (const floor of floors) floorMap.set(floor.id, floor);
    // Archive floors carry the "af-" id prefix and are never shown in the
    // plan view (see lib/data.ts); a project whose floors are all archive
    // rows routes to office dna instead of the plan.
    planByProject.set(
      project.id,
      floors.some((floor) => !floor.id.startsWith("af-")),
    );
  }

  const projectById = new Map(projects.map((p) => [p.id, p] as const));

  const rows: LibraryRow[] = [];
  for (const unit of allUnits) {
    const project = projectById.get(unit.project_id);
    const floor = floorMap.get(unit.floor_id);
    if (!project || !floor) continue;
    const hasPlan = planByProject.get(project.id) ?? false;
    const href = hasPlan
      ? `/p/${project.project_code}/units?floor=${floor.level}&u=${unit.number}`
      : `/p/${project.project_code}/office-dna?u=${unit.number}`;
    rows.push({
      id: unit.id,
      projectCode: project.project_code,
      projectName: project.display_name,
      city: project.city,
      number: unit.number,
      floorLevel: floor.level,
      floorLabel: floor.label,
      sheet: floor.sheet_number,
      type: unit.type_qc.value,
      bedrooms: unit.bedrooms.value,
      netM2: unit.net_area_m2.value,
      orientation: unit.orientation.value,
      corner: unit.is_corner.value,
      status: unit.status,
      href,
    });
  }

  return (
    <div className="flex h-screen">
      <AppSidebar active="library" />

      <div className="flex min-w-0 flex-1 flex-col bg-surface">
        <header className="px-6 pt-6 pb-4">
          <h1 className="text-title-lg text-ink">bibliothèque</h1>
          <p className="mt-1 text-body text-ink-2">
            {projects.length} projets, {rows.length} unités indexées, en
            cours et archivées ensemble.
          </p>
        </header>

        <LibraryBrowser
          rows={rows}
          projects={projects.map((p) => ({
            code: p.project_code,
            name: p.display_name,
          }))}
          area={prefs.area}
        />
      </div>
    </div>
  );
}
