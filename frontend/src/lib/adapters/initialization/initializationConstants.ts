import type { DataSource } from "../../infrastructure/sync/convexSeedingService";

export const SEEDING_STRATEGY = {
  SKIP_SEEDING: "skip_seeding",
  CONVEX_FIRST_WITH_LOCAL_FALLBACK: "convex_first_with_local_fallback",
  CONVEX_MANDATORY: "convex_mandatory",
  LOCAL_ONLY: "local_only",
} as const;

export type SeedingStrategy =
  (typeof SEEDING_STRATEGY)[keyof typeof SEEDING_STRATEGY];

export const SEED_OUTCOME = {
  SKIPPED: "skipped",
  CONVEX_SUCCESS: "convex_success",
  LOCAL_FALLBACK_SUCCESS: "local_fallback_success",
  OFFLINE_MODE: "offline_mode",
  CONVEX_REQUIRED_BUT_UNAVAILABLE: "convex_required_but_unavailable",
  FAILED: "failed",
} as const;

export type SeedOutcome = (typeof SEED_OUTCOME)[keyof typeof SEED_OUTCOME];

export const DATA_SOURCE = {
  CONVEX: "convex",
  LOCAL: "local",
  NONE: "none",
} as const satisfies Record<string, DataSource>;

export const APP_INIT_RESULT = {
  SUCCESS: "success",
  REDIRECT_TO_LOGIN: "redirect_to_login",
} as const;

export type AppInitResult =
  (typeof APP_INIT_RESULT)[keyof typeof APP_INIT_RESULT];

export const CLERK_USER_STATE_STATUS = {
  PRESENT: "present",
  MISSING: "missing",
} as const;

export const SEEDING_COMPLETION_STATE = {
  COMPLETE: "complete",
  NOT_COMPLETE: "not_complete",
  UNREADABLE: "unreadable",
} as const;

export type SeedingCompletionState =
  (typeof SEEDING_COMPLETION_STATE)[keyof typeof SEEDING_COMPLETION_STATE];

export const BRANDING_PROFILE_STATUS = {
  MISSING: "missing",
  PRESENT: "present",
} as const;

const UNDEFINED_TYPE_NAME = "undefined";
export const SETTING_TRUE_VALUE = "true";
export const SEEDING_COMPLETE_SETTING_KEY = "sports_org_seeding_complete_v16";
export const FIRST_TIME_DETECTION_SETTING_KEY = "sports_org_app_initialized";
export const SEED_LOOKUP_PAGE_SIZE = 100;
export const FIRST_TIME_STEP_DELAY_MS = 400;
export const FIRST_TIME_FINAL_DELAY_MS = 600;
export const FIRST_TIME_CONNECT_DELAY_MS = 300;
export const FIRST_TIME_PUBLIC_VIEW_DELAY_MS = 200;
export const FIRST_TIME_PUBLIC_VIEW_FINAL_DELAY_MS = 400;
export const FIRST_TIME_ERROR_DISPLAY_DELAY_MS = 1500;

export function is_browser_environment(): boolean {
  return typeof window !== UNDEFINED_TYPE_NAME;
}

export function create_seeding_run_id(): string {
  return crypto.randomUUID();
}
