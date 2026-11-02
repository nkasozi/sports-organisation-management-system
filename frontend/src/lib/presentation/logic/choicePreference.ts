import type { AppSettingsPort } from "$lib/core/interfaces/ports";
import {
  create_failure_result,
  create_success_result,
  type Result,
} from "$lib/core/types/Result";

const CHOICE_PREFERENCE_EVENTS = {
  LOAD_FAILED: "choice_preference_load_failed",
  SAVE_FAILED: "choice_preference_save_failed",
  SAVED: "choice_preference_saved",
} as const;

interface LoadChoicePreferenceCommand<TChoice extends string> {
  storage: AppSettingsPort;
  setting_key: string;
  allowed_choices: readonly TChoice[];
  default_choice: TChoice;
}

interface SaveChoicePreferenceCommand<TChoice extends string> {
  storage: AppSettingsPort;
  setting_key: string;
  choice: TChoice;
}

function is_allowed_choice<TChoice extends string>(
  value: string,
  allowed_choices: readonly TChoice[],
): value is TChoice {
  return (allowed_choices as readonly string[]).includes(value);
}

export async function load_choice_preference<TChoice extends string>(
  command: LoadChoicePreferenceCommand<TChoice>,
): Promise<Result<TChoice>> {
  try {
    const stored_value = await command.storage.get_setting(command.setting_key);
    return create_success_result(
      is_allowed_choice(stored_value, command.allowed_choices)
        ? stored_value
        : command.default_choice,
    );
  } catch (error) {
    console.error("[ChoicePreference] Failed to load preference", {
      event: CHOICE_PREFERENCE_EVENTS.LOAD_FAILED,
      setting_key: command.setting_key,
      error: String(error),
    });
    return create_failure_result(String(error));
  }
}

export async function save_choice_preference<TChoice extends string>(
  command: SaveChoicePreferenceCommand<TChoice>,
): Promise<Result<TChoice>> {
  try {
    await command.storage.set_setting(command.setting_key, command.choice);
    console.log("[ChoicePreference] Saved preference", {
      event: CHOICE_PREFERENCE_EVENTS.SAVED,
      setting_key: command.setting_key,
      choice: command.choice,
    });
    return create_success_result(command.choice);
  } catch (error) {
    console.error("[ChoicePreference] Failed to save preference", {
      event: CHOICE_PREFERENCE_EVENTS.SAVE_FAILED,
      setting_key: command.setting_key,
      error: String(error),
    });
    return create_failure_result(String(error));
  }
}
