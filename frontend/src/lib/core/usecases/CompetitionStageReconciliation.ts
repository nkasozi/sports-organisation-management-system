import type {
  Competition,
  UpdateCompetitionInput,
} from "../entities/Competition";

export const STAGE_RECONCILIATION_KIND = {
  KEEP_FORMAT: "keep_format",
  REPLACE_FORMAT: "replace_format",
} as const;

export type StageReconciliationPlan =
  | {
      kind: typeof STAGE_RECONCILIATION_KIND.KEEP_FORMAT;
      competition_format_id: Competition["competition_format_id"];
    }
  | {
      kind: typeof STAGE_RECONCILIATION_KIND.REPLACE_FORMAT;
      competition_format_id: Competition["competition_format_id"];
    };

export function plan_stage_reconciliation(
  existing_competition: Competition,
  input: UpdateCompetitionInput,
): StageReconciliationPlan {
  const next_competition_format_id = (input.competition_format_id ??
    existing_competition.competition_format_id) as Competition["competition_format_id"];
  return next_competition_format_id ===
    existing_competition.competition_format_id
    ? {
        kind: STAGE_RECONCILIATION_KIND.KEEP_FORMAT,
        competition_format_id: next_competition_format_id,
      }
    : {
        kind: STAGE_RECONCILIATION_KIND.REPLACE_FORMAT,
        competition_format_id: next_competition_format_id,
      };
}
