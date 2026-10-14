const BASE64_BLOCK_LENGTH = 4;
const BASE64_PADDING_CHARACTER = "=";

function encode_utf8_as_binary_string(data: string): string {
  return Array.from(new TextEncoder().encode(data), (byte: number) =>
    String.fromCharCode(byte),
  ).join("");
}

function decode_binary_string_as_utf8(binary: string): string {
  const bytes = Uint8Array.from(binary, (character: string) =>
    character.charCodeAt(0),
  );
  return new TextDecoder().decode(bytes);
}

function restore_base64_padding(base64: string): string {
  const remainder = base64.length % BASE64_BLOCK_LENGTH;
  if (remainder === 0) return base64;
  return (
    base64 + BASE64_PADDING_CHARACTER.repeat(BASE64_BLOCK_LENGTH - remainder)
  );
}

export function base64_url_encode(data: string): string {
  return btoa(encode_utf8_as_binary_string(data))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function base64_url_decode(encoded: string): string {
  const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
  return decode_binary_string_as_utf8(atob(restore_base64_padding(base64)));
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
