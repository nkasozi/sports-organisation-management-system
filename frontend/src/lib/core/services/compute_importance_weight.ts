import type { StageType } from "../entities/CompetitionStage";
import { STAGE_TYPE } from "../entities/StatusConstants";

type ImportanceWeight = 1.0 | 1.5 | 2.0 | 2.5 | 3.0;

const IMPORTANCE_WEIGHT_OVERRIDE_STATUS = {
  AUTOMATIC: "automatic",
  MANUAL: "manual",
} as const;

export type ImportanceWeightOverride =
  | { status: typeof IMPORTANCE_WEIGHT_OVERRIDE_STATUS.AUTOMATIC }
  | { status: typeof IMPORTANCE_WEIGHT_OVERRIDE_STATUS.MANUAL; value: number };

export interface ImportanceWeightInput {
  stage_type: StageType;
  match_day: number;
  total_match_days: number;
  manual_override: ImportanceWeightOverride;
}

function is_final_round(match_day: number, total_match_days: number): boolean {
  return total_match_days > 0 && match_day >= total_match_days;
}

function is_late_season(match_day: number, total_match_days: number): boolean {
  return total_match_days > 0 && match_day >= total_match_days - 2;
}

function compute_round_robin_weight(
  match_day: number,
  total_match_days: number,
): ImportanceWeight {
  if (is_final_round(match_day, total_match_days)) return 3.0;
  if (is_late_season(match_day, total_match_days)) return 2.0;
  return 1.5;
}

const KNOWN_STAGE_TYPES: ReadonlySet<string> = new Set(
  Object.values(STAGE_TYPE),
);

const DEFAULT_IMPORTANCE_WEIGHT: ImportanceWeight = 1.0;

function compute_raw_importance_weight(
  stage_type: StageType,
  match_day: number,
  total_match_days: number,
): ImportanceWeight {
  if (!KNOWN_STAGE_TYPES.has(stage_type)) {
    console.warn("[ImportanceWeight] Unrecognised stage type", {
      event: "importance_weight_unknown_stage_type",
      stage_type,
    });
    return DEFAULT_IMPORTANCE_WEIGHT;
  }
  switch (stage_type) {
    case STAGE_TYPE.ONE_OFF_STAGE:
      return 3.0;
    case STAGE_TYPE.KNOCKOUT_STAGE:
      return is_final_round(match_day, total_match_days) ? 3.0 : 2.5;
    case STAGE_TYPE.GROUP_STAGE:
    case STAGE_TYPE.LEAGUE_STAGE:
      return compute_round_robin_weight(match_day, total_match_days);
    case STAGE_TYPE.CUSTOM:
      return DEFAULT_IMPORTANCE_WEIGHT;
  }
}

export function compute_importance_weight(
  input: ImportanceWeightInput,
): number {
  switch (input.manual_override.status) {
    case IMPORTANCE_WEIGHT_OVERRIDE_STATUS.MANUAL:
      return input.manual_override.value;
    case IMPORTANCE_WEIGHT_OVERRIDE_STATUS.AUTOMATIC:
      return compute_raw_importance_weight(
        input.stage_type,
        input.match_day,
        input.total_match_days,
      );
  }
}
