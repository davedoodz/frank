import Link from "next/link";
import { notFound } from "next/navigation";
import MassingStage from "@/components/sim/MassingStage";
import SketchUpChrome from "@/components/sim/SketchUpChrome";
import Icon from "@/components/ui/Icon";
import {
  getBuildingLevelMaps,
  getFloors,
  getMassingModel,
  getProjects,
} from "@/lib/data";

/**
 * Flow D step 01, simulated SketchUp: Extensions → fitte → Connect Project.
 * The panel names the project, the connected SKP and what the model can
 * contribute — massing, not interiors.
 */
export default async function ConnectPage({
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
  const skp = project.drawings.find((d) => d.filename === model.model_ref);

  const rows: [string, string][] = [
    ["Projet", project.display_name],
    ["Code de projet", project.project_code],
    ["Modèle", model.model_ref],
    ["Taille du modèle", skp ? `${skp.size_mb.toFixed(1)} MB` : "—"],
    ["Groupes de géométrie", String(model.groups.length)],
    ["Étages dans le modèle", String(model.levels_in_render)],
    ["Étages indexés", String(floors.length)],
    [
      "Étages du bâtiment",
      maps.length > 0 ? `${maps.length} associés` : "Non associé",
    ],
  ];

  return (
    <SketchUpChrome
      title={`${model.model_ref} — SketchUp Pro 2024`}
      status="Extensions › fitte › Connecter le projet"
      measurement=""
      tray={
        <div className="text-[13px] text-text">
          <div className="text-[15px] font-semibold">Connecter le projet</div>
          <p className="mt-1 text-[12px] text-text-2">
            fitte lit l’enveloppe pour le contexte du bâtiment. Il ne lit pas
            les unités ni les pièces de ce modèle.
          </p>

          <label className="mt-4 block text-[11px] tracking-[0.02em] text-text-3">
            PROJET
          </label>
          <div className="mt-1 flex h-9 items-center gap-2 rounded-lg border border-edge bg-panel px-2.5">
            <Icon name="building" size={14} />
            <span className="truncate font-medium">{project.display_name}</span>
            <span className="flex-1" />
            <Icon name="chevron-down" size={12} />
          </div>

          <div className="mt-3 flex items-start gap-2 rounded-lg border border-edge bg-panel p-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-app text-text-2">
              <Icon name="cube" size={15} />
            </span>
            <div className="min-w-0">
              <div className="truncate font-medium">{model.model_ref}</div>
              <div className="text-[11px] text-text-3">
                Connecté · volumétrie seulement
              </div>
            </div>
          </div>

          <div className="mt-4">
            {rows.map(([label, value]) => (
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
            href={`/sim/sketchup/levels?code=${encodeURIComponent(project.project_code)}`}
            className="mt-4 flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-brand text-[13px] font-medium text-text transition-colors hover:bg-brand-2"
          >
            <Icon name="layers" size={14} />
            Associer les étages du bâtiment
          </Link>

          <Link
            href={`/p/${project.project_code}/units`}
            className="mt-2 flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-edge bg-panel text-[13px] font-medium text-text transition-colors hover:bg-app"
          >
            Voir les unités dans fitte
          </Link>
        </div>
      }
    >
      <MassingStage model={model} />
    </SketchUpChrome>
  );
}
