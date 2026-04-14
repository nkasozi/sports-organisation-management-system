import { afterEach, describe, expect, it, vi } from "vitest";

import { ENTITY_STATUS } from "../../core/entities/StatusConstants";
import { create_success_result, type Result } from "../../core/types/Result";
import {
  get_profile_permissions_impl,
  get_role_for_email,
} from "./authProfilePermissions";

function create_paginated_result<TData>(items: TData[]) {
  return {
    items,
    total_count: items.length,
    page_number: 1,
    page_size: items.length || 1,
    total_pages: 1,
  };
}

function create_system_user(overrides: Record<string, unknown> = {}) {
  return {
    id: "system_user_1",
    email: "admin@example.com",
    role: "org_admin",
    status: ENTITY_STATUS.ACTIVE,
    ...overrides,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("authProfilePermissions", () => {
  it("resolves active user roles and rejects missing or inactive users", async () => {
    const missing_user_repository = {
      find_by_email: vi
        .fn()
        .mockResolvedValue(create_success_result(create_paginated_result([]))),
    };

    const missing_user_result = await get_role_for_email(
      missing_user_repository as never,
      "missing@example.com",
    );

    expect(missing_user_result.success).toBe(false);

    const inactive_user_repository = {
      find_by_email: vi
        .fn()
        .mockResolvedValue(
          create_success_result(
            create_paginated_result([
              create_system_user({ status: ENTITY_STATUS.INACTIVE }),
            ]),
          ),
        ),
    };

    const inactive_user_result = await get_role_for_email(
      inactive_user_repository as never,
      "inactive@example.com",
    );

    expect(inactive_user_result.success).toBe(false);

    const active_user_repository = {
      find_by_email: vi
        .fn()
        .mockResolvedValue(
          create_success_result(
            create_paginated_result([create_system_user()]),
          ),
        ),
    };

    await expect(
      get_role_for_email(active_user_repository as never, "admin@example.com"),
    ).resolves.toEqual({ success: true, data: "org_admin" });
  });

  it("returns cached permissions without re-verifying the token", async () => {
    const cached_result =  {
      success: true,
      data: {
        role: "org_admin",
        permissions: { organisation_level: { read: true } },
      },
    } as Result<{
      permissions: Record<string, unknown>;
      role: "org_admin";
    }>;
    const auth_port = {
      verify_token: vi.fn(),
    };
    const authorization_cache = {
      get_or_miss: vi
        .fn()
        .mockReturnValue({ is_hit: true, value: cached_result }),
      set: vi.fn(),
    };

    const result = await get_profile_permissions_impl(
      auth_port as never,
      {} as never,
      authorization_cache as never,
      "raw_token",
    );

    expect(result).toBe(cached_result);
    expect(auth_port.verify_token).not.toHaveBeenCalled();
  });

  it("derives permissions from a verified token and caches the result", async () => {
    const auth_port = {
      verify_token: vi.fn().mockResolvedValue(
        create_success_result({
          is_valid: true,
          payload: {
            email: "admin@example.com",
          },
        }),
      ),
    };
    const system_user_repository = {
      find_by_email: vi
        .fn()
        .mockResolvedValue(
          create_success_result(
            create_paginated_result([create_system_user()]),
          ),
        ),
    };
    const authorization_cache = {
      get_or_miss: vi.fn().mockReturnValue({ is_hit: false, value: null }),
      set: vi.fn(),
    };

    const result = await get_profile_permissions_impl(
      auth_port as never,
      system_user_repository as never,
      authorization_cache as never,
      "raw_token",
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.role).toBe("org_admin");
      expect(result.data.permissions.organisation_level.read).toBe(true);
    }
    expect(authorization_cache.set).toHaveBeenCalledWith(
      "profile_permissions:raw_token",
      result,
    );
  });

  it("maps expired verification results to token_expired failures", async () => {
    const auth_port = {
      verify_token: vi.fn().mockResolvedValue(
        create_success_result({
          is_valid: false,
          error_message: "token expired",
        }),
      ),
    };
    const authorization_cache = {
      get_or_miss: vi.fn().mockReturnValue({ is_hit: false, value: null }),
      set: vi.fn(),
    };

    const result = await get_profile_permissions_impl(
      auth_port as never,
      {} as never,
      authorization_cache as never,
      "raw_token",
    );

    expect(result).toEqual({
      success: false,
      error: {
        failure_type: "token_expired",
        message: "token expired",
      },
    });
  });
});
