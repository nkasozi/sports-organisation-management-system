import type { AppSettingsPort } from "$lib/core/interfaces/ports";
import { get_app_settings_storage } from "$lib/infrastructure/container";

import type { DataSource } from "../../infrastructure/sync/convexSeedingService";
import type { SeedCompetitionFormatIds } from "../../infrastructure/utils/SeedDataGenerator";

export type SeedingStrategy =
  | "skip_seeding"
  | "convex_first_with_local_fallback"
  | "convex_mandatory"
  | "local_only";

export type SeedOutcome =
  | "skipped"
  | "convex_success"
  | "local_fallback_success"
  | "offline_mode"
  | "convex_required_but_unavailable"
  | "failed";

export interface SeedResult {
  success: boolean;
  data_source: DataSource;
  outcome: SeedOutcome;
  error_message: string;
}

export interface PositionIds {
  gk: string;
  sw: string;
  cb: string;
  lb: string;
  rb: string;
  cdm: string;
  cm: string;
  lm: string;
  rm: string;
  lw: string;
  rw: string;
  cf: string;
}

export interface SeedVenueIds {
  dragon_stadium_id: string;
  thunder_arena_id: string;
  eagle_nest_id: string;
  storm_center_id: string;
  international_hockey_arena_id: string;
}

export interface SeedEntityIdLookups {
  position_ids: PositionIds;
  head_coach_role_id: string;
  assistant_coach_role_id: string;
  physio_role_id: string;
  team_manager_role_id: string;
  referee_role_id: string;
  assistant_referee_role_id: string;
  competition_format_ids: SeedCompetitionFormatIds;
}

export type { DataSource } from "../../infrastructure/sync/convexSeedingService";

export const SEEDING_COMPLETE_KEY = "sports_org_seeding_complete_v16";

export async function is_seeding_already_complete(
  app_settings: AppSettingsPort = get_app_settings_storage(),
): Promise<boolean> {
  return (await app_settings.get_setting(SEEDING_COMPLETE_KEY)) === "true";
}

export async function mark_seeding_complete(
  app_settings: AppSettingsPort = get_app_settings_storage(),
): Promise<boolean> {
  await app_settings.set_setting(SEEDING_COMPLETE_KEY, "true");
  return true;
}

export async function reset_seeding_flag(
  app_settings: AppSettingsPort = get_app_settings_storage(),
): Promise<boolean> {
  await app_settings.remove_setting(SEEDING_COMPLETE_KEY);
  return true;
}
