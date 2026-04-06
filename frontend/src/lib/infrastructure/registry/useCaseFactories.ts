import { get_repository_container } from "../container";
import { create_audit_log_use_cases } from "../../core/usecases/AuditLogUseCases";
import { create_competition_format_use_cases } from "../../core/usecases/CompetitionFormatUseCases";
import { create_competition_stage_use_cases } from "../../core/usecases/CompetitionStageUseCases";
import { create_competition_team_use_cases } from "../../core/usecases/CompetitionTeamUseCases";
import { create_competition_use_cases_with_stage_lifecycle } from "../../core/usecases/CompetitionUseCases";
import { create_competition_stage_lifecycle } from "../../core/usecases/CompetitionStageLifecycle";
import { create_fixture_details_setup_use_cases } from "../../core/usecases/FixtureDetailsSetupUseCases";
import { create_fixture_lineup_use_cases } from "../../core/usecases/FixtureLineupUseCases";
import { create_fixture_use_cases } from "../../core/usecases/FixtureUseCases";
import { create_game_event_log_use_cases } from "../../core/usecases/GameEventLogUseCases";
import { create_game_event_type_use_cases } from "../../core/usecases/GameEventTypeUseCases";
import { create_game_official_role_use_cases } from "../../core/usecases/GameOfficialRoleUseCases";
import { create_gender_use_cases } from "../../core/usecases/GenderUseCases";
import { create_identification_type_use_cases } from "../../core/usecases/IdentificationTypeUseCases";
import { create_identification_use_cases } from "../../core/usecases/IdentificationUseCases";
import { create_jersey_color_use_cases } from "../../core/usecases/JerseyColorUseCases";
import { create_live_game_log_use_cases } from "../../core/usecases/LiveGameLogUseCases";
import { create_official_associated_team_use_cases } from "../../core/usecases/OfficialAssociatedTeamUseCases";
import { create_official_performance_rating_use_cases } from "../../core/usecases/OfficialPerformanceRatingUseCases";
import { create_official_use_cases } from "../../core/usecases/OfficialUseCases";
import { create_organization_settings_use_cases } from "../../core/usecases/OrganizationSettingsUseCases";
import {
  create_organization_use_cases,
  create_organization_use_cases_with_default_seeder,
} from "../../core/usecases/OrganizationUseCases";
import { create_player_position_use_cases } from "../../core/usecases/PlayerPositionUseCases";
import { create_player_profile_use_cases } from "../../core/usecases/PlayerProfileUseCases";
import { create_player_team_membership_use_cases } from "../../core/usecases/PlayerTeamMembershipUseCases";
import { create_player_team_transfer_history_use_cases } from "../../core/usecases/PlayerTeamTransferHistoryUseCases";
import { create_player_use_cases } from "../../core/usecases/PlayerUseCases";
import { create_profile_link_use_cases } from "../../core/usecases/ProfileLinkUseCases";
import { create_qualification_use_cases } from "../../core/usecases/QualificationUseCases";
import { create_sport_use_cases } from "../../core/usecases/SportUseCases";
import { create_system_user_use_cases } from "../../core/usecases/SystemUserUseCases";
import { create_team_profile_use_cases } from "../../core/usecases/TeamProfileUseCases";
import { create_team_staff_role_use_cases } from "../../core/usecases/TeamStaffRoleUseCases";
import { create_team_staff_use_cases } from "../../core/usecases/TeamStaffUseCases";
import { create_team_use_cases } from "../../core/usecases/TeamUseCases";
import { create_venue_use_cases } from "../../core/usecases/VenueUseCases";
import { get } from "svelte/store";
import { auth_store } from "../../presentation/stores/auth";
import type { AuditLogUseCases } from "../../core/usecases/AuditLogUseCases";
import type { CompetitionFormatUseCases } from "../../core/usecases/CompetitionFormatUseCases";
import type { CompetitionStageUseCases } from "../../core/usecases/CompetitionStageUseCases";
import type { CompetitionTeamUseCases } from "../../core/usecases/CompetitionTeamUseCases";
import type { CompetitionUseCases } from "../../core/usecases/CompetitionUseCases";
import type { FixtureDetailsSetupUseCases } from "../../core/usecases/FixtureDetailsSetupUseCases";
import type { FixtureLineupUseCases } from "../../core/usecases/FixtureLineupUseCases";
import type { FixtureUseCases } from "../../core/usecases/FixtureUseCases";
import type { GameEventLogUseCases } from "../../core/usecases/GameEventLogUseCases";
import type { GameEventTypeUseCases } from "../../core/usecases/GameEventTypeUseCases";
import type { GameOfficialRoleUseCases } from "../../core/usecases/GameOfficialRoleUseCases";
import type { GenderUseCases } from "../../core/usecases/GenderUseCases";
import type { IdentificationTypeUseCases } from "../../core/usecases/IdentificationTypeUseCases";
import type { IdentificationUseCases } from "../../core/usecases/IdentificationUseCases";
import type { JerseyColorUseCases } from "../../core/usecases/JerseyColorUseCases";
import type { LiveGameLogUseCases } from "../../core/usecases/LiveGameLogUseCases";
import type { OfficialAssociatedTeamUseCases } from "../../core/usecases/OfficialAssociatedTeamUseCases";
import type { OfficialPerformanceRatingUseCases } from "../../core/usecases/OfficialPerformanceRatingUseCases";
import type { OfficialUseCases } from "../../core/usecases/OfficialUseCases";
import type { OrganizationSettingsUseCasesPort } from "../../core/interfaces/ports/internal/usecases/OrganizationSettingsUseCasesPort";
import type { OrganizationUseCases } from "../../core/usecases/OrganizationUseCases";
import type { PlayerPositionUseCases } from "../../core/usecases/PlayerPositionUseCases";
import type { PlayerProfileUseCases } from "../../core/usecases/PlayerProfileUseCases";
import type { PlayerTeamMembershipUseCases } from "../../core/usecases/PlayerTeamMembershipUseCases";
import type { PlayerTeamTransferHistoryUseCases } from "../../core/usecases/PlayerTeamTransferHistoryUseCases";
import type { PlayerUseCases } from "../../core/usecases/PlayerUseCases";
import type { ProfileLinkUseCases } from "../../core/usecases/ProfileLinkUseCases";
import type { QualificationUseCases } from "../../core/usecases/QualificationUseCases";
import type { SportUseCases } from "../../core/usecases/SportUseCases";
import type { SystemUserUseCases } from "../../core/usecases/SystemUserUseCases";
import type { TeamProfileUseCases } from "../../core/usecases/TeamProfileUseCases";
import type { TeamStaffRoleUseCases } from "../../core/usecases/TeamStaffRoleUseCases";
import type { TeamStaffUseCases } from "../../core/usecases/TeamStaffUseCases";
import type { TeamUseCases } from "../../core/usecases/TeamUseCases";
import type { VenueUseCases } from "../../core/usecases/VenueUseCases";

