"use server";

import { revalidatePath } from "next/cache";
import { createProject } from "@/lib/data";

export async function createProjectAction(form: FormData): Promise<void> {
  const display_name = String(form.get("display_name") ?? "").trim();
  const project_code = String(form.get("project_code") ?? "").trim();
  if (!display_name || !project_code) return;

  await createProject({
    display_name,
    project_code,
    city: String(form.get("city") ?? "").trim(),
    year: Number(form.get("year")) || new Date().getFullYear(),
    floors_count: Number(form.get("floors_count")) || 0,
  });

  revalidatePath("/");
}
