import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  check_entity_authorized_mock,
  ensure_auth_profile_mock,
  get_store_value_mock,
} = vi.hoisted(() => ({
  check_entity_authorized_mock: vi.fn(),
  ensure_auth_profile_mock: vi.fn(),
  get_store_value_mock: vi.fn(),
}));

vi.mock("svelte/store", () => ({
  get: get_store_value_mock,
}));

vi.mock("$lib/infrastructure/AuthorizationProvider", () => ({
  get_authorization_adapter: () => ({
    check_entity_authorized: check_entity_authorized_mock,
  }),
}));

vi.mock("../stores/auth", () => ({
  auth_store: { kind: "auth_store" },
}));

vi.mock("./authGuard", () => ({
  ensure_auth_profile: ensure_auth_profile_mock,
}));

import { run_dynamic_entity_form_permission_check } from "./dynamicEntityFormPermissionCheck";

describe("dynamicEntityFormPermissionCheck", () => {
  beforeEach(() => {
    check_entity_authorized_mock.mockReset();
    ensure_auth_profile_mock.mockReset();
    get_store_value_mock.mockReset();
  });

  it("returns the auth error when the current profile cannot be loaded", async () => {
    ensure_auth_profile_mock.mockResolvedValueOnce({
      success: false,
      error_message: "Missing profile",
    });

    await expect(
      run_dynamic_entity_form_permission_check(
        "Fixture Lineup",
        false,
        "fixture lineup",
      ),
    ).resolves.toEqual({
      auth_profile_missing: true,
      auth_error_message: "Missing profile",
      permission_denied: false,
      permission_denied_message: "",
    });
  });

  it("allows access when the auth store has no token", async () => {
    ensure_auth_profile_mock.mockResolvedValueOnce({ success: true });
    get_store_value_mock.mockReturnValueOnce({ current_token: null });

    await expect(
      run_dynamic_entity_form_permission_check(
        "Fixture Lineup",
        false,
        "fixture lineup",
      ),
    ).resolves.toEqual({
      auth_profile_missing: false,
      auth_error_message: "",
      permission_denied: false,
      permission_denied_message: "",
    });
  });

  it("builds a denial message when the current role cannot create or update the entity", async () => {
    ensure_auth_profile_mock.mockResolvedValueOnce({ success: true });
    get_store_value_mock.mockReturnValueOnce({
      current_token: { raw_token: "token-1" },
    });
    check_entity_authorized_mock.mockResolvedValueOnce({
      success: true,
      data: { is_authorized: false },
    });

    await expect(
      run_dynamic_entity_form_permission_check(
        "Fixture Lineup",
        true,
        "fixture lineup",
      ),
    ).resolves.toEqual({
      auth_profile_missing: false,
      auth_error_message: "",
      permission_denied: true,
      permission_denied_message:
        "Access denied: Your role does not have permission to update fixture lineup records.",
    });
    expect(check_entity_authorized_mock).toHaveBeenCalledWith(
      "token-1",
      "fixturelineup",
      "update",
    );
  });
});
