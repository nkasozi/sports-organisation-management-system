import type { GameEventLogType } from "$lib/core/entities/GameEventLogTypes";

const SCORING_EVENT_CLASS =
  "border-l-green-500 bg-green-50 dark:bg-green-900/20";
const BLUE_EVENT_CLASS = "border-l-blue-500 bg-blue-50 dark:bg-blue-900/20";
const CAUTION_EVENT_CLASS =
  "border-l-yellow-400 bg-yellow-50 dark:bg-yellow-900/20";
const DISMISSAL_EVENT_CLASS = "border-l-red-500 bg-red-50 dark:bg-red-900/20";
const PERIOD_EVENT_CLASS =
  "border-l-purple-500 bg-purple-50 dark:bg-purple-900/20";
export const NEUTRAL_EVENT_CLASS =
  "border-l-gray-300 bg-gray-50 dark:bg-accent-800";

export const GAME_EVENT_BACKGROUND_CLASS_BY_TYPE: Readonly<
  Record<GameEventLogType, string>
> = {
  goal: SCORING_EVENT_CLASS,
  penalty_scored: SCORING_EVENT_CLASS,
  own_goal: BLUE_EVENT_CLASS,
  substitution: BLUE_EVENT_CLASS,
  yellow_card: CAUTION_EVENT_CLASS,
  red_card: DISMISSAL_EVENT_CLASS,
  second_yellow: DISMISSAL_EVENT_CLASS,
  period_start: PERIOD_EVENT_CLASS,
  period_end: PERIOD_EVENT_CLASS,
  penalty_missed: NEUTRAL_EVENT_CLASS,
  green_card: NEUTRAL_EVENT_CLASS,
  foul: NEUTRAL_EVENT_CLASS,
  offside: NEUTRAL_EVENT_CLASS,
  corner: NEUTRAL_EVENT_CLASS,
  free_kick: NEUTRAL_EVENT_CLASS,
  injury: NEUTRAL_EVENT_CLASS,
  var_review: NEUTRAL_EVENT_CLASS,
};
