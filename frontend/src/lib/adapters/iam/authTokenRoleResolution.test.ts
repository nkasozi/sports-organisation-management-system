import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  create_failure_result,
  create_success_result,
} from "../../core/types/Result";
import {
  get_allowed_entity_actions_impl,
  get_disabled_entity_actions_impl,
} from "./authEntityActions";
import { check_entity_authorized_impl } from "./authEntityCheck";
import {
  resolve_token_role,
  TOKEN_ROLE_STATUS,
} from "./authTokenRoleResolution";
import { IAM_MESSAGE } from "./iamConstants";

const VALID_VERIFICATION = create_success_result({
  is_valid: true,
  payload: { email: "admin@example.com" },
});

function build_ports(lookup_result: unknown): {
  auth_port: never;
  system_user_repository: never;
  cache: never;
} {
  return {
    auth_port: {
      verify_token: vi.fn().mockResolvedValue(VALID_VERIFICATION),
    } as never,
    system_user_repository: {
      find_by_email: vi.fn().mockResolvedValue(lookup_result),
    } as never,
    cache: {
      lookup: vi.fn().mockReturnValue({ status: "miss", reason: "absent" }),
      set: vi.fn(),
    } as never,
  };
}

const LOOKUP_FAILURE = create_failure_result("Failed to find system user");

describe("authTokenRoleResolution", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => true);
    vi.spyOn(console, "warn").mockImplementation(() => true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reports storage failures as lookup failures with a user-safe message", async () => {
    const ports = build_ports(LOOKUP_FAILURE);

    const resolution = await resolve_token_role({
      auth_port: ports.auth_port,
      system_user_repository: ports.system_user_repository,
      raw_token: "token",
    });

    expect(resolution).toEqual({
      status: TOKEN_ROLE_STATUS.LOOKUP_FAILED,
      message: IAM_MESSAGE.AUTHORIZATION_UNAVAILABLE,
    });
    expect(console.error).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ event: "iam_role_lookup_failed" }),
    );
  });

  it("classifies expired verification messages", async () => {
    const auth_port = {
      verify_token: vi.fn().mockResolvedValue(
        create_success_result({
          is_valid: false,
          error_message: "Token has expired",
        }),
      ),
    };

    const resolution = await resolve_token_role({
      auth_port: auth_port as never,
      system_user_repository: {} as never,
      raw_token: "token",
    });

    expect(resolution.status).toBe(TOKEN_ROLE_STATUS.TOKEN_EXPIRED);
  });

  it("propagates lookup failures instead of returning empty action sets", async () => {
    const ports = build_ports(LOOKUP_FAILURE);
    const args = [
      ports.auth_port,
      ports.system_user_repository,
      ports.cache,
      "token",
      "team",
    ] as const;

    const allowed = await get_allowed_entity_actions_impl(...args);
    const disabled = await get_disabled_entity_actions_impl(...args);
    const check = await check_entity_authorized_impl(...args, "read");

    for (const result of [allowed, disabled, check]) {
      expect(result).toEqual({
        success: false,
        error: IAM_MESSAGE.AUTHORIZATION_UNAVAILABLE,
      });
    }
    expect((ports.cache as { set: () => void }).set).not.toHaveBeenCalled();
  });

  it("denies unknown users with a uniform message and no email in logs", async () => {
    const ports = build_ports(
      create_success_result({
        items: [],
        total_count: 0,
        page_number: 1,
        page_size: 1,
        total_pages: 1,
      }),
    );

    const allowed = await get_allowed_entity_actions_impl(
      ports.auth_port,
      ports.system_user_repository,
      ports.cache,
      "token",
      "team",
    );

    expect(allowed).toEqual({ success: true, data: [] });
    expect(JSON.stringify(vi.mocked(console.warn).mock.calls)).not.toContain(
      "admin@example.com",
    );
  });
});
