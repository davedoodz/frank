import Link from "next/link";
import { notFound } from "next/navigation";
import PlanCrop from "@/components/dna/PlanCrop";
import { dimensions } from "@/components/dna/crop";
import Icon from "@/components/ui/Icon";
import { getFloorById, getProjects, getRooms, getUnit } from "@/lib/data";

/**
 * Simulated AutoCAD, PRD section 12 "07 retrieve": the archived sheet open in
 * the host, the historical unit selected, the fitte palette docked on the
 * right. Nothing here is connected to an installed application, and the
 * drawing is never written to.
 */
export default async function RetrievePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const asked = Array.isArray(query.unit) ? query.unit[0] : query.unit;
  const code = Array.isArray(query.code) ? query.code[0] : query.code;
  /** The web dialog asks for a zoom; the command zooms the view, nothing else. */
  const zoom = (Array.isArray(query.zoom) ? query.zoom[0] : query.zoom) === "1";

  const unit = asked ? await getUnit(asked) : null;
  const floor = unit ? await getFloorById(unit.floor_id) : null;
  if (!unit || !floor) notFound();

  const project = (await getProjects()).find((p) => p.id === unit.project_id);
  if (!project) notFound();

  const rooms = await getRooms(unit.id);
  const size = dimensions(unit, floor);

  const rows: [string, string][] = [
    ["unité", unit.number],
    ["type", unit.type_qc.value],
    ["superficie nette", `${unit.net_area_m2.value.toFixed(1)} m²`],
    ["hors tout", `${size.w.toFixed(2)} × ${size.h.toFixed(2)} m`],
    ["pièces", String(rooms.length)],
    ["feuille", floor.sheet_number],
    ["révision", floor.revision_date],
    ["projet", `${project.display_name} · ${project.year}`],
  ];

  return (
    <div className="flex h-screen flex-col bg-[#212830] text-[#E6E6E6]">
      {/* ribbon */}
      <div className="shrink-0 border-b border-[#11161C] bg-[#2B2F36]">
        <div className="flex h-8 items-center gap-4 px-3 text-[12px] text-[#C9CDD2]">
          <span>{floor.source_file}</span>
          <span className="text-[#7D848C]">— AutoCAD 2024</span>
        </div>
        <div className="flex h-8 items-center gap-5 border-t border-[#11161C] px-3 text-[12px] text-[#9BA2AA]">
          {["Début", "Insertion", "Annoter", "Affichage", "Gérer", "Modules complémentaires", "fitte"].map(
            (tab) => (
              <span
                key={tab}
                className={tab === "fitte" ? "text-[#E6E6E6]" : undefined}
              >
                {tab}
              </span>
            ),
          )}
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* model space */}
        <div className="relative min-w-0 flex-1 p-8">
          <PlanCrop
            unit={unit}
            floor={floor}
            aspect={16 / 10}
            margin={zoom ? 0.06 : 0.25}
            invert
            stroke="#3C8CFF"
            strokeWidth={1}
            fill="#3C8CFF"
            fillOpacity={0.25}
          />
          <div className="pointer-events-none absolute bottom-2 left-3 font-mono text-[11px] text-[#7D848C]">
            simulé
          </div>
        </div>

        {/* fitte palette */}
        <aside className="flex w-[320px] shrink-0 flex-col border-l border-[#11161C] bg-[#2B2F36]">
          <div className="flex h-7 items-center justify-between border-b border-[#11161C] px-2 text-[12px] text-[#C9CDD2]">
            <span>fitte</span>
            <span className="flex items-center gap-1.5 text-[#7D848C]">
              <Icon name="cube" size={12} />
              <Icon name="close" size={12} />
            </span>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto bg-surface p-4 text-ink">
            <div className="label-11">unité historique sélectionnée</div>
            <div className="mt-1 font-mono text-title-lg text-ink">
              {unit.number}
            </div>
            <div className="mt-1 font-mono text-meta text-ink-3">
              {project.display_name} · {floor.label} · référence en lecture seule
            </div>

            <div className="mt-4">
              {rows.map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-baseline justify-between gap-4 border-b border-line py-1.5 last:border-0"
                >
                  <span className="text-body text-ink-2">{label}</span>
                  <span className="truncate font-mono text-meta text-ink">
                    {value}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 border-t border-line pt-3">
              <div className="label-11">copier la géométrie de l’unité</div>
              <p className="mt-2 text-body text-ink-2">
                Les entités sélectionnées proviennent d’une feuille archivée à{" "}
                {floor.scale}. Vérifiez les calques, les blocs et les styles de
                cote avant de les copier dans le dessin actuel. fitte n’écrit
                pas dans ce fichier.
              </p>
            </div>

            <div className="mt-4 flex flex-col gap-2 border-t border-line pt-3">
              {code ? (
                <Link
                  href={`/p/${code}/office-dna/${unit.id}`}
                  className="text-body text-ink transition-colors duration-[80ms] hover:text-accent"
                >
                  ouvrir l’ADN complet de l’unité dans fitte
                </Link>
              ) : null}
              <Link
                href={code ? `/p/${code}/office-dna` : "/"}
                className="text-body text-ink-2 transition-colors duration-[80ms] hover:text-ink"
              >
                retour à fitte
              </Link>
            </div>
          </div>
        </aside>
      </div>

      {/* command line and status bar */}
      <div className="shrink-0 border-t border-[#11161C] bg-[#1A1F26] px-3 py-1 font-mono text-[11px] text-[#9BA2AA]">
        <div>Commande : {zoom ? "_FITTEZOOM" : "_FITTERETRIEVE"}</div>
        <div className="text-[#7D848C]">
          Sélectionnez les objets : 1 trouvé · unité {unit.number} ·{" "}
          {zoom ? "vue zoomée sur l’unité · " : ""}référence en lecture seule
        </div>
      </div>
      <div className="flex h-6 shrink-0 items-center gap-4 border-t border-[#11161C] bg-[#2B2F36] px-3 font-mono text-[11px] text-[#7D848C]">
        <span>MODEL</span>
        <span>{floor.scale}</span>
        <span>SNAP</span>
        <span>GRID</span>
        <span>OSNAP</span>
        <span className="flex-1" />
        <span>simulé</span>
      </div>
    </div>
  );
}
