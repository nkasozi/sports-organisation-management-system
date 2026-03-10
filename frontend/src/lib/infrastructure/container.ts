import type {
  OrganizationRepository,
  CompetitionRepository,
  TeamRepository,
  PlayerRepository,
  OfficialRepository,
  FixtureRepository,
  ActivityRepository,
  ActivityCategoryRepository,
  CalendarTokenRepository,
  SystemUserRepository,
  AuditLogRepository,
  SportRepository,
  VenueRepository,
  GenderRepository,
  CompetitionFormatRepository,
  CompetitionTeamRepository,
  FixtureLineupRepository,
  FixtureDetailsSetupRepository,
  GameEventTypeRepository,
  GameOfficialRoleRepository,
  IdentificationTypeRepository,
  IdentificationRepository,
  PlayerPositionRepository,
  PlayerTeamMembershipRepository,
  PlayerTeamTransferHistoryRepository,
  QualificationRepository,
  TeamStaffRoleRepository,
  TeamStaffRepository,
  PlayerProfileRepository,
  TeamProfileRepository,
  ProfileLinkRepository,
  OfficialAssociatedTeamRepository,
  JerseyColorRepository,
  LiveGameLogRepository,
  GameEventLogRepository,
  CompetitionStageRepository,
} from "../core/interfaces/ports";

import { get_organization_repository } from "../adapters/repositories/InBrowserOrganizationRepository";
import { get_competition_repository } from "../adapters/repositories/InBrowserCompetitionRepository";
import { get_team_repository } from "../adapters/repositories/InBrowserTeamRepository";
import { get_player_repository } from "../adapters/repositories/InBrowserPlayerRepository";
import { get_official_repository } from "../adapters/repositories/InBrowserOfficialRepository";
import { get_fixture_repository } from "../adapters/repositories/InBrowserFixtureRepository";
import { get_activity_repository } from "../adapters/repositories/InBrowserActivityRepository";
import { get_activity_category_repository } from "../adapters/repositories/InBrowserActivityCategoryRepository";
import { get_system_user_repository } from "../adapters/repositories/InBrowserSystemUserRepository";
import { get_audit_log_repository } from "../adapters/repositories/InBrowserAuditLogRepository";
import { get_calendar_token_repository } from "../adapters/repositories/InBrowserCalendarTokenRepository";
import { get_sport_repository } from "../adapters/repositories/InBrowserSportRepository";
import { get_venue_repository } from "../adapters/repositories/InBrowserVenueRepository";
import { get_gender_repository } from "../adapters/repositories/InBrowserGenderRepository";
import { get_competition_format_repository } from "../adapters/repositories/InBrowserCompetitionFormatRepository";
import { get_competition_team_repository } from "../adapters/repositories/InBrowserCompetitionTeamRepository";
import { get_fixture_lineup_repository } from "../adapters/repositories/InBrowserFixtureLineupRepository";
import { get_fixture_details_setup_repository } from "../adapters/repositories/InBrowserFixtureDetailsSetupRepository";
import { get_game_event_type_repository } from "../adapters/repositories/InBrowserGameEventTypeRepository";
import { get_game_official_role_repository } from "../adapters/repositories/InBrowserGameOfficialRoleRepository";
import { get_identification_type_repository } from "../adapters/repositories/InBrowserIdentificationTypeRepository";
import { get_identification_repository } from "../adapters/repositories/InBrowserIdentificationRepository";
import { get_player_position_repository } from "../adapters/repositories/InBrowserPlayerPositionRepository";
import { get_player_team_membership_repository } from "../adapters/repositories/InBrowserPlayerTeamMembershipRepository";
import { InBrowserPlayerTeamTransferHistoryRepository } from "../adapters/repositories/InBrowserPlayerTeamTransferHistoryRepository";
import { get_qualification_repository } from "../adapters/repositories/InBrowserQualificationRepository";
import { get_team_staff_role_repository } from "../adapters/repositories/InBrowserTeamStaffRoleRepository";
import { get_team_staff_repository } from "../adapters/repositories/InBrowserTeamStaffRepository";
import { get_player_profile_repository } from "../adapters/repositories/InBrowserPlayerProfileRepository";
import { get_team_profile_repository } from "../adapters/repositories/InBrowserTeamProfileRepository";
import { get_profile_link_repository } from "../adapters/repositories/InBrowserProfileLinkRepository";
import { get_official_associated_team_repository } from "../adapters/repositories/InBrowserOfficialAssociatedTeamRepository";
import { get_jersey_color_repository } from "../adapters/repositories/InBrowserJerseyColorRepository";
import { get_live_game_log_repository } from "../adapters/repositories/InBrowserLiveGameLogRepository";
import { get_game_event_log_repository } from "../adapters/repositories/InBrowserGameEventLogRepository";
import { get_competition_stage_repository } from "../adapters/repositories/InBrowserCompetitionStageRepository";

