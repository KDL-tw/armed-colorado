/**
 * Admin session cookie — shared-password gate for /admin.
 *
 * Token format: `${expiresAtMs}.${hex(sha256(ADMIN_PASSWORD + "." + expiresAtMs))}`
 * The password is the key; no separate session secret is needed.
 * Uses only WebCrypto (globalThis.crypto.subtle) so the same module runs in
 * the Proxy (Node.js runtime by default in Next 16) and in Node server actions.
 */

export const SESSION_COOKIE = "admin_session";
export const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

async function sha256(input: string): Promise<Uint8Array> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input),
  );
  return new Uint8Array(digest);
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Constant-time string compare (hashes first so lengths are normalized). */
export async function constantTimeEqual(
  a: string,
  b: string,
): Promise<boolean> {
  const [ha, hb] = await Promise.all([sha256(a), sha256(b)]);
  if (ha.byteLength !== hb.byteLength) return false;
  let diff = 0;
  for (let i = 0; i < ha.byteLength; i++) diff |= ha[i] ^ hb[i];
  return diff === 0;
}

export async function signSession(
  password: string,
  nowMs: number = Date.now(),
): Promise<string> {
  const expiresAt = nowMs + SESSION_TTL_MS;
  return `${expiresAt}.${toHex(await sha256(`${password}.${expiresAt}`))}`;
}

export async function verifySession(
  password: string,
  cookieValue: string,
  nowMs: number = Date.now(),
): Promise<boolean> {
  const dot = cookieValue.lastIndexOf(".");
  if (dot <= 0 || dot === cookieValue.length - 1) return false;
  const expiresAtRaw = cookieValue.slice(0, dot);
  const mac = cookieValue.slice(dot + 1);
  if (!/^\d+$/.test(expiresAtRaw)) return false;
  const expiresAt = Number(expiresAtRaw);
  if (expiresAt <= nowMs) return false;
  return constantTimeEqual(
    toHex(await sha256(`${password}.${expiresAt}`)),
    mac,
  );
}
