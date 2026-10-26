"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import Icon from "@/components/ui/Icon";
import { BTN, BTN_BRAND } from "@/components/ui/Button";
import { connectDrawingsAction } from "@/app/p/[code]/files/actions";
import type { Drawing, DrawingRole, Project } from "@/lib/types";

type Candidate = {
  filename: string;
  kind: "dwg" | "skp";
  role: DrawingRole;
  floor_level: number | null;
  size_mb: number;
  description: string;
  modified: string;
};

/**
 * The drawing folder a project would be read from. Fitte never opens a DWG
 * here — the folder listing is what the connect step shows before AutoCAD does
 * the geometry work.
 */
const FOLDER: Candidate[] = [
  { filename: "A-200_Site_Plan.dwg", kind: "dwg", role: "other", floor_level: null, size_mb: 2.4, description: "Plan d’implantation", modified: "2026-09-12" },
  { filename: "A-201_Level_01.dwg", kind: "dwg", role: "floor_plan", floor_level: 1, size_mb: 4.1, description: "Plan d’étage — Niveau 01", modified: "2026-09-12" },
  { filename: "A-202_Level_02.dwg", kind: "dwg", role: "floor_plan", floor_level: 2, size_mb: 3.8, description: "Plan d’étage — Niveau 02", modified: "2026-09-12" },
  { filename: "A-203_Level_03.dwg", kind: "dwg", role: "floor_plan", floor_level: 3, size_mb: 3.7, description: "Plan d’étage — Niveau 03", modified: "2026-09-12" },
  { filename: "A-204_Level_04.dwg", kind: "dwg", role: "floor_plan", floor_level: 4, size_mb: 3.7, description: "Plan d’étage — Niveau 04", modified: "2026-09-12" },
  { filename: "A-300_Elevations.dwg", kind: "dwg", role: "other", floor_level: null, size_mb: 4.8, description: "Élévations", modified: "2026-09-05" },
  { filename: "A-301_Sections.dwg", kind: "dwg", role: "other", floor_level: null, size_mb: 4.2, description: "Coupes", modified: "2026-09-05" },
  { filename: "A-400_Unit_Schedule.dwg", kind: "dwg", role: "other", floor_level: null, size_mb: 1.1, description: "Tableau des unités", modified: "2026-09-05" },
  { filename: "A-401_Parking_Schedule.dwg", kind: "dwg", role: "other", floor_level: null, size_mb: 0.98, description: "Tableau du stationnement", modified: "2026-09-05" },
  { filename: "Massing_v3.skp", kind: "skp", role: "massing", floor_level: null, size_mb: 18.2, description: "Volumétrie du bâtiment", modified: "2026-09-02" },
];

const ROLE_LABEL: Record<DrawingRole, string> = {
  floor_plan: "Plan d’étage",
  massing: "Modèle de volume",
  other: "Dessin de référence",
};

const STEPS = ["Sélectionner les fichiers", "Identifier les dessins", "Confirmer"];

