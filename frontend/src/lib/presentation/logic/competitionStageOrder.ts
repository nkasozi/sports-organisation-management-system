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

const STAGE_ORDER_SETTING_KEY = "competition_results_stage_order";
const STAGE_ORDER_CHOICES: readonly StageOrder[] = Object.values(STAGE_ORDER);

interface LoadStageOrderCommand {
  storage: AppSettingsPort;
}

interface SaveStageOrderCommand {
  storage: AppSettingsPort;
  stage_order: StageOrder;
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
    setting_key: STAGE_ORDER_SETTING_KEY,
    allowed_choices: STAGE_ORDER_CHOICES,
    default_choice: STAGE_ORDER.ASCENDING,
  });
}

export function save_stage_order_preference(
  command: SaveStageOrderCommand,
): Promise<Result<StageOrder>> {
  return save_choice_preference({
    storage: command.storage,
    setting_key: STAGE_ORDER_SETTING_KEY,
    choice: command.stage_order,
  });
}
