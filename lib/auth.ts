export const AUTH_COOKIE = "fitte_access";

async function hmac(value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(process.env.FITTE_COOKIE_SECRET ?? ""),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Token is `granted.<hmac>`; the password itself is never stored in the cookie. */
export async function issueToken(): Promise<string> {
  return `granted.${await hmac("granted")}`;
}

export async function isValidToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const [claim, sig] = token.split(".");
  if (claim !== "granted" || !sig) return false;
  const expected = await hmac("granted");
  if (sig.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < sig.length; i += 1) {
    diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}