export default function ConnectFiles({ project }: { project: Project }) {
  const [drawer, setDrawer] = useState(false);
  const connected = project.drawings;
  const dwg = connected.filter((d) => d.kind === "dwg");
  const skp = connected.filter((d) => d.kind === "skp");

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <div className="min-w-0 flex-1 overflow-auto px-6 pb-6">
        <h1 className="text-[22px] font-semibold tracking-tight text-text">
          Connectez les fichiers de votre projet
        </h1>
        <p className="mt-1 max-w-[640px] text-[13px] text-text-2">
          Ajoutez vos fichiers AutoCAD et SketchUp pour que fitte puisse lire
          vos unités, organiser vos dessins et faire correspondre les plans
          au modèle 3D.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-4">
          <section className="panel p-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-app text-text-2">
              <Icon name="cad" size={20} />
            </span>
            <h2 className="mt-3 text-[15px] font-semibold text-text">
              Dessins AutoCAD
            </h2>
            <p className="mt-1 text-[13px] text-text-2">
              Connectez les fichiers DWG des plans d’étage, élévations,
              coupes et tableaux.
            </p>
            <button
              type="button"
              onClick={() => setDrawer(true)}
              className={`mt-4 ${BTN_BRAND}`}
            >
              Connecter des fichiers
            </button>
            <ul className="mt-4 flex flex-col gap-2">
              {[
                ["Plans d’étage résidentiels", dwg.some((d) => d.role === "floor_plan")],
                ["Élévations et façades", false],
                ["Coupes", false],
                ["Tableaux (unités, stationnement)", false],
              ].map(([label, on]) => (
                <li key={String(label)} className="flex items-center gap-2 text-[13px] text-text-2">
                  <Icon
                    name={on ? "check" : "minus"}
                    size={14}
                    className={on ? "text-ok" : "text-text-3"}
                  />
                  {label}
                </li>
              ))}
            </ul>
          </section>

          <section className="panel p-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-app text-text-2">
              <Icon name="cube" size={20} />
            </span>
            <h2 className="mt-3 text-[15px] font-semibold text-text">
              Modèle SketchUp
            </h2>
            <p className="mt-1 text-[13px] text-text-2">
              Connectez le modèle SKP pour le volume du bâtiment et la
              correspondance des étages.
            </p>
            <button
              type="button"
              onClick={() => setDrawer(true)}
              className={`mt-4 ${BTN}`}
            >
              Connecter un modèle
            </button>
            <ul className="mt-4 flex flex-col gap-2">
              {[
                ["Modèle architectural (SKP)", skp.length > 0],
                ["Volume du bâtiment", skp.length > 0],
                ["Étages", false],
                ["Contexte du site", false],
              ].map(([label, on]) => (
                <li key={String(label)} className="flex items-center gap-2 text-[13px] text-text-2">
                  <Icon
                    name={on ? "check" : "minus"}
                    size={14}
                    className={on ? "text-ok" : "text-text-3"}
                  />
                  {label}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className="panel mt-4 flex flex-col">
          <div className="flex h-12 items-center gap-2 px-5">
            <h2 className="text-[15px] font-semibold text-text">
              Fichiers connectés
            </h2>
            <span className="text-[13px] text-text-3">{connected.length}</span>
          </div>

          {connected.length === 0 ? (
            <div className="m-5 mt-0 flex flex-col items-center gap-2 rounded-lg border border-dashed border-edge px-6 py-10 text-center">
              <Icon name="file" size={22} className="text-text-3" />
              <span className="text-[13px] text-text-2">
                Aucun fichier connecté pour l’instant.
              </span>
              <span className="text-[12px] text-text-3">
                Connectez vos fichiers AutoCAD et SketchUp pour commencer.
              </span>
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-edge-2">
                  {["Nom du fichier", "Type", "Étage", "État", "Taille"].map((label, i) => (
                    <th
                      key={label}
                      className={`cap h-9 px-5 font-normal ${
                        i === 4 ? "text-right" : "text-left"
                      }`}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {connected.map((d) => (
                  <tr key={d.filename} className="h-10 border-b border-edge-2 last:border-0">
                    <td className="flex h-10 items-center gap-2 px-5 text-[13px] text-text">
                      <Icon
                        name={d.kind === "skp" ? "cube" : "dwg"}
                        size={14}
                        className="text-text-3"
                      />
                      {d.filename}
                    </td>
                    <td className="px-5 text-[13px] text-text-2">
                      {ROLE_LABEL[d.role]}
                    </td>
                    <td className="px-5 text-[13px] text-text-2">
                      {d.floor_level === null ? "—" : `Niveau ${d.floor_level}`}
                    </td>
                    <td className="px-5 text-[13px]">
                      <span className={d.status === "indexed" ? "text-ok" : "text-text-2"}>
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

      {drawer ? (
        <ConnectDrawer project={project} onClose={() => setDrawer(false)} />
      ) : null}
    </div>
  );
}

function ConnectDrawer({
  project,
  onClose,
}: {
  project: Project;
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState(0);
  const already = useMemo(
    () => new Set(project.drawings.map((d) => d.filename)),
    [project.drawings],
  );
  const found = FOLDER.filter((f) => !already.has(f.filename));
  const [picked, setPicked] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      found.map((f) => [f.filename, f.role === "floor_plan"]),
    ),
  );
  const [roles, setRoles] = useState<Record<string, DrawingRole>>(() =>
    Object.fromEntries(found.map((f) => [f.filename, f.role])),
  );

  const selected = found.filter((f) => picked[f.filename]);

  function commit() {
    const drawings: Drawing[] = selected.map((f) => ({
      filename: f.filename,
      kind: f.kind,
      role: roles[f.filename],
      floor_level: roles[f.filename] === "floor_plan" ? f.floor_level : null,
      status: "connected",
      indexed_at: null,
      size_mb: f.size_mb,
    }));
    startTransition(async () => {
      await connectDrawingsAction(project.project_code, project.id, drawings);
      router.refresh();
      onClose();
    });
  }

  return (
    <aside className="panel flex w-[620px] shrink-0 flex-col overflow-hidden rounded-none border-y-0 border-r-0">
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-edge-2 px-5">
        <h2 className="text-[15px] font-semibold text-text">
          Connecter des fichiers AutoCAD
        </h2>
        <span className="flex-1" />
        <button
          type="button"
          onClick={onClose}
          aria-label="fermer"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-text-3 transition-colors hover:bg-app hover:text-text"
        >
          <Icon name="close" size={16} />
        </button>
      </div>

      <ol className="flex shrink-0 items-center gap-4 border-b border-edge-2 px-5 py-3">
        {STEPS.map((label, i) => (
          <li key={label} className="flex items-center gap-2">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-medium ${
                i <= step ? "bg-brand text-text" : "bg-app text-text-3"
              }`}
            >
              {i + 1}
            </span>
            <span
              className={`text-[13px] ${
                i === step ? "font-medium text-text" : "text-text-2"
              }`}
            >
              {label}
            </span>
          </li>
        ))}
      </ol>

      <div className="min-h-0 flex-1 overflow-auto px-5 py-4">
        {step === 0 ? (
          <>
            <label className="text-[12px] font-medium text-text-2">
              Dossier du projet
            </label>
            <div className="mt-1.5 flex gap-2">
              <input
                readOnly
                value={`/Volumes/Projects/${project.display_name.replace(/\s+/g, "_")}/DWG`}
                className="h-9 flex-1 rounded-lg border border-edge bg-app px-3 text-[13px] text-text-2 outline-none"
              />
              <span className={`${BTN} cursor-default opacity-60`}>Parcourir</span>
            </div>

            <p className="mt-4 text-[13px] font-medium text-text">
              Fichiers trouvés ({found.length})
            </p>

            <table className="mt-2 w-full border-collapse">
              <thead>
                <tr className="border-b border-edge-2">
                  <th className="w-9" />
                  {["Nom du fichier", "Type", "Modifié", "Taille"].map((label, i) => (
                    <th
                      key={label}
                      className={`cap h-8 px-2 font-normal ${
                        i === 3 ? "text-right" : "text-left"
                      }`}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {found.map((f) => (
                  <tr
                    key={f.filename}
                    onClick={() =>
                      setPicked((p) => ({ ...p, [f.filename]: !p[f.filename] }))
                    }
                    className="h-11 cursor-pointer border-b border-edge-2 transition-colors last:border-0 hover:bg-app"
                  >
                    <td className="px-2">
                      <span
                        className={`flex h-4 w-4 items-center justify-center rounded border ${
                          picked[f.filename]
                            ? "border-brand bg-brand text-ok"
                            : "border-edge bg-panel"
                        }`}
                      >
                        {picked[f.filename] ? (
                          <Icon name="check" size={12} />
                        ) : null}
                      </span>
                    </td>
                    <td className="px-2">
                      <span className="block text-[13px] text-text">
                        {f.filename}
                      </span>
                      <span className="block text-[11px] text-text-3">
                        {f.description}
                      </span>
                    </td>
                    <td className="px-2 text-[12px] text-text-2">
                      {f.kind.toUpperCase()}
                    </td>
                    <td className="px-2 text-[12px] text-text-2">
                      {f.modified}
                    </td>
                    <td className="px-2 text-right text-[12px] text-text-2">
                      {f.size_mb} MB
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : null}

        {step === 1 ? (
          <>
            <p className="text-[13px] text-text-2">
              Indiquez à fitte ce qu’est chaque dessin. Seuls les plans
              d’étage comportent des unités; le reste est conservé comme
              référence.
            </p>
            <ul className="mt-3 flex flex-col gap-2">
              {selected.map((f) => (
                <li
                  key={f.filename}
                  className="flex items-center gap-3 rounded-lg border border-edge px-3 py-2"
                >
                  <Icon
                    name={f.kind === "skp" ? "cube" : "dwg"}
                    size={16}
                    className="text-text-3"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] text-text">
                      {f.filename}
                    </span>
                    <span className="block text-[11px] text-text-3">
                      {f.floor_level === null
                        ? "Aucun étage"
                        : `Niveau ${f.floor_level}`}
                    </span>
                  </span>
                  <select
                    value={roles[f.filename]}
                    onChange={(e) =>
                      setRoles((r) => ({
                        ...r,
                        [f.filename]: e.target.value as DrawingRole,
                      }))
                    }
                    aria-label={`rôle de ${f.filename}`}
                    className="h-9 rounded-lg border border-edge bg-panel px-2 text-[13px] text-text outline-none"
                  >
                    {(Object.keys(ROLE_LABEL) as DrawingRole[]).map((role) => (
                      <option key={role} value={role}>
                        {ROLE_LABEL[role]}
                      </option>
                    ))}
                  </select>
                </li>
              ))}
            </ul>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <p className="text-[13px] text-text-2">
              {selected.length} fichier{selected.length === 1 ? "" : "s"}{" "}
              {selected.length === 1 ? "sera connecté" : "seront connectés"} à{" "}
              {project.display_name}. L’indexation des unités se fait dans
              AutoCAD, depuis la palette fitte dans le dessin.
            </p>
            <ul className="mt-3 flex flex-col gap-1">
              {selected.map((f) => (
                <li
                  key={f.filename}
                  className="flex items-center gap-2 text-[13px] text-text"
                >
                  <Icon name="check" size={14} className="text-ok" />
                  {f.filename}
                  <span className="text-[12px] text-text-3">
                    {ROLE_LABEL[roles[f.filename]]}
                  </span>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </div>

      <div className="flex h-16 shrink-0 items-center gap-3 border-t border-edge-2 px-5">
        <button type="button" onClick={onClose} className={BTN}>
          Annuler
        </button>
        <span className="flex-1" />
        {step > 0 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className={BTN}
          >
            Retour
          </button>
        ) : null}
        {step < 2 ? (
          <button
            type="button"
            disabled={selected.length === 0}
            onClick={() => setStep((s) => s + 1)}
            className={BTN_BRAND}
          >
            Suivant ({selected.length} sélectionné{selected.length === 1 ? "" : "s"})
            <Icon name="chevron-right" size={14} />
          </button>
        ) : (
          <button
            type="button"
            disabled={pending || selected.length === 0}
            onClick={commit}
            className={BTN_BRAND}
          >
            Connecter {selected.length} fichier{selected.length === 1 ? "" : "s"}
          </button>
        )}
      </div>
    </aside>
  );
}
