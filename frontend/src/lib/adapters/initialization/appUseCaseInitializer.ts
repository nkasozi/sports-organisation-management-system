import { get_repository_container } from "$lib/infrastructure/container";
import {
  get_competition_format_use_cases,
  get_competition_use_cases,
  get_fixture_use_cases,
  get_game_official_role_use_cases,
  get_official_use_cases,
  get_organization_use_cases,
  get_player_position_use_cases,
  get_player_team_membership_use_cases,
  get_player_use_cases,
  get_sport_use_cases,
  get_team_staff_role_use_cases,
  get_team_staff_use_cases,
  get_team_use_cases,
} from "$lib/infrastructure/registry/useCaseFactories";

export function initialize_all_use_cases(): boolean {
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
  return true;
}
