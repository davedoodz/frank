"use server";

import { revalidatePath } from "next/cache";
import { DEFAULT_PREFS } from "@/lib/prefs";
import { writePrefs } from "@/lib/prefs.server";
import type { AreaUnit, Density } from "@/lib/prefs";

export async function setAreaAction(value: AreaUnit): Promise<void> {
  await writePrefs({ area: value });
  revalidatePath("/", "layout");
}

export async function setLowConfidenceAction(value: number): Promise<void> {
  await writePrefs({ lowConfidence: value });
  revalidatePath("/", "layout");
}

export async function setDensityAction(value: Density): Promise<void> {
  await writePrefs({ density: value });
  revalidatePath("/", "layout");
}

export async function setTypologyFillsAction(value: boolean): Promise<void> {
  await writePrefs({ typologyFills: value });
  revalidatePath("/", "layout");
}

export async function resetPrefsAction(): Promise<void> {
  await writePrefs(DEFAULT_PREFS);
  revalidatePath("/", "layout");
}
