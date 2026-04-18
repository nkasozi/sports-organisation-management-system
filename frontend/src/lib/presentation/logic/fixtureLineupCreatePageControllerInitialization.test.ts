import { beforeEach, describe, expect, it, vi } from "vitest";

import type { UserScopeProfile } from "$lib/core/interfaces/ports";
import {
  type AuthTokenState,
  create_present_auth_token_state,
} from "$lib/presentation/stores/authTypes";

import { initialize_fixture_lineup_create_page } from "./fixtureLineupCreatePageControllerInitialization";

const {
  auth_state,
  check_entity_authorized_mock,
  ensure_auth_profile_mock,
  load_fixture_lineup_create_reference_data_mock,
  set_denial_mock,
} = vi.hoisted(() => ({
  auth_state: {
    current_token: { status: "missing" as const } as AuthTokenState,
  },
  check_entity_authorized_mock: vi.fn(),
  ensure_auth_profile_mock: vi.fn(),
  load_fixture_lineup_create_reference_data_mock: vi.fn(),
  set_denial_mock: vi.fn(),
}));

vi.mock("svelte/store", async () => {
  const actual =
    await vi.importActual<typeof import("svelte/store")>("svelte/store");
  return {
    ...actual,
    get: vi.fn(() => auth_state),
  };
});

vi.mock("$lib/infrastructure/AuthorizationProvider", () => ({
  get_authorization_adapter: () => ({
    check_entity_authorized: check_entity_authorized_mock,
  }),
}));

vi.mock("$lib/presentation/logic/authGuard", () => ({
  ensure_auth_profile: ensure_auth_profile_mock,
}));

vi.mock("$lib/presentation/stores/accessDenial", () => ({
  access_denial_store: {
    set_denial: set_denial_mock,
  },
}));

vi.mock("./fixtureLineupCreateData", () => ({
  load_fixture_lineup_create_reference_data:
    load_fixture_lineup_create_reference_data_mock,
}));

function create_auth_profile(organization_id: string): UserScopeProfile {
  return { organization_id, team_id: "" } as UserScopeProfile;
}

describe("fixtureLineupCreatePageControllerInitialization", () => {
  beforeEach(() => {
    auth_state.current_token = { status: "missing" };
    check_entity_authorized_mock.mockReset();
    ensure_auth_profile_mock.mockReset();
    load_fixture_lineup_create_reference_data_mock.mockReset();
    set_denial_mock.mockReset();
  });

  it("skips initialization outside the browser", async () => {
    await expect(
      initialize_fixture_lineup_create_page({
        is_browser: false,
        current_auth_profile_state: { status: "missing" },
        form_organization_id: "",
        organization_is_restricted: false,
        dependencies: {} as never,
      }),
    ).resolves.toEqual({ kind: "skip" });
  });

  it("returns the auth failure when no profile can be loaded", async () => {
    ensure_auth_profile_mock.mockResolvedValue({
      success: false,
      error_message: "Missing profile",
    });

    await expect(
      initialize_fixture_lineup_create_page({
        is_browser: true,
        current_auth_profile_state: { status: "missing" },
        form_organization_id: "",
        organization_is_restricted: false,
        dependencies: {} as never,
      }),
    ).resolves.toEqual({
      kind: "auth-failed",
      error_message: "Missing profile",
    });
  });

  it("redirects when the current token is not authorized to create fixture lineups", async () => {
    auth_state.current_token = create_present_auth_token_state({
      raw_token: "token-1",
    } as never);
    ensure_auth_profile_mock.mockResolvedValue({ success: true });
    check_entity_authorized_mock.mockResolvedValue({
      success: true,
      data: { is_authorized: false },
    });

    const result = await initialize_fixture_lineup_create_page({
      is_browser: true,
      current_auth_profile_state: {
        status: "present",
        profile: create_auth_profile("organization-1"),
      },
      form_organization_id: "organization-1",
      organization_is_restricted: true,
      dependencies: {} as never,
    });

    expect(set_denial_mock).toHaveBeenCalledWith(
      "/fixture-lineups/create",
      expect.stringContaining("Access denied"),
    );
    expect(result).toEqual({ kind: "redirect", redirect_to: "/" });
  });

  it("loads reference data and advances the wizard when the organization is preselected", async () => {
    ensure_auth_profile_mock.mockResolvedValue({ success: true });
    load_fixture_lineup_create_reference_data_mock.mockResolvedValue({
      selected_organization_state: {
        status: "present",
        organization: { id: "organization-1" },
      },
      fixtures: [],
      teams: [],
      all_teams: [],
      all_competitions: [],
      organizations: [],
      error_message: "",
    });

    await expect(
      initialize_fixture_lineup_create_page({
        is_browser: true,
        current_auth_profile_state: {
          status: "present",
          profile: create_auth_profile("organization-1"),
        },
        form_organization_id: "",
        organization_is_restricted: true,
        dependencies: {} as never,
      }),
    ).resolves.toEqual({
      kind: "loaded",
      reference_data: expect.objectContaining({
        selected_organization_state: {
          status: "present",
          organization: { id: "organization-1" },
        },
      }),
      current_step_index: 1,
    });
  });
});
