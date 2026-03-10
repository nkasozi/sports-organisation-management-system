import { describe, it, expect } from "vitest";
import {
  validate_competition_stage_input,
  create_empty_competition_stage_input,
  create_default_stage_templates,
} from "./CompetitionStage";
import type { CreateCompetitionStageInput } from "./CompetitionStage";

function create_valid_stage_input(
  overrides: Partial<CreateCompetitionStageInput> = {},
): CreateCompetitionStageInput {
  return {
    competition_id: "comp-123",
    name: "Pool Stage",
    stage_type: "group_stage",
    stage_order: 1,
    status: "active",
    ...overrides,
  };
}

describe("validate_competition_stage_input", () => {
  it("returns error when name is empty", () => {
    const input = create_valid_stage_input({ name: "" });
    const errors = validate_competition_stage_input(input);
    expect(errors).toContain("Stage name is required");
  });

  it("returns error when name is only whitespace", () => {
    const input = create_valid_stage_input({ name: "   " });
    const errors = validate_competition_stage_input(input);
    expect(errors).toContain("Stage name is required");
  });

  it("returns error when stage_order is less than 1", () => {
    const input = create_valid_stage_input({ stage_order: 0 });
    const errors = validate_competition_stage_input(input);
    expect(errors).toContain("Stage order must be at least 1");
  });

  it("returns error when stage_order is negative", () => {
    const input = create_valid_stage_input({ stage_order: -1 });
    const errors = validate_competition_stage_input(input);
    expect(errors).toContain("Stage order must be at least 1");
  });

  it("returns error when competition_id is empty", () => {
    const input = create_valid_stage_input({ competition_id: "" });
    const errors = validate_competition_stage_input(input);
    expect(errors).toContain("Competition ID is required");
  });

  it("passes validation for valid input", () => {
    const input = create_valid_stage_input();
    const errors = validate_competition_stage_input(input);
    expect(errors).toHaveLength(0);
  });
});

describe("create_empty_competition_stage_input", () => {
  it("creates input with the given competition_id", () => {
    const input = create_empty_competition_stage_input("comp-abc");
    expect(input.competition_id).toBe("comp-abc");
  });

  it("creates input with stage_order 1 by default", () => {
    const input = create_empty_competition_stage_input("comp-abc");
    expect(input.stage_order).toBe(1);
  });
});

describe("create_default_stage_templates", () => {
  it("league format with 2 rounds returns 2 league_stage stages", () => {
    const templates = create_default_stage_templates("league", {
      number_of_rounds: 2,
      points_for_win: 3,
      points_for_draw: 1,
      points_for_loss: 0,
      promotion_spots: 0,
      relegation_spots: 0,
      playoff_spots: 0,
    });
    expect(templates).toHaveLength(2);
    expect(templates[0].stage_type).toBe("league_stage");
    expect(templates[0].name).toBe("Round 1");
    expect(templates[0].stage_order).toBe(1);
    expect(templates[1].stage_type).toBe("league_stage");
    expect(templates[1].name).toBe("Round 2");
    expect(templates[1].stage_order).toBe(2);
  });

  it("league format with no config defaults to 1 round", () => {
    const templates = create_default_stage_templates("league");
    expect(templates).toHaveLength(1);
    expect(templates[0].name).toBe("Round 1");
  });

  it("round_robin returns single league_stage stage", () => {
    const templates = create_default_stage_templates("round_robin");
    expect(templates).toHaveLength(1);
    expect(templates[0].stage_type).toBe("league_stage");
    expect(templates[0].name).toBe("Round Robin");
  });

  it("groups_knockout returns [group_stage, knockout_stage, one_off_stage]", () => {
    const templates = create_default_stage_templates("groups_knockout");
    expect(templates).toHaveLength(3);
    expect(templates[0].stage_type).toBe("group_stage");
    expect(templates[0].name).toBe("Pool Stage");
    expect(templates[1].stage_type).toBe("knockout_stage");
    expect(templates[1].name).toBe("Semi Finals");
    expect(templates[2].stage_type).toBe("one_off_stage");
    expect(templates[2].name).toBe("Final");
  });

  it("straight_knockout returns 3 knockout_stage stages plus one_off_stage Final", () => {
    const templates = create_default_stage_templates("straight_knockout");
    expect(templates).toHaveLength(4);
    expect(templates[0].stage_type).toBe("knockout_stage");
    expect(templates[0].name).toBe("Round of 16");
    expect(templates[1].stage_type).toBe("knockout_stage");
    expect(templates[1].name).toBe("Quarter Finals");
    expect(templates[2].stage_type).toBe("knockout_stage");
    expect(templates[2].name).toBe("Semi Finals");
    expect(templates[3].stage_type).toBe("one_off_stage");
    expect(templates[3].name).toBe("Final");
  });

  it("groups_playoffs returns [group_stage Pool Stage, knockout_stage Playoffs, one_off_stage Final]", () => {
    const templates = create_default_stage_templates("groups_playoffs");
    expect(templates).toHaveLength(3);
    expect(templates[0].stage_type).toBe("group_stage");
    expect(templates[0].name).toBe("Pool Stage");
    expect(templates[1].stage_type).toBe("knockout_stage");
    expect(templates[1].name).toBe("Playoffs");
    expect(templates[2].stage_type).toBe("one_off_stage");
    expect(templates[2].name).toBe("Final");
  });

  it("double_elimination returns [knockout_stage x2, one_off_stage Grand Final]", () => {
    const templates = create_default_stage_templates("double_elimination");
    expect(templates).toHaveLength(3);
    expect(templates[0].stage_type).toBe("knockout_stage");
    expect(templates[0].name).toBe("Winners Bracket");
    expect(templates[1].stage_type).toBe("knockout_stage");
    expect(templates[1].name).toBe("Losers Bracket");
    expect(templates[2].stage_type).toBe("one_off_stage");
    expect(templates[2].name).toBe("Grand Final");
  });

  it("swiss returns [league_stage Swiss Rounds, one_off_stage Final]", () => {
    const templates = create_default_stage_templates("swiss");
    expect(templates).toHaveLength(2);
    expect(templates[0].stage_type).toBe("league_stage");
    expect(templates[0].name).toBe("Swiss Rounds");
    expect(templates[1].stage_type).toBe("one_off_stage");
    expect(templates[1].name).toBe("Final");
  });

  it("custom returns single custom stage", () => {
    const templates = create_default_stage_templates("custom");
    expect(templates).toHaveLength(1);
    expect(templates[0].stage_type).toBe("custom");
    expect(templates[0].name).toBe("Stage 1");
  });

  it("all 8 format types return at least one template", () => {
    const format_types = [
      "league",
      "round_robin",
      "groups_knockout",
      "straight_knockout",
      "groups_playoffs",
      "double_elimination",
      "swiss",
      "custom",
    ] as const;
    for (const format_type of format_types) {
      const templates = create_default_stage_templates(format_type);
      expect(templates.length).toBeGreaterThan(0);
    }
  });

  it("all templates have stage_order starting from 1 and incrementing", () => {
    const templates = create_default_stage_templates("straight_knockout");
    templates.forEach((template, index) => {
      expect(template.stage_order).toBe(index + 1);
    });
  });
});
