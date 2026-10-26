"use client";

import Link from "next/link";
import { useState } from "react";
import Dialog from "@/components/ui/Dialog";
import Icon from "@/components/ui/Icon";
import { BTN, BTN_BRAND, BTN_DARK } from "@/components/ui/Button";

/**
 * The handoff out of fitte (flow C, step 5). The dialog states what will open
 * and under which rule: an archived sheet is a read-only reference, fitte
 * never writes to a drawing file. The action is a real link to the simulated
 * AutoCAD session.
 */
export default function OpenDrawingDialog({
  code,
  unitId,
  unitNumber,
  projectName,
  city,
  year,
  sheet,
  filename,
  revision,
  drawingStatus,
  variant = "brand",
  label = "Ouvrir le DWG original",
  full = false,
}: {
  code: string;
  unitId: string;
  unitNumber: string;
  projectName: string;
  city: string;
  year: number;
  sheet: string;
  filename: string;
  revision: string;
  drawingStatus: string;
  variant?: "brand" | "dark" | "plain";
  label?: string;
  full?: boolean;
}) {
  const [open, setOpen] = useState(false);

  const rows: [string, React.ReactNode][] = [
    ["Feuille", sheet],
    ["Description", `Unité ${unitNumber} · ${projectName}`],
    ["Date", revision],
    ["État d’indexation", drawingStatus],
    [
      "Statut",
      <span key="s" className="flex items-center gap-1.5">
        <Icon name="lock" size={13} />
        Référence en lecture seule
      </span>,
    ],
  ];

  const shell =
    variant === "brand" ? BTN_BRAND : variant === "dark" ? BTN_DARK : BTN;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`${shell} ${full ? "w-full justify-center" : ""}`}
      >
        <Icon name="external" size={14} />
        {label}
      </button>

      {open ? (
        <Dialog title="Ouvrir le dessin original" onClose={() => setOpen(false)}>
          <div className="flex items-center gap-4 border-b border-edge-2 pb-4">
            <span className="flex h-16 w-20 shrink-0 items-center justify-center rounded-lg border border-edge bg-app text-text-3">
              <span className="flex h-7 items-center rounded-md bg-brand px-2 text-[11px] font-semibold text-text">
                DWG
              </span>
            </span>
            <span className="min-w-0">
              <span className="block truncate font-mono text-[15px] font-medium text-text">
                {filename}
              </span>
              <span className="mt-1 block text-[13px] text-text-2">
                {projectName}
              </span>
              <span className="block text-[12px] text-text-3">
                {city} · {year} · Dessin archivé
              </span>
            </span>
          </div>

          <div>
            {rows.map(([key, value]) => (
              <div
                key={key}
                className="flex items-baseline justify-between gap-4 border-b border-edge-2 py-2.5 last:border-0"
              >
                <span className="text-[13px] text-text-2">{key}</span>
                <span className="truncate text-[13px] text-text">{value}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex gap-3 rounded-lg border border-brand-line bg-brand-soft p-3">
            <Icon name="info" size={16} className="mt-0.5 text-text-2" />
            <p className="text-[13px] text-text-2">
              <span className="font-medium text-text">
                Ce dessin s’ouvrira dans AutoCAD comme référence en lecture
                seule.
              </span>{" "}
              Vous ne pourrez pas modifier le fichier original. Vous pouvez
              copier la géométrie pertinente dans votre projet actuel après en
              avoir révisé le contenu.
            </p>
          </div>

          <div className="mt-5 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className={`${BTN} flex-1 justify-center`}
            >
              Annuler
            </button>
            <Link
              href={`/sim/autocad/retrieve?unit=${unitId}&code=${encodeURIComponent(code)}`}
              className={`${BTN_BRAND} flex-[2]`}
            >
              <Icon name="external" size={14} />
              Ouvrir dans AutoCAD (lecture seule)
            </Link>
          </div>
        </Dialog>
      ) : null}
    </>
  );
}
