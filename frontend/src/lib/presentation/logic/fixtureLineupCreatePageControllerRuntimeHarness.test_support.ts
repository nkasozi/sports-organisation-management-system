import { vi } from "vitest";

import { create_fixture_lineup_create_page_controller_runtime } from "./fixtureLineupCreatePageControllerRuntime";
import type { FixtureLineupCreatePageControllerRuntime } from "./fixtureLineupCreatePageControllerRuntimeTypes";

interface FixtureLineupCreateRuntimeHarness {
  runtime: FixtureLineupCreatePageControllerRuntime;
  state: Record<string, unknown>;
  command: { goto: ReturnType<typeof vi.fn> };
}

const STATE_KEYS: string[] = [
  "all_competitions",
  "all_teams",
  "available_teams",
  "confirm_lock_understood",
  "current_step_index",
  "error_message",
  "fixture_team_label_by_team_id",
  "fixtures",
  "fixtures_with_complete_lineups",
  "form_data",
  "loading",
  "max_players",
  "min_players",
  "organizations",
  "player_search_text",
  "saving",
  "selected_fixture_state",
  "selected_organization_state",
  "selected_team_state",
  "starters_count",
  "team_players",
  "teams_with_existing_lineups",
  "validation_errors",
];

function create_runtime_harness_state(
  overrides: Record<string, unknown>,
): Record<string, unknown> {
  return {
    confirm_lock_understood: true,
    error_message: "old",
    fixtures_with_complete_lineups: new Set<string>(),
    form_data: {
      organization_id: "",
      fixture_id: "",
      team_id: "",
      selected_players: [],
    },
    max_players: 2,
    min_players: 1,
    organizations: [{ id: "organization-1", name: "League" }],
    player_search_text: "keeper",
    selected_fixture_state: { status: "missing" },
    selected_organization_state: { status: "missing" },
    selected_team_state: { status: "missing" },
    team_players: [],
    validation_errors: { players: "old" },
    ...overrides,
  };
}

export function create_fixture_lineup_create_runtime_harness(
  overrides: Record<string, unknown> = {},
): FixtureLineupCreateRuntimeHarness {
  const state = create_runtime_harness_state(overrides);
  const accessors = Object.fromEntries(
    STATE_KEYS.flatMap((key: string) => [
      [`get_${key}`, () => state[key]],
      [
        `set_${key}`,
        vi.fn((value: unknown) => {
          state[key] = value;
        }),
      ],
    ]),
  );
  const command = {
    ...accessors,
    dependencies: {},
    is_browser: true,
    goto: vi.fn(async () => {}),
    get_current_auth_profile_state: () => ({ status: "missing" }),
    get_organization_is_restricted: () => false,
  };
  const runtime = create_fixture_lineup_create_page_controller_runtime(
    command as never,
  );
  return { runtime, state, command };
}