export function get_audit_log_use_cases(): AuditLogUseCases {
  const container = get_repository_container();
  return create_audit_log_use_cases(container.audit_log_repository);
}

export function get_competition_format_use_cases(): CompetitionFormatUseCases {
  const container = get_repository_container();
  return create_competition_format_use_cases(
    container.competition_format_repository,
  );
}

export function get_competition_stage_use_cases(): CompetitionStageUseCases {
  const container = get_repository_container();
  return create_competition_stage_use_cases(
    container.competition_stage_repository,
    container.fixture_repository,
  );
}

export function get_competition_team_use_cases(): CompetitionTeamUseCases {
  const container = get_repository_container();
  return create_competition_team_use_cases(
    container.competition_team_repository,
  );
}

export function get_competition_use_cases(): CompetitionUseCases {
  const container = get_repository_container();
  const stage_lifecycle = create_competition_stage_lifecycle(
    container.competition_format_repository,
    container.competition_stage_repository,
    container.fixture_repository,
  );
  return create_competition_use_cases_with_stage_lifecycle(
    container.competition_repository,
    stage_lifecycle,
  );
}

export function get_fixture_details_setup_use_cases(): FixtureDetailsSetupUseCases {
  const container = get_repository_container();
  return create_fixture_details_setup_use_cases(
    container.fixture_details_setup_repository,
  );
}

export function get_fixture_lineup_use_cases(): FixtureLineupUseCases {
  const container = get_repository_container();
  return create_fixture_lineup_use_cases(container.fixture_lineup_repository);
}

export function get_fixture_use_cases(): FixtureUseCases {
  const container = get_repository_container();
  return create_fixture_use_cases(
    container.fixture_repository,
    container.team_repository,
  );
}

export function get_game_event_log_use_cases(): GameEventLogUseCases {
  const container = get_repository_container();
  return create_game_event_log_use_cases(container.game_event_log_repository);
}

export function get_game_event_type_use_cases(): GameEventTypeUseCases {
  const container = get_repository_container();
  return create_game_event_type_use_cases(container.game_event_type_repository);
}

export function get_game_official_role_use_cases(): GameOfficialRoleUseCases {
  const container = get_repository_container();
  return create_game_official_role_use_cases(
    container.game_official_role_repository,
  );
}

