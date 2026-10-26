import Link from "next/link";
import { notFound } from "next/navigation";
import MassingStage from "@/components/sim/MassingStage";
import SketchUpChrome from "@/components/sim/SketchUpChrome";
import Icon from "@/components/ui/Icon";
import {
  getBuildingLevelMaps,
  getFloorUnits,
  getFloors,
  getMassingModel,
  getProjects,
} from "@/lib/data";

/**
 * Flow D step 03, simulated SketchUp: the extension confirms what fitte now
 * holds — approved floor assignments, the massing association and a model
 * reference. The handoff is a real link into the web plan view in 3D.
 */
export default async function PublishPage({
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
  const mapped = floors.filter((f) => maps.some((m) => m.floor_id === f.id));
  const synced = maps[0]?.synced_at ?? null;

  const first = mapped[mapped.length - 1] ?? floors[0];
  const units = first ? await getFloorUnits(first.id) : [];
  const anchored = units.find((u) =>
    model.unit_anchors.some((a) => a.unit_number === u.number),
  );

  const target = first
    ? `/p/${project.project_code}/units?floor=${first.level}${
        anchored ? `&u=${anchored.number}` : ""
      }&view=3d`
    : `/p/${project.project_code}/units`;

  return (
    <SketchUpChrome
      title={`${model.model_ref} — SketchUp Pro 2024`}
      status={`Contexte du bâtiment synchronisé · ${mapped.length} étages`}
      measurement=""
      tray={
        <div className="text-[13px] text-text">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ok-soft text-ok">
              <Icon name="check" size={13} />
            </span>
            <span className="text-[15px] font-semibold">Contexte synchronisé</span>
          </div>
          <p className="mt-1 text-[12px] text-text-2">
            L&rsquo;information d&rsquo;étages du bâtiment du modèle est disponible
            dans {project.display_name}. Aucune géométrie intérieure n&rsquo;a été
            publiée.
          </p>

          <div className="mt-4 text-[11px] tracking-[0.02em] text-text-3">
            ÉTAGES PUBLIÉS
          </div>
          <div className="mt-1 overflow-hidden rounded-lg border border-edge bg-panel">
            {mapped.length === 0 ? (
              <div className="px-2.5 py-2 text-[12px] text-text-2">
                Aucun étage associé.
              </div>
            ) : (
              mapped.map((floor) => (
                <div
                  key={floor.id}
                  className="flex items-center gap-2 border-b border-edge-2 px-2.5 py-2 text-[12px] last:border-0"
                >
                  <span className="h-2 w-2 rounded-full bg-[#4A90E2]" />
                  <span className="flex-1 truncate">{floor.label}</span>
                  <span className="font-mono text-[11px] text-text-3">
                    {floor.sheet_number}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="mt-4">
            {(
              [
                ["Référence du modèle", model.model_ref],
                ["Projet", project.display_name],
                ["Étages", String(mapped.length)],
                ["Synchronisé", synced ? synced.slice(0, 16).replace("T", " ") : "—"],
                ["Géométrie intérieure", "Non publiée"],
              ] as [string, string][]
            ).map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between border-b border-edge-2 py-1.5 last:border-0"
              >
                <span className="text-[12px] text-text-2">{label}</span>
                <span className="truncate text-[12px] font-medium">{value}</span>
              </div>
            ))}
          </div>

          <Link
            href={target}
            className="mt-4 flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-brand text-[13px] font-medium text-white transition-colors hover:bg-brand-2"
          >
            <Icon name="external" size={14} />
            Voir le contexte du bâtiment dans fitte
          </Link>

          <Link
            href={`/sim/sketchup/levels?code=${encodeURIComponent(project.project_code)}`}
            className="mt-2 flex h-9 w-full items-center justify-center rounded-lg border border-edge bg-panel text-[13px] font-medium transition-colors hover:bg-app"
          >
            Modifier les associations d’étages
          </Link>
        </div>
      }
    >
      <MassingStage model={model} highlight={mapped.map((f) => f.level)} />
    </SketchUpChrome>
  );
}
