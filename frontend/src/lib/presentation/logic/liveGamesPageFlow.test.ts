import { describe, expect, it, vi } from "vitest";

import type { Fixture } from "$lib/core/entities/Fixture";
import type { Organization } from "$lib/core/entities/Organization";
import {
  type AuthToken,
  create_auth_token_payload,
} from "$lib/core/interfaces/ports";
import type { AuthState } from "$lib/presentation/stores/auth";
import {
  create_missing_auth_token_state,
  create_present_auth_profile_state,
  create_present_auth_token_state,
} from "$lib/presentation/stores/authTypes";

import {
  build_live_games_start_flow_dependencies,
  initialize_live_games_page,
  refresh_live_games_page_fixture_state,
} from "./liveGamesPageState";

function create_auth_state(overrides: Partial<AuthState> = {}): AuthState {
  return {
    current_token: create_missing_auth_token_state(),
    current_profile: create_present_auth_profile_state({
      id: "profile_1",
      display_name: "Admin User",
      email: "admin@example.com",
      role: "org_admin",
      organization_id: "org_1",
      organization_name: "Org 1",
      team_id: "team_1",
    } as never),
    available_profiles: [],
    sidebar_menu_items: [],
    is_initialized: true,
    is_demo_session: false,
    ...overrides,
  } as AuthState;
}

function create_fixture(overrides: Partial<Fixture> = {}): Fixture {
  return {
    id: "fixture_1",
    organization_id: "org_1",
    competition_id: "comp_1",
    home_team_id: "team_1",
    away_team_id: "team_2",
    scheduled_date: "2026-04-07",
    scheduled_time: "14:00",
    status: "scheduled",
    created_at: "2026-04-01T00:00:00Z",
    updated_at: "2026-04-01T00:00:00Z",
    ...overrides,
  } as Fixture;
}

function create_organization(
  overrides: Partial<Organization> = {},
): Organization {
  return {
    id: "org_1",
    name: "Org 1",
    sport_id: "sport_1",
    created_at: "2026-04-01T00:00:00Z",
    updated_at: "2026-04-01T00:00:00Z",
    ...overrides,
  } as Organization;
}

function create_fixture_state_dependencies(
  fixtures: Fixture[] = [create_fixture()],
) {
  return {
    fixture_use_cases: {
      list: async () => ({ success: true, data: { items: fixtures } }),
    },
    team_use_cases: {
      get_by_id: async (team_id: string) => ({
        success: true,
        data: { id: team_id, name: `Team ${team_id}` },
      }),
    },
    competition_use_cases: {
      get_by_id: async () => ({
        success: true,
        data: { id: "comp_1", name: "League", organization_id: "org_1" },
      }),
    },
    organization_use_cases: {
      list: async () => ({
        success: true,
        data: { items: [create_organization()] },
      }),
      get_by_id: async () => ({ success: true, data: create_organization() }),
    },
    sport_use_cases: {
      get_by_id: async () => ({
        success: true,
        data: { id: "sport_1", name: "Hockey" },
      }),
    },
  };
}

function create_auth_token(): AuthToken {
  const payload_result = create_auth_token_payload({
    user_id: "user_1",
    email: "admin@example.com",
    display_name: "Admin User",
    role: "org_admin",
    organization_id: "org_1",
    team_id: "team_1",
    issued_at: 1,
    expires_at: 2,
  });

  expect(payload_result.success).toBe(true);

  if (!payload_result.success) {
    return false as never;
  }

  return {
    raw_token: "token",
    signature: "signature",
    payload: payload_result.data,
  } as AuthToken;
}

describe("liveGamesPageFlow", () => {
  it("returns empty fixture state when no organization is selected", async () => {
    const result = await refresh_live_games_page_fixture_state({
      auth_state: create_auth_state(),
      fixture_state_dependencies: create_fixture_state_dependencies() as never,
      organization_id: "",
    });

    expect(result.fixtures).toEqual([]);
  });

  it("initializes the page with organizations and fixture state", async () => {
    const fixture_state_dependencies = create_fixture_state_dependencies();
    const result = await initialize_live_games_page({
      ensure_auth_profile: async () => ({ success: true, error_message: "" }),
      auth_state: create_auth_state({
        current_token: create_present_auth_token_state(create_auth_token()),
      }),
      authorization_adapter: {
        check_entity_authorized: async (
          _raw_token: string,
          _entity: string,
          action: string,
        ) => ({
          success: true,
          data: { is_authorized: action === "read", role: "org_admin" },
        }),
      },
      organization_use_cases: fixture_state_dependencies.organization_use_cases,
      fixture_state_dependencies: fixture_state_dependencies as never,
    });

    expect(result.status).toBe("ready");
    if (result.status !== "ready") return;
    expect(result.selected_organization_id).toBe("org_1");
    expect(result.fixture_state.fixtures).toHaveLength(1);
  });

  it("returns denied state when fixture read access is not allowed", async () => {
    const fixture_state_dependencies = create_fixture_state_dependencies();
    const result = await initialize_live_games_page({
      ensure_auth_profile: async () => ({ success: true, error_message: "" }),
      auth_state: create_auth_state({
        current_token: create_present_auth_token_state(create_auth_token()),
      }),
      authorization_adapter: {
        check_entity_authorized: async () => ({
          success: true,
          data: { is_authorized: false, role: "org_admin" },
        }),
      },
      organization_use_cases: fixture_state_dependencies.organization_use_cases,
      fixture_state_dependencies: fixture_state_dependencies as never,
    });

    expect(result.status).toBe("denied");
  });

  it("builds start flow dependencies with the shared delay helper", async () => {
    const result = build_live_games_start_flow_dependencies({
      fixture_details_setup_use_cases: {} as never,
      fixture_lineup_use_cases: {} as never,
      membership_use_cases: {} as never,
      player_use_cases: {} as never,
      player_position_use_cases: {} as never,
      fixture_use_cases: {} as never,
      team_use_cases: {} as never,
      sport_use_cases: {} as never,
      competition_use_cases: {} as never,
      organization_use_cases: {} as never,
      jersey_color_use_cases: {} as never,
      official_use_cases: {} as never,
      game_official_role_use_cases: {} as never,
      goto: async () => {},
      get_current_role: () => "org_admin",
      can_access_route: () => true,
      update_checks: () => {},
      set_is_starting: () => {},
      check_delay_ms: 800,
    });

    vi.useFakeTimers();
    let is_resolved = false;
    void result.delay(800).then(() => {
      is_resolved = true;
    });

    await vi.advanceTimersByTimeAsync(800);
    expect(is_resolved).toBe(true);
    expect(result.check_delay_ms).toBe(800);

    vi.useRealTimers();
  });
});