export function get_gender_use_cases(): GenderUseCases {
  const container = get_repository_container();
  return create_gender_use_cases(container.gender_repository);
}

export function get_identification_type_use_cases(): IdentificationTypeUseCases {
  const container = get_repository_container();
  return create_identification_type_use_cases(
    container.identification_type_repository,
  );
}

export function get_identification_use_cases(): IdentificationUseCases {
  const container = get_repository_container();
  return create_identification_use_cases(container.identification_repository);
}

export function get_jersey_color_use_cases(): JerseyColorUseCases {
  const container = get_repository_container();
  return create_jersey_color_use_cases(container.jersey_color_repository);
}

export function get_live_game_log_use_cases(): LiveGameLogUseCases {
  const container = get_repository_container();
  return create_live_game_log_use_cases(container.live_game_log_repository);
}

export function get_official_associated_team_use_cases(): OfficialAssociatedTeamUseCases {
  const container = get_repository_container();
  return create_official_associated_team_use_cases(
    container.official_associated_team_repository,
  );
}

export function get_official_performance_rating_use_cases(): OfficialPerformanceRatingUseCases {
  const container = get_repository_container();
  return create_official_performance_rating_use_cases(
    container.official_performance_rating_repository,
    () => get(auth_store).current_profile,
  );
}

export function get_official_use_cases(): OfficialUseCases {
  const container = get_repository_container();
  return create_official_use_cases(container.official_repository);
}

export function get_organization_settings_use_cases(): OrganizationSettingsUseCasesPort {
  const container = get_repository_container();
  return create_organization_settings_use_cases(
    container.organization_settings_repository,
  );
}

export function get_organization_use_cases(): OrganizationUseCases {
  const container = get_repository_container();
  return create_organization_use_cases(container.organization_repository);
}

export function get_organization_with_defaults_use_cases(): OrganizationUseCases {
  const container = get_repository_container();
  return create_organization_use_cases_with_default_seeder(
    container.organization_repository,
    async (organization_id: string): Promise<void> => {
      const { seed_default_lookup_entities_for_organization } =
        await import("../../adapters/initialization/organizationDefaultsSeeder");
      await seed_default_lookup_entities_for_organization(organization_id);
    },
  );
}

export function get_player_position_use_cases(): PlayerPositionUseCases {
  const container = get_repository_container();
  return create_player_position_use_cases(container.player_position_repository);
}

export function get_player_profile_use_cases(): PlayerProfileUseCases {
  const container = get_repository_container();
  return create_player_profile_use_cases(container.player_profile_repository);
}

export function get_player_team_membership_use_cases(): PlayerTeamMembershipUseCases {
  const container = get_repository_container();
  return create_player_team_membership_use_cases(
    container.player_team_membership_repository,
  );
}

export function get_player_team_transfer_history_use_cases(): PlayerTeamTransferHistoryUseCases {
  const container = get_repository_container();
  return create_player_team_transfer_history_use_cases(
    container.player_team_transfer_history_repository,
    container.player_team_membership_repository,
  );
}

export function get_player_use_cases(): PlayerUseCases {
  const container = get_repository_container();
  return create_player_use_cases(container.player_repository);
}

export function get_profile_link_use_cases(): ProfileLinkUseCases {
  const container = get_repository_container();
  return create_profile_link_use_cases(container.profile_link_repository);
}

export function get_qualification_use_cases(): QualificationUseCases {
  const container = get_repository_container();
  return create_qualification_use_cases(container.qualification_repository);
}

export function get_sport_use_cases(): SportUseCases {
  const container = get_repository_container();
  return create_sport_use_cases(container.sport_repository);
}

export function get_system_user_use_cases(): SystemUserUseCases {
  const container = get_repository_container();
  return create_system_user_use_cases(container.system_user_repository);
}

export function get_team_profile_use_cases(): TeamProfileUseCases {
  const container = get_repository_container();
  return create_team_profile_use_cases(container.team_profile_repository);
}

export function get_team_staff_role_use_cases(): TeamStaffRoleUseCases {
  const container = get_repository_container();
  return create_team_staff_role_use_cases(container.team_staff_role_repository);
}

export function get_team_staff_use_cases(): TeamStaffUseCases {
  const container = get_repository_container();
  return create_team_staff_use_cases(
    container.team_staff_repository,
    container.team_staff_role_repository,
  );
}

export function get_team_use_cases(): TeamUseCases {
  const container = get_repository_container();
  return create_team_use_cases(container.team_repository);
}

export function get_venue_use_cases(): VenueUseCases {
  const container = get_repository_container();
  return create_venue_use_cases(container.venue_repository);
}
