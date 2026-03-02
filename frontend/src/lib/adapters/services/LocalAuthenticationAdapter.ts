import type {
  AuthenticationPort,
  AuthToken,
  AuthTokenPayload,
  AuthVerificationResult,
} from "$lib/core/interfaces/ports/AuthenticationPort";
import type { InBrowserSystemUserRepository } from "$lib/adapters/repositories/InBrowserSystemUserRepository";
import { browser } from "$app/environment";

function get_secret_key(): string {
  if (browser) {
    return (
      import.meta.env.VITE_AUTH_SECRET_KEY ||
      "dev-only-fallback-key-not-for-production"
    );
  }
  return "server-side-placeholder";
}

const TOKEN_EXPIRY_DAYS = 365;

function base64_url_encode(data: string): string {
  const base64 = btoa(data);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64_url_decode(encoded: string): string {
  let base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
  const padding = base64.length % 4;
  if (padding) {
    base64 += "=".repeat(4 - padding);
  }
  return atob(base64);
}

async function create_hmac_signature(
  data: string,
  secret: string,
): Promise<string> {
  const encoder = new TextEncoder();
  const key_data = encoder.encode(secret);
  const message_data = encoder.encode(data);

  const crypto_key = await crypto.subtle.importKey(
    "raw",
    key_data,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign("HMAC", crypto_key, message_data);
  const signature_array = new Uint8Array(signature);
  const signature_hex = Array.from(signature_array)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return signature_hex;
}

async function verify_hmac_signature(
  data: string,
  signature: string,
  secret: string,
): Promise<boolean> {
  const expected_signature = await create_hmac_signature(data, secret);
  return signature === expected_signature;
}

function create_token_header(): string {
  const header = { alg: "HS256", typ: "JWT" };
  return base64_url_encode(JSON.stringify(header));
}

export class LocalAuthenticationAdapter implements AuthenticationPort {
  private system_user_repository: InBrowserSystemUserRepository;

  constructor(system_user_repository: InBrowserSystemUserRepository) {
    this.system_user_repository = system_user_repository;
  }

  async generate_token(
    payload_input: Omit<AuthTokenPayload, "issued_at" | "expires_at">,
  ): Promise<AuthToken> {
    const now = Date.now();
    const expires_at = now + TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

    const payload: AuthTokenPayload = {
      ...payload_input,
      issued_at: now,
      expires_at,
    };

    const header = create_token_header();
    const encoded_payload = base64_url_encode(JSON.stringify(payload));
    const signature_input = `${header}.${encoded_payload}`;
    const signature = await create_hmac_signature(
      signature_input,
      get_secret_key(),
    );

    const raw_token = `${header}.${encoded_payload}.${signature}`;

    console.log(
      `[LocalAuthenticationAdapter] Generated token for user: ${payload.email}, role: ${payload.role}`,
    );

    return {
      payload,
      signature,
      raw_token,
    };
  }

  async verify_token(raw_token: string): Promise<AuthVerificationResult> {
    if (!raw_token || raw_token.trim().length === 0) {
      return { is_valid: false, error_message: "Token is empty" };
    }

    const parts = raw_token.split(".");
    if (parts.length !== 3) {
      return { is_valid: false, error_message: "Invalid token format" };
    }

    const [header, encoded_payload, signature] = parts;
    const signature_input = `${header}.${encoded_payload}`;

    const is_signature_valid = await verify_hmac_signature(
      signature_input,
      signature,
      get_secret_key(),
    );

    if (!is_signature_valid) {
      console.warn(
        "[LocalAuthenticationAdapter] Token signature verification failed - token may have been tampered with",
      );
      return { is_valid: false, error_message: "Token has been tampered with" };
    }

    const payload = this.parse_token_payload(raw_token);
    if (!payload) {
      return {
        is_valid: false,
        error_message: "Failed to decode token payload",
      };
    }

    if (Date.now() > payload.expires_at) {
      console.warn("[LocalAuthenticationAdapter] Token has expired");
      return { is_valid: false, error_message: "Token has expired" };
    }

    const user_result = await this.system_user_repository.find_by_email(
      payload.email,
    );

    if (!user_result.success || user_result.data.items.length === 0) {
      console.warn(
        `[LocalAuthenticationAdapter] User not found for email: ${payload.email}`,
      );
      return { is_valid: false, error_message: "User not found" };
    }

    const system_user = user_result.data.items[0];

    console.log(
      `[LocalAuthenticationAdapter] Token verified successfully for user: ${payload.email}`,
    );

    return { is_valid: true, payload, system_user };
  }

  private parse_token_payload(raw_token: string): AuthTokenPayload | null {
    if (!raw_token || raw_token.trim().length === 0) {
      return null;
    }

    const parts = raw_token.split(".");
    if (parts.length !== 3) {
      return null;
    }

    try {
      const decoded_payload = base64_url_decode(parts[1]);
      return JSON.parse(decoded_payload) as AuthTokenPayload;
    } catch (error) {
      console.error(
        "[LocalAuthenticationAdapter] Failed to decode token:",
        error,
      );
      return null;
    }
  }
}

let authentication_adapter_instance: LocalAuthenticationAdapter | null = null;

export function get_authentication_adapter(
  system_user_repository: InBrowserSystemUserRepository,
): LocalAuthenticationAdapter {
  if (!authentication_adapter_instance) {
    authentication_adapter_instance = new LocalAuthenticationAdapter(
      system_user_repository,
    );
  }
  return authentication_adapter_instance;
}
