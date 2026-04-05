import { get_app_settings_storage } from "$lib/infrastructure/container";
import {
  seed_from_convex_or_local,
  type SeedingStrategy,
  type SeedResult,
} from "./seedingService";
import { first_time_setup_store } from "$lib/presentation/stores/firstTimeSetup";
import { app_status_store } from "$lib/presentation/stores/appStatus";

type InitResult = "success" | "redirect_to_login";
const FIRST_TIME_DETECTION_KEY = "sports_org_app_initialized";

async function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function mark_app_initialized(): Promise<void> {
  await get_app_settings_storage().set_setting(
    FIRST_TIME_DETECTION_KEY,
    "true",
  );
}

async function finalize_first_time_setup(): Promise<void> {
  first_time_setup_store.update_progress("Finalizing setup...", 95);
  await delay(400);
  await mark_app_initialized();
  first_time_setup_store.complete_setup();
  await delay(600);
}

async function handle_seed_result(
  seed_result: SeedResult,
  is_first_time: boolean,
): Promise<InitResult> {
  switch (seed_result.outcome) {
    case "convex_success": {
      app_status_store.set_online();
      if (is_first_time) {
        first_time_setup_store.update_progress("Data loaded from server", 90);
        await delay(400);
        await finalize_first_time_setup();
      }
      return "success";
    }
    case "local_fallback_success": {
      app_status_store.set_online();
      if (is_first_time) {
        first_time_setup_store.update_progress(
          "Demo data loaded (offline mode)",
          90,
        );
        await delay(400);
        await finalize_first_time_setup();
      }
      return "success";
    }
    case "offline_mode": {
      app_status_store.set_offline(seed_result.error_message);
      console.warn(
        `[AppInitializer] Offline mode: ${seed_result.error_message}`,
      );
      if (is_first_time) {
        await finalize_first_time_setup();
      }
      return "success";
    }
    case "convex_required_but_unavailable": {
      console.error(
        `[AppInitializer] Cannot proceed: ${seed_result.error_message}`,
      );
      if (is_first_time) {
        first_time_setup_store.update_progress(seed_result.error_message, 0);
        await delay(1500);
        first_time_setup_store.complete_setup();
      }
      return "redirect_to_login";
    }
    case "skipped": {
      return "success";
    }
    default: {
      console.error(
        `[AppInitializer] Seeding failed: ${seed_result.error_message}`,
      );
      if (is_first_time) {
        await finalize_first_time_setup();
      }
      return "success";
    }
  }
}

export async function run_seeding_with_strategy(
  strategy: SeedingStrategy,
  is_first_time: boolean,
): Promise<InitResult> {
  if (strategy === "skip_seeding") {
    console.log("[AppInitializer] Public viewer — skipping seeding");
    if (is_first_time) {
      first_time_setup_store.update_progress("Preparing public view...", 90);
      await delay(200);
      await mark_app_initialized();
      first_time_setup_store.complete_setup();
      await delay(400);
    }
    return "success";
  }
  if (strategy === "local_only") {
    console.log("[AppInitializer] Anonymous user — seeding locally only");
    if (is_first_time) {
      first_time_setup_store.update_progress("Loading offline data...", 30);
      await delay(300);
    }
    const progress_callback = is_first_time
      ? (message: string, percentage: number) =>
          first_time_setup_store.update_progress(message, percentage)
      : (_message: string, _percentage: number) => {};
    const seed_result = await seed_from_convex_or_local(
      progress_callback,
      "local_only",
    );
    return handle_seed_result(seed_result, is_first_time);
  }
  if (is_first_time) {
    const connecting_message =
      strategy === "convex_mandatory"
        ? "Pulling data from server..."
        : "Checking server for existing data...";
    first_time_setup_store.update_progress(connecting_message, 30);
    await delay(300);
  }
  const progress_callback = is_first_time
    ? (message: string, percentage: number) =>
        first_time_setup_store.update_progress(message, percentage)
    : (_message: string, _percentage: number) => {};
  const seed_result = await seed_from_convex_or_local(
    progress_callback,
    strategy,
  );
  return handle_seed_result(seed_result, is_first_time);
}
