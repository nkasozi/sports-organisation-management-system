export function base64_url_encode(data: string): string {
  return btoa(data).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function base64_url_decode(encoded: string): string {
  let base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
  const padding = base64.length % 4;
  if (padding) {
    base64 += "=".repeat(4 - padding);
  }
  return atob(base64);
}

export async function create_hmac_signature(
  data: string,
  secret: string,
): Promise<string> {
  const encoder = new TextEncoder();
  const crypto_key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    crypto_key,
    encoder.encode(data),
  );
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function verify_hmac_signature(
  data: string,
  signature: string,
  secret: string,
): Promise<boolean> {
  const expected_signature = await create_hmac_signature(data, secret);
  return signature === expected_signature;
}

export function create_token_header(): string {
  return base64_url_encode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
}
