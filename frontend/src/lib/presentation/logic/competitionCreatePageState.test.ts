import { describe, expect, it } from "vitest";

import { create_empty_competition_input } from "$lib/core/entities/Competition";
import type { CompetitionFormat } from "$lib/core/entities/CompetitionFormat";
import {
  create_default_group_stage_config,
  create_default_knockout_stage_config,
  create_default_league_config,
} from "$lib/core/entities/CompetitionFormatFactories";

import {
  create_competition_team_inputs,
  get_competition_format_team_requirements,
  get_next_selected_team_ids,
  is_competition_team_count_valid,
  normalize_competition_auto_squad_settings,
  update_competition_auto_squad_submission,
} from "./competitionCreatePageState";

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

describe("get_next_selected_team_ids", () => {
  it("adds a team when it is not selected", () => {
    const selected_team_ids = get_next_selected_team_ids(
      new Set(["team_1"]),
      "team_2",
    );

    expect(Array.from(selected_team_ids)).toEqual(["team_1", "team_2"]);
  });

  it("removes a team when it is already selected", () => {
    const selected_team_ids = get_next_selected_team_ids(
      new Set(["team_1"]),
      "team_1",
    );

    expect(Array.from(selected_team_ids)).toEqual([]);
  });
});

describe("competition team requirements", () => {
  it("formats the selected format limits", () => {
    expect(
      get_competition_format_team_requirements({
        status: "present",
        competition_format: create_test_competition_format({
          min_teams_required: 8,
          max_teams_allowed: 12,
        }),
      }),
    ).toBe("Requires 8 to 12 teams");
  });

  it("validates team counts against the selected format", () => {
    const selected_format = create_test_competition_format({
      min_teams_required: 4,
      max_teams_allowed: 6,
    });

    expect(
      is_competition_team_count_valid(
        { status: "present", competition_format: selected_format },
        4,
      ),
    ).toBe(true);
    expect(
      is_competition_team_count_valid(
        { status: "present", competition_format: selected_format },
        7,
      ),
    ).toBe(false);
    expect(is_competition_team_count_valid({ status: "missing" }, 0)).toBe(
      true,
    );
  });
});

describe("auto squad state", () => {
  it("clears the deadline when auto squad submission is disabled", () => {
    const updated_form_data = update_competition_auto_squad_submission(
      {
        ...create_empty_competition_input(),
        allow_auto_squad_submission: true,
        lineup_submission_deadline_hours: 4,
      },
      false,
    );

    expect(updated_form_data.allow_auto_squad_submission).toBe(false);
    expect(updated_form_data.lineup_submission_deadline_hours).toBe(0);
  });

  it("enforces auto squad submission when a deadline is configured and defaults the strategy", () => {
    const updated_form_data = normalize_competition_auto_squad_settings({
      ...create_empty_competition_input(),
      allow_auto_squad_submission: false,
      lineup_submission_deadline_hours: 2,
      squad_generation_strategy: "" as never,
    });

    expect(updated_form_data.allow_auto_squad_submission).toBe(true);
    expect(updated_form_data.squad_generation_strategy).toBe("first_available");
  });
});

describe("create_competition_team_inputs", () => {
  it("creates one competition team input per selected team", () => {
    const competition_team_inputs = create_competition_team_inputs(
      "competition_1",
      ["team_1", "team_2"],
      "2024-04-05",
    );

    expect(competition_team_inputs).toHaveLength(2);
    expect(competition_team_inputs[0]).toEqual(
      expect.objectContaining({
        competition_id: "competition_1",
        team_id: "team_1",
        registration_date: "2024-04-05",
      }),
    );
  });
});
