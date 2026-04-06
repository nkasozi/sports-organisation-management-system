import type { StageType } from "../entities/CompetitionStage";

export type ImportanceWeight = 1.0 | 1.5 | 2.0 | 2.5 | 3.0;

export interface ImportanceWeightInput {
  stage_type: StageType;
  match_day: number;
  total_match_days: number;
  manual_override: number | null;
}

function is_final_round(match_day: number, total_match_days: number): boolean {
  return total_match_days > 0 && match_day >= total_match_days;
}

function is_late_season(match_day: number, total_match_days: number): boolean {
  return total_match_days > 0 && match_day >= total_match_days - 2;
}

function compute_raw_importance_weight(
  stage_type: StageType,
  match_day: number,
  total_match_days: number,
): number {
  if (stage_type === "one_off_stage") return 3.0;

  if (
    stage_type === "knockout_stage" &&
    is_final_round(match_day, total_match_days)
  )
    return 3.0;
  if (stage_type === "knockout_stage") return 2.5;

  const is_group_or_league =
    stage_type === "group_stage" || stage_type === "league_stage";
  if (is_group_or_league && is_final_round(match_day, total_match_days))
    return 3.0;
  if (is_group_or_league && is_late_season(match_day, total_match_days))
    return 2.0;
  if (is_group_or_league) return 1.5;

  return 1.0;
}

export function compute_importance_weight(
  input: ImportanceWeightInput,
): number {
  if (input.manual_override !== null && input.manual_override !== undefined) {
    return input.manual_override;
  }
  return compute_raw_importance_weight(
    input.stage_type,
    input.match_day,
    input.total_match_days,
  );
}
