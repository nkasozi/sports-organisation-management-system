import { type Mock, vi } from "vitest";

type UntrackedSetterName =
  | "set_all_competitions"
  | "set_all_teams"
  | "set_available_teams"
  | "set_fixture_team_label_by_team_id"
  | "set_fixtures"
  | "set_organizations"
  | "set_starters_count"
  | "set_teams_with_existing_lineups";

export function create_runtime_command_untracked_setters(): Record<
  UntrackedSetterName,
  Mock
> {
  return {
    set_all_competitions: vi.fn(),
    set_all_teams: vi.fn(),
    set_available_teams: vi.fn(),
    set_fixture_team_label_by_team_id: vi.fn(),
    set_fixtures: vi.fn(),
    set_organizations: vi.fn(),
    set_starters_count: vi.fn(),
    set_teams_with_existing_lineups: vi.fn(),
  };
}
