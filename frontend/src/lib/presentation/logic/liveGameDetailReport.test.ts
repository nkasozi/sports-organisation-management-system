import { beforeEach, describe, expect, it, vi } from "vitest";

import { build_live_game_detail_report } from "./liveGameDetailReport";

const { build_match_report_data_mock, generate_match_report_filename_mock } =
  vi.hoisted(() => ({
    build_match_report_data_mock: vi.fn(),
    generate_match_report_filename_mock: vi.fn(),
  }));

vi.mock("$lib/infrastructure/utils/MatchReportBuilder", () => ({
  build_match_report_data: build_match_report_data_mock,
  generate_match_report_filename: generate_match_report_filename_mock,
}));

describe("liveGameDetailReport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("builds report context with organization, staff, venue, and card type data", async () => {
    build_match_report_data_mock.mockReturnValue({ pages: [] });
    generate_match_report_filename_mock.mockReturnValue("lions-vs-tigers.pdf");
    const dependencies = {
      organization_use_cases: {
        get_by_id: vi
          .fn()
          .mockResolvedValue({ success: true, data: { name: "Super League" } }),
      },
      team_staff_use_cases: {
        list_staff_roles: vi.fn().mockResolvedValue({
          success: true,
          data: [{ id: "role-coach", name: "Coach" }],
        }),
        list_staff_by_team: vi
          .fn()
          .mockImplementation(async (team_id: string) =>
            team_id === "team-home"
              ? {
                  success: true,
                  data: {
                    items: [
                      {
                        role_id: "role-coach",
                        first_name: "Sam",
                        last_name: "Hill",
                      },
                    ],
                  },
                }
              : {
                  success: true,
                  data: {
                    items: [
                      {
                        role_id: "role-unknown",
                        first_name: "Ava",
                        last_name: "Cole",
                      },
                    ],
                  },
                },
          ),
      },
    } as never;

    const result = await build_live_game_detail_report(
      {
        home_team_id: "team-home",
        away_team_id: "team-away",
        scheduled_date: "2024-06-01",
      } as never,
      { organization_id: "organization-1" } as never,
      {
        card_types: [{ id: "yellow", name: "Yellow", color: "#ff0" }],
      } as never,
      { name: "Lions" } as never,
      { name: "Tigers" } as never,
      { name: "National Stadium" } as never,
      [{ id: "home-player" }] as never,
      [{ id: "away-player" }] as never,
      [{ official: { id: "official-1" }, role_name: "Referee" }] as never,
      "https://logo.example/crest.png",
      dependencies,
    );

    expect(build_match_report_data_mock).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_name: "SUPER LEAGUE",
        home_staff: [{ role: "Coach", name: "Sam Hill" }],
        away_staff: [{ role: "Staff", name: "Ava Cole" }],
        card_types: [
          {
            id: "yellow",
            name: "Yellow",
            color: "#ff0",
            event_type: "yellow_card",
          },
        ],
        venue_name: "National Stadium",
        organization_logo_url: "https://logo.example/crest.png",
      }),
    );
    expect(generate_match_report_filename_mock).toHaveBeenCalledWith(
      "Lions",
      "Tigers",
      "2024-06-01",
    );
    expect(result).toEqual({
      report_data: { pages: [] },
      filename: "lions-vs-tigers.pdf",
    });
  });

  it("falls back to default organization and empty staff collections when lookups fail", async () => {
    build_match_report_data_mock.mockReturnValue({ pages: [] });
    generate_match_report_filename_mock.mockReturnValue("fallback.pdf");

    await build_live_game_detail_report(
      {
        home_team_id: "team-home",
        away_team_id: "team-away",
        scheduled_date: "2024-06-02",
      } as never,
      { organization_id: "organization-1" } as never,
      void 0,
      { name: "Lions" } as never,
      { name: "Tigers" } as never,
      void 0,
      [] as never,
      [] as never,
      [] as never,
      "",
      {
        organization_use_cases: {
          get_by_id: vi
            .fn()
            .mockResolvedValue({ success: false, error: "missing" }),
        },
        team_staff_use_cases: {
          list_staff_roles: vi
            .fn()
            .mockResolvedValue({ success: false, error: "missing" }),
          list_staff_by_team: vi
            .fn()
            .mockResolvedValue({ success: false, error: "missing" }),
        },
      } as never,
    );

    expect(build_match_report_data_mock).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_name: "SPORT-SYNC",
        home_staff: [],
        away_staff: [],
        card_types: [],
      }),
    );
  });
});
