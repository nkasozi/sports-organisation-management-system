import type { OvertimeRule } from "$lib/core/entities/SportTypes";
import { SPORT_FORM_SECTIONS } from "$lib/presentation/logic/sportFormEditorConstants";

export type SportFormSectionId = (typeof SPORT_FORM_SECTIONS)[number]["id"];

export const SPORT_FORM_SECTION = {
  BASIC: "basic",
  PERIODS: "periods",
  CARDS: "cards",
  FOULS: "fouls",
  OFFICIALS: "officials",
  SCORING: "scoring",
  OVERTIME: "overtime",
  SUBSTITUTIONS: "substitutions",
} as const satisfies Record<string, SportFormSectionId>;

type SportOvertimeType = OvertimeRule["overtime_type"];

export const SPORT_OVERTIME_TYPE = {
  EXTRA_TIME: "extra_time",
  GOLDEN_GOAL: "golden_goal",
  SILVER_GOAL: "silver_goal",
  PENALTIES: "penalties",
  REPLAY: "replay",
  SHOOTOUT: "shootout",
} as const satisfies Record<string, SportOvertimeType>;

export function is_penalty_based_overtime(overtime_type: string): boolean {
  return (
    overtime_type === SPORT_OVERTIME_TYPE.PENALTIES ||
    overtime_type === SPORT_OVERTIME_TYPE.SHOOTOUT
  );
}

const UNLIMITED_SUBSTITUTION_LIMIT = -1;

export const SPORT_SUBSTITUTION_LIMIT_TEXT = {
  UNLIMITED_EXPLANATION: "-1 means unlimited",
  CURRENTLY_UNLIMITED: "Currently unlimited (-1 means unlimited)",
} as const;

export function build_substitution_limit_hint(
  limit_value: number | string,
): string {
  return Number(limit_value) === UNLIMITED_SUBSTITUTION_LIMIT
    ? SPORT_SUBSTITUTION_LIMIT_TEXT.CURRENTLY_UNLIMITED
    : SPORT_SUBSTITUTION_LIMIT_TEXT.UNLIMITED_EXPLANATION;
}
