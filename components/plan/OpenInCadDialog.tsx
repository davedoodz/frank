"use client";

import Link from "next/link";
import { useState } from "react";
import Icon from "@/components/ui/Icon";
import { BTN_BRAND, BTN_QUIET } from "@/components/ui/Button";
import Dialog from "@/components/ui/Dialog";
import type { Floor, Unit } from "@/lib/types";

/**
 * The way back to the drawing. The dialog says exactly what the local CAD
 * integration will do — open the linked DWG, optionally zoom to the unit — and
 * names the file either way, because without the integration running the
 * technician opens it by hand. fitte never writes to the drawing.
 */
export default function OpenInCadDialog({
  code,
  unit,
  floor,
  className,
  label = "Ouvrir le plan d’étage dans AutoCAD",
}: {
  code: string;
  unit: Unit;
  floor: Floor;
  className: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(true);

  const href =
    `/sim/autocad/retrieve?unit=${unit.id}&code=${encodeURIComponent(code)}` +
    (zoom ? "&zoom=1" : "");

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        <Icon name="external" size={14} />
        {label}
      </button>

      {open ? (
        <Dialog title={`Ouvrir dans AutoCAD\u00A0?`} onClose={() => setOpen(false)}>
          <p className="px-3 text-[13px] text-text-2">
            fitte ouvrira le dessin lié et fera un zoom sur l’unité {unit.number}{" "}
            à l’aide de l’intégration CAO locale de fitte. Sans elle, ouvrez le
            fichier ci-dessous manuellement.
          </p>

          <div className="mx-3 mt-3 flex items-start gap-3 rounded-lg border border-edge bg-panel p-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-app text-text-2">
              <Icon name="dwg" />
            </span>
            <div className="min-w-0">
              <div className="truncate text-[13px] font-medium text-text">
                {floor.source_file}
              </div>
              <div className="text-[11px] text-text-3">
                {floor.sheet_number} · {floor.label} · {floor.revision_date} ·{" "}
                {floor.scale}
              </div>
            </div>
          </div>

          <label className="mx-3 mt-3 flex items-center gap-2 text-[13px] text-text">
            <input
              type="checkbox"
              checked={zoom}
              onChange={(e) => setZoom(e.target.checked)}
              className="h-4 w-4 accent-brand"
            />
            Zoom sur l’unité {unit.number}
          </label>

          <div className="flex items-center gap-2 px-3 pt-4 pb-2">
            <span className="font-mono text-[11px] text-text-3">simulé</span>
            <span className="flex-1" />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className={BTN_QUIET}
            >
              Annuler
            </button>
            <Link href={href} className={BTN_BRAND}>
              <Icon name="external" size={14} />
              Ouvrir dans AutoCAD
            </Link>
          </div>
        </Dialog>
      ) : null}
    </>
  );
}
