import { describe, expect, it, vi } from "vitest";

import type { PreFlightCheck } from "$lib/core/services/fixtureStartChecks";
import type { AuthState } from "$lib/presentation/stores/auth";
import {
  create_missing_auth_profile_state,
  create_missing_auth_token_state,
  create_present_auth_profile_state,
  create_present_auth_token_state,
} from "$lib/presentation/stores/authTypes";

import {
  get_live_games_current_profile_state,
  get_live_games_current_role,
  get_live_games_current_token_state,
  update_live_games_checks,
  update_live_games_starting_state,
  wait_for_live_games_delay,
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

function create_check(overrides: Partial<PreFlightCheck> = {}): PreFlightCheck {
  return {
    check_name: "officials",
    status: "passed",
    message: "Ready",
    fix_suggestion: "",
    ...overrides,
  } as PreFlightCheck;
}

describe("liveGamesPageState", () => {
  it("returns the current profile state from auth state", () => {
    const result = get_live_games_current_profile_state(create_auth_state());

    expect(result).toEqual({
      status: "present",
      profile: expect.objectContaining({ organization_id: "org_1" }),
    });
  });

  it("returns the current token state from auth state", () => {
    const result = get_live_games_current_token_state(
      create_auth_state({
        current_token: create_present_auth_token_state({
          raw_token: "token-1",
        } as never),
      }),
    );

    expect(result).toEqual({ status: "present", raw_token: "token-1" });
  });

  it("returns the current role from auth state", () => {
    const result = get_live_games_current_role(create_auth_state());

    expect(result).toBe("org_admin");
  });

  it("falls back to player when no role is available", () => {
    const result = get_live_games_current_role(
      create_auth_state({
        current_profile: create_missing_auth_profile_state(),
      }),
    );

    expect(result).toBe("player");
  });

  it("updates checks without mutating the existing map", () => {
    const existing_checks = {
      fixture_1: [create_check({ message: "Existing" })],
    };
    const next_checks = [create_check({ message: "Updated" })];

    const result = update_live_games_checks(
      existing_checks,
      "fixture_2",
      next_checks,
    );

    expect(result.fixture_1[0].message).toBe("Existing");
    expect(result.fixture_2[0].message).toBe("Updated");
    expect(result.fixture_2).not.toBe(next_checks);
  });

  it("updates starting state without mutating the existing map", () => {
    const existing_state = { fixture_1: true };

    const result = update_live_games_starting_state(
      existing_state,
      "fixture_2",
      false,
    );

    expect(result).toEqual({ fixture_1: true, fixture_2: false });
    expect(result).not.toBe(existing_state);
  });

  it("waits until the requested delay elapses", async () => {
    vi.useFakeTimers();

    const delayed_result = wait_for_live_games_delay(800);
    let is_resolved = false;
    void delayed_result.then(() => {
      is_resolved = true;
    });

    await vi.advanceTimersByTimeAsync(799);
    expect(is_resolved).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    await delayed_result;
    expect(is_resolved).toBe(true);

    vi.useRealTimers();
  });
});
