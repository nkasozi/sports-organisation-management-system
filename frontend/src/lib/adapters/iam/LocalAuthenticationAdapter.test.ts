import { beforeEach, describe, expect, it } from "vitest";

import type { InBrowserSystemUserRepository } from "$lib/adapters/repositories/InBrowserSystemUserRepository";

import { LocalAuthenticationAdapter } from "./LocalAuthenticationAdapter";
import {
  create_mock_repository,
  create_test_payload,
} from "./LocalAuthenticationAdapter.test_support";

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
});
