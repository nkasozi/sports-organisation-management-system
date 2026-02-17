import { reset_organization_repository } from "../repositories/InBrowserOrganizationRepository";
import { reset_team_repository } from "../repositories/InBrowserTeamRepository";
import { reset_competition_repository } from "../repositories/InBrowserCompetitionRepository";
import { reset_player_repository } from "../repositories/InBrowserPlayerRepository";
import { reset_player_team_membership_repository } from "../repositories/InBrowserPlayerTeamMembershipRepository";
import { reset_official_repository } from "../repositories/InBrowserOfficialRepository";
import { reset_sport_repository } from "../repositories/InBrowserSportRepository";
import { reset_fixture_repository } from "../repositories/InBrowserFixtureRepository";
import { reset_team_staff_repository } from "../repositories/InBrowserTeamStaffRepository";
import {
  reset_game_event_type_repository,
  get_game_event_type_repository,
} from "../repositories/InBrowserGameEventTypeRepository";
import { reset_player_position_repository } from "../repositories/InBrowserPlayerPositionRepository";
import { reset_team_staff_role_repository } from "../repositories/InBrowserTeamStaffRoleRepository";
import { reset_game_official_role_repository } from "../repositories/InBrowserGameOfficialRoleRepository";
import { reset_competition_format_repository } from "../repositories/InBrowserCompetitionFormatRepository";
import { reset_venue_repository } from "../repositories/InBrowserVenueRepository";
import { reset_jersey_color_repository } from "../repositories/InBrowserJerseyColorRepository";
import { reset_competition_team_repository } from "../repositories/InBrowserCompetitionTeamRepository";
import { reset_player_profile_repository } from "../repositories/InBrowserPlayerProfileRepository";
import { reset_team_profile_repository } from "../repositories/InBrowserTeamProfileRepository";
import { reset_profile_link_repository } from "../repositories/InBrowserProfileLinkRepository";
import { reset_qualification_repository } from "../repositories/InBrowserQualificationRepository";
import { reset_fixture_details_setup_repository } from "../repositories/InBrowserFixtureDetailsSetupRepository";
import { reset_fixture_lineup_repository } from "../repositories/InBrowserFixtureLineupRepository";
import { get_organization_repository } from "../repositories/InBrowserOrganizationRepository";
import { get_team_repository } from "../repositories/InBrowserTeamRepository";
import { get_competition_repository } from "../repositories/InBrowserCompetitionRepository";
import { get_player_repository } from "../repositories/InBrowserPlayerRepository";
import { get_player_team_membership_repository } from "../repositories/InBrowserPlayerTeamMembershipRepository";
import { get_official_repository } from "../repositories/InBrowserOfficialRepository";
import { get_all_sports } from "./sportService";
import { reset_seeding_flag, seed_all_data_if_needed } from "./seedingService";

const FIRST_TIME_DETECTION_KEY = "sports_org_app_initialized";

function reset_first_time_flag(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(FIRST_TIME_DETECTION_KEY);
}

export async function reset_all_data(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  localStorage.clear();

  reset_seeding_flag();
  reset_first_time_flag();

  await reset_sport_repository();
  await reset_organization_repository();
  await reset_team_repository();
  await reset_competition_repository();
  await reset_player_repository();
  await reset_player_team_membership_repository();
  await reset_official_repository();
  await reset_fixture_repository();
  await reset_fixture_details_setup_repository();
  await reset_fixture_lineup_repository();
  await reset_team_staff_repository();
  await reset_game_event_type_repository();
  await reset_player_position_repository();
  await reset_team_staff_role_repository();
  await reset_game_official_role_repository();
  await reset_competition_format_repository();
  await reset_venue_repository();
  await reset_jersey_color_repository();
  await reset_competition_team_repository();
  await reset_player_profile_repository();
  await reset_team_profile_repository();
  await reset_profile_link_repository();
  await reset_qualification_repository();

  await get_all_sports();
  get_organization_repository();
  get_team_repository();
  get_competition_repository();
  get_player_repository();
  get_player_team_membership_repository();
  get_official_repository();
  const game_event_repo = get_game_event_type_repository();
  await game_event_repo.find_all();

  await seed_all_data_if_needed();

  return true;
}
