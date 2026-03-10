import type { BaseEntity, EntityStatus } from "./BaseEntity";
import type { FormatType, LeagueConfig } from "./CompetitionFormat";

export type StageType =
  | "group_stage"
  | "knockout_stage"
  | "league_stage"
  | "one_off_stage"
  | "custom";

export interface CompetitionStage extends BaseEntity {
  competition_id: string;
  name: string;
  stage_type: StageType;
  stage_order: number;
  status: EntityStatus;
}

export type CreateCompetitionStageInput = Omit<
  CompetitionStage,
  "id" | "created_at" | "updated_at"
>;

export type UpdateCompetitionStageInput = Partial<CreateCompetitionStageInput>;

export const STAGE_TYPE_OPTIONS: { value: StageType; label: string }[] = [
  { value: "group_stage", label: "Group Stage" },
  { value: "knockout_stage", label: "Knockout Stage" },
  { value: "league_stage", label: "League Stage" },
  { value: "one_off_stage", label: "One-Off Stage" },
  { value: "custom", label: "Custom" },
];

export function get_stage_type_label(stage_type: StageType): string {
  const found = STAGE_TYPE_OPTIONS.find((opt) => opt.value === stage_type);
  return found?.label ?? stage_type;
}

export function create_empty_competition_stage_input(
  competition_id: string,
): CreateCompetitionStageInput {
  return {
    competition_id,
    name: "",
    stage_type: "league_stage",
    stage_order: 1,
    status: "active",
  };
}

export function validate_competition_stage_input(
  input: CreateCompetitionStageInput,
): string[] {
  const errors: string[] = [];

  if (!input.competition_id || input.competition_id.trim().length === 0) {
    errors.push("Competition ID is required");
  }

  if (!input.name || input.name.trim().length === 0) {
    errors.push("Stage name is required");
  }

  if (input.stage_order < 1) {
    errors.push("Stage order must be at least 1");
  }

  return errors;
}

export function create_default_stage_templates(
  format_type: FormatType,
  league_config?: LeagueConfig,
): CreateCompetitionStageInput[] {
  switch (format_type) {
    case "league":
      return build_league_templates(league_config);
    case "round_robin":
      return [build_template("Round Robin", "league_stage", 1)];
    case "groups_knockout":
      return [
        build_template("Pool Stage", "group_stage", 1),
        build_template("Semi Finals", "knockout_stage", 2),
        build_template("Final", "one_off_stage", 3),
      ];
    case "straight_knockout":
      return [
        build_template("Round of 16", "knockout_stage", 1),
        build_template("Quarter Finals", "knockout_stage", 2),
        build_template("Semi Finals", "knockout_stage", 3),
        build_template("Final", "one_off_stage", 4),
      ];
    case "groups_playoffs":
      return [
        build_template("Pool Stage", "group_stage", 1),
        build_template("Playoffs", "knockout_stage", 2),
        build_template("Final", "one_off_stage", 3),
      ];
    case "double_elimination":
      return [
        build_template("Winners Bracket", "knockout_stage", 1),
        build_template("Losers Bracket", "knockout_stage", 2),
        build_template("Grand Final", "one_off_stage", 3),
      ];
    case "swiss":
      return [
        build_template("Swiss Rounds", "league_stage", 1),
        build_template("Final", "one_off_stage", 2),
      ];
    case "custom":
      return [build_template("Stage 1", "custom", 1)];
  }
}

function build_league_templates(
  league_config?: LeagueConfig,
): CreateCompetitionStageInput[] {
  const number_of_rounds = league_config?.number_of_rounds ?? 1;
  return Array.from({ length: number_of_rounds }, (_, index) =>
    build_template(`Round ${index + 1}`, "league_stage", index + 1),
  );
}

function build_template(
  name: string,
  stage_type: StageType,
  stage_order: number,
): CreateCompetitionStageInput {
  return {
    competition_id: "",
    name,
    stage_type,
    stage_order,
    status: "active",
  };
}
