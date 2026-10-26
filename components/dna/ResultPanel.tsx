import Link from "next/link";
import AddToCollectionDialog from "@/components/dna/AddToCollectionDialog";
import Badge from "@/components/dna/Badge";
import OpenDrawingDialog from "@/components/dna/OpenDrawingDialog";
import PlanCrop from "@/components/dna/PlanCrop";
import Icon from "@/components/ui/Icon";
import { BTN } from "@/components/ui/Button";
import { ORIENTATION_LABEL, unitChips, type Result } from "@/lib/dna";
import { bedroomLabel } from "@/lib/format";
import type { Collection, Unit } from "@/lib/types";

/**
 * The preview beside the gallery: one archived unit, its record, and the three
 * things a technician does with it — open the drawing, compare it with the
 * unit on screen, keep it in the project's references.
 */
export default function ResultPanel({
  code,
  result,
  source,
  search,
  closeHref,
  prevHref,
  nextHref,
  collections,
  saved,
  drawingStatus,
  currentProject,
}: {
  code: string;
  result: Result;
  source: Unit;
  search: string;
  closeHref: string;
  prevHref: string | null;
  nextHref: string | null;
  collections: Collection[];
  saved: boolean;
  drawingStatus: string;
  /** The project the reference would be filed under. */
  currentProject: { display_name: string; city: string; thumb: string | null };
}) {
  const { unit, floor, project } = result;
  const unitHref = `/p/${code}/office-dna/${unit.id}?${search}`;

  const rows: [string, React.ReactNode][] = [
    ["Type d’unité", bedroomLabel(unit.type_qc.value)],
    ["Superficie", `${unit.net_area_m2.value.toFixed(1)} m²`],
    [
      "Superficie du balcon",
      unit.has_balcony.value
        ? `${unit.balcony_area_m2.value?.toFixed(1) ?? "—"} m²`
        : "Aucun",
    ],
    ["Étage", floor.label],
    ["Orientation", ORIENTATION_LABEL[unit.orientation.value]],
    ["Bâtiment", project.display_name],
    [
      "Dessin",
      <span key="d" className="font-mono text-[12px]">
        {floor.source_file}
      </span>,
    ],
    ["Date", floor.revision_date],
    [
      "Statut",
      <span key="s" className="flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-ok" />
        Archivée
      </span>,
    ],
  ];

  return (
    <aside className="hidden w-[360px] shrink-0 flex-col overflow-y-auto border-l border-edge bg-panel xl:flex">
      <div className="flex items-start gap-2 px-5 pt-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Link
              href={unitHref}
              className="text-[22px] font-semibold text-text transition-colors hover:text-text-2"
            >
              Unité {unit.number}
            </Link>
            <Badge basis={result.basis} />
          </div>
          <div className="mt-1 text-[13px] text-text-2">
            {project.display_name}
          </div>
          <div className="text-[12px] text-text-3">
            {project.city}, {project.province === "QC" ? "Québec" : project.province} ·{" "}
            {project.year}
          </div>
        </div>
        <span className="flex-1" />
        <Link
          href={closeHref}
          scroll={false}
          aria-label="fermer l’aperçu"
          className="flex h-7 w-7 items-center justify-center rounded-md text-text-3 transition-colors hover:bg-app hover:text-text"
        >
          <Icon name="close" size={16} />
        </Link>
      </div>

      <div className="relative mx-5 mt-4 overflow-hidden rounded-lg border border-edge">
        <Link href={unitHref} aria-label={`ouvrir l’unité ${unit.number}`}>
          <PlanCrop unit={unit} floor={floor} aspect={1} margin={0.18} />
        </Link>
        {prevHref ? (
          <Link
            href={prevHref}
            scroll={false}
            aria-label="résultat précédent"
            className="absolute top-1/2 left-2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-edge bg-panel text-text-2 transition-colors hover:text-text"
          >
            <Icon name="chevron-left" size={16} />
          </Link>
        ) : null}
        {nextHref ? (
          <Link
            href={nextHref}
            scroll={false}
            aria-label="résultat suivant"
            className="absolute top-1/2 right-2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-edge bg-panel text-text-2 transition-colors hover:text-text"
          >
            <Icon name="chevron-right" size={16} />
          </Link>
        ) : null}
        <NorthArrow />
      </div>

      <div className="mt-4 px-5">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="flex items-baseline justify-between gap-4 border-b border-edge-2 py-2 last:border-0"
          >
            <span className="shrink-0 text-[13px] text-text-2">{label}</span>
            <span className="truncate text-[13px] text-text">{value}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-2 px-5 pb-6">
        <OpenDrawingDialog
          code={code}
          unitId={unit.id}
          unitNumber={unit.number}
          projectName={project.display_name}
          city={project.city}
          year={project.year}
          sheet={floor.sheet_number}
          filename={floor.source_file}
          revision={floor.revision_date}
          drawingStatus={drawingStatus}
          variant="brand"
          label="Ouvrir le DWG original"
          full
        />
        <Link
          href={`/p/${code}/office-dna/compare?a=${unit.id}&b=${source.id}&${search}`}
          className={`${BTN} w-full justify-center`}
        >
          <Icon name="compare" size={14} />
          Comparer avec l’unité actuelle
        </Link>
        <AddToCollectionDialog
          code={code}
          unitId={unit.id}
          unitNumber={unit.number}
          projectName={project.display_name}
          city={project.city}
          year={project.year}
          filename={floor.source_file}
          revision={floor.revision_date}
          summary={`${bedroomLabel(unit.type_qc.value)} · ${unit.net_area_m2.value.toFixed(1)} m² · ${floor.label}`}
          chips={unitChips(unit)}
          collections={collections}
          saved={saved}
          preview={{ unit, floor }}
          basis={result.basis}
          currentProject={currentProject}
          variant="plain"
          label={saved ? "Enregistrée dans la bibliothèque du projet" : "Enregistrer dans la bibliothèque du projet"}
          full
        />
      </div>
    </aside>
  );
}

/** The sheet's north arrow, drawn, so a crop keeps its orientation. */
export function NorthArrow({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      aria-hidden="true"
      className={`absolute right-3 bottom-3 h-9 w-9 text-text-2 ${className}`}
    >
      <circle
        cx="20"
        cy="20"
        r="13"
        fill="var(--color-panel)"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.9"
      />
      <path d="M20 8 L20 32" stroke="currentColor" strokeWidth="1" />
      <path d="M20 8 L23.5 15 L20 13.2 L16.5 15 Z" fill="currentColor" />
      <text
        x="20"
        y="7"
        textAnchor="middle"
        fontSize="7"
        fill="currentColor"
        fontFamily="var(--font-sans)"
      >
        N
      </text>
    </svg>
  );
}
