"use server";

import { revalidatePath } from "next/cache";
import { setUnitVerified } from "@/lib/data";

/**
 * Verification is the one write the plan makes against an indexed unit. Every
 * getter reads through the same store, so the plan, the schedule, the floor
 * statistics and the dashboard card count all need a revalidation pass.
 */
export async function setUnitVerifiedAction(
  code: string,
  unitId: string,
  on: boolean,
): Promise<void> {
  await setUnitVerified(unitId, on);

  revalidatePath(`/p/${code}/units`);
  revalidatePath(`/p/${code}/schedule`);
  revalidatePath("/");
}
