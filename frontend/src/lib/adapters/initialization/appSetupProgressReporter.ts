import { get_app_settings_storage } from "$lib/infrastructure/container";
import { first_time_setup_store } from "$lib/presentation/stores/firstTimeSetup";

import type { ProgressCallback } from "../../infrastructure/sync/convexSeedingService";
import {
  FIRST_TIME_DETECTION_SETTING_KEY,
  FIRST_TIME_ERROR_DISPLAY_DELAY_MS,
  FIRST_TIME_FINAL_DELAY_MS,
  FIRST_TIME_STEP_DELAY_MS,
  SETTING_TRUE_VALUE,
} from "./initializationConstants";
import {
  INITIALIZATION_PROGRESS_MESSAGE,
  INITIALIZATION_PROGRESS_PERCENT,
} from "./initializationMessages";

const SETUP_PROGRESS_MODE = {
  FIRST_TIME: "first_time",
  SILENT: "silent",
} as const;

export type SetupProgressReporter =
  | { mode: typeof SETUP_PROGRESS_MODE.FIRST_TIME }
  | { mode: typeof SETUP_PROGRESS_MODE.SILENT };

export function create_setup_progress_reporter(
  is_first_time: boolean,
): SetupProgressReporter {
  return is_first_time
    ? { mode: SETUP_PROGRESS_MODE.FIRST_TIME }
    : { mode: SETUP_PROGRESS_MODE.SILENT };
}

async function delay(milliseconds: number): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, milliseconds));
  return true;
}

async function mark_app_initialized(): Promise<boolean> {
  await get_app_settings_storage().set_setting(
    FIRST_TIME_DETECTION_SETTING_KEY,
    SETTING_TRUE_VALUE,
  );
  return true;
}

export async function report_setup_step(
  reporter: SetupProgressReporter,
  message: string,
  percentage: number,
  delay_ms: number,
): Promise<boolean> {
  switch (reporter.mode) {
    case SETUP_PROGRESS_MODE.SILENT:
      return false;
    case SETUP_PROGRESS_MODE.FIRST_TIME:
      first_time_setup_store.update_progress(message, percentage);
      return delay(delay_ms);
  }
}

export function create_progress_callback(
  reporter: SetupProgressReporter,
): ProgressCallback {
  switch (reporter.mode) {
    case SETUP_PROGRESS_MODE.SILENT:
      return (): void => {};
    case SETUP_PROGRESS_MODE.FIRST_TIME:
      return (message: string, percentage: number): void =>
        first_time_setup_store.update_progress(message, percentage);
  }
}

export async function complete_setup(
  reporter: SetupProgressReporter,
  final_delay_ms: number,
): Promise<boolean> {
  switch (reporter.mode) {
    case SETUP_PROGRESS_MODE.SILENT:
      return false;
    case SETUP_PROGRESS_MODE.FIRST_TIME:
      await mark_app_initialized();
      first_time_setup_store.complete_setup();
      return delay(final_delay_ms);
  }
}

export async function finalize_setup(
  reporter: SetupProgressReporter,
): Promise<boolean> {
  await report_setup_step(
    reporter,
    INITIALIZATION_PROGRESS_MESSAGE.FINALIZING_SETUP,
    INITIALIZATION_PROGRESS_PERCENT.FINALIZING,
    FIRST_TIME_STEP_DELAY_MS,
  );
  return complete_setup(reporter, FIRST_TIME_FINAL_DELAY_MS);
}

export async function show_setup_error(
  reporter: SetupProgressReporter,
  error_message: string,
): Promise<boolean> {
  return report_setup_step(
    reporter,
    error_message,
    INITIALIZATION_PROGRESS_PERCENT.ERROR,
    FIRST_TIME_ERROR_DISPLAY_DELAY_MS,
  );
}

export function close_setup_without_initializing(
  reporter: SetupProgressReporter,
): boolean {
  switch (reporter.mode) {
    case SETUP_PROGRESS_MODE.SILENT:
      return false;
    case SETUP_PROGRESS_MODE.FIRST_TIME:
      first_time_setup_store.complete_setup();
      return true;
  }
}
