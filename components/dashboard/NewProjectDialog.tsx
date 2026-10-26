"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { createProjectAction } from "@/app/actions";
import Icon from "@/components/ui/Icon";
import { BTN, BTN_BRAND } from "@/components/ui/Button";

const typologies = [
  { value: "condo", label: "Résidentiel (copropriété)" },
  { value: "rental", label: "Locatif" },
  { value: "mixed_use", label: "Usage mixte" },
  { value: "other", label: "Autre" },
];

const FIELD =
  "h-9 w-full rounded-lg border border-edge bg-panel px-3 text-[13px] text-text outline-none transition-colors focus:border-brand-line";

/**
 * Creation happens in one dialog over the grid: name, where, how big, what
 * kind, one line of description. The image a project carries is a placeholder
 * render, so the dialog says so instead of offering an upload that does
 * nothing.
 */
export default function NewProjectDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-text/40 p-6"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="panel max-h-full w-[560px] overflow-auto">
        <div className="flex h-14 items-center justify-between border-b border-edge-2 px-5">
          <h2 className="text-[17px] font-semibold text-text">Nouveau projet</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="fermer"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-text-3 transition-colors hover:bg-app hover:text-text"
          >
            <Icon name="close" size={16} />
          </button>
        </div>

        <form
          className="flex flex-col gap-4 p-5"
          action={(form) => {
            if (
              !String(form.get("display_name") ?? "").trim() ||
              !String(form.get("project_code") ?? "").trim()
            ) {
              setError("Un nom et un code sont requis.");
              return;
            }
            setError("");
            startTransition(async () => {
              await createProjectAction(form);
              router.refresh();
              onClose();
            });
          }}
        >
          <Field label="Nom du projet" required>
            <input name="display_name" className={FIELD} autoFocus />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Code du projet" required>
              <input name="project_code" className={FIELD} />
            </Field>
            <Field label="Année">
              <input
                name="year"
                type="number"
                defaultValue={new Date().getFullYear()}
                className={FIELD}
              />
            </Field>
          </div>

          <div className="grid grid-cols-[1fr_96px] gap-4">
            <Field label="Emplacement">
              <input name="city" placeholder="Montréal" className={FIELD} />
            </Field>
            <Field label="Province">
              <input name="province" defaultValue="QC" className={FIELD} />
            </Field>
          </div>

          <div className="grid grid-cols-[96px_1fr] gap-4">
            <Field label="Étages">
              <input
                name="floors_count"
                type="number"
                min={0}
                defaultValue={0}
                className={FIELD}
              />
            </Field>
            <Field label="Type de projet">
              <select name="typology" className={FIELD}>
                {typologies.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Description (optionnel)">
            <textarea
              name="description"
              rows={3}
              className="w-full rounded-lg border border-edge bg-panel px-3 py-2 text-[13px] text-text outline-none transition-colors focus:border-brand-line"
            />
          </Field>

          <p className="flex items-center gap-2 rounded-lg bg-app px-3 py-2 text-[12px] text-text-2">
            <Icon name="info" size={14} className="text-text-3" />Un projet
            porte un rendu de substitution tant que ses dessins ne sont pas
            connectés.
          </p>

          <div className="flex items-center gap-3 border-t border-edge-2 pt-4">
            {error ? (
              <span className="text-[12px] text-text-2">{error}</span>
            ) : null}
            <span className="flex-1" />
            <button type="button" onClick={onClose} className={BTN}>
              Annuler
            </button>
            <button type="submit" disabled={pending} className={BTN_BRAND}>
              Créer le projet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[12px] font-medium text-text-2">
        {label}
        {required ? <span className="text-brand"> *</span> : null}
      </span>
      {children}
    </label>
  );
}
