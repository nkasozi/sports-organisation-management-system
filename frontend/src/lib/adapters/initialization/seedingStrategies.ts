import {
  type ProgressCallback,
  try_seed_all_tables_from_convex,
} from "../../infrastructure/sync/convexSeedingService";
import { seed_all_data_if_needed } from "./seedingService";
import {
  is_seeding_already_complete,
  mark_seeding_complete,
  type SeedResult,
} from "./seedingTypes";
import { load_and_set_current_user } from "./seedingUserSetup";

export function handle_skip_seeding(): SeedResult {
  console.log("[Seeding] Skip strategy — public viewer, no seeding needed");
  return {
    success: true,
    data_source: "none",
    outcome: "skipped",
    error_message: "",
  };
}

export async function handle_local_only_seeding(
  on_progress: ProgressCallback,
): Promise<SeedResult> {
  on_progress("Loading offline data...", 20);
  const local_seed_result = await seed_all_data_if_needed();

  if (!local_seed_result.success) {
    console.error("[Seeding] Local-only seeding failed", {
      event: "local_only_seeding_failed",
      error: local_seed_result.error,
    });
    return {
      success: false,
      data_source: "none",
      outcome: "failed",
      error_message: local_seed_result.error,
    };
  }

  on_progress("Offline data ready", 90);
  console.log("[Seeding] Local-only seeding completed", {
    event: "local_only_seeding_completed",
  });
  return {
    success: true,
    data_source: "local",
    outcome: "local_fallback_success",
    error_message: "",
  };
}

export async function handle_convex_with_local_fallback(
  on_progress: ProgressCallback,
): Promise<SeedResult> {
  if (await is_seeding_already_complete()) {
    const current_user_result = await load_and_set_current_user();
    if (!current_user_result.success) {
      console.warn(
        `[Seeding] Could not resolve current user: ${current_user_result.error}`,
      );
    }
    return {
      success: true,
      data_source: "local",
      outcome: "local_fallback_success",
      error_message: "",
    };
  }

  if (typeof window === "undefined") {
    return {
      success: false,
      data_source: "none",
      outcome: "failed",
      error_message: "Not in browser environment",
    };
  }

  on_progress("Connecting to server...", 15);
  const convex_result = await try_seed_all_tables_from_convex(on_progress);

  if (convex_result.success) {
    return handle_convex_success(on_progress, convex_result);
  }

  console.log("[Seeding] Convex unavailable, falling back to local demo data");
  on_progress("Server unavailable, loading demo data...", 40);
  const local_seed_result = await seed_all_data_if_needed();
  const local_success = local_seed_result.success;

  return {
    success: local_success,
    data_source: local_success ? "local" : "none",
    outcome: local_success ? "local_fallback_success" : "failed",
    error_message: local_success ? "" : "Both Convex and local seeding failed",
  };
}

export async function handle_convex_mandatory(
  on_progress: ProgressCallback,
): Promise<SeedResult> {
  const seeding_already_done = await is_seeding_already_complete();

  if (typeof window === "undefined") {
    return {
      success: false,
      data_source: "none",
      outcome: "failed",
      error_message: "Not in browser environment",
    };
  }

  on_progress("Pulling data from server...", 15);
  const convex_result = await try_seed_all_tables_from_convex(on_progress);

  if (convex_result.success) {
    return handle_convex_success(on_progress, convex_result);
  }

  if (seeding_already_done) {
    console.log(
      "[Seeding] Convex unavailable but local data exists — entering offline mode",
    );
    const current_user_result = await load_and_set_current_user();
    if (!current_user_result.success) {
      console.warn(
        `[Seeding] Could not resolve current user: ${current_user_result.error}`,
      );
    }
    return {
      success: true,
      data_source: "local",
      outcome: "offline_mode",
      error_message:
        "Unable to fetch the latest data from the server. Using previously saved data.",
    };
  }

  console.error(
    "[Seeding] Convex unavailable and no local data — cannot proceed",
  );
  return {
    success: false,
    data_source: "none",
    outcome: "convex_required_but_unavailable",
    error_message:
      "Unable to connect to the server to load your data. Please check your internet connection and try again.",
  };
}

async function handle_convex_success(
  on_progress: ProgressCallback,
  convex_result: { total_records: number; tables_fetched: number },
): Promise<SeedResult> {
  on_progress("Server data loaded successfully", 85);
  console.log(
    `[Seeding] Convex seeding succeeded: ${convex_result.total_records} records from ${convex_result.tables_fetched} tables`,
  );
  const current_user_result = await load_and_set_current_user();
  if (!current_user_result.success) {
    console.warn(
      `[Seeding] Could not resolve current user: ${current_user_result.error}`,
    );
  }
  await mark_seeding_complete();
  return {
    success: true,
    data_source: "convex",
    outcome: "convex_success",
    error_message: "",
  };
}
