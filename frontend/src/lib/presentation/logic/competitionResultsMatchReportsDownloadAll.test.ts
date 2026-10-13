import { beforeEach, describe, expect, it, vi } from "vitest";

import { download_all_fixture_reports } from "./competitionResultsMatchReports";
import {
  fixture,
  team_map,
} from "./competitionResultsMatchReports.test_support";

const {
  build_assigned_officials_mock,
  build_match_report_data_mock,
  build_staff_entries_mock,
  build_staff_roles_map_mock,
  download_all_match_reports_mock,
  download_match_report_mock,
  generate_match_report_filename_mock,
  resolve_match_report_organization_name_mock,
} = vi.hoisted(() => ({
  build_assigned_officials_mock: vi.fn(),
  build_match_report_data_mock: vi.fn(),
  build_staff_entries_mock: vi.fn(),
  build_staff_roles_map_mock: vi.fn(),
  download_all_match_reports_mock: vi.fn(),
  download_match_report_mock: vi.fn(),
  generate_match_report_filename_mock: vi.fn(),
  resolve_match_report_organization_name_mock: vi.fn(),
}));

vi.mock("$lib/infrastructure/utils/MatchReportBuilder", () => ({
  build_match_report_data: build_match_report_data_mock,
  generate_match_report_filename: generate_match_report_filename_mock,
}));

vi.mock("$lib/infrastructure/utils/MatchReportPdfGenerator", () => ({
  download_all_match_reports: download_all_match_reports_mock,
  download_match_report: download_match_report_mock,
}));

vi.mock("$lib/presentation/logic/competitionResultsMatchReportHelpers", () => ({
  build_assigned_officials: build_assigned_officials_mock,
  build_staff_entries: build_staff_entries_mock,
  build_staff_roles_map: build_staff_roles_map_mock,
  COMPETITION_RESULTS_MATCH_REPORT_TEXT: {
    default_competition_name: "Competition",
    all_reports_suffix: " Match Reports",
  },
  resolve_match_report_organization_name:
    resolve_match_report_organization_name_mock,
}));

describe("competitionResultsMatchReports", () => {
  beforeEach(() => {
    build_assigned_officials_mock.mockReset();
    build_match_report_data_mock.mockReset();
    build_staff_entries_mock.mockReset();
    build_staff_roles_map_mock.mockReset();
    download_all_match_reports_mock.mockReset();
    download_all_match_reports_mock.mockReturnValue({
      success: true,
      data: "all.pdf",
    });
    download_match_report_mock.mockReset();
    download_match_report_mock.mockReturnValue({
      success: true,
      data: "report.pdf",
    });
    generate_match_report_filename_mock.mockReset();
    resolve_match_report_organization_name_mock.mockReset();
  });

  it("downloads all valid reports and returns false when no completed fixtures or reports exist", async () => {
    await expect(
      download_all_fixture_reports({
        completed_fixtures: [],
        selected_competition_state: { status: "missing" },
        team_map,
        organization_logo_url: "/logo.svg",
        dependencies: {} as never,
      }),
    ).resolves.toBe(false);

    resolve_match_report_organization_name_mock.mockResolvedValueOnce(
      "Org One",
    );
    build_staff_roles_map_mock.mockResolvedValueOnce(
      new Map([["coach", "Coach"]]),
    );
    build_staff_entries_mock
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    build_assigned_officials_mock
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    build_match_report_data_mock
      .mockReturnValueOnce({ id: "report-1" })
      .mockImplementationOnce(() => {});

    await expect(
      download_all_fixture_reports({
        completed_fixtures: [
          fixture as never,
          {
            ...fixture,
            id: "fixture-2",
            scheduled_date: "2024-06-02",
          } as never,
        ],
        selected_competition_state: {
          status: "present",
          competition: {
            id: "competition-1",
            name: "Summer Cup",
          },
        } as never,
        team_map,
        organization_logo_url: "/logo.svg",
        dependencies: {
          fixture_lineup_use_cases: {
            get_lineup_for_team_in_fixture: vi.fn().mockResolvedValue({
              success: true,
              data: { selected_players: [] },
            }),
          },
          team_staff_use_cases: { marker: true },
        } as never,
      }),
    ).resolves.toBe(true);
    expect(resolve_match_report_organization_name_mock).toHaveBeenCalledWith(
      {
        status: "present",
        competition: {
          id: "competition-1",
          name: "Summer Cup",
        },
      },
      expect.any(Object),
    );
    expect(download_all_match_reports_mock).toHaveBeenCalledWith(
      [{ id: "report-1" }],
      "Summer Cup Match Reports",
    );
  });

  it("returns false when saving the combined report fails", async () => {
    const console_error = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    resolve_match_report_organization_name_mock.mockResolvedValue("Org One");
    build_staff_roles_map_mock.mockResolvedValue(new Map());
    build_staff_entries_mock.mockResolvedValue([]);
    build_assigned_officials_mock.mockResolvedValue([]);
    build_match_report_data_mock.mockReturnValue({ id: "report-1" });
    download_all_match_reports_mock.mockReturnValue({
      success: false,
      error: "PDF failed",
    });

    await expect(
      download_all_fixture_reports({
        completed_fixtures: [fixture as never],
        selected_competition_state: { status: "missing" },
        team_map,
        organization_logo_url: "/logo.svg",
        dependencies: {
          fixture_lineup_use_cases: {
            get_lineup_for_team_in_fixture: vi.fn().mockResolvedValue({
              success: true,
              data: { selected_players: [] },
            }),
          },
          team_staff_use_cases: { marker: true },
        } as never,
      }),
    ).resolves.toBe(false);
    expect(console_error).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        event: "competition_results_all_match_reports_download_failed",
      }),
    );
  });
});
