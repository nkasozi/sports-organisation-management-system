import type { GameOfficialRole } from "$lib/core/entities/GameOfficialRole";
import type { TeamStaffRole } from "$lib/core/entities/TeamStaffRole";
import type { Venue } from "$lib/core/entities/Venue";
import type { AppSettingsPort } from "$lib/core/interfaces/ports";
import type { ScalarValueInput } from "$lib/core/types/DomainScalars";
import {
  type AsyncResult,
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";
import { get_app_settings_storage } from "$lib/infrastructure/container";

import type { DataSource } from "../../infrastructure/sync/convexSeedingService";
import type { PositionIds } from "../../infrastructure/utils/seed/seedPlayerIds";
import type { SeedCompetitionFormatIds } from "../../infrastructure/utils/SeedDataGenerator";
import {
  type DATA_SOURCE,
  type SEED_OUTCOME,
  SEEDING_COMPLETE_SETTING_KEY,
  SEEDING_COMPLETION_STATE,
  type SeedingCompletionState,
  type SeedOutcome,
  SETTING_TRUE_VALUE,
} from "./initializationConstants";
import {
  INITIALIZATION_ERROR_CODE,
  INITIALIZATION_EVENT,
} from "./initializationEvents";

const SEEDING_STATE_SAVE_FAILED_MESSAGE =
  "We could not finish setting up demo data. Please reload and try again.";

export type { SeedingStrategy } from "./initializationConstants";

interface SeedResultShape<
  TOutcome extends SeedOutcome,
  TSuccess extends boolean,
  TSource extends DataSource,
> {
  outcome: TOutcome;
  success: TSuccess;
  data_source: TSource;
  error_message: string;
}

export type SeedResult =
  | SeedResultShape<typeof SEED_OUTCOME.SKIPPED, true, typeof DATA_SOURCE.NONE>
  | SeedResultShape<
      typeof SEED_OUTCOME.CONVEX_SUCCESS,
      true,
      typeof DATA_SOURCE.CONVEX
    >
  | SeedResultShape<
      typeof SEED_OUTCOME.LOCAL_FALLBACK_SUCCESS,
      true,
      typeof DATA_SOURCE.LOCAL
    >
  | SeedResultShape<
      typeof SEED_OUTCOME.OFFLINE_MODE,
      true,
      typeof DATA_SOURCE.LOCAL
    >
  | SeedResultShape<
      typeof SEED_OUTCOME.CONVEX_REQUIRED_BUT_UNAVAILABLE,
      false,
      typeof DATA_SOURCE.NONE
    >
  | SeedResultShape<typeof SEED_OUTCOME.FAILED, false, typeof DATA_SOURCE.NONE>;

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

export async function is_seeding_already_complete(
  app_settings: AppSettingsPort = get_app_settings_storage(),
): Promise<SeedingCompletionState> {
  try {
    const stored_value = await app_settings.get_setting(
      SEEDING_COMPLETE_SETTING_KEY,
    );
    return stored_value === SETTING_TRUE_VALUE
      ? SEEDING_COMPLETION_STATE.COMPLETE
      : SEEDING_COMPLETION_STATE.NOT_COMPLETE;
  } catch (error) {
    console.error("[Seeding] Could not read the seeding completion marker", {
      event: INITIALIZATION_EVENT.SEEDING_COMPLETION_UNREADABLE,
      error_code: INITIALIZATION_ERROR_CODE.SEEDING_STATE_UNREADABLE,
      error: String(error),
    });
    return SEEDING_COMPLETION_STATE.UNREADABLE;
  }
}

export async function mark_seeding_complete(
  app_settings: AppSettingsPort = get_app_settings_storage(),
): AsyncResult<boolean> {
  try {
    await app_settings.set_setting(
      SEEDING_COMPLETE_SETTING_KEY,
      SETTING_TRUE_VALUE,
    );
    return create_success_result(true);
  } catch (error) {
    console.error("[Seeding] Could not save the seeding completion marker", {
      event: INITIALIZATION_EVENT.SEEDING_COMPLETION_MARK_FAILED,
      error_code: INITIALIZATION_ERROR_CODE.SEEDING_STATE_UNREADABLE,
      error: String(error),
    });
    return create_failure_result(SEEDING_STATE_SAVE_FAILED_MESSAGE);
  }
}
