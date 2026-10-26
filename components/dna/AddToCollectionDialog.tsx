"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { saveToCollectionAction } from "@/app/p/[code]/office-dna/actions";
import PlanCrop from "@/components/dna/PlanCrop";
import Badge from "@/components/dna/Badge";
import Dialog from "@/components/ui/Dialog";
import Icon from "@/components/ui/Icon";
import { BTN, BTN_BRAND, BTN_DARK } from "@/components/ui/Button";
import type { Collection, Floor, SimilarityBasis, Unit } from "@/lib/types";

/**
 * Keeping a historical unit in the current project's references (flow C,
 * step 7). The saved row is a link back to the archived record and its source
 * drawing; the note and the tags are the technician's own reading of it.
 */
export default function AddToCollectionDialog({
  code,
  unitId,
  unitNumber,
  projectName,
  city,
  year,
  filename,
  revision,
  summary,
  chips,
  collections,
  saved,
  currentProject,
  preview,
  basis,
  variant = "plain",
  label = "Ajouter à une collection",
  full = false,
}: {
  code: string;
  unitId: string;
  unitNumber: string;
  projectName: string;
  city: string;
  year: number;
  filename: string;
  revision: string;
  summary: string;
  chips: string[];
  collections: Collection[];
  saved: boolean;
  /** The project the reference is filed under, shown in the dialog. */
  currentProject?: { display_name: string; city: string; thumb: string | null };
  /** The archived unit and its sheet, for the card at the top of the dialog. */
  preview?: { unit: Unit; floor: Floor };
  basis?: SimilarityBasis | null;
  variant?: "plain" | "dark" | "brand";
  label?: string;
  full?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(collections.length === 0);
  const [note, setNote] = useState("");
  const [tags, setTags] = useState(chips);

  const shell =
    variant === "brand" ? BTN_BRAND : variant === "dark" ? BTN_DARK : BTN;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`${shell} ${full ? "w-full justify-center" : ""}`}
      >
        <Icon name="bookmark" size={14} />
        {label}
      </button>

      {open ? (
        <Dialog
          title="Ajouter à la bibliothèque de références"
          subtitle="Enregistrez cette unité historique dans une collection du projet en cours."
          width={560}
          onClose={() => setOpen(false)}
        >
          <form
            action={async (form) => {
              await saveToCollectionAction(form);
              setOpen(false);
            }}
          >
            <input type="hidden" name="code" value={code} />
            <input type="hidden" name="unit_id" value={unitId} />
            <input type="hidden" name="note" value={note} />

            <div className="flex gap-4 rounded-lg border border-edge bg-app p-3">
              {preview ? (
                <span className="w-[88px] shrink-0 overflow-hidden rounded-md border border-edge bg-panel">
                  <PlanCrop
                    unit={preview.unit}
                    floor={preview.floor}
                    aspect={1}
                    margin={0.18}
                  />
                </span>
              ) : null}
              <span className="min-w-0">
                <span className="flex items-center gap-2">
                  <span className="text-[17px] font-semibold text-text">
                    {unitNumber}
                  </span>
                  {basis ? <Badge basis={basis} /> : null}
                </span>
                <span className="mt-1 block text-[13px] text-text-2">
                  {projectName} · {city} · {year}
                </span>
                <span className="block font-mono text-[12px] text-text-3">
                  {filename} · {revision}
                </span>
                <span className="mt-0.5 block text-[12px] text-text-3">
                  {summary}
                </span>
              </span>
            </div>

            {currentProject ? (
              <div className="mt-4">
                <div className="text-[12px] text-text-2">Ajouter au projet</div>
                <div className="mt-1.5 flex h-12 items-center gap-3 rounded-lg border border-edge bg-panel px-3">
                  <span className="h-8 w-8 shrink-0 overflow-hidden rounded-md bg-app">
                    {currentProject.thumb ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={currentProject.thumb}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-medium text-text">
                      {currentProject.display_name}
                    </span>
                    <span className="block truncate text-[12px] text-text-3">
                      {currentProject.city}
                    </span>
                  </span>
                </div>
              </div>
            ) : null}

            <div className="mt-4">
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-text-2">Collection</span>
                <span className="flex-1" />
                {collections.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setAdding((a) => !a)}
                    className="flex items-center gap-1 text-[13px] font-medium text-brand transition-colors hover:text-brand-2"
                  >
                    <Icon name={adding ? "chevron-down" : "plus"} size={14} />
                    {adding ? "Choisir une collection existante" : "Nouvelle collection"}
                  </button>
                ) : null}
              </div>

              <div className="relative mt-1.5">
                <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-text-2">
                  <Icon name="bookmark" size={15} />
                </span>
                {adding ? (
                  <input
                    name="new_collection"
                    defaultValue="Références de conception"
                    aria-label="nom de la nouvelle collection"
                    className="h-12 w-full rounded-lg border border-edge bg-panel pr-3 pl-10 text-[13px] text-text"
                  />
                ) : (
                  <select
                    name="collection_id"
                    defaultValue={collections[0]?.id}
                    aria-label="collection"
                    className="select-pill h-12 w-full rounded-lg border border-edge bg-panel pr-8 pl-10 text-[13px] text-text"
                  >
                    {collections.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div className="mt-4">
              <label className="text-[12px] text-text-2" htmlFor="dna-note">
                Ajouter une note (facultatif)
              </label>
              <div className="relative mt-1.5">
                <textarea
                  id="dna-note"
                  rows={3}
                  maxLength={500}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Pourquoi cette disposition mérite d’être conservée."
                  className="w-full rounded-lg border border-edge bg-panel px-3 py-2.5 text-[13px] text-text placeholder:text-text-3"
                />
                <span className="absolute right-3 bottom-2.5 text-[11px] text-text-3">
                  {note.length}/500
                </span>
              </div>
            </div>

            <div className="mt-4">
              <div className="text-[12px] text-text-2">Étiquettes (facultatif)</div>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex h-8 items-center gap-1.5 rounded-lg border border-edge bg-app pr-1.5 pl-2.5 text-[12px] text-text-2"
                  >
                    {tag}
                    <button
                      type="button"
                      aria-label={`retirer ${tag}`}
                      onClick={() => setTags((t) => t.filter((x) => x !== tag))}
                      className="flex h-5 w-5 items-center justify-center rounded text-text-3 transition-colors hover:text-text"
                    >
                      <Icon name="close" size={12} />
                    </button>
                  </span>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const next = chips.find((c) => !tags.includes(c));
                    if (next) setTags((t) => [...t, next]);
                  }}
                  className="flex h-8 items-center gap-1 rounded-lg border border-dashed border-edge px-2.5 text-[12px] text-text-2 transition-colors hover:text-text"
                >
                  <Icon name="plus" size={13} />
                  Ajouter une étiquette
                </button>
              </div>
              <input type="hidden" name="tags" value={tags.join(", ")} />
            </div>

            <Footer onCancel={() => setOpen(false)} saved={saved} />
          </form>
        </Dialog>
      ) : null}
    </>
  );
}

function Footer({
  onCancel,
  saved,
}: {
  onCancel: () => void;
  saved: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <div className="mt-6 flex items-center gap-3">
      <button
        type="button"
        onClick={onCancel}
        className={`${BTN} flex-1 justify-center`}
      >
        Annuler
      </button>
      <button
        type="submit"
        disabled={pending}
        className={`${BTN_BRAND} flex-[2]`}
      >
        <Icon name="bookmark" size={14} />
        {pending
          ? "Enregistrement…"
          : saved
            ? "Mettre à jour la collection"
            : "Enregistrer dans la collection"}
      </button>
    </div>
  );
}
