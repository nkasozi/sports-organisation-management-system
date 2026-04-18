import { describe, expect, it } from "vitest";

import {
  create_competition_team_collections,
  create_competition_update_form_data,
  get_competition_team_collections_after_add,
  get_competition_team_collections_after_remove,
  normalize_competition_auto_squad_settings,
  reset_competition_scoring_overrides,
  toggle_competition_tie_breaker,
  update_competition_points_override,
} from "./competitionEditPageState";

describe("competitionEditPageState", () => {
  it("creates editable form data from a competition entity", () => {
    expect(
      create_competition_update_form_data({
        name: "Premier League",
        description: "Top division",
        organization_id: "organization-1",
        competition_format_id: "format-1",
        team_ids: ["team-1"],
        allow_auto_squad_submission: true,
        squad_generation_strategy: "first_available",
        allow_auto_fixture_details_setup: false,
        lineup_submission_deadline_hours: 4,
        start_date: "2024-01-01",
        end_date: "2024-02-01",
        registration_deadline: "2023-12-15",
        max_teams: 16,
        entry_fee: 0,
        prize_pool: 1000,
        location: "Arena",
        rule_overrides: {},
        status: "active",
      } as never),
    ).toEqual(
      expect.objectContaining({
        name: "Premier League",
        competition_format_id: "format-1",
        team_ids: ["team-1"],
        lineup_submission_deadline_hours: 4,
      }),
    );
  });

  it("builds, adds, and removes competition team collections within the selected organization", () => {
    const collections = create_competition_team_collections(
      [
        { id: "team-1", organization_id: "organization-1", name: "Lions" },
        { id: "team-2", organization_id: "organization-1", name: "Tigers" },
        { id: "team-3", organization_id: "organization-2", name: "Bears" },
      ] as never,
      [{ id: "entry-1", team_id: "team-1" }] as never,
      "organization-1",
    );

    expect(collections.teams_in_competition.map((team) => team.id)).toEqual([
      "team-1",
    ]);
    expect(collections.available_teams.map((team) => team.id)).toEqual([
      "team-2",
    ]);

    const added = get_competition_team_collections_after_add(
      collections,
      { id: "entry-2", team_id: "team-2" } as never,
      {
        id: "team-2",
        organization_id: "organization-1",
        name: "Tigers",
      } as never,
    );
    expect(added.teams_in_competition.map((team) => team.id)).toEqual([
      "team-1",
      "team-2",
    ]);

    const removed = get_competition_team_collections_after_remove(added, {
      id: "team-1",
      organization_id: "organization-1",
      name: "Lions",
    } as never);
    expect(removed.teams_in_competition.map((team) => team.id)).toEqual([
      "team-2",
    ]);
    expect(removed.available_teams.map((team) => team.id)).toContain("team-1");
  });

  it("updates scoring overrides, tie breakers, and auto squad defaults", () => {
    const points_updated = update_competition_points_override(
      { rule_overrides: {} } as never,
      "points_for_win",
      "5",
    );
    expect(points_updated.rule_overrides?.points_config_override).toEqual({
      points_for_win: 5,
    });

    const tie_breakers_toggled = toggle_competition_tie_breaker(
      { rule_overrides: {} } as never,
      "goals_scored",
      true,
      ["goal_difference"],
    );
    expect(tie_breakers_toggled.rule_overrides?.tie_breakers_override).toEqual([
      "goal_difference",
      "goals_scored",
    ]);

    expect(
      reset_competition_scoring_overrides({
        rule_overrides: {
          points_config_override: { points_for_win: 5 },
          tie_breakers_override: ["goal_difference"],
        },
      } as never),
    ).toEqual({
      rule_overrides: {},
    });

    expect(
      normalize_competition_auto_squad_settings({
        allow_auto_squad_submission: false,
        lineup_submission_deadline_hours: 2,
        squad_generation_strategy: "",
      } as never),
    ).toEqual({
      allow_auto_squad_submission: true,
      lineup_submission_deadline_hours: 2,
      squad_generation_strategy: "first_available",
    });
  });
});
