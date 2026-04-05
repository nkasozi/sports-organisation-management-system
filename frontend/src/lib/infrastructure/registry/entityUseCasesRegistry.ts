import { get_organization_with_defaults_use_cases } from "$lib/core/usecases/OrganizationUseCases";
import { get_competition_use_cases } from "$lib/core/usecases/CompetitionUseCases";
import { get_team_use_cases } from "$lib/core/usecases/TeamUseCases";
import { get_player_use_cases } from "$lib/core/usecases/PlayerUseCases";
import { get_player_team_membership_use_cases } from "$lib/core/usecases/PlayerTeamMembershipUseCases";
import { get_player_team_transfer_history_use_cases } from "$lib/core/usecases/PlayerTeamTransferHistoryUseCases";
import { get_player_position_use_cases } from "$lib/core/usecases/PlayerPositionUseCases";
import { get_official_use_cases } from "$lib/core/usecases/OfficialUseCases";
import { get_fixture_use_cases } from "$lib/core/usecases/FixtureUseCases";
import { get_fixture_details_setup_use_cases } from "$lib/core/usecases/FixtureDetailsSetupUseCases";
import { get_competition_format_use_cases } from "$lib/core/usecases/CompetitionFormatUseCases";
import { get_game_event_type_use_cases } from "$lib/core/usecases/GameEventTypeUseCases";
import { get_game_official_role_use_cases } from "$lib/core/usecases/GameOfficialRoleUseCases";
import { get_team_staff_role_use_cases } from "$lib/core/usecases/TeamStaffRoleUseCases";
import { get_team_staff_use_cases } from "$lib/core/usecases/TeamStaffUseCases";
import { get_fixture_lineup_use_cases } from "$lib/core/usecases/FixtureLineupUseCases";
import { get_sport_use_cases } from "$lib/core/usecases/SportUseCases";
import { get_qualification_use_cases } from "$lib/core/usecases/QualificationUseCases";
import { get_venue_use_cases } from "$lib/core/usecases/VenueUseCases";
import { get_identification_type_use_cases } from "$lib/core/usecases/IdentificationTypeUseCases";
import { get_gender_use_cases } from "$lib/core/usecases/GenderUseCases";
import { get_identification_use_cases } from "$lib/core/usecases/IdentificationUseCases";
import { get_jersey_color_use_cases } from "$lib/core/usecases/JerseyColorUseCases";
import { get_system_user_use_cases } from "$lib/core/usecases/SystemUserUseCases";
import { get_audit_log_use_cases } from "$lib/core/usecases/AuditLogUseCases";
import { get_player_profile_use_cases } from "$lib/core/usecases/PlayerProfileUseCases";
import { get_team_profile_use_cases } from "$lib/core/usecases/TeamProfileUseCases";
import { get_profile_link_use_cases } from "$lib/core/usecases/ProfileLinkUseCases";
import { get_official_associated_team_use_cases } from "$lib/core/usecases/OfficialAssociatedTeamUseCases";
import { get_official_performance_rating_use_cases } from "$lib/core/usecases/OfficialPerformanceRatingUseCases";
import { get_live_game_log_use_cases } from "$lib/core/usecases/LiveGameLogUseCases";
import { get_game_event_log_use_cases } from "$lib/core/usecases/GameEventLogUseCases";
import { get_competition_stage_use_cases } from "$lib/core/usecases/CompetitionStageUseCases";
import type { BaseEntity } from "$lib/core/entities/BaseEntity";
import type {
  AsyncResult,
  PaginatedAsyncResult,
  Result,
} from "$lib/core/types/Result";
import {
  create_success_result,
  create_failure_result,
} from "$lib/core/types/Result";
import { get_entity_display_name } from "./entityDisplayNames";
import { wrap_use_cases_with_events } from "./entityEventWrapper";

const VALID_ENTITY_TYPE_KEYS = [
  "organization",
  "competition",
  "team",
  "player",
  "playerteammembership",
  "playerteamtransferhistory",
  "official",
  "fixture",
  "fixturedetailssetup",
  "competitionformat",
  "competitionstage",
  "gameeventtype",
  "gameofficialrole",
  "teamstaffrole",
  "teamstaff",
  "fixturelineup",
  "sport",
  "playerposition",
  "qualification",
  "venue",
  "identificationtype",
  "gender",
  "identification",
  "jerseycolor",
  "systemuser",
  "auditlog",
  "playerprofile",
  "teamprofile",
  "profilelink",
  "officialassociatedteam",
  "livegamelog",
  "gameeventlog",
  "officialperformancerating",
] as const;

