import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Team } from "$lib/core/entities/Team";

import {
  build_report_data_for_fixture,
  download_all_fixture_reports,
  download_fixture_report,
} from "./competitionResultsMatchReports";

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
  function create_team(id: string, name: string): Team {
    return {
      id,
      name,
      short_name: name.slice(0, 3).toUpperCase(),
      description: `${name} description`,
      organization_id: "organization-1",
      gender_id: "gender-1",
      captain_player_id: "",
      vice_captain_player_id: "",
      max_squad_size: 25,
      home_venue_id: "venue-1",
      primary_color: "#111111",
      secondary_color: "#ffffff",
      logo_url: "",
      website: "https://example.com",
      founded_year: 2020,
      status: "active",
      created_at: "2024-01-01T00:00:00.000Z",
      updated_at: "2024-01-01T00:00:00.000Z",
    } as Team;
  }

  const fixture = {
    id: "fixture-1",
    home_team_id: "team-1",
    away_team_id: "team-2",
    scheduled_date: "2024-06-01",
  };
  const team_map = new Map([
    ["team-1", create_team("team-1", "Lions")],
    ["team-2", create_team("team-2", "Falcons")],
  ]);

  beforeEach(() => {
    build_assigned_officials_mock.mockReset();
    build_match_report_data_mock.mockReset();
    build_staff_entries_mock.mockReset();
    build_staff_roles_map_mock.mockReset();
    download_all_match_reports_mock.mockReset();
    download_match_report_mock.mockReset();
    generate_match_report_filename_mock.mockReset();
    resolve_match_report_organization_name_mock.mockReset();
  });

  it("builds report data from fixture lineups, staff, officials, and the selected teams", async () => {
    const dependencies = {
      fixture_lineup_use_cases: {
        get_lineup_for_team_in_fixture: vi
          .fn()
          .mockResolvedValueOnce({
            success: true,
            data: { selected_players: [{ id: "player-1" }] },
          })
          .mockResolvedValueOnce({
            success: true,
            data: { selected_players: [{ id: "player-2" }] },
          }),
      },
      team_staff_use_cases: { marker: true },
    };
    build_staff_entries_mock
      .mockResolvedValueOnce([{ id: "staff-1" }])
      .mockResolvedValueOnce([{ id: "staff-2" }]);
    build_assigned_officials_mock.mockResolvedValueOnce([{ id: "official-1" }]);
    build_match_report_data_mock.mockReturnValueOnce({ id: "report-1" });

    await expect(
      build_report_data_for_fixture({
        fixture: fixture as never,
        selected_competition_state: {
          status: "present",
          competition: { id: "competition-1" },
        } as never,
        team_map,
        organization_name: "Org One",
        organization_logo_url: "/logo.svg",
        staff_roles_map: new Map([["coach", "Coach"]]),
        dependencies: dependencies as never,
      }),
    ).resolves.toEqual({ id: "report-1" });
  });

  it("downloads a fixture report only when report data and teams are available", async () => {
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
    generate_match_report_filename_mock.mockReturnValueOnce(
      "lions-vs-falcons.pdf",
    );

    await expect(
      download_fixture_report({
        fixture: fixture as never,
        selected_competition_state: {
          status: "present",
          competition: { id: "competition-1" },
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
        competition: { id: "competition-1" },
      },
      expect.any(Object),
    );
    expect(download_match_report_mock).toHaveBeenCalledWith(
      { id: "report-1" },
      "lions-vs-falcons.pdf",
    );

    await expect(
      download_fixture_report({
        fixture: fixture as never,
        selected_competition_state: {
          status: "present",
          competition: { id: "competition-1" },
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
    ).resolves.toBe(false);
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
});
