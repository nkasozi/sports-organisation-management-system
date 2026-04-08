import { describe, expect, it, vi } from "vitest";

import {
  load_match_report_assigned_officials,
  load_match_report_competition_bundle,
  load_match_report_lineups,
} from "./matchReportPageLoadHelpers";

describe("matchReportPageLoadHelpers", () => {
  it("loads home and away lineups with empty fallbacks", async () => {
    await expect(
      load_match_report_lineups(
        {
          id: "fixture_1",
          home_team_id: "team_1",
          away_team_id: "team_2",
        } as never,
        {
          fixture_lineup_use_cases: {
            get_lineup_for_team_in_fixture: vi
              .fn()
              .mockResolvedValueOnce({
                success: true,
                data: { selected_players: [{ id: "player_1" }] },
              })
              .mockResolvedValueOnce({ success: false, error: "missing" }),
          },
        } as never,
      ),
    ).resolves.toEqual({
      home_players: [{ id: "player_1" }],
      away_players: [],
    });
  });

  it("loads the competition bundle and short-circuits missing relationships", async () => {
    await expect(
      load_match_report_competition_bundle(
        { competition_id: null } as never,
        {} as never,
      ),
    ).resolves.toEqual({
      competition: null,
      organization_name: "",
      sport: null,
    });

    await expect(
      load_match_report_competition_bundle(
        { competition_id: "competition_1" } as never,
        {
          competition_use_cases: {
            get_by_id: vi.fn().mockResolvedValue({
              success: true,
              data: { id: "competition_1", organization_id: "org_1" },
            }),
          },
          organization_use_cases: {
            get_by_id: vi.fn().mockResolvedValue({
              success: true,
              data: {
                id: "org_1",
                name: "Uganda Hockey Association",
                sport_id: "sport_1",
              },
            }),
          },
          sport_use_cases: {
            get_by_id: vi
              .fn()
              .mockResolvedValue({ success: true, data: { id: "sport_1" } }),
          },
        } as never,
      ),
    ).resolves.toEqual({
      competition: { id: "competition_1", organization_id: "org_1" },
      organization_name: "Uganda Hockey Association",
      sport: { id: "sport_1" },
    });
  });

  it("loads assigned officials and the venue bundle together", async () => {
    await expect(
      load_match_report_assigned_officials(
        {
          venue: "venue_1",
          assigned_officials: [
            { official_id: "official_1", role_name: "Umpire" },
            { official_id: "official_2", role_name: "Judge" },
          ],
        } as never,
        {
          official_use_cases: {
            get_by_id: vi
              .fn()
              .mockResolvedValueOnce({
                success: true,
                data: { id: "official_1" },
              })
              .mockResolvedValueOnce({ success: false, error: "missing" }),
          },
          venue_use_cases: {
            get_by_id: vi
              .fn()
              .mockResolvedValue({ success: true, data: { id: "venue_1" } }),
          },
        } as never,
      ),
    ).resolves.toEqual({
      assigned_officials_data: [
        { official: { id: "official_1" }, role_name: "Umpire" },
      ],
      venue_result: { success: true, data: { id: "venue_1" } },
    });
  });
});
