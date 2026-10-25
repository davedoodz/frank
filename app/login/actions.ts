"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE, issueToken } from "@/lib/auth";

export async function signIn(_state: string, form: FormData): Promise<string> {
  const password = String(form.get("password") ?? "");
  const next = String(form.get("next") ?? "/");

  if (!process.env.FITTE_PASSWORD || password !== process.env.FITTE_PASSWORD) {
    return "incorrect";
  }

  const store = await cookies();
  store.set(AUTH_COOKIE, await issueToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect(next.startsWith("/") ? next : "/");
}
