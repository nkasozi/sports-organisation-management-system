import type { GameOfficialRole } from "$lib/core/entities/GameOfficialRole";
import type { TeamStaffRole } from "$lib/core/entities/TeamStaffRole";
import type { Venue } from "$lib/core/entities/Venue";
import type { AppSettingsPort } from "$lib/core/interfaces/ports";
import type { ScalarValueInput } from "$lib/core/types/DomainScalars";
import { get_app_settings_storage } from "$lib/infrastructure/container";

import type { DataSource } from "../../infrastructure/sync/convexSeedingService";
import type { PositionIds } from "../../infrastructure/utils/seed/seedPlayerIds";
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

export type { PositionIds } from "../../infrastructure/utils/seed/seedPlayerIds";

export interface SeedVenueIds {
  dragon_stadium_id: ScalarValueInput<Venue["id"]>;
  thunder_arena_id: ScalarValueInput<Venue["id"]>;
  eagle_nest_id: ScalarValueInput<Venue["id"]>;
  storm_center_id: ScalarValueInput<Venue["id"]>;
  international_hockey_arena_id: ScalarValueInput<Venue["id"]>;
}

export interface SeedEntityIdLookups {
  position_ids: PositionIds;
  head_coach_role_id: ScalarValueInput<TeamStaffRole["id"]>;
  assistant_coach_role_id: ScalarValueInput<TeamStaffRole["id"]>;
  physio_role_id: ScalarValueInput<TeamStaffRole["id"]>;
  team_manager_role_id: ScalarValueInput<TeamStaffRole["id"]>;
  referee_role_id: ScalarValueInput<GameOfficialRole["id"]>;
  assistant_referee_role_id: ScalarValueInput<GameOfficialRole["id"]>;
  competition_format_ids: SeedCompetitionFormatIds;
}

export type { DataSource } from "../../infrastructure/sync/convexSeedingService";

const SEEDING_COMPLETE_KEY = "sports_org_seeding_complete_v16";

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

async function reset_seeding_flag(
  app_settings: AppSettingsPort = get_app_settings_storage(),
): Promise<boolean> {
  await app_settings.remove_setting(SEEDING_COMPLETE_KEY);
  return true;
}
