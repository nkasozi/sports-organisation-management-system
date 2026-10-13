import { type Mock, vi } from "vitest";

import type { FixtureLineup } from "$lib/core/entities/FixtureLineup";
import type { TeamPlayer } from "$lib/core/services/teamPlayers";

import type {
  FixtureLineupDetailLineupState,
  FixtureLineupDetailProfileState,
  FixtureLineupDetailTokenState,
} from "./fixtureLineupDetailPageContracts";
import type { FixtureLineupDetailPageControllerRuntimeCommand } from "./fixtureLineupDetailPageControllerRuntimeTypes";

export function create_lineup(
  overrides: Partial<FixtureLineup> = {},
): FixtureLineup {
  return {
    id: "lineup_1",
    organization_id: "org_1",
    fixture_id: "fixture_1",
    team_id: "team_1",
    selected_players: [],
    status: "draft",
    submitted_by: "Coach 1",
    submitted_at: "2026-01-01T00:00:00Z",
    notes: "Ready",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  } as FixtureLineup;
}

export function create_team_player(
  overrides: Partial<TeamPlayer> = {},
): TeamPlayer {
  return {
    id: "player_1",
    first_name: "Jordan",
    last_name: "Miles",
    gender_id: "gender_1",
    email: "player@example.com",
    phone: "123",
    date_of_birth: "2000-01-01",
    position_id: "position_1",
    organization_id: "org_1",
    height_cm: 0,
    weight_kg: 0,
    nationality: "UG",
    profile_image_url: "",
    emergency_contact_name: "Coach",
    emergency_contact_phone: "123",
    medical_notes: "",
    status: "active",
    jersey_number: 9,
    position: "Forward",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  } as TeamPlayer;
}

type FixtureLineupTestSpies = {
  goto: Mock;
  set_access_denial: Mock;
  set_away_team_state: Mock;
  set_can_modify_lineup: Mock;
  set_error_message: Mock;
  set_fixture_state: Mock;
  set_home_team_state: Mock;
  set_lineup_state: Mock;
  set_loading: Mock;
  set_permission_info_message: Mock;
  set_saving: Mock;
  set_team_state: Mock;
  set_team_players: Mock;
};

type FixtureLineupTestContext = FixtureLineupTestSpies & {
  command: FixtureLineupDetailPageControllerRuntimeCommand;
  get_current_lineup_state: () => FixtureLineupDetailLineupState;
};

type FixtureLineupTestStateBox = {
  lineup_state: FixtureLineupDetailLineupState;
  team_players: TeamPlayer[];
};

const FIXTURE_LINEUP_TEST_COMMAND_SETTINGS = {
  access_denied_message: "Access denied",
  access_denial_path: "/unauthorized",
  access_check_failed_message: "Access check failed",
  entity_type: "fixture_lineup",
  is_browser: true,
  lineup_id: "lineup_1",
  lineup_list_path: "/fixture-lineups",
  read_action: "read" as const,
  submit_confirmation: "Submit lineup?",
  submit_failed_message: "Submit failed",
  update_action: "update" as const,
  update_failed_message: "Update failed",
};

function create_spies(box: FixtureLineupTestStateBox): FixtureLineupTestSpies {
  return {
    goto: vi.fn(async () => {}),
    set_access_denial: vi.fn(),
    set_away_team_state: vi.fn(),
    set_can_modify_lineup: vi.fn(),
    set_error_message: vi.fn(),
    set_fixture_state: vi.fn(),
    set_home_team_state: vi.fn(),
    set_lineup_state: vi.fn((value: FixtureLineupDetailLineupState) => {
      box.lineup_state = value;
    }),
    set_loading: vi.fn(),
    set_permission_info_message: vi.fn(),
    set_saving: vi.fn(),
    set_team_state: vi.fn(),
    set_team_players: vi.fn((value: TeamPlayer[]) => {
      box.team_players = value;
    }),
  };
}

function create_auth_state(): {
  current_profile_state: FixtureLineupDetailProfileState;
  current_token_state: FixtureLineupDetailTokenState;
} {
  return {
    current_profile_state: {
      status: "present",
      organization_scope_state: {
        status: "scoped",
        organization_id: "org_1",
      },
    },
    current_token_state: { status: "present", raw_token: "raw-token" },
  };
}

function create_use_cases(): FixtureLineupDetailPageControllerRuntimeCommand["use_cases"] {
  return {
    fixture_lineup_use_cases: { update: vi.fn() },
    fixture_use_cases: { get_by_id: vi.fn() },
    membership_use_cases: { list_memberships_by_team: vi.fn() },
    player_position_use_cases: { list: vi.fn() },
    player_use_cases: { list_players_by_team: vi.fn() },
    team_use_cases: { get_by_id: vi.fn() },
  };
}

export function create_command(): FixtureLineupTestContext {
  const box: FixtureLineupTestStateBox = {
    lineup_state: { status: "present", lineup: create_lineup() },
    team_players: [create_team_player()],
  };
  const spies = create_spies(box);
  const command: FixtureLineupDetailPageControllerRuntimeCommand = {
    ...FIXTURE_LINEUP_TEST_COMMAND_SETTINGS,
    ...spies,
    get_auth_state: create_auth_state,
    get_lineup_state: () => box.lineup_state,
    get_team_players: () => box.team_players,
    use_cases: create_use_cases(),
  };
  return {
    command,
    ...spies,
    get_current_lineup_state: () => box.lineup_state,
  };
}
