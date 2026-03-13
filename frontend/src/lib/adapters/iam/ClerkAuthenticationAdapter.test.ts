import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  ClerkAuthenticationAdapter,
  type ClerkSessionProvider,
} from "./ClerkAuthenticationAdapter";
import type { AuthVerificationResult } from "$lib/core/interfaces/ports";

function create_mock_clerk_session_provider(
  overrides?: Partial<ClerkSessionProvider>,
): ClerkSessionProvider {
  return {
    get_session_token: vi.fn().mockResolvedValue("mock-clerk-jwt-token-abc123"),
    get_current_user: vi.fn().mockReturnValue({
      id: "clerk-user-123",
      email_address: "testuser@example.com",
      full_name: "Test User",
      first_name: "Test",
      last_name: "User",
      image_url: "https://img.clerk.com/avatar.png",
    }),
    is_signed_in: vi.fn().mockReturnValue(true),
    ...overrides,
  };
}

describe("ClerkAuthenticationAdapter", () => {
  let mock_provider: ClerkSessionProvider;
  let adapter: ClerkAuthenticationAdapter;

  beforeEach(() => {
    mock_provider = create_mock_clerk_session_provider();
    adapter = new ClerkAuthenticationAdapter(mock_provider);
  });

  describe("generate_token", () => {
    it("should return a token using the clerk session token", async () => {
      const token_result = await adapter.generate_token({
        user_id: "clerk-user-123",
        email: "testuser@example.com",
        display_name: "Test User",
        organization_id: "org-1",
        team_id: "team-1",
      });

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
        get_session_token: vi.fn().mockResolvedValue(null),
        is_signed_in: vi.fn().mockReturnValue(false),
      });
      const no_session_adapter = new ClerkAuthenticationAdapter(
        no_session_provider,
      );

      const result = await no_session_adapter.generate_token({
        user_id: "clerk-user-123",
        email: "testuser@example.com",
        display_name: "Test User",
        organization_id: "org-1",
        team_id: "team-1",
      });

      expect(result.success).toBe(false);
    });

    it("should populate issued_at and expires_at timestamps", async () => {
      const before_generation = Math.floor(Date.now() / 1000);

      const token_result = await adapter.generate_token({
        user_id: "clerk-user-123",
        email: "testuser@example.com",
        display_name: "Test User",
        organization_id: "org-1",
        team_id: "team-1",
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

  describe("verify_token", () => {
    it("should return valid result when clerk session is active", async () => {
      const result = await adapter.verify_token("mock-clerk-jwt-token-abc123");

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.is_valid).toBe(true);
      expect(result.data.payload).toBeDefined();
      expect(result.data.payload?.user_id).toBe("clerk-user-123");
      expect(result.data.payload?.email).toBe("testuser@example.com");
      expect(result.data.payload?.display_name).toBe("Test User");
    });

    it("should return invalid result when clerk user is not signed in", async () => {
      const signed_out_provider = create_mock_clerk_session_provider({
        is_signed_in: vi.fn().mockReturnValue(false),
        get_current_user: vi.fn().mockReturnValue(null),
        get_session_token: vi.fn().mockResolvedValue(null),
      });
      const signed_out_adapter = new ClerkAuthenticationAdapter(
        signed_out_provider,
      );

      const result = await signed_out_adapter.verify_token("some-old-token");

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.is_valid).toBe(false);
      expect(result.data.error_message).toBeDefined();
    });

    it("should return invalid result when clerk user is null", async () => {
      const no_user_provider = create_mock_clerk_session_provider({
        is_signed_in: vi.fn().mockReturnValue(true),
        get_current_user: vi.fn().mockReturnValue(null),
      });
      const no_user_adapter = new ClerkAuthenticationAdapter(no_user_provider);

      const result = await no_user_adapter.verify_token("some-token");

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.is_valid).toBe(false);
      expect(result.data.error_message).toBeDefined();
    });

    it("should cache successful verification results", async () => {
      const first_result = await adapter.verify_token("clerk-token-xyz");
      const second_result = await adapter.verify_token("clerk-token-xyz");

      expect(first_result.success).toBe(true);
      expect(second_result.success).toBe(true);
      if (!first_result.success || !second_result.success) return;
      expect(first_result.data.is_valid).toBe(true);
      expect(second_result.data.is_valid).toBe(true);

      expect(mock_provider.is_signed_in).toHaveBeenCalledTimes(1);
    });

    it("should not cache failed verification results", async () => {
      const flaky_provider = create_mock_clerk_session_provider({
        is_signed_in: vi
          .fn()
          .mockReturnValueOnce(false)
          .mockReturnValueOnce(true),
        get_current_user: vi.fn().mockReturnValue({
          id: "clerk-user-123",
          email_address: "testuser@example.com",
          full_name: "Test User",
          first_name: "Test",
          last_name: "User",
        }),
      });
      const flaky_adapter = new ClerkAuthenticationAdapter(flaky_provider);

      const first_result = await flaky_adapter.verify_token("some-token");
      const second_result = await flaky_adapter.verify_token("some-token");

      expect(first_result.success).toBe(true);
      expect(second_result.success).toBe(true);
      if (!first_result.success || !second_result.success) return;
      expect(first_result.data.is_valid).toBe(false);
      expect(second_result.data.is_valid).toBe(true);
      expect(flaky_provider.is_signed_in).toHaveBeenCalledTimes(2);
    });

    it("should include user identity in verification payload without a role", async () => {
      const result = await adapter.verify_token("clerk-token");

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.payload?.user_id).toBe("clerk-user-123");
      expect(result.data.payload?.email).toBe("testuser@example.com");
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
