import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  build_live_game_detail_report_mock,
  download_match_report_mock,
  get_team_staff_use_cases_mock,
} = vi.hoisted(() => ({
  build_live_game_detail_report_mock: vi.fn(),
  download_match_report_mock: vi.fn(),
  get_team_staff_use_cases_mock: vi.fn(),
}));

vi.mock("$lib/infrastructure/registry/useCaseFactories", () => ({
  get_team_staff_use_cases: get_team_staff_use_cases_mock,
}));

vi.mock("$lib/infrastructure/utils/MatchReportPdfGenerator", () => ({
  download_match_report: download_match_report_mock,
}));

vi.mock("$lib/presentation/logic/liveGameDetailReport", () => ({
  build_live_game_detail_report: build_live_game_detail_report_mock,
}));

import { create_live_game_detail_report_handlers } from "./liveGameDetailControllerReportActions";
import type {
  LiveGameDetailPageState,
  LiveGameDetailToastState,
} from "./liveGameDetailPageState";
import { create_live_game_detail_page_state } from "./liveGameDetailPageStateFactories";

describe("liveGameDetailControllerReportActions", () => {
  type HandlerCommand = Parameters<
    typeof create_live_game_detail_report_handlers
  >[0];
  type MockActionDependencies = {
    [Key in keyof HandlerCommand["action_dependencies"]]?: Partial<
      HandlerCommand["action_dependencies"][Key]
    >;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns false when the minimum page data needed for a report is missing", async () => {
    let page_state: LiveGameDetailPageState =
      create_live_game_detail_page_state();
    const action_dependencies = {
      organization_use_cases: {},
    } satisfies MockActionDependencies;
    const handlers = create_live_game_detail_report_handlers({
      action_dependencies:
        action_dependencies as unknown as HandlerCommand["action_dependencies"],
      get_branding_logo_url: () => "",
      get_page_state: () => page_state,
      set_page_state: (next_state) => {
        page_state = next_state;
      },
      set_toast_state: vi.fn(),
    });

    await expect(handlers.download_report()).resolves.toBe(false);
    expect(build_live_game_detail_report_mock).not.toHaveBeenCalled();
  });

  it("builds and downloads the report while toggling download state and showing a success toast", async () => {
    const team_staff_use_cases = {
      list_staff_by_team: vi.fn(),
      list_staff_roles: vi.fn(),
    };
    get_team_staff_use_cases_mock.mockReturnValue(team_staff_use_cases);
    build_live_game_detail_report_mock.mockResolvedValue({
      report_data: { sections: [] },
      filename: "lions-vs-tigers.pdf",
    });
    const toast_updates: LiveGameDetailToastState[] = [];
    const download_states: boolean[] = [];
    let page_state: LiveGameDetailPageState = {
      ...create_live_game_detail_page_state(),
      fixture: { id: "fixture-1" } as LiveGameDetailPageState["fixture"],
      competition: {
        id: "competition-1",
      } as LiveGameDetailPageState["competition"],
      sport: { id: "sport-1" } as LiveGameDetailPageState["sport"],
      home_team: { name: "Lions" } as LiveGameDetailPageState["home_team"],
      away_team: { name: "Tigers" } as LiveGameDetailPageState["away_team"],
      venue: { name: "National Stadium" } as LiveGameDetailPageState["venue"],
      home_players: [
        { id: "home-1" },
      ] as LiveGameDetailPageState["home_players"],
      away_players: [
        { id: "away-1" },
      ] as LiveGameDetailPageState["away_players"],
      assigned_officials_data: [
        { official: { id: "official-1" }, role_name: "Referee" },
      ] as LiveGameDetailPageState["assigned_officials_data"],
    };
    const action_dependencies = {
      organization_use_cases: { get_by_id: vi.fn() },
    } satisfies MockActionDependencies;
    const handlers = create_live_game_detail_report_handlers({
      action_dependencies:
        action_dependencies as unknown as HandlerCommand["action_dependencies"],
      get_branding_logo_url: () => "https://logo.example/crest.png",
      get_page_state: () => page_state,
      set_page_state: (next_state) => {
        download_states.push(next_state.downloading_report);
        page_state = next_state;
      },
      set_toast_state: (next_toast_state: LiveGameDetailToastState) => {
        toast_updates.push(next_toast_state);
      },
    });

    await expect(handlers.download_report()).resolves.toBe(true);
    expect(build_live_game_detail_report_mock).toHaveBeenCalledWith(
      page_state.fixture,
      page_state.competition,
      page_state.sport,
      page_state.home_team,
      page_state.away_team,
      page_state.venue,
      page_state.home_players,
      page_state.away_players,
      page_state.assigned_officials_data,
      "https://logo.example/crest.png",
      {
        organization_use_cases: { get_by_id: expect.any(Function) },
        team_staff_use_cases,
      },
    );
    expect(download_match_report_mock).toHaveBeenCalledWith(
      { sections: [] },
      "lions-vs-tigers.pdf",
    );
    expect(download_states).toEqual([true, false]);
    expect(toast_updates).toContainEqual({
      is_visible: true,
      message: "Match report downloaded!",
      type: "success",
    });
  });
});
