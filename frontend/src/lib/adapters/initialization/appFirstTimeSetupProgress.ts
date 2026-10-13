import { get_app_settings_storage } from "$lib/infrastructure/container";
import { first_time_setup_store } from "$lib/presentation/stores/firstTimeSetup";

const FIRST_TIME_DETECTION_KEY = "sports_org_app_initialized";
const FIRST_TIME_DETECTION_COMPLETE_VALUE = "true";
const SETUP_START_DELAY_MS = 500;
const SETUP_STEP_DELAY_MS = 300;

export const FIRST_TIME_SETUP_STEP = {
  AUDIT_SYSTEM: "audit_system",
  DATA_REPOSITORIES: "data_repositories",
} as const;

type FirstTimeSetupStep =
  (typeof FIRST_TIME_SETUP_STEP)[keyof typeof FIRST_TIME_SETUP_STEP];

const AUDIT_SYSTEM_PROGRESS = {
  message: "Initializing audit system...",
  percentage: 10,
} as const;

const DATA_REPOSITORIES_PROGRESS = {
  message: "Setting up data repositories...",
  percentage: 20,
} as const;

function delay(milliseconds: number): Promise<boolean> {
  return new Promise((resolve) =>
    setTimeout(() => resolve(true), milliseconds),
  );
}

export async function is_first_time_use(): Promise<boolean> {
  const stored_value = await get_app_settings_storage().get_setting(
    FIRST_TIME_DETECTION_KEY,
  );
  return stored_value !== FIRST_TIME_DETECTION_COMPLETE_VALUE;
}

async function announce_audit_system_step(): Promise<boolean> {
  first_time_setup_store.set_first_time(true);
  first_time_setup_store.start_setup();
  await delay(SETUP_START_DELAY_MS);
  first_time_setup_store.update_progress(
    AUDIT_SYSTEM_PROGRESS.message,
    AUDIT_SYSTEM_PROGRESS.percentage,
  );
  return delay(SETUP_STEP_DELAY_MS);
}

async function announce_data_repositories_step(): Promise<boolean> {
  first_time_setup_store.update_progress(
    DATA_REPOSITORIES_PROGRESS.message,
    DATA_REPOSITORIES_PROGRESS.percentage,
  );
  return delay(SETUP_STEP_DELAY_MS);
}

export async function announce_first_time_setup_step(
  is_first_time: boolean,
  step: FirstTimeSetupStep,
): Promise<boolean> {
  if (!is_first_time) return false;
  switch (step) {
    case FIRST_TIME_SETUP_STEP.AUDIT_SYSTEM:
      return announce_audit_system_step();
    case FIRST_TIME_SETUP_STEP.DATA_REPOSITORIES:
      return announce_data_repositories_step();
  }
}
