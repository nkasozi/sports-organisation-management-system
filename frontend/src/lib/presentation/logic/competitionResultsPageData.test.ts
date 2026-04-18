import { describe, expect, it } from "vitest";

import type { Competition } from "$lib/core/entities/Competition";
import type { CompetitionFormat } from "$lib/core/entities/CompetitionFormat";
import {
  create_default_group_stage_config,
  create_default_knockout_stage_config,
  create_default_league_config,
} from "$lib/core/entities/CompetitionFormatFactories";

import {
  build_shareable_competition_results_url,
  derive_effective_points_config,
  derive_effective_tie_breakers,
  extract_competition_results_url_params,
  load_selected_competition_bundle,
} from "./competitionResultsPageData";

function create_test_competition(overrides: Partial<Competition>): Competition {
  return {
    id: overrides.id ?? "competition_1",
    created_at: overrides.created_at ?? "2024-01-01T00:00:00.000Z",
    updated_at: overrides.updated_at ?? "2024-01-01T00:00:00.000Z",
    name: overrides.name ?? "Premier Cup",
    description: overrides.description ?? "",
    organization_id: overrides.organization_id ?? "organization_1",
    competition_format_id: overrides.competition_format_id ?? "format_1",
    team_ids: overrides.team_ids ?? [],
    allow_auto_squad_submission: overrides.allow_auto_squad_submission ?? false,
    squad_generation_strategy:
      overrides.squad_generation_strategy ?? "first_available",
    allow_auto_fixture_details_setup:
      overrides.allow_auto_fixture_details_setup ?? false,
    lineup_submission_deadline_hours:
      overrides.lineup_submission_deadline_hours ?? 0,
    start_date: overrides.start_date ?? "2024-06-01",
    end_date: overrides.end_date ?? "2024-06-30",
    registration_deadline: overrides.registration_deadline ?? "2024-05-20",
    max_teams: overrides.max_teams ?? 8,
    entry_fee: overrides.entry_fee ?? 0,
    prize_pool: overrides.prize_pool ?? 0,
    location: overrides.location ?? "Main Stadium",
    rule_overrides: overrides.rule_overrides ?? {},
    status: overrides.status ?? "active",
  } as Competition;
}

function create_test_competition_format(
  overrides: Partial<CompetitionFormat>,
): CompetitionFormat {
  return {
    id: overrides.id ?? "format_1",
    created_at: overrides.created_at ?? "2024-01-01T00:00:00.000Z",
    updated_at: overrides.updated_at ?? "2024-01-01T00:00:00.000Z",
    name: overrides.name ?? "League",
    code: overrides.code ?? "LEAGUE",
    description: overrides.description ?? "",
    format_type: overrides.format_type ?? "league",
    points_config: overrides.points_config ?? {
      points_for_win: 3,
      points_for_draw: 1,
      points_for_loss: 0,
    },
    tie_breakers: overrides.tie_breakers ?? ["goal_difference"],
    group_stage_config:
      overrides.group_stage_config ?? create_default_group_stage_config(),
    knockout_stage_config:
      overrides.knockout_stage_config ?? create_default_knockout_stage_config(),
    league_config: overrides.league_config ?? create_default_league_config(),
    stage_templates: overrides.stage_templates ?? [],
    min_teams_required: overrides.min_teams_required ?? 4,
    max_teams_allowed: overrides.max_teams_allowed ?? 16,
    status: overrides.status ?? "active",
    organization_id: overrides.organization_id,
  } as CompetitionFormat;
}

describe("competition results url helpers", () => {
  it("builds a shareable competition results url", () => {
    expect(
      build_shareable_competition_results_url(
        "https://example.com",
        "organization_1",
        "competition_1",
      ),
    ).toBe(
      "https://example.com/competition-results?org=organization_1&competition=competition_1",
    );
  });

  it("extracts organization and competition params from a url", () => {
    expect(
      extract_competition_results_url_params(
        new URL(
          "https://example.com/competition-results?org=organization_1&competition=competition_1",
        ),
      ),
    ).toEqual({
      org_id: "organization_1",
      competition_id: "competition_1",
    });
  });
});

describe("competition results rules helpers", () => {
  it("applies competition point overrides over the format defaults", () => {
    const competition_format = create_test_competition_format({});
    const competition = create_test_competition({
      rule_overrides: { points_config_override: { points_for_win: 5 } },
    });

    expect(
      derive_effective_points_config(
        {
          status: "present",
          competition_format,
        },
        {
          status: "present",
          competition,
        },
      ),
    ).toEqual({
      points_for_win: 5,
      points_for_draw: 1,
      points_for_loss: 0,
    });
  });

  it("prefers competition tie breaker overrides when available", () => {
    expect(
      derive_effective_tie_breakers(
        {
          status: "present",
          competition_format: create_test_competition_format({
            tie_breakers: ["goal_difference"],
          }),
        },
        {
          status: "present",
          competition: create_test_competition({
            rule_overrides: { tie_breakers_override: ["head_to_head"] },
          }),
        },
      ),
    ).toEqual(["head_to_head"]);
  });

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
        } as never,
        "competition_2",
      ),
    ).resolves.toMatchObject({
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
