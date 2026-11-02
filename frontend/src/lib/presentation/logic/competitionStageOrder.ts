import type { AppSettingsPort } from "$lib/core/interfaces/ports";
import type { Result } from "$lib/core/types/Result";

import {
  load_choice_preference,
  save_choice_preference,
} from "./choicePreference";
import type { CompetitionStageResultsSection } from "./competitionStageResults";

export const STAGE_ORDER = {
  ASCENDING: "asc",
  DESCENDING: "desc",
} as const;

export type StageOrder = (typeof STAGE_ORDER)[keyof typeof STAGE_ORDER];

export const ORDER_PREFERENCE = {
  STANDINGS_STAGES: "standings_stages",
  RESULTS_KICKOFF: "results_kickoff",
} as const;

export type OrderPreference =
  (typeof ORDER_PREFERENCE)[keyof typeof ORDER_PREFERENCE];

const ORDER_PREFERENCE_SETTINGS: Readonly<
  Record<OrderPreference, { setting_key: string; default_order: StageOrder }>
> = {
  [ORDER_PREFERENCE.STANDINGS_STAGES]: {
    setting_key: "competition_results_stage_order",
    default_order: STAGE_ORDER.ASCENDING,
  },
  [ORDER_PREFERENCE.RESULTS_KICKOFF]: {
    setting_key: "competition_results_kickoff_order",
    default_order: STAGE_ORDER.DESCENDING,
  },
};

const STAGE_ORDER_CHOICES: readonly StageOrder[] = Object.values(STAGE_ORDER);

interface LoadStageOrderCommand {
  storage: AppSettingsPort;
  preference: OrderPreference;
}

interface SaveStageOrderCommand extends LoadStageOrderCommand {
  stage_order: StageOrder;
}

export function get_default_order(preference: OrderPreference): StageOrder {
  return ORDER_PREFERENCE_SETTINGS[preference].default_order;
}

export function toggle_stage_order(stage_order: StageOrder): StageOrder {
  return stage_order === STAGE_ORDER.ASCENDING
    ? STAGE_ORDER.DESCENDING
    : STAGE_ORDER.ASCENDING;
}

export function order_stage_results_sections(
  sections: CompetitionStageResultsSection[],
  stage_order: StageOrder,
): CompetitionStageResultsSection[] {
  return stage_order === STAGE_ORDER.DESCENDING
    ? [...sections].reverse()
    : sections;
}

export function load_stage_order_preference(
  command: LoadStageOrderCommand,
): Promise<Result<StageOrder>> {
  return load_choice_preference({
    storage: command.storage,
    setting_key: ORDER_PREFERENCE_SETTINGS[command.preference].setting_key,
    allowed_choices: STAGE_ORDER_CHOICES,
    default_choice: get_default_order(command.preference),
  });
}

export function save_stage_order_preference(
  command: SaveStageOrderCommand,
): Promise<Result<StageOrder>> {
  return save_choice_preference({
    storage: command.storage,
    setting_key: ORDER_PREFERENCE_SETTINGS[command.preference].setting_key,
    choice: command.stage_order,
  });
}
