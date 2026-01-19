import { get_repository_container } from "$lib/infrastructure/container";
import { get_organization_use_cases } from "$lib/core/usecases/OrganizationUseCases";
import { get_competition_use_cases } from "$lib/core/usecases/CompetitionUseCases";
import { get_team_use_cases } from "$lib/core/usecases/TeamUseCases";
import { get_player_use_cases } from "$lib/core/usecases/PlayerUseCases";
import { get_player_team_membership_use_cases } from "$lib/core/usecases/PlayerTeamMembershipUseCases";
import { get_official_use_cases } from "$lib/core/usecases/OfficialUseCases";
import { get_fixture_use_cases } from "$lib/core/usecases/FixtureUseCases";
import { get_sport_use_cases } from "$lib/core/usecases/SportUseCases";
import { get_player_position_use_cases } from "$lib/core/usecases/PlayerPositionUseCases";
import { get_team_staff_use_cases } from "$lib/core/usecases/TeamStaffUseCases";
import { get_team_staff_role_use_cases } from "$lib/core/usecases/TeamStaffRoleUseCases";
import { get_competition_format_use_cases } from "$lib/core/usecases/CompetitionFormatUseCases";
import { get_game_official_role_use_cases } from "$lib/core/usecases/GameOfficialRoleUseCases";
import { seed_all_data_if_needed } from "./seedingService";

let initialized = false;

export async function initialize_app_data(): Promise<boolean> {
  if (initialized) return true;
  if (typeof window === "undefined") return false;

  get_repository_container();

  get_sport_use_cases();
  get_organization_use_cases();
  get_player_position_use_cases();
  get_team_staff_role_use_cases();
  get_game_official_role_use_cases();
  get_competition_format_use_cases();
  get_team_use_cases();
  get_player_use_cases();
  get_player_team_membership_use_cases();
  get_team_staff_use_cases();
  get_official_use_cases();
  get_competition_use_cases();
  get_fixture_use_cases();

  await seed_all_data_if_needed();

  initialized = true;
  return true;
}
