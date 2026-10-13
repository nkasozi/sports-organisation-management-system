import type { EntityId, Name, ScalarInput } from "../types/DomainScalars";
import type { BaseEntity, EntityStatus } from "./BaseEntity";
import type { FormatType, LeagueConfig } from "./CompetitionFormat";
import {
  COMPETITION_STAGE_MESSAGES,
  DEFAULT_STAGE_BLUEPRINTS,
  LEAGUE_ROUND_NAME_PREFIX,
  STAGE_TYPE_LABELS,
} from "./CompetitionStageConstants";
import {
  check_condition,
  check_required_entity_id,
  check_required_name,
  collect_validation_errors,
} from "./EntityValidation";
import type { StageTypeValue } from "./StatusConstants";
import { ENTITY_STATUS, FORMAT_TYPE, STAGE_TYPE } from "./StatusConstants";

export type StageType = StageTypeValue;

export interface CompetitionStage extends BaseEntity {
  competition_id: EntityId;
  name: Name;
  stage_type: StageType;
  stage_order: number;
  status: EntityStatus;
}

export type CreateCompetitionStageInput = Omit<
  ScalarInput<CompetitionStage>,
  "id" | "created_at" | "updated_at"
>;

export type UpdateCompetitionStageInput = Partial<CreateCompetitionStageInput>;

export const STAGE_TYPE_OPTIONS: { value: StageType; label: string }[] =
  Object.values(STAGE_TYPE).map((value) => ({
    value,
    label: STAGE_TYPE_LABELS[value],
  }));

export function get_stage_type_label(stage_type: StageType): string {
  return STAGE_TYPE_LABELS[stage_type];
}

export function create_empty_competition_stage_input(
  competition_id: CreateCompetitionStageInput["competition_id"],
): CreateCompetitionStageInput {
  return {
    competition_id,
    name: "",
    stage_type: STAGE_TYPE.LEAGUE_STAGE,
    stage_order: 1,
    status: ENTITY_STATUS.ACTIVE,
  };
}

export function validate_competition_stage_input(
  input: CreateCompetitionStageInput,
): string[] {
  return collect_validation_errors([
    check_required_entity_id(
      input.competition_id,
      COMPETITION_STAGE_MESSAGES.COMPETITION_ID_REQUIRED,
    ),
    check_required_name(input.name, COMPETITION_STAGE_MESSAGES.NAME_REQUIRED),
    check_condition(
      input.stage_order >= 1,
      COMPETITION_STAGE_MESSAGES.STAGE_ORDER_INVALID,
    ),
  ]);
}

export function create_default_stage_templates(
  format_type: FormatType,
  league_config?: LeagueConfig,
): CreateCompetitionStageInput[] {
  if (format_type === FORMAT_TYPE.LEAGUE) {
    return build_league_templates(league_config);
  }
  return DEFAULT_STAGE_BLUEPRINTS[format_type].map((blueprint, index) =>
    build_template(blueprint.name, blueprint.stage_type, index + 1),
  );
}

function build_league_templates(
  league_config?: LeagueConfig,
): CreateCompetitionStageInput[] {
  const number_of_rounds = league_config?.number_of_rounds ?? 1;
  return Array.from({ length: number_of_rounds }, (_, index) =>
    build_template(
      `${LEAGUE_ROUND_NAME_PREFIX}${index + 1}`,
      STAGE_TYPE.LEAGUE_STAGE,
      index + 1,
    ),
  );
}

function build_template(
  name: CreateCompetitionStageInput["name"],
  stage_type: StageType,
  stage_order: number,
): CreateCompetitionStageInput {
  return {
    competition_id: "",
    name,
    stage_type,
    stage_order,
    status: ENTITY_STATUS.ACTIVE,
  };
}
