import { reset_organization_repository } from "../repositories/InBrowserOrganizationRepository";
import { reset_team_repository } from "../repositories/InBrowserTeamRepository";
import { reset_competition_repository } from "../repositories/InBrowserCompetitionRepository";
import { reset_player_repository } from "../repositories/InBrowserPlayerRepository";
import { reset_player_team_membership_repository } from "../repositories/InBrowserPlayerTeamMembershipRepository";
import { reset_official_repository } from "../repositories/InBrowserOfficialRepository";
import { reset_sport_repository } from "../repositories/InBrowserSportRepository";
import { reset_fixture_repository } from "../repositories/InBrowserFixtureRepository";
import { reset_team_staff_repository } from "../repositories/InBrowserTeamStaffRepository";
import { reset_game_event_type_repository } from "../repositories/InBrowserGameEventTypeRepository";
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
import { reset_system_user_repository } from "../repositories/InBrowserSystemUserRepository";
import { get_organization_repository } from "../repositories/InBrowserOrganizationRepository";
import { get_team_repository } from "../repositories/InBrowserTeamRepository";
import { get_competition_repository } from "../repositories/InBrowserCompetitionRepository";
import { get_player_repository } from "../repositories/InBrowserPlayerRepository";
import { get_player_team_membership_repository } from "../repositories/InBrowserPlayerTeamMembershipRepository";
import { get_official_repository } from "../repositories/InBrowserOfficialRepository";
import { get_all_sports } from "../persistence/sportService";
import { reset_seeding_flag, seed_all_data_if_needed } from "./seedingService";
import {
  clear_all_demo_data_in_convex,
  reset_sync_metadata,
} from "$lib/infrastructure/sync/convexSyncService";
import {
  stop_background_sync,
  start_background_sync,
  set_pulling_from_remote,
} from "$lib/infrastructure/sync/backgroundSyncService";
import { is_signed_in } from "$lib/adapters/iam/clerkAuthService";
import { get } from "svelte/store";

const FIRST_TIME_DETECTION_KEY = "sports_org_app_initialized";

function reset_first_time_flag(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(FIRST_TIME_DETECTION_KEY);
}

export async function reset_all_data(
  on_progress?: (message: string, percentage: number) => void,
): Promise<boolean> {
  if (typeof window === "undefined") return false;

  const report = (message: string, percentage: number): void => {
    on_progress?.(message, percentage);
  };

  report("Stopping background sync...", 5);
  stop_background_sync();
  set_pulling_from_remote(true);

  const user_is_signed_in = get(is_signed_in);

  if (user_is_signed_in) {
    report("Clearing server data...", 10);
    await clear_all_demo_data_in_convex();
  } else {
    report("Skipping server clear (not signed in)...", 10);
    console.log("[DataReset] User not signed in — skipping Convex clear");
  }

  report("Clearing local storage...", 20);
  localStorage.clear();
  reset_sync_metadata();
  reset_seeding_flag();
  reset_first_time_flag();

  report("Resetting data stores...", 35);
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
  await reset_system_user_repository();

  report("Reloading fresh demo data...", 65);
  await get_all_sports();
  report("Seeding demo data...", 80);
  await seed_all_data_if_needed();

  report("Finishing up...", 95);
  set_pulling_from_remote(false);

  if (get(is_signed_in)) {
    start_background_sync();
  } else {
    console.log("[DataReset] User not signed in — skipping background sync start");
  }

  return true;
}
