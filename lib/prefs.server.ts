/** Server-only: reads and writes the one preferences cookie. */
import { cookies } from "next/headers";
import { coercePrefs, DEFAULT_PREFS, PREFS_COOKIE, type Prefs } from "@/lib/prefs";

export async function getPrefs(): Promise<Prefs> {
  const value = (await cookies()).get(PREFS_COOKIE)?.value;
  if (!value) return DEFAULT_PREFS;
  try {
    return coercePrefs(JSON.parse(value));
  } catch {
    return DEFAULT_PREFS;
  }
}

export async function writePrefs(next: Partial<Prefs>): Promise<Prefs> {
  const merged = coercePrefs({ ...(await getPrefs()), ...next });
  (await cookies()).set(PREFS_COOKIE, JSON.stringify(merged), {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return merged;
}
