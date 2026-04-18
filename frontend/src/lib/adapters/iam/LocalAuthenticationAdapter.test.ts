import { beforeEach, describe, expect, it, vi } from "vitest";

import type { InBrowserSystemUserRepository } from "$lib/adapters/repositories/InBrowserSystemUserRepository";
import type { SystemUser } from "$lib/core/entities/SystemUser";
import {
  type AuthTokenPayload,
  create_auth_token_payload_core,
} from "$lib/core/interfaces/ports";

import { LocalAuthenticationAdapter } from "./LocalAuthenticationAdapter";

interface CreateTestPayloadOverrides {
  user_id?: string;
  email?: string;
  display_name?: string;
  role?: AuthTokenPayload["role"];
  organization_id?: string;
  team_id?: string;
}

function create_test_payload(): Omit<
  AuthTokenPayload,
  "issued_at" | "expires_at"
> {
  return create_test_payload_with_overrides();
}

function create_test_payload_with_overrides(
  overrides: CreateTestPayloadOverrides = {},
): Omit<AuthTokenPayload, "issued_at" | "expires_at"> {
  const result = create_auth_token_payload_core({
    user_id: overrides.user_id ?? "test-user-123",
    email: overrides.email ?? "test@example.com",
    display_name: overrides.display_name ?? "Test User",
    role: overrides.role ?? "super_admin",
    organization_id: overrides.organization_id ?? "*",
    team_id: overrides.team_id ?? "*",
  });

  expect(result.success).toBe(true);

  return (
    result as {
      success: true;
      data: Omit<AuthTokenPayload, "issued_at" | "expires_at">;
    }
  ).data;
}

function create_mock_system_user(): SystemUser {
  return {
    id: "test-user-123",
    email: "test@example.com",
    first_name: "Test",
    last_name: "User",
    role: "super_admin",
    status: "active",
    organization_id: "*",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as SystemUser;
}

function create_mock_repository(): InBrowserSystemUserRepository {
  const mock_user = create_mock_system_user();
  return {
    find_by_email: vi.fn().mockResolvedValue({
      success: true,
      data: {
        items: [mock_user],
        total_count: 1,
        page_number: 1,
        page_size: 10,
        total_pages: 1,
      },
    }),
  } as unknown as InBrowserSystemUserRepository;
}

describe("LocalAuthenticationAdapter", () => {
  let adapter: LocalAuthenticationAdapter;
  let mock_repository: InBrowserSystemUserRepository;

  beforeEach(() => {
    mock_repository = create_mock_repository();
    adapter = new LocalAuthenticationAdapter(mock_repository);
  });

  describe("generate_token", () => {
    it("should generate a valid JWT-like token", async () => {
      const payload_input = create_test_payload();
      const token_result = await adapter.generate_token(payload_input);

      expect(token_result.success).toBe(true);
      if (!token_result.success) return;
      expect(token_result.data.raw_token).toBeDefined();
      expect(token_result.data.payload).toBeDefined();
      expect(token_result.data.signature).toBeDefined();
    });

    it("should include issued_at and expires_at in the payload", async () => {
      const payload_input = create_test_payload();
      const token_result = await adapter.generate_token(payload_input);

      expect(token_result.success).toBe(true);
      if (!token_result.success) return;
      const token = token_result.data;
      expect(token.payload.issued_at).toBeDefined();
      expect(token.payload.expires_at).toBeDefined();
      expect(token.payload.expires_at).toBeGreaterThan(token.payload.issued_at);
    });

    it("should set expiry to 7 days from now", async () => {
      const payload_input = create_test_payload();
      const before_generation = Date.now();
      const token_result = await adapter.generate_token(payload_input);
      const after_generation = Date.now();

      expect(token_result.success).toBe(true);
      if (!token_result.success) return;
      const token = token_result.data;

      const expected_min_expiry = before_generation + 7 * 24 * 60 * 60 * 1000;
      const expected_max_expiry = after_generation + 7 * 24 * 60 * 60 * 1000;

      expect(token.payload.expires_at).toBeGreaterThanOrEqual(
        expected_min_expiry,
      );
      expect(token.payload.expires_at).toBeLessThanOrEqual(expected_max_expiry);
    });

    it("should generate token with three parts separated by dots", async () => {
      const payload_input = create_test_payload();
      const token_result = await adapter.generate_token(payload_input);

      expect(token_result.success).toBe(true);
      if (!token_result.success) return;
      const parts = token_result.data.raw_token.split(".");
      expect(parts).toHaveLength(3);
    });
  });

  describe("verify_token", () => {
    it("should verify a valid token successfully", async () => {
      const payload_input = create_test_payload();
      const token_result = await adapter.generate_token(payload_input);
      expect(token_result.success).toBe(true);
      if (!token_result.success) return;
      const token = token_result.data;

      const result = await adapter.verify_token(token.raw_token);

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.is_valid).toBe(true);
      expect(result.data.payload).toBeDefined();
      expect(result.data.payload?.email).toBe(payload_input.email);
    });

    it("should verify public viewer tokens without loading a system user", async () => {
      const payload_input = create_test_payload_with_overrides({
        user_id: "public-viewer",
        email: "public-viewer@anonymous.invalid",
        display_name: "Public Viewer",
        role: "public_viewer",
      });
      const token_result = await adapter.generate_token(payload_input);

      expect(token_result.success).toBe(true);
      if (!token_result.success) return;

      const result = await adapter.verify_token(token_result.data.raw_token);

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.is_valid).toBe(true);
      expect("system_user" in result.data).toBe(false);
      expect(result.data.payload?.user_id).toBe("public-viewer");
      expect(mock_repository.find_by_email).not.toHaveBeenCalled();
    });

    it("should fail verification for empty token", async () => {
      const result = await adapter.verify_token("");

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.is_valid).toBe(false);
      expect(result.data.error_message).toBe("Token is empty");
    });

    it("should fail verification for invalid token format", async () => {
      const result = await adapter.verify_token("invalid-token-without-dots");

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.is_valid).toBe(false);
      expect(result.data.error_message).toBe("Invalid token format");
    });

    it("should detect tampered token", async () => {
      const payload_input = create_test_payload();
      const token_result = await adapter.generate_token(payload_input);
      expect(token_result.success).toBe(true);
      if (!token_result.success) return;
      const token = token_result.data;

      const parts = token.raw_token.split(".");
      const tampered_payload = btoa(
        JSON.stringify({ ...token.payload, role: "player" }),
      )
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
      const tampered_token = `${parts[0]}.${tampered_payload}.${parts[2]}`;

      const result = await adapter.verify_token(tampered_token);

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.is_valid).toBe(false);
      expect(result.data.error_message).toBe("Token has been tampered with");
    });

    it("should detect expired token", async () => {
      const payload_input = create_test_payload();
      const token_result = await adapter.generate_token(payload_input);
      expect(token_result.success).toBe(true);
      if (!token_result.success) return;
      const token = token_result.data;

      const expired_payload = {
        ...token.payload,
        issued_at: Date.now() - 400 * 24 * 60 * 60 * 1000,
        expires_at: Date.now() - 35 * 24 * 60 * 60 * 1000,
      } as AuthTokenPayload;

      const header = token.raw_token.split(".")[0];
      const encoded_payload = btoa(JSON.stringify(expired_payload))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

      const expired_token = await adapter.generate_token({
        ...payload_input,
      });

      const modified_expired_token = `${header}.${encoded_payload}.fake-signature`;
      const result = await adapter.verify_token(modified_expired_token);

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.is_valid).toBe(false);
    });
  });
});
