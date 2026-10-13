import { describe, expect, it } from "vitest";

import type { Competition } from "$lib/core/entities/Competition";
import type { CompetitionFormat } from "$lib/core/entities/CompetitionFormat";

import { load_selected_competition_bundle } from "./competitionResultsPageData";
import {
  create_test_competition,
  create_test_competition_format,
} from "./competitionResultsPageData.test_support";

describe("competition results rules helpers", () => {
  it("builds explicit selected competition and format states", async () => {
    const competition = create_test_competition({
      id: "competition_2" as Competition["id"],
    });
    const competition_format = create_test_competition_format({
      id: "format_2" as CompetitionFormat["id"],
    });

    await expect(
      load_selected_competition_bundle(
        {
          competition_use_cases: {
            get_by_id: async () => ({ success: true, data: competition }),
          },
          format_use_cases: {
            get_by_id: async () => ({
              success: true,
              data: competition_format,
            }),
          },
          competition_stage_use_cases: {
            list_stages_by_competition: async () => ({
              success: true,
              data: { items: [] },
            }),
          },
          competition_team_use_cases: {
            list_teams_in_competition: async () => ({
              success: true,
              data: { items: [] },
            }),
          },
          team_use_cases: {
            get_by_id: async () => ({ success: false, error: "missing" }),
          },
          fixture_use_cases: {
            list_fixtures_by_competition: async () => ({
              success: true,
              data: { items: [] },
            }),
          },
          organization_use_cases: {
            get_by_id: async () => ({
              success: true,
              data: { id: "org_1", sport_id: "sport_netball" },
            }),
          },
          sport_use_cases: {
            get_by_id: async () => ({
              success: true,
              data: { code: "NETBALL", scoring_rules: [], card_types: [] },
            }),
          },
        } as never,
        "competition_2",
      ),
    ).resolves.toMatchObject({
      sport_rules: { event_source: { sport_code: "NETBALL" } },
      selected_competition_state: {
        status: "present",
        competition,
      },
      competition_format_state: {
        status: "present",
        competition_format,
      },
    });
  });

  it("returns missing selected competition and format states without a selection", async () => {
    await expect(
      load_selected_competition_bundle(
        {
          competition_use_cases: {
            get_by_id: async () => ({ success: false, error: "missing" }),
          },
          format_use_cases: {
            get_by_id: async () => ({ success: false, error: "missing" }),
          },
          competition_stage_use_cases: {
            list_stages_by_competition: async () => ({
              success: true,
              data: { items: [] },
            }),
          },
          competition_team_use_cases: {
            list_teams_in_competition: async () => ({
              success: true,
              data: { items: [] },
            }),
          },
          team_use_cases: {
            get_by_id: async () => ({ success: false, error: "missing" }),
          },
          fixture_use_cases: {
            list_fixtures_by_competition: async () => ({
              success: true,
              data: { items: [] },
            }),
          },
        } as never,
        "",
      ),
    ).resolves.toMatchObject({
      selected_competition_state: { status: "missing" },
      competition_format_state: { status: "missing" },
    });
  });
});
