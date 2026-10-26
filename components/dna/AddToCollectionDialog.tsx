"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { saveToCollectionAction } from "@/app/p/[code]/office-dna/actions";
import Dialog from "@/components/ui/Dialog";
import { FIELD, SELECT } from "@/components/ui/Action";
import type { Collection } from "@/lib/types";

/**
 * Saving an archived unit into the current project's reference library.
 * CollectionItem keeps a note, nothing else: the unit record already carries
 * the areas and the source drawing.
 */
export default function AddToCollectionDialog({
  code,
  unitId,
  unitNumber,
  projectName,
  summary,
  collections,
  saved,
}: {
  code: string;
  unitId: string;
  unitNumber: string;
  projectName: string;
  summary: string;
  collections: Collection[];
  saved: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(collections.length === 0);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-body text-ink transition-colors duration-[80ms] hover:text-accent"
      >
        {saved ? "saved · edit note" : "add to collection"}
      </button>

      {open ? (
        <Dialog title="add to project library" onClose={() => setOpen(false)}>
          <form
            action={async (form) => {
              await saveToCollectionAction(form);
              setOpen(false);
            }}
          >
            <input type="hidden" name="code" value={code} />
            <input type="hidden" name="unit_id" value={unitId} />

            <div className="rounded-[14px] border border-line bg-paper p-3">
              <div className="font-mono text-body text-ink">
                unit {unitNumber}
              </div>
              <div className="mt-1 font-mono text-meta text-ink-3">
                {projectName} · {summary}
              </div>
            </div>

            <div className="px-3 pt-4">
              <div className="flex items-center gap-2">
                <span className="label-11">collection</span>
                <span className="flex-1" />
                {collections.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setAdding((a) => !a)}
                    className="text-body text-ink-2 transition-colors duration-[80ms] hover:text-ink"
                  >
                    {adding ? "pick an existing one" : "new collection"}
                  </button>
                ) : null}
              </div>

              <div className="mt-2">
                {adding ? (
                  <input
                    name="new_collection"
                    defaultValue=""
                    placeholder="collection name"
                    aria-label="new collection name"
                    className={`w-full ${FIELD}`}
                  />
                ) : (
                  <select
                    name="collection_id"
                    defaultValue={collections[0]?.id}
                    aria-label="collection"
                    className={`w-full ${SELECT}`}
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

            <div className="px-3 pt-4">
              <label className="label-11" htmlFor="note">
                note
              </label>
              <textarea
                id="note"
                name="note"
                rows={3}
                maxLength={500}
                placeholder="why this layout is worth keeping"
                className="mt-2 w-full rounded-[14px] border border-line px-3 py-2 text-body text-ink focus:border-ink-2"
              />
            </div>

            <Footer onCancel={() => setOpen(false)} />
          </form>
        </Dialog>
      ) : null}
    </>
  );
}

function Footer({ onCancel }: { onCancel: () => void }) {
  const { pending } = useFormStatus();

  return (
    <div className="flex items-center gap-4 px-3 pt-4 pb-2">
      <button
        type="submit"
        disabled={pending}
        className="text-body text-ink transition-colors duration-[80ms] hover:text-accent disabled:text-ink-3"
      >
        {pending ? "saving" : "save to collection"}
      </button>
      <span className="text-ink-3">·</span>
      <button
        type="button"
        onClick={onCancel}
        className="text-body text-ink-2 transition-colors duration-[80ms] hover:text-ink"
      >
        cancel
      </button>
    </div>
  );
}
