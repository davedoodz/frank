import Link from "next/link";
import { notFound } from "next/navigation";
import Icon from "@/components/ui/Icon";
import { BTN, BTN_BRAND } from "@/components/ui/Button";
import { StatusChip } from "@/components/dashboard/Dashboard";
import { brLabel, projectThumb, since } from "@/lib/format";
import { getFloors, getProject, getUnits } from "@/lib/data";
import type { Project } from "@/lib/types";


/** Session-created projects and connections, so never prerendered. */
export const dynamic = "force-dynamic";
const TYPOLOGY_LABEL: Record<Project["typology"], string> = {
  condo: "Résidentiel (condominium)",
  mixed_use: "Usage mixte",
  rental: "Location",
  other: "Autre",
};

const ROLE_LABEL: Record<string, string> = {
  floor_plan: "Plan d’étage",
  massing: "Modèle de volume",
  other: "Autre",
};

/**
 * Where a project opens: what it is, what is connected, and the first rows of
 * what has been indexed. Everything here is read from the project record, so a
 * project with nothing connected states that rather than showing empty tables.
 */
export default async function ProjectOverview({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const project = await getProject(decodeURIComponent(code));
  if (!project) notFound();

  const floors = await getFloors(project.id);
  const units = await getUnits(project.id);
  const thumb = projectThumb(project.project_code);
  const indexed = project.drawings.filter((d) => d.status === "indexed");
  const skp = project.drawings.filter((d) => d.kind === "skp");
  const dwg = project.drawings.filter((d) => d.kind === "dwg");

  const info: [string, React.ReactNode][] = [
    ["Nom", project.display_name],
    ["Code", project.project_code],
    ["Localisation", `${project.city}, ${project.province}`],
    ["Étages", project.floors_count],
    ["Type", TYPOLOGY_LABEL[project.typology]],
    ["Statut", <StatusChip key="s" status={project.status} />],
  ];

  const connection: [string, string, boolean][] = [
    [
      "Fichiers AutoCAD",
      dwg.length ? `${dwg.length} connectés` : "Non connecté",
      dwg.length > 0,
    ],
    [
      "Modèle SketchUp",
      skp.length ? `${skp.length} connectés` : "Non connecté",
      skp.length > 0,
    ],
    [
      "Unités analysées",
      units.length ? `${units.length} sur ${floors.length} étages` : "—",
      units.length > 0,
    ],
    [
      "Dernière importation",
      project.last_import_at ?? "—",
      project.last_import_at !== null,
    ],
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto px-6 pb-6">
      {/* identity band: the render runs behind the name, as a placeholder */}
      <section className="panel relative overflow-hidden">
        {thumb ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumb}
              alt=""
              className="absolute inset-y-0 right-0 h-full w-1/2 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-panel via-panel/95 to-transparent" />
          </>
        ) : null}

        <div className="relative flex items-center gap-4 p-5">
          <span className="h-[88px] w-[132px] shrink-0 overflow-hidden rounded-lg bg-app">
            {thumb ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={thumb} alt="" className="h-full w-full object-cover" />
            ) : null}
          </span>

          <div className="min-w-0">
            <h1 className="text-[24px] font-semibold tracking-tight text-text">
              {project.display_name}
            </h1>
            <p className="mt-1 flex items-center gap-1.5 text-[13px] text-text-2">
              <Icon name="pin" size={13} className="text-text-3" />
              {project.city}, {project.province}
            </p>
            <p className="flex items-center gap-1.5 text-[13px] text-text-2">
              <Icon name="building" size={13} className="text-text-3" />
              {project.floors_count} étages ·{" "}
              {TYPOLOGY_LABEL[project.typology]}
            </p>
          </div>

          <span className="flex-1" />

          <div className="relative flex flex-col items-end gap-2 rounded-lg bg-panel/85 px-3 py-2 backdrop-blur-[2px]">
            <StatusChip status={project.status} />
            <span className="text-[12px] text-text-3">
              {since(project.updated_at)}
            </span>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-[1.4fr_1fr_1fr] gap-4">
        {/* start here: the two connections a project needs */}
        <section className="panel p-5">
          <h2 className="text-[15px] font-semibold text-text">
            Démarrer avec votre projet
          </h2>
          <p className="mt-1 text-[13px] text-text-2">
            Connectez vos fichiers pour permettre à fitte d’analyser vos
            unités et de créer votre base de données de projet.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="flex flex-col rounded-lg border border-edge p-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-app text-text-2">
                <Icon name="cad" size={18} />
              </span>
              <span className="mt-3 text-[13px] font-semibold text-text">
                Fichiers AutoCAD
              </span>
              <span className="mt-1 text-[12px] text-text-2">
                Connecter vos fichiers DWG de plans d’étages, élévations,
                sections et tableaux.
              </span>
              <Link
                href={`/p/${project.project_code}/files`}
                className={`mt-3 ${BTN_BRAND}`}
              >
                Connecter des fichiers
              </Link>
            </div>

            <div className="flex flex-col rounded-lg border border-edge p-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-app text-text-2">
                <Icon name="cube" size={18} />
              </span>
              <span className="mt-3 text-[13px] font-semibold text-text">
                Modèle SketchUp
              </span>
              <span className="mt-1 text-[12px] text-text-2">
                Connecter votre modèle SKP pour la masse du bâtiment et la
                correspondance des étages.
              </span>
              <Link
                href={`/p/${project.project_code}/files`}
                className={`mt-3 ${BTN}`}
              >
                Connecter un modèle
              </Link>
            </div>
          </div>
        </section>

        <section className="panel p-5">
          <h2 className="text-[15px] font-semibold text-text">
            Informations du projet
          </h2>
          <dl className="mt-3">
            {info.map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between border-b border-edge-2 py-2 last:border-0"
              >
                <dt className="text-[13px] text-text-2">{label}</dt>
                <dd className="text-[13px] font-medium text-text">{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="panel p-5">
          <h2 className="text-[15px] font-semibold text-text">
            État de connexion
          </h2>
          <ul className="mt-3">
            {connection.map(([label, value, on]) => (
              <li
                key={label}
                className="flex items-center justify-between border-b border-edge-2 py-2 last:border-0"
              >
                <span className="flex items-center gap-2 text-[13px] text-text-2">
                  <Icon
                    name={on ? "check" : "info"}
                    size={14}
                    className={on ? "text-ok" : "text-text-3"}
                  />
                  {label}
                </span>
                <span className="text-[13px] font-medium text-text">
                  {value}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <section className="panel flex flex-col">
          <div className="flex h-12 items-center gap-2 px-5">
            <h2 className="text-[15px] font-semibold text-text">Unités</h2>
            <span className="flex-1" />
            {units.length ? (
              <Link
                href={`/p/${project.project_code}/units`}
                className="text-[13px] font-medium text-text-2"
              >
                Voir toutes
              </Link>
            ) : null}
          </div>

          {units.length === 0 ? (
            <Empty line="Aucune unité analysée pour l’instant. Connectez un plan d’étage et indexez-le dans AutoCAD." />
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-edge-2">
                  {["Unité", "Étage", "Type", "Superficie (m²)", "Statut"].map(
                    (label, i) => (
                      <th
                        key={label}
                        className={`cap h-9 px-5 font-normal ${
                          i === 3 ? "text-right" : "text-left"
                        }`}
                      >
                        {label}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {units.slice(0, 5).map((unit) => {
                  const floor = floors.find((f) => f.id === unit.floor_id);
                  return (
                    <tr
                      key={unit.id}
                      className="h-10 border-b border-edge-2 last:border-0"
                    >
                      <td className="px-5 text-[13px] font-medium text-text">
                        {unit.number}
                      </td>
                      <td className="px-5 text-[13px] text-text-2">
                        {floor?.label ?? "—"}
                      </td>
                      <td className="px-5 text-[13px] text-text-2">
                        {brLabel(unit.type_qc.value)}
                      </td>
                      <td className="px-5 text-right text-[13px] text-text-2">
                        {unit.net_area_m2.value.toFixed(1)}
                      </td>
                      <td className="px-5">
                        <span
                          className={`text-[12px] ${
                            unit.status === "verified"
                              ? "text-ok"
                              : "text-text-3"
                          }`}
                        >
                          {unit.status === "verified"
                            ? "Vérifiée"
                            : "Non vérifiée"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>

        <section className="panel flex flex-col">
          <div className="flex h-12 items-center gap-2 px-5">
            <h2 className="text-[15px] font-semibold text-text">
              Dessins récents
            </h2>
            <span className="flex-1" />
            {project.drawings.length ? (
              <Link
                href={`/p/${project.project_code}/drawings`}
                className="text-[13px] font-medium text-text-2"
              >
                Voir tout
              </Link>
            ) : null}
          </div>

          {project.drawings.length === 0 ? (
            <Empty line="Aucun fichier connecté pour l’instant. Connectez vos fichiers AutoCAD et SketchUp pour commencer." />
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-edge-2">
                  {["Nom", "Type", "État", "Taille"].map((label, i) => (
                    <th
                      key={label}
                      className={`cap h-9 px-5 font-normal ${
                        i === 3 ? "text-right" : "text-left"
                      }`}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {project.drawings.slice(0, 5).map((d) => (
                  <tr
                    key={d.filename}
                    className="h-10 border-b border-edge-2 last:border-0"
                  >
                    <td className="flex h-10 items-center gap-2 px-5 text-[13px] text-text">
                      <Icon
                        name={d.kind === "skp" ? "cube" : "dwg"}
                        size={14}
                        className="text-text-3"
                      />
                      {d.filename}
                    </td>
                    <td className="px-5 text-[13px] text-text-2">
                      {ROLE_LABEL[d.role] ?? d.role}
                    </td>
                    <td className="px-5 text-[13px]">
                      <span
                        className={
                          d.status === "indexed" ? "text-ok" : "text-text-2"
                        }
                      >
                        {d.status === "indexed" ? "Indexé" : "Connecté"}
                      </span>
                    </td>
                    <td className="px-5 text-right text-[13px] text-text-2">
                      {d.size_mb} MB
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>

      {indexed.length === 0 ? null : (
        <p className="text-[12px] text-text-3">
          {indexed.length} dessin{indexed.length === 1 ? "" : "s"} indexé
          {indexed.length === 1 ? "" : "s"} · dernière importation{" "}
          {project.last_import_at}
        </p>
      )}
    </div>
  );
}

function Empty({ line }: { line: string }) {
  return (
    <div className="m-5 mt-0 flex flex-col items-center gap-2 rounded-lg border border-dashed border-edge px-6 py-8 text-center">
      <Icon name="file" size={20} className="text-text-3" />
      <span className="text-[13px] text-text-2">{line}</span>
    </div>
  );
}