import type { OrganizationUseCasesPort } from "../core/interfaces/ports";
import type { CompetitionUseCasesPort } from "../core/interfaces/ports";
import type { TeamUseCasesPort } from "../core/interfaces/ports";
import type { PlayerUseCasesPort } from "../core/interfaces/ports";
import type { OfficialUseCasesPort } from "../core/interfaces/ports";
import type { FixtureUseCasesPort } from "../core/interfaces/ports";
import type { ActivityUseCasesPort } from "../core/interfaces/ports";
import type { ActivityCategoryUseCasesPort } from "../core/interfaces/ports";
import type { CalendarTokenUseCasesPort } from "../core/interfaces/ports";

import { create_organization_use_cases } from "../core/usecases/OrganizationUseCases";
import { create_competition_use_cases } from "../core/usecases/CompetitionUseCases";
import { create_team_use_cases } from "../core/usecases/TeamUseCases";
import { create_player_use_cases } from "../core/usecases/PlayerUseCases";
import { create_official_use_cases } from "../core/usecases/OfficialUseCases";
import { create_fixture_use_cases } from "../core/usecases/FixtureUseCases";
import { create_activity_use_cases } from "../core/usecases/ActivityUseCases";
import { create_activity_category_use_cases } from "../core/usecases/ActivityCategoryUseCases";
import { create_calendar_token_use_cases } from "../core/usecases/CalendarTokenUseCases";
import {
  create_system_user_use_cases,
  type SystemUserUseCases,
} from "../core/usecases/SystemUserUseCases";
import {
  create_audit_log_use_cases,
  type AuditLogUseCases,
} from "../core/usecases/AuditLogUseCases";
import { create_competition_stage_use_cases } from "../core/usecases/CompetitionStageUseCases";
import type { CompetitionStageUseCasesPort } from "../core/interfaces/ports";

export interface RepositoryContainer {
  organization_repository: OrganizationRepository;
  competition_repository: CompetitionRepository;
  team_repository: TeamRepository;
  player_repository: PlayerRepository;
  official_repository: OfficialRepository;
  fixture_repository: FixtureRepository;
  activity_repository: ActivityRepository;
  activity_category_repository: ActivityCategoryRepository;
  calendar_token_repository: CalendarTokenRepository;
  system_user_repository: SystemUserRepository;
  audit_log_repository: AuditLogRepository;
  sport_repository: SportRepository;
  venue_repository: VenueRepository;
  gender_repository: GenderRepository;
  competition_format_repository: CompetitionFormatRepository;
  competition_team_repository: CompetitionTeamRepository;
  fixture_lineup_repository: FixtureLineupRepository;
  fixture_details_setup_repository: FixtureDetailsSetupRepository;
  game_event_type_repository: GameEventTypeRepository;
  game_official_role_repository: GameOfficialRoleRepository;
  identification_type_repository: IdentificationTypeRepository;
  identification_repository: IdentificationRepository;
  player_position_repository: PlayerPositionRepository;
  player_team_membership_repository: PlayerTeamMembershipRepository;
  player_team_transfer_history_repository: PlayerTeamTransferHistoryRepository;
  qualification_repository: QualificationRepository;
  team_staff_role_repository: TeamStaffRoleRepository;
  team_staff_repository: TeamStaffRepository;
  player_profile_repository: PlayerProfileRepository;
  team_profile_repository: TeamProfileRepository;
  profile_link_repository: ProfileLinkRepository;
  official_associated_team_repository: OfficialAssociatedTeamRepository;
  jersey_color_repository: JerseyColorRepository;
  live_game_log_repository: LiveGameLogRepository;
  game_event_log_repository: GameEventLogRepository;
  competition_stage_repository: CompetitionStageRepository;
}

export interface UseCasesContainer {
  organization_use_cases: OrganizationUseCasesPort;
  competition_use_cases: CompetitionUseCasesPort;
  team_use_cases: TeamUseCasesPort;
  player_use_cases: PlayerUseCasesPort;
  official_use_cases: OfficialUseCasesPort;
  fixture_use_cases: FixtureUseCasesPort;
  activity_use_cases: ActivityUseCasesPort;
  activity_category_use_cases: ActivityCategoryUseCasesPort;
  calendar_token_use_cases: CalendarTokenUseCasesPort;
  system_user_use_cases: SystemUserUseCases;
  audit_log_use_cases: AuditLogUseCases;
  competition_stage_use_cases: CompetitionStageUseCasesPort;
}

