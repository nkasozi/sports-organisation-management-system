import { reset_organization_repository } from "../repositories/InMemoryOrganizationRepository";
import { reset_team_repository } from "../repositories/InMemoryTeamRepository";
import { reset_competition_repository } from "../repositories/InMemoryCompetitionRepository";
import { reset_player_repository } from "../repositories/InMemoryPlayerRepository";
import { reset_player_team_membership_repository } from "../repositories/InMemoryPlayerTeamMembershipRepository";
import { reset_official_repository } from "../repositories/InMemoryOfficialRepository";
import { reset_sport_repository } from "../repositories/InMemorySportRepository";
import { reset_fixture_repository } from "../repositories/InMemoryFixtureRepository";
import { reset_team_staff_repository } from "../repositories/InMemoryTeamStaffRepository";
import {
  reset_game_event_type_repository,
  get_game_event_type_repository,
} from "../repositories/InMemoryGameEventTypeRepository";
import { reset_player_position_repository } from "../repositories/InMemoryPlayerPositionRepository";
import { reset_team_staff_role_repository } from "../repositories/InMemoryTeamStaffRoleRepository";
import { reset_game_official_role_repository } from "../repositories/InMemoryGameOfficialRoleRepository";
import { reset_competition_format_repository } from "../repositories/InMemoryCompetitionFormatRepository";
import { reset_venue_repository } from "../repositories/InMemoryVenueRepository";
import { reset_jersey_color_repository } from "../repositories/InMemoryJerseyColorRepository";
import { reset_competition_team_repository } from "../repositories/InMemoryCompetitionTeamRepository";
import { reset_player_profile_repository } from "../repositories/InMemoryPlayerProfileRepository";
import { reset_team_profile_repository } from "../repositories/InMemoryTeamProfileRepository";
import { reset_profile_link_repository } from "../repositories/InMemoryProfileLinkRepository";
import { reset_qualification_repository } from "../repositories/InMemoryQualificationRepository";
import { get_organization_repository } from "../repositories/InMemoryOrganizationRepository";
import { get_team_repository } from "../repositories/InMemoryTeamRepository";
import { get_competition_repository } from "../repositories/InMemoryCompetitionRepository";
import { get_player_repository } from "../repositories/InMemoryPlayerRepository";
import { get_player_team_membership_repository } from "../repositories/InMemoryPlayerTeamMembershipRepository";
import { get_official_repository } from "../repositories/InMemoryOfficialRepository";
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

  reset_sport_repository();
  reset_organization_repository();
  reset_team_repository();
  reset_competition_repository();
  reset_player_repository();
  reset_player_team_membership_repository();
  reset_official_repository();
  reset_fixture_repository();
  reset_team_staff_repository();
  reset_game_event_type_repository();
  reset_player_position_repository();
  reset_team_staff_role_repository();
  reset_game_official_role_repository();
  reset_competition_format_repository();
  reset_venue_repository();
  reset_jersey_color_repository();
  reset_competition_team_repository();
  reset_player_profile_repository();
  reset_team_profile_repository();
  reset_profile_link_repository();
  reset_qualification_repository();

  await get_all_sports();
  get_organization_repository();
  get_team_repository();
  get_competition_repository();
  get_player_repository();
  get_player_team_membership_repository();
  get_official_repository();
  const game_event_repo = get_game_event_type_repository();
  await game_event_repo.find_all_with_filter();

  await seed_all_data_if_needed();

  return true;
}
