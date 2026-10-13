import { type Mock, vi } from "vitest";

type ResultsWorkspaceTestState = { selected_team_id: string };

type ResultsWorkspaceTestCommand = {
  competitions: { id: string }[];
  fixtures: { id: string; home_team_id: string; away_team_id: string }[];
  get_branding_logo_url: () => string;
  get_completed_fixtures: () => never;
  get_selected_competition_state: () => never;
  get_selected_team_id: () => string;
  selected_competition_id: string;
  selected_organization_id: string;
  set_downloading_all_reports: Mock;
  set_downloading_fixture_id: Mock;
  set_extended_competition_map: Mock;
  set_extended_team_map: Mock;
  set_selected_team_id: Mock;
  set_selected_team_name: Mock;
  set_share_link_copied: Mock;
  set_show_all_competitions_fixtures: Mock;
  set_team_fixtures_all_competitions: Mock;
  set_team_fixtures_in_competition: Mock;
  set_team_fixtures_loading: Mock;
  team_map: Map<string, { id: string; name: string }>;
};

export function create_results_workspace_command(): {
  command: ResultsWorkspaceTestCommand;
  state: ResultsWorkspaceTestState;
} {
  const state: ResultsWorkspaceTestState = {
    selected_team_id: "",
  };

  const command: ResultsWorkspaceTestCommand = {
    competitions: [{ id: "competition-1" }],
    fixtures: [
      { id: "fixture-1", home_team_id: "team-1", away_team_id: "team-2" },
    ],
    get_branding_logo_url: () => "/logo.svg",
    get_completed_fixtures: () => [{ id: "fixture-1" }] as never,
    get_selected_competition_state: () =>
      ({
        status: "present",
        competition: { id: "competition-1", name: "Summer Cup" },
      }) as never,
    get_selected_team_id: () => state.selected_team_id,
    selected_competition_id: "competition-1",
    selected_organization_id: "organization-1",
    set_downloading_all_reports: vi.fn(),
    set_downloading_fixture_id: vi.fn(),
    set_extended_competition_map: vi.fn(),
    set_extended_team_map: vi.fn(),
    set_selected_team_id: vi.fn((value: string) => {
      state.selected_team_id = value;
    }),
    set_selected_team_name: vi.fn(),
    set_share_link_copied: vi.fn(),
    set_show_all_competitions_fixtures: vi.fn(),
    set_team_fixtures_all_competitions: vi.fn(),
    set_team_fixtures_in_competition: vi.fn(),
    set_team_fixtures_loading: vi.fn(),
    team_map: new Map([
      ["team-1", { id: "team-1", name: "Lions" }],
      ["team-2", { id: "team-2", name: "Falcons" }],
    ]),
  };

  return { command, state };
}
