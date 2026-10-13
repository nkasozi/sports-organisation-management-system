import { beforeEach, describe, expect, it, vi } from "vitest";

import { download_match_report_for_fixture } from "./matchReportPageDownload";
import type { MockUseCases } from "./testMockTypes.test_support";

const {
  build_match_report_data_mock,
  download_match_report_mock,
  generate_match_report_filename_mock,
} = vi.hoisted(() => ({
  build_match_report_data_mock: vi.fn(),
  download_match_report_mock: vi.fn(),
  generate_match_report_filename_mock: vi.fn(),
}));

vi.mock("$lib/infrastructure/utils/MatchReportBuilder", () => ({
  build_match_report_data: build_match_report_data_mock,
  generate_match_report_filename: generate_match_report_filename_mock,
}));

vi.mock("$lib/infrastructure/utils/MatchReportPdfGenerator", () => ({
  download_match_report: download_match_report_mock,
}));

const MALFORMED_REPORT_JSON = "{";

describe("matchReportPageDownload", () => {
  function create_dependencies(): MockUseCases {
    return {
      organization_use_cases: { get_by_id: vi.fn() },
      team_staff_use_cases: {
        list_staff_roles: vi.fn(),
        list_staff_by_team: vi.fn(),
      },
    };
  }

  beforeEach(() => {
    build_match_report_data_mock.mockReset();
    download_match_report_mock.mockReset();
    download_match_report_mock.mockReturnValue({
      success: true,
      data: "lions-vs-tigers.pdf",
    });
    generate_match_report_filename_mock.mockReset();
  });

  it("builds and downloads a match report with organization and staff context", async () => {
    const dependencies = create_dependencies();
    dependencies.organization_use_cases.get_by_id.mockResolvedValue({
      success: true,
      data: { name: "Premier League" },
    });
    dependencies.team_staff_use_cases.list_staff_roles.mockResolvedValue({
      success: true,
      data: [{ id: "role-1", name: "Coach" }],
    });
    dependencies.team_staff_use_cases.list_staff_by_team
      .mockResolvedValueOnce({
        success: true,
        data: {
          items: [{ first_name: "Ada", last_name: "Stone", role_id: "role-1" }],
        },
      })
      .mockResolvedValueOnce({
        success: true,
        data: {
          items: [{ first_name: "Bo", last_name: "Reed", role_id: "missing" }],
        },
      });
    build_match_report_data_mock.mockReturnValue({ pages: 1 });
    generate_match_report_filename_mock.mockReturnValue("report.pdf");

    await expect(
      download_match_report_for_fixture({
        fixture: {
          id: "fixture-1",
          home_team_id: "team-1",
          away_team_id: "team-2",
          scheduled_date: "2024-06-01",
        },
        home_team: { name: "Lions" },
        away_team: { name: "Tigers" },
        competition_state: {
          status: "present",
          competition: { organization_id: "organization-1" },
        },
        sport_state: {
          status: "present",
          sport: {
            card_types: [{ id: "yellow", name: "Yellow", color: "yellow" }],
          },
        },
        venue_state: {
          status: "present",
          venue: { name: "National Stadium" },
        },
        assigned_officials_data: [],
        home_players: [],
        away_players: [],
        organization_logo_url: "https://logo.example/logo.png",
        dependencies: dependencies as never,
      } as never),
    ).resolves.toEqual({ success: true, data: "Match report downloaded!" });

    expect(build_match_report_data_mock).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_name: "PREMIER LEAGUE",
        home_staff: [{ role: "Coach", name: "Ada Stone" }],
        away_staff: [{ role: "Staff", name: "Bo Reed" }],
        venue_name: "National Stadium",
      }),
    );
    expect(download_match_report_mock).toHaveBeenCalledWith(
      { pages: 1 },
      "report.pdf",
    );
  });

  it("returns a failure result when report generation throws", async () => {
    const dependencies = create_dependencies();
    dependencies.team_staff_use_cases.list_staff_roles.mockResolvedValue({
      success: true,
      data: [],
    });
    dependencies.team_staff_use_cases.list_staff_by_team.mockResolvedValue({
      success: true,
      data: { items: [] },
    });
    build_match_report_data_mock.mockImplementation(() =>
      JSON.parse(MALFORMED_REPORT_JSON),
    );

    await expect(
      download_match_report_for_fixture({
        fixture: {
          id: "fixture-1",
          home_team_id: "team-1",
          away_team_id: "team-2",
          scheduled_date: "2024-06-01",
        },
        home_team: { name: "Lions" },
        away_team: { name: "Tigers" },
        competition_state: { status: "missing" },
        sport_state: { status: "missing" },
        venue_state: { status: "missing" },
        assigned_officials_data: [],
        home_players: [],
        away_players: [],
        organization_logo_url: "",
        dependencies: dependencies as never,
      } as never),
    ).resolves.toEqual({
      success: false,
      error: "We couldn't download the match report. Please try again.",
    });
  });

  it("returns a friendly failure when the PDF cannot be saved", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const dependencies = create_dependencies();
    dependencies.team_staff_use_cases.list_staff_roles.mockResolvedValue({
      success: true,
      data: [],
    });
    dependencies.team_staff_use_cases.list_staff_by_team.mockResolvedValue({
      success: true,
      data: { items: [] },
    });
    download_match_report_mock.mockReturnValue({
      success: false,
      error: "save blocked",
    });

    const result = await download_match_report_for_fixture({
      fixture: { id: "fixture-1", scheduled_date: "2024-06-01" },
      home_team: { name: "Lions" },
      away_team: { name: "Tigers" },
      competition_state: { status: "missing" },
      sport_state: { status: "missing" },
      venue_state: { status: "missing" },
      assigned_officials_data: [],
      home_players: [],
      away_players: [],
      organization_logo_url: "",
      dependencies: dependencies as never,
    } as never);

    expect(result).toEqual({
      success: false,
      error: "We couldn't download the match report. Please try again.",
    });
  });
});
