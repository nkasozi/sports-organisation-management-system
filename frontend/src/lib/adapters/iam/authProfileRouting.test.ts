import { afterEach, describe, expect, it, vi } from "vitest";

import { create_success_result, type Result } from "../../core/types/Result";
import {
  can_profile_access_route_impl,
  get_sidebar_menu_for_profile_impl,
} from "./authProfileRouting";

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
    status: "active",
    ...overrides,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("authProfileRouting", () => {
  it("returns cached sidebar menus without re-verifying tokens", async () => {
    const cached_result =  {
      success: true,
      data: [
        {
          group_name: "General",
          items: [{ href: "/", icon: "home", name: "Dashboard" }],
        },
      ],
    } as Result<
      Array<{
        group_name: string;
        items: Array<{ href: string; icon: string; name: string }>;
      }>
    >;
    const auth_port = {
      verify_token: vi.fn(),
    };
    const authorization_cache = {
      get_or_miss: vi
        .fn()
        .mockReturnValue({ is_hit: true, value: cached_result }),
      set: vi.fn(),
    };

    const result = await get_sidebar_menu_for_profile_impl(
      auth_port as never,
      {} as never,
      authorization_cache as never,
      "raw_token",
    );

    expect(result).toBe(cached_result);
    expect(auth_port.verify_token).not.toHaveBeenCalled();
  });

  it("builds and caches sidebar menus for verified profiles", async () => {
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

    const result = await get_sidebar_menu_for_profile_impl(
      auth_port as never,
      system_user_repository as never,
      authorization_cache as never,
      "raw_token",
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.length).toBeGreaterThan(0);
    }
    expect(authorization_cache.set).toHaveBeenCalledWith(
      "sidebar_menu:raw_token",
      result,
    );
  });

  it("allows always-available routes and rejects unknown routes", async () => {
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

    const allowed_result = await can_profile_access_route_impl(
      auth_port as never,
      system_user_repository as never,
      authorization_cache as never,
      "raw_token",
      "/",
    );

    expect(allowed_result.success).toBe(true);
    if (allowed_result.success) {
      expect(allowed_result.data.route).toBe("/");
    }

    const denied_result = await can_profile_access_route_impl(
      auth_port as never,
      system_user_repository as never,
      authorization_cache as never,
      "raw_token",
      "/not-a-real-route",
    );

    expect(denied_result.success).toBe(false);
    if (!denied_result.success) {
      expect(denied_result.error.route).toBe("/not-a-real-route");
    }
  });
});