let repository_container_instance: RepositoryContainer | null = null;
let use_cases_container_instance: UseCasesContainer | null = null;

export function get_repository_container(): RepositoryContainer {
  if (!repository_container_instance) {
    repository_container_instance = create_in_browser_repository_container();
  }
  return repository_container_instance;
}

export function get_use_cases_container(): UseCasesContainer {
  if (!use_cases_container_instance) {
    use_cases_container_instance = create_use_cases_container(
      get_repository_container(),
    );
  }
  return use_cases_container_instance;
}

function create_in_browser_repository_container(): RepositoryContainer {
  return {
    organization_repository: get_organization_repository(),
    competition_repository: get_competition_repository(),
    team_repository: get_team_repository(),
    player_repository: get_player_repository(),
    official_repository: get_official_repository(),
    fixture_repository: get_fixture_repository(),
    activity_repository: get_activity_repository(),
    activity_category_repository: get_activity_category_repository(),
    calendar_token_repository: get_calendar_token_repository(),
    system_user_repository: get_system_user_repository(),
    audit_log_repository: get_audit_log_repository(),
    sport_repository: get_sport_repository(),
    venue_repository: get_venue_repository(),
    gender_repository: get_gender_repository(),
    competition_format_repository: get_competition_format_repository(),
    competition_team_repository: get_competition_team_repository(),
    fixture_lineup_repository: get_fixture_lineup_repository(),
    fixture_details_setup_repository: get_fixture_details_setup_repository(),
    game_event_type_repository: get_game_event_type_repository(),
    game_official_role_repository: get_game_official_role_repository(),
    identification_type_repository: get_identification_type_repository(),
    identification_repository: get_identification_repository(),
    player_position_repository: get_player_position_repository(),
    player_team_membership_repository: get_player_team_membership_repository(),
    player_team_transfer_history_repository:
      new InBrowserPlayerTeamTransferHistoryRepository(),
    qualification_repository: get_qualification_repository(),
    team_staff_role_repository: get_team_staff_role_repository(),
    team_staff_repository: get_team_staff_repository(),
    player_profile_repository: get_player_profile_repository(),
    team_profile_repository: get_team_profile_repository(),
    profile_link_repository: get_profile_link_repository(),
    official_associated_team_repository:
      get_official_associated_team_repository(),
    jersey_color_repository: get_jersey_color_repository(),
    live_game_log_repository: get_live_game_log_repository(),
    game_event_log_repository: get_game_event_log_repository(),
    competition_stage_repository: get_competition_stage_repository(),
  };
}

function create_use_cases_container(
  repositories: RepositoryContainer,
): UseCasesContainer {
  return {
    organization_use_cases: create_organization_use_cases(
      repositories.organization_repository,
    ),
    competition_use_cases: create_competition_use_cases(
      repositories.competition_repository,
    ),
    team_use_cases: create_team_use_cases(repositories.team_repository),
    player_use_cases: create_player_use_cases(repositories.player_repository),
    official_use_cases: create_official_use_cases(
      repositories.official_repository,
    ),
    fixture_use_cases: create_fixture_use_cases(
      repositories.fixture_repository,
    ),
    activity_use_cases: create_activity_use_cases({
      activity_repository: repositories.activity_repository,
      activity_category_repository: repositories.activity_category_repository,
      competition_repository: repositories.competition_repository,
      fixture_repository: repositories.fixture_repository,
      team_repository: repositories.team_repository,
    }),
    activity_category_use_cases: create_activity_category_use_cases(
      repositories.activity_category_repository,
    ),
    calendar_token_use_cases: create_calendar_token_use_cases({
      calendar_token_repository: repositories.calendar_token_repository,
      get_base_url: () =>
        typeof window !== "undefined" ? window.location.origin : "",
    }),
    system_user_use_cases: create_system_user_use_cases(
      repositories.system_user_repository,
    ),
    audit_log_use_cases: create_audit_log_use_cases(
      repositories.audit_log_repository,
    ),
    competition_stage_use_cases: create_competition_stage_use_cases(
      repositories.competition_stage_repository,
      repositories.fixture_repository,
    ),
  };
}

export function reset_container(): void {
  repository_container_instance = null;
  use_cases_container_instance = null;
}

export function inject_test_repository_container(
  test_container: RepositoryContainer,
): void {
  repository_container_instance = test_container;
  use_cases_container_instance = null;
}

export function inject_test_use_cases_container(
  test_container: UseCasesContainer,
): void {
  use_cases_container_instance = test_container;
}
