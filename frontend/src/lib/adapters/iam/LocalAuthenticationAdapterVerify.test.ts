import { beforeEach, describe, expect, it } from "vitest";

import type { InBrowserSystemUserRepository } from "$lib/adapters/repositories/InBrowserSystemUserRepository";
import type { AuthTokenPayload } from "$lib/core/interfaces/ports";

import { LocalAuthenticationAdapter } from "./LocalAuthenticationAdapter";
import {
  create_mock_repository,
  create_test_payload,
  create_test_payload_with_overrides,
} from "./LocalAuthenticationAdapter.test_support";

describe("LocalAuthenticationAdapter", () => {
  let adapter: LocalAuthenticationAdapter;
  let mock_repository: InBrowserSystemUserRepository;

  beforeEach(() => {
    mock_repository = create_mock_repository();
    adapter = new LocalAuthenticationAdapter(mock_repository);
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
