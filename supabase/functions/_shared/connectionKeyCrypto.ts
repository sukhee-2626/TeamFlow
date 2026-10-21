// Server-only. Lovable auto-provisions APP_USER_CONNECTION_KEY_SECRET (base64, 32 bytes).
async function key(): Promise<CryptoKey> {
  const raw = Deno.env.get("APP_USER_CONNECTION_KEY_SECRET");
  if (!raw) throw new Error("APP_USER_CONNECTION_KEY_SECRET is not set");
  return crypto.subtle.importKey(
    "raw",
    Uint8Array.from(atob(raw), (c) => c.charCodeAt(0)),
    "AES-GCM",
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptConnectionKey(plaintext: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await key(), new TextEncoder().encode(plaintext)),
  );
  // iv | ciphertext+tag, base64 — one opaque column value.
  const buf = new Uint8Array(iv.length + ciphertext.length);
  buf.set(iv);
  buf.set(ciphertext, iv.length);
  return btoa(String.fromCharCode(...buf));
}

export async function decryptConnectionKey(stored: string): Promise<string> {
  const buf = Uint8Array.from(atob(stored), (c) => c.charCodeAt(0));
  const iv = buf.subarray(0, 12);
  const ciphertext = buf.subarray(12);
  const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, await key(), ciphertext);
  return new TextDecoder().decode(plaintext);
}
