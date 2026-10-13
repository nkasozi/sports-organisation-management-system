import { get } from "svelte/store";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { SidebarMenuGroup } from "$lib/core/interfaces/ports";

import {
  can_switch_profiles,
  current_profile_display_name,
  current_profile_email,
  current_profile_initials,
  current_profile_organization_name,
  current_profile_team_id,
  current_user_role,
  current_user_role_display,
  has_verified_account_session,
  is_auth_initialized,
  is_public_viewer,
  other_available_profiles,
  sidebar_menu_items,
} from "./authDerivedStores";
import {
  auth_store_mock,
  authorization_ports_mock,
  create_profile,
  reset_auth_derived_store_mocks,
} from "./authDerivedStores.test_support";
import {
  create_missing_auth_profile_state,
  create_missing_auth_token_state,
  create_present_auth_profile_state,
  create_present_auth_token_state,
} from "./authTypes";

vi.mock("$lib/core/interfaces/ports", async () => ({
  USER_ROLE_DISPLAY_NAMES: {
    org_admin: "Organization Admin",
    public_viewer: "Public Viewer",
  },
  check_data_permission: (await import("./authDerivedStores.test_support"))
    .authorization_ports_mock.check_data_permission,
}));

vi.mock("./authStoreCore", async () => ({
  auth_store: (await import("./authDerivedStores.test_support")).auth_store_mock
    .auth_store,
}));

describe("authDerivedStores", () => {
  beforeEach(() => {
    reset_auth_derived_store_mocks();
  });

  it("derives the current profile fields and alternate profiles", () => {
    const current_profile = create_profile({
      id: "profile-1",
      display_name: "Jane Doe",
      email: "jane@example.test",
      team_id: "team-1",
    });
    const alternate_profile = create_profile({
      id: "profile-2",
      display_name: "Chris Roe",
      email: "chris@example.test",
      role: "public_viewer",
      team_id: "",
    });
    const sidebar_groups = [
      { group_name: "Operations", items: [] },
    ] as SidebarMenuGroup[];

    auth_store_mock.set_state({
      current_token: create_missing_auth_token_state(),
      current_profile: create_present_auth_profile_state(current_profile),
      available_profiles: [current_profile, alternate_profile],
      sidebar_menu_items: sidebar_groups,
      is_initialized: true,
      is_demo_session: true,
    });

    expect(get(current_user_role)).toBe("org_admin");
    expect(get(current_user_role_display)).toBe("Organization Admin");
    expect(get(current_profile_organization_name)).toBe("City Hawks");
    expect(get(current_profile_display_name)).toBe("Jane Doe");
    expect(get(current_profile_email)).toBe("jane@example.test");
    expect(get(current_profile_team_id)).toBe("team-1");
    expect(get(current_profile_initials)).toBe("JD");
    expect(get(other_available_profiles)).toEqual([alternate_profile]);
    expect(get(is_auth_initialized)).toBe(true);
    expect(get(sidebar_menu_items)).toEqual(sidebar_groups);
    expect(get(can_switch_profiles)).toBe(true);
  });

  it("falls back to guest values and detects public viewers from permission checks", () => {
    auth_store_mock.set_state({
      current_token: create_missing_auth_token_state(),
      current_profile: create_present_auth_profile_state(
        create_profile({
          id: "profile-3",
          display_name: "Solo",
          email: "solo@example.test",
          role: "public_viewer",
          organization_name: "Public League",
          team_id: "",
        }),
      ),
      available_profiles: [],
      sidebar_menu_items: [],
      is_initialized: false,
      is_demo_session: false,
    });
    authorization_ports_mock.check_data_permission.mockReturnValue(false);
    auth_store_mock.set_state({
      current_token: create_missing_auth_token_state(),
      current_profile: create_present_auth_profile_state(
        create_profile({
          id: "profile-3",
          display_name: "Solo",
          email: "solo@example.test",
          role: "public_viewer",
          organization_name: "Public League",
          team_id: "",
        }),
      ),
      available_profiles: [],
      sidebar_menu_items: [],
      is_initialized: false,
      is_demo_session: false,
    });

    expect(get(current_profile_initials)).toBe("SO");
    expect(get(is_public_viewer)).toBe(true);

    auth_store_mock.set_state({
      current_token: create_missing_auth_token_state(),
      current_profile: create_missing_auth_profile_state(),
      available_profiles: [],
      sidebar_menu_items: [],
      is_initialized: false,
      is_demo_session: false,
    });

    expect(get(current_user_role)).toBe("");
    expect(get(current_user_role_display)).toBe("Unknown");
    expect(get(current_profile_display_name)).toBe("Guest");
    expect(get(current_profile_email)).toBe("");
    expect(get(current_profile_initials)).toBe("?");
    expect(get(is_public_viewer)).toBe(false);
  });

  it("reports a verified account session only for a real signed-in user, even offline", () => {
    const verified_state = {
      current_token: create_present_auth_token_state({
        raw_token: "a.b.c",
      } as never),
      current_profile: create_present_auth_profile_state(create_profile()),
      available_profiles: [create_profile()],
      sidebar_menu_items: [],
      is_initialized: true,
      is_demo_session: false,
    };
    auth_store_mock.set_state(verified_state);
    expect(get(has_verified_account_session)).toBe(true);

    auth_store_mock.set_state({ ...verified_state, is_demo_session: true });
    expect(get(has_verified_account_session)).toBe(false);

    auth_store_mock.set_state({
      ...verified_state,
      current_token: create_missing_auth_token_state(),
    });
    expect(get(has_verified_account_session)).toBe(false);
  });
});
