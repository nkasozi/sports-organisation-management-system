import { describe, expect, it, vi } from "vitest";

import { create_present_auth_token_state } from "$lib/presentation/stores/authTypes";

import { LIVE_GAMES_USER_MESSAGE } from "./liveGamesMessages";
import {
  create_auth_state,
  create_auth_token,
  create_fixture_state_dependencies,
} from "./liveGamesPageFlow.test_support";
import {
  build_live_games_start_flow_dependencies,
  initialize_live_games_page,
  refresh_live_games_page_fixture_state,
} from "./liveGamesPageState";

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

  it("returns a friendly error state when fixtures fail to load", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const fixture_state_dependencies = {
      ...create_fixture_state_dependencies(),
      fixture_use_cases: { list: async () => ({ success: false }) },
    };
    const result = await initialize_live_games_page({
      ensure_auth_profile: async () => ({ success: true, error_message: "" }),
      auth_state: create_auth_state({
        current_token: create_present_auth_token_state(create_auth_token()),
      }),
      authorization_adapter: {
        check_entity_authorized: async () => ({
          success: true,
          data: { is_authorized: true, role: "org_admin" },
        }),
      },
      organization_use_cases: fixture_state_dependencies.organization_use_cases,
      fixture_state_dependencies: fixture_state_dependencies as never,
    });

    expect(result).toEqual({
      status: "error",
      error_message: LIVE_GAMES_USER_MESSAGE.FIXTURES_LOAD_FAILED,
    });
  });
});
