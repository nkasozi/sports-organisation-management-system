import { DATA_SOURCE, SEED_OUTCOME } from "./initializationConstants";
import type { SeedResult } from "./seedingTypes";

const NO_ERROR_MESSAGE = "";

export function create_skipped_seed_result(): SeedResult {
  return {
    outcome: SEED_OUTCOME.SKIPPED,
    success: true,
    data_source: DATA_SOURCE.NONE,
    error_message: NO_ERROR_MESSAGE,
  };
}

export function create_convex_success_seed_result(): SeedResult {
  return {
    outcome: SEED_OUTCOME.CONVEX_SUCCESS,
    success: true,
    data_source: DATA_SOURCE.CONVEX,
    error_message: NO_ERROR_MESSAGE,
  };
}

export function create_local_success_seed_result(): SeedResult {
  return {
    outcome: SEED_OUTCOME.LOCAL_FALLBACK_SUCCESS,
    success: true,
    data_source: DATA_SOURCE.LOCAL,
    error_message: NO_ERROR_MESSAGE,
  };
}

export function create_offline_mode_seed_result(
  error_message: string,
): SeedResult {
  return {
    outcome: SEED_OUTCOME.OFFLINE_MODE,
    success: true,
    data_source: DATA_SOURCE.LOCAL,
    error_message,
  };
}

export function create_convex_required_seed_result(
  error_message: string,
): SeedResult {
  return {
    outcome: SEED_OUTCOME.CONVEX_REQUIRED_BUT_UNAVAILABLE,
    success: false,
    data_source: DATA_SOURCE.NONE,
    error_message,
  };
}

export function create_failed_seed_result(error_message: string): SeedResult {
  return {
    outcome: SEED_OUTCOME.FAILED,
    success: false,
    data_source: DATA_SOURCE.NONE,
    error_message,
  };
}
