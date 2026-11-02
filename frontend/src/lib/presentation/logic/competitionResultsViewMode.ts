import type { AppSettingsPort } from "$lib/core/interfaces/ports";
import type { Result } from "$lib/core/types/Result";

import {
  load_choice_preference,
  save_choice_preference,
} from "./choicePreference";

export const RESULTS_VIEW_MODE = {
  LIST: "list",
  BRACKET: "bracket",
} as const;

export type ResultsViewMode =
  (typeof RESULTS_VIEW_MODE)[keyof typeof RESULTS_VIEW_MODE];

export const RESULTS_VIEW_SURFACE = {
  STANDINGS: "standings",
  RESULTS: "results",
} as const;

export type ResultsViewSurface =
  (typeof RESULTS_VIEW_SURFACE)[keyof typeof RESULTS_VIEW_SURFACE];

const VIEW_MODE_SETTING_KEY_PREFIX = "competition_results_view_mode_";
const VIEW_MODE_CHOICES: readonly ResultsViewMode[] =
  Object.values(RESULTS_VIEW_MODE);

interface LoadViewModeCommand {
  storage: AppSettingsPort;
  surface: ResultsViewSurface;
}

interface SaveViewModeCommand extends LoadViewModeCommand {
  view_mode: ResultsViewMode;
}

function build_view_mode_setting_key(surface: ResultsViewSurface): string {
  return `${VIEW_MODE_SETTING_KEY_PREFIX}${surface}`;
}

export function load_results_view_mode(
  command: LoadViewModeCommand,
): Promise<Result<ResultsViewMode>> {
  return load_choice_preference({
    storage: command.storage,
    setting_key: build_view_mode_setting_key(command.surface),
    allowed_choices: VIEW_MODE_CHOICES,
    default_choice: RESULTS_VIEW_MODE.LIST,
  });
}

export function save_results_view_mode(
  command: SaveViewModeCommand,
): Promise<Result<ResultsViewMode>> {
  return save_choice_preference({
    storage: command.storage,
    setting_key: build_view_mode_setting_key(command.surface),
    choice: command.view_mode,
  });
}
