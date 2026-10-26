import Link from "next/link";
import { notFound } from "next/navigation";
import BuildingSummary from "@/components/building/BuildingSummary";
import FloorStack from "@/components/building/FloorStack";
import TypologyBreakdown from "@/components/building/TypologyBreakdown";
import { getFloorUnits, getFloors, getProject, getUnits } from "@/lib/data";
import { getPrefs } from "@/lib/prefs.server";

export default async function BuildingTab({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const project = await getProject(decodeURIComponent(code));
  if (!project) notFound();

  const floors = await getFloors(project.id);

  if (floors.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-meta text-ink-2">
        aucun étage indexé pour l’instant ·{" "}
        <Link
          href={`/p/${project.project_code}/drawings`}
          className="text-ink-2 transition-colors duration-[80ms] hover:text-ink"
        >
          voir les fichiers connectés
        </Link>
      </div>
    );
  }

  const units = await getUnits(project.id);
  const prefs = await getPrefs();
  const floorRows = await Promise.all(
    floors.map(async (floor) => ({
      floor,
      units: await getFloorUnits(floor.id),
    })),
  );

  return (
    <div className="min-h-0 flex-1 overflow-auto">
      <div className="space-y-6 p-6">
        <BuildingSummary
          project={project}
          floors={floors}
          units={units}
          area={prefs.area}
        />
        <TypologyBreakdown units={units} area={prefs.area} />
        <FloorStack
          code={project.project_code}
          floorRows={floorRows}
          area={prefs.area}
        />
      </div>
    </div>
  );
}
