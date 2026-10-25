import type { AsyncResult } from "../../core/types/Result";
import { get_activity_category_repository } from "../repositories/InBrowserActivityCategoryRepository";
import { get_activity_repository } from "../repositories/InBrowserActivityRepository";
import { get_audit_log_repository } from "../repositories/InBrowserAuditLogRepository";
import { get_calendar_token_repository } from "../repositories/InBrowserCalendarTokenRepository";
import { get_competition_stage_repository } from "../repositories/InBrowserCompetitionStageRepository";
import { get_game_event_log_repository } from "../repositories/InBrowserGameEventLogRepository";
import { get_gender_repository } from "../repositories/InBrowserGenderRepository";
import { get_identification_repository } from "../repositories/InBrowserIdentificationRepository";
import { get_identification_type_repository } from "../repositories/InBrowserIdentificationTypeRepository";
import { get_live_game_log_repository } from "../repositories/InBrowserLiveGameLogRepository";
import { get_official_associated_team_repository } from "../repositories/InBrowserOfficialAssociatedTeamRepository";
import { get_official_performance_rating_repository } from "../repositories/InBrowserOfficialPerformanceRatingRepository";
import { get_organization_settings_repository } from "../repositories/InBrowserOrganizationSettingsRepository";
import { InBrowserPlayerTeamTransferHistoryRepository } from "../repositories/InBrowserPlayerTeamTransferHistoryRepository";
import type { RepositoryWriteOrigin } from "../repositories/InBrowserRepositoryWriteOrigin";
import { get_system_user_repository } from "../repositories/InBrowserSystemUserRepository";

interface ClearableRepository {
  with_write_origin(origin: RepositoryWriteOrigin): {
    clear_all_data(): AsyncResult<boolean>;
  };
}

interface ClearedTableResetStep {
  table_name: string;
  reset(origin: RepositoryWriteOrigin): AsyncResult<boolean>;
}

function clear_table(
  table_name: string,
  get_repository: () => unknown,
): ClearedTableResetStep {
  return {
    table_name,
    reset: (origin) =>
      (get_repository() as ClearableRepository)
        .with_write_origin(origin)
        .clear_all_data(),
  };
}

export const CLEARED_TABLE_RESET_STEPS: readonly ClearedTableResetStep[] = [
  clear_table("competition_stages", get_competition_stage_repository),
  clear_table("activities", get_activity_repository),
  clear_table("activity_categories", get_activity_category_repository),
  clear_table("game_event_logs", get_game_event_log_repository),
  clear_table("live_game_logs", get_live_game_log_repository),
  clear_table(
    "official_performance_ratings",
    get_official_performance_rating_repository,
  ),
  clear_table(
    "player_team_transfer_histories",
    () => new InBrowserPlayerTeamTransferHistoryRepository(),
  ),
  clear_table(
    "official_associated_teams",
    get_official_associated_team_repository,
  ),
  clear_table("identifications", get_identification_repository),
  clear_table("identification_types", get_identification_type_repository),
  clear_table("genders", get_gender_repository),
  clear_table("system_users", get_system_user_repository),
  clear_table("organization_settings", get_organization_settings_repository),
  clear_table("calendar_tokens", get_calendar_token_repository),
  clear_table("audit_logs", get_audit_log_repository),
];
