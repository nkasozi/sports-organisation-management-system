import { beforeEach, describe, expect, it, vi } from "vitest";

import { create_live_game_detail_report_handlers } from "./liveGameDetailControllerReportActions";
import type {
  LiveGameDetailPageState,
  LiveGameDetailToastState,
} from "./liveGameDetailPageState";
import { create_live_game_detail_page_state } from "./liveGameDetailPageStateFactories";

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

describe("liveGameDetailControllerReportActions failures", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("shows a friendly error toast and resets the spinner when saving the PDF fails", async () => {
    get_team_staff_use_cases_mock.mockReturnValue({});
    build_live_game_detail_report_mock.mockResolvedValue({
      report_data: { sections: [] },
      filename: "lions-vs-tigers.pdf",
    });
    download_match_report_mock.mockReturnValue({
      success: false,
      error: "jsPDF save failed",
    });
    const toast_updates = [] as LiveGameDetailToastState[];
    let page_state: LiveGameDetailPageState = {
      ...create_live_game_detail_page_state(),
      fixture: { id: "fixture-1" } as LiveGameDetailPageState["fixture"],
      home_team: { name: "Lions" } as LiveGameDetailPageState["home_team"],
      away_team: { name: "Tigers" } as LiveGameDetailPageState["away_team"],
    };
    const handlers = create_live_game_detail_report_handlers({
      action_dependencies: { organization_use_cases: {} } as never,
      get_branding_logo_url: () => "",
      get_page_state: () => page_state,
      set_page_state: (next_state) => {
        page_state = next_state;
      },
      set_toast_state: (next_toast_state: LiveGameDetailToastState) => {
        toast_updates.push(next_toast_state);
      },
    });

    await expect(handlers.download_report()).resolves.toBe(false);
    expect(page_state.downloading_report).toBe(false);
    expect(toast_updates).toContainEqual({
      is_visible: true,
      message: "We couldn't download the match report. Please try again.",
      type: "error",
    });
    expect(console.error).toHaveBeenCalledWith(
      "[LiveGameDetail] Match report download failed",
      {
        event: "live_game_match_report_download_failed",
        fixture_id: "fixture-1",
        error: "jsPDF save failed",
      },
    );
  });
});
