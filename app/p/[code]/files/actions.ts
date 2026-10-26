"use server";

import { revalidatePath } from "next/cache";
import { connectDrawings } from "@/lib/data";
import type { Drawing } from "@/lib/types";

/**
 * Connecting a file is the one write the setup flow makes. Indexing happens in
 * AutoCAD, so a file arrives here as connected and nothing else changes.
 */
export async function connectDrawingsAction(
  code: string,
  projectId: string,
  drawings: Drawing[],
): Promise<void> {
  await connectDrawings(projectId, drawings);

  revalidatePath(`/p/${code}`);
  revalidatePath(`/p/${code}/files`);
  revalidatePath(`/p/${code}/drawings`);
  revalidatePath("/");
}
