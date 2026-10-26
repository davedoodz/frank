"use server";

import { revalidatePath } from "next/cache";
import {
  addCollectionItem,
  createCollection,
  getProject,
  removeCollectionItem,
} from "@/lib/data";

/**
 * Saving an archived unit to the project's reference library. A new
 * collection name wins over the picked collection, so one form covers both.
 */
export async function saveToCollectionAction(form: FormData): Promise<void> {
  const code = String(form.get("code") ?? "").trim();
  const unitId = String(form.get("unit_id") ?? "").trim();
  if (!code || !unitId) return;

  const project = await getProject(code);
  if (!project) return;

  const newName = String(form.get("new_collection") ?? "").trim();
  const picked = String(form.get("collection_id") ?? "").trim();
  const collectionId = newName
    ? (await createCollection(project.id, newName)).id
    : picked;
  if (!collectionId) return;

  const note = String(form.get("note") ?? "").trim();
  await addCollectionItem(collectionId, unitId, note || null);

  revalidatePath(`/p/${code}/office-dna`);
}

export async function removeFromCollectionAction(form: FormData): Promise<void> {
  const code = String(form.get("code") ?? "").trim();
  const collectionId = String(form.get("collection_id") ?? "").trim();
  const unitId = String(form.get("unit_id") ?? "").trim();
  if (!code || !collectionId || !unitId) return;

  await removeCollectionItem(collectionId, unitId);
  revalidatePath(`/p/${code}/office-dna`);
}
