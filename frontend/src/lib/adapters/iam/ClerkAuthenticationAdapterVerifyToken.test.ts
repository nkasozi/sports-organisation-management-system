import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";

import {
  ClerkAuthenticationAdapter,
  type ClerkSessionProvider,
} from "./ClerkAuthenticationAdapter";
import { create_mock_clerk_session_provider } from "./ClerkAuthenticationAdapter.test_support";

describe("ClerkAuthenticationAdapter", () => {
  let mock_provider: ClerkSessionProvider;
  let adapter: ClerkAuthenticationAdapter;

  beforeEach(() => {
    mock_provider = create_mock_clerk_session_provider();
    adapter = new ClerkAuthenticationAdapter(mock_provider);
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
        get_current_user: vi
          .fn()
          .mockReturnValue(create_failure_result("Clerk user is unavailable")),
        get_session_token: vi
          .fn()
          .mockResolvedValue(
            create_failure_result("No Clerk session available"),
          ),
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

    it("should return invalid result when clerk user is unavailable", async () => {
      const no_user_provider = create_mock_clerk_session_provider({
        is_signed_in: vi.fn().mockReturnValue(true),
        get_current_user: vi
          .fn()
          .mockReturnValue(create_failure_result("Clerk user is unavailable")),
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
        get_current_user: vi.fn().mockReturnValue(
          create_success_result({
            id: "clerk-user-123",
            email_address: "testuser@example.com",
            full_name: "Test User",
            first_name: "Test",
            last_name: "User",
          }),
        ),
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
});
