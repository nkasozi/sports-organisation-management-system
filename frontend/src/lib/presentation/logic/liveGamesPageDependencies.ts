import { get_authorization_adapter } from "$lib/infrastructure/AuthorizationProvider";
import {
  get_competition_use_cases,
  get_fixture_details_setup_use_cases,
  get_fixture_lineup_use_cases,
  get_fixture_use_cases,
  get_game_official_role_use_cases,
  get_jersey_color_use_cases,
  get_official_use_cases,
  get_organization_use_cases,
  get_player_position_use_cases,
  get_player_team_membership_use_cases,
  get_player_use_cases,
  get_sport_use_cases,
  get_team_use_cases,
} from "$lib/infrastructure/registry/useCaseFactories";

export const live_games_page_dependencies = {
  authorization_adapter: get_authorization_adapter(),
  fixture_use_cases: get_fixture_use_cases(),
  fixture_details_setup_use_cases: get_fixture_details_setup_use_cases(),
  fixture_lineup_use_cases: get_fixture_lineup_use_cases(),
  membership_use_cases: get_player_team_membership_use_cases(),
  player_use_cases: get_player_use_cases(),
  player_position_use_cases: get_player_position_use_cases(),
  team_use_cases: get_team_use_cases(),
  sport_use_cases: get_sport_use_cases(),
  competition_use_cases: get_competition_use_cases(),
  organization_use_cases: get_organization_use_cases(),
  jersey_color_use_cases: get_jersey_color_use_cases(),
  official_use_cases: get_official_use_cases(),
  game_official_role_use_cases: get_game_official_role_use_cases(),
  check_delay_ms: 800,
};
