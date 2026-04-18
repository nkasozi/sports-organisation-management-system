import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { create_competition_results_workspace_controller_runtime } from "./competitionResultsWorkspaceControllerRuntime";

const {
  build_shareable_competition_results_url_mock,
  download_all_fixture_reports_mock,
  download_fixture_report_mock,
  load_team_fixtures_bundle_mock,
} = vi.hoisted(() => ({
  build_shareable_competition_results_url_mock: vi.fn(),
  download_all_fixture_reports_mock: vi.fn(),
  download_fixture_report_mock: vi.fn(),
  load_team_fixtures_bundle_mock: vi.fn(),
}));

vi.mock("$lib/presentation/logic/competitionResultsMatchReports", () => ({
  download_all_fixture_reports: download_all_fixture_reports_mock,
  download_fixture_report: download_fixture_report_mock,
}));

vi.mock("$lib/presentation/logic/competitionResultsPageData", () => ({
  build_shareable_competition_results_url:
    build_shareable_competition_results_url_mock,
}));

vi.mock("$lib/presentation/logic/competitionResultsTeamFixturesData", () => ({
  load_team_fixtures_bundle: load_team_fixtures_bundle_mock,
}));

vi.mock(
  "$lib/presentation/logic/competitionResultsWorkspaceControllerDependencies",
  () => ({
    competition_results_match_report_dependencies: { marker: "reports" },
    competition_results_workspace_dependencies: { marker: "workspace" },
  }),
);

describe("competitionResultsWorkspaceControllerRuntime", () => {
  function create_command() {
    const state = {
      selected_team_id: "",
    };

    const command = {
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

  beforeEach(() => {
    vi.useRealTimers();
    build_shareable_competition_results_url_mock.mockReset();
    download_all_fixture_reports_mock.mockReset();
    download_fixture_report_mock.mockReset();
    load_team_fixtures_bundle_mock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("copies the share link when the page has enough context and a browser clipboard is available", () => {
    const { command } = create_command();
    const clipboard_write = vi.fn();
    vi.useFakeTimers();
    vi.stubGlobal("window", { location: { origin: "https://example.com" } });
    vi.stubGlobal("navigator", { clipboard: { writeText: clipboard_write } });
    build_shareable_competition_results_url_mock.mockReturnValueOnce(
      "https://example.com/share",
    );

    const runtime = create_competition_results_workspace_controller_runtime(
      command as never,
    );
    expect(runtime.handle_copy_share_link()).toBe(true);
    vi.advanceTimersByTime(2000);

    expect(clipboard_write).toHaveBeenCalledWith("https://example.com/share");
    expect(command.set_share_link_copied).toHaveBeenCalledWith(true);
    expect(command.set_share_link_copied).toHaveBeenCalledWith(false);
  });

  it("returns false for share-link copying when required ids are missing", () => {
    const { command } = create_command();
    const runtime = create_competition_results_workspace_controller_runtime({
      ...command,
      selected_competition_id: "",
    } as never);

    expect(runtime.handle_copy_share_link()).toBe(false);
  });

  it("toggles report download state for all reports and individual fixture reports", async () => {
    const { command } = create_command();
    download_all_fixture_reports_mock.mockResolvedValueOnce(true);
    download_fixture_report_mock.mockResolvedValueOnce(false);
    const runtime = create_competition_results_workspace_controller_runtime(
      command as never,
    );
    const stop_propagation = vi.fn();

    await expect(runtime.handle_download_all_reports()).resolves.toBe(true);
    await expect(
      runtime.handle_download_match_report(
        { id: "fixture-1" } as never,
        { stopPropagation: stop_propagation } as never,
      ),
    ).resolves.toBe(false);

    expect(command.set_downloading_all_reports).toHaveBeenCalledWith(true);
    expect(command.set_downloading_all_reports).toHaveBeenCalledWith(false);
    expect(stop_propagation).toHaveBeenCalled();
    expect(command.set_downloading_fixture_id).toHaveBeenCalledWith(
      "fixture-1",
    );
    expect(command.set_downloading_fixture_id).toHaveBeenCalledWith("");
  });

  it("closes the team fixtures panel when the selected team is clicked again", async () => {
    const { command, state } = create_command();
    state.selected_team_id = "team-1";
    const runtime = create_competition_results_workspace_controller_runtime(
      command as never,
    );

    await runtime.handle_team_click({
      detail: { team_id: "team-1", team_name: "Lions" },
    } as never);

    expect(command.set_selected_team_id).toHaveBeenCalledWith("");
    expect(command.set_selected_team_name).toHaveBeenCalledWith("");
    expect(command.set_team_fixtures_in_competition).toHaveBeenCalledWith([]);
    expect(command.set_team_fixtures_all_competitions).toHaveBeenCalledWith([]);
    expect(command.set_show_all_competitions_fixtures).toHaveBeenCalledWith(
      false,
    );
  });

  it("loads team fixtures and extended maps when a new team is selected", async () => {
    const { command } = create_command();
    load_team_fixtures_bundle_mock.mockResolvedValueOnce({
      team_fixtures_in_competition: [{ id: "fixture-1" }],
      team_fixtures_all_competitions: [{ id: "fixture-2" }],
      extended_team_map: new Map([
        ["team-3", { id: "team-3", name: "Eagles" }],
      ]),
      extended_competition_map: new Map([
        ["competition-2", { id: "competition-2", name: "League Two" }],
      ]),
    });
    const runtime = create_competition_results_workspace_controller_runtime(
      command as never,
    );

    await runtime.handle_team_click({
      detail: { team_id: "team-2", team_name: "Falcons" },
    } as never);

    expect(command.set_selected_team_id).toHaveBeenCalledWith("team-2");
    expect(command.set_selected_team_name).toHaveBeenCalledWith("Falcons");
    expect(command.set_team_fixtures_loading).toHaveBeenCalledWith(true);
    expect(command.set_team_fixtures_in_competition).toHaveBeenCalledWith([
      { id: "fixture-1" },
    ]);
    expect(command.set_team_fixtures_all_competitions).toHaveBeenCalledWith([
      { id: "fixture-2" },
    ]);
    expect(command.set_extended_team_map).toHaveBeenCalled();
    expect(command.set_extended_competition_map).toHaveBeenCalled();
    expect(command.set_team_fixtures_loading).toHaveBeenCalledWith(false);
  });
});
