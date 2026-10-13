import { expect } from "vitest";

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
} from "$lib/presentation/stores/authTypes";

import type { LiveGamesDataDependencies } from "./liveGamesDataTypes";

export function create_auth_state(
  overrides: Partial<AuthState> = {},
): AuthState {
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

export function create_fixture_state_dependencies(
  fixtures: Fixture[] = [create_fixture()],
): LiveGamesDataDependencies {
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

export function create_auth_token(): AuthToken {
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