export type EntityTypeKey = (typeof VALID_ENTITY_TYPE_KEYS)[number];

export interface GenericEntityUseCases<T extends BaseEntity = BaseEntity> {
  create(input: Record<string, unknown>): AsyncResult<T>;
  get_by_id(id: string): AsyncResult<T>;
  list(
    filter?: Record<string, unknown>,
    options?: { page?: number; page_size?: number },
  ): PaginatedAsyncResult<T>;
  update(id: string, input: Record<string, unknown>): AsyncResult<T>;
  delete(id: string): AsyncResult<boolean>;
}

type UseCasesGetter = () => GenericEntityUseCases;

function create_use_cases_registry(): Record<EntityTypeKey, UseCasesGetter> {
  return {
    organization: get_organization_with_defaults_use_cases as UseCasesGetter,
    competition: get_competition_use_cases as UseCasesGetter,
    team: get_team_use_cases as UseCasesGetter,
    player: get_player_use_cases as UseCasesGetter,
    playerteammembership:
      get_player_team_membership_use_cases as UseCasesGetter,
    playerteamtransferhistory:
      get_player_team_transfer_history_use_cases as UseCasesGetter,
    official: get_official_use_cases as UseCasesGetter,
    fixture: get_fixture_use_cases as UseCasesGetter,
    fixturedetailssetup: get_fixture_details_setup_use_cases as UseCasesGetter,
    competitionformat: get_competition_format_use_cases as UseCasesGetter,
    competitionstage: get_competition_stage_use_cases as UseCasesGetter,
    gameeventtype: get_game_event_type_use_cases as UseCasesGetter,
    gameofficialrole: get_game_official_role_use_cases as UseCasesGetter,
    teamstaffrole: get_team_staff_role_use_cases as UseCasesGetter,
    teamstaff: get_team_staff_use_cases as UseCasesGetter,
    fixturelineup: get_fixture_lineup_use_cases as UseCasesGetter,
    sport: get_sport_use_cases as UseCasesGetter,
    playerposition: get_player_position_use_cases as UseCasesGetter,
    qualification: get_qualification_use_cases as UseCasesGetter,
    venue: get_venue_use_cases as UseCasesGetter,
    identificationtype: get_identification_type_use_cases as UseCasesGetter,
    gender: get_gender_use_cases as UseCasesGetter,
    identification: get_identification_use_cases as UseCasesGetter,
    jerseycolor: get_jersey_color_use_cases as UseCasesGetter,
    systemuser: get_system_user_use_cases as unknown as UseCasesGetter,
    auditlog: get_audit_log_use_cases as unknown as UseCasesGetter,
    playerprofile: get_player_profile_use_cases as UseCasesGetter,
    teamprofile: get_team_profile_use_cases as UseCasesGetter,
    profilelink: get_profile_link_use_cases as UseCasesGetter,
    officialassociatedteam:
      get_official_associated_team_use_cases as UseCasesGetter,
    livegamelog: get_live_game_log_use_cases as UseCasesGetter,
    gameeventlog: get_game_event_log_use_cases as UseCasesGetter,
    officialperformancerating:
      get_official_performance_rating_use_cases as UseCasesGetter,
  };
}

const USE_CASES_REGISTRY = create_use_cases_registry();

export function get_use_cases_for_entity_type(
  entity_type: string,
): Result<GenericEntityUseCases> {
  if (typeof entity_type !== "string" || entity_type.length === 0) {
    console.error(
      "Invalid or missing entity type for use case lookup:",
      entity_type,
    );
    return create_failure_result(
      `Invalid or missing entity type: "${entity_type}"`,
    );
  }

  const normalized_type = entity_type.toLowerCase();

  if (!is_valid_entity_type(normalized_type)) {
    console.warn(`Unknown entity type requested: ${entity_type}`);
    return create_failure_result(`Unknown entity type: "${entity_type}"`);
  }

  const getter = USE_CASES_REGISTRY[normalized_type];
  const use_cases = getter();
  return create_success_result(
    wrap_use_cases_with_events(normalized_type, use_cases),
  );
}

function get_all_registered_entity_types(): EntityTypeKey[] {
  return [...VALID_ENTITY_TYPE_KEYS];
}

function is_valid_entity_type(
  entity_type: string,
): entity_type is EntityTypeKey {
  return VALID_ENTITY_TYPE_KEYS.includes(
    entity_type.toLowerCase() as EntityTypeKey,
  );
}
