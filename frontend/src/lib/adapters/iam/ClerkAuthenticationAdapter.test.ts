import { beforeEach, describe, expect, it, vi } from "vitest";

import { create_failure_result } from "$lib/core/types/Result";

import {
  ClerkAuthenticationAdapter,
  type ClerkSessionProvider,
} from "./ClerkAuthenticationAdapter";
import {
  create_auth_token_input,
  create_mock_clerk_session_provider,
} from "./ClerkAuthenticationAdapter.test_support";

describe("ClerkAuthenticationAdapter", () => {
  let mock_provider: ClerkSessionProvider;
  let adapter: ClerkAuthenticationAdapter;

  beforeEach(() => {
    mock_provider = create_mock_clerk_session_provider();
    adapter = new ClerkAuthenticationAdapter(mock_provider);
  });

  describe("generate_token", () => {
    it("should return a token using the clerk session token", async () => {
      const token_result = await adapter.generate_token(
        create_auth_token_input(),
      );

      expect(token_result.success).toBe(true);
      if (!token_result.success) return;
      const token = token_result.data;
      expect(token.raw_token).toBe("mock-clerk-jwt-token-abc123");
      expect(token.payload.user_id).toBe("clerk-user-123");
      expect(token.payload.email).toBe("testuser@example.com");
      expect(token.payload.organization_id).toBe("org-1");
      expect(token.payload.team_id).toBe("team-1");
      expect(mock_provider.get_session_token).toHaveBeenCalled();
    });

    it("should return failure when no clerk session is available", async () => {
      const no_session_provider = create_mock_clerk_session_provider({
        get_session_token: vi
          .fn()
          .mockResolvedValue(
            create_failure_result(
              "No active Clerk session - cannot generate token",
            ),
          ),
        is_signed_in: vi.fn().mockReturnValue(false),
      });
      const no_session_adapter = new ClerkAuthenticationAdapter(
        no_session_provider,
      );

      const result = await no_session_adapter.generate_token({
        ...create_auth_token_input(),
      });

      expect(result.success).toBe(false);
    });

    it("should populate issued_at and expires_at timestamps", async () => {
      const before_generation = Math.floor(Date.now() / 1000);

      const token_result = await adapter.generate_token({
        ...create_auth_token_input(),
      });

      const after_generation = Math.floor(Date.now() / 1000);

      expect(token_result.success).toBe(true);
      if (!token_result.success) return;
      const token = token_result.data;
      expect(token.payload.issued_at).toBeGreaterThanOrEqual(before_generation);
      expect(token.payload.issued_at).toBeLessThanOrEqual(after_generation);
      expect(token.payload.expires_at).toBeGreaterThan(token.payload.issued_at);
    });
  });

  describe("get_verification_cache", () => {
    it("should return the internal cache instance", () => {
      const cache = adapter.get_verification_cache();

      expect(cache).toBeDefined();
      expect(cache.get_stats).toBeDefined();
      expect(cache.invalidate_all).toBeDefined();
    });
  });
});
