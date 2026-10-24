import type { Fixture } from "$lib/core/entities/Fixture";
import type { FixtureStatusValue } from "$lib/core/entities/StatusConstants";
import type { CheckStatus } from "$lib/core/services/fixtureStartChecks";

import { format_fixture_date } from "./dashboardPageDisplayLogic";
import {
  LIVE_GAME_CHECK_CLASS_BY_STATUS,
  LIVE_GAME_CHECK_CONTAINER_CLASS_BY_STATUS,
  LIVE_GAME_CHECK_ICON_BY_STATUS,
  LIVE_GAME_DEFAULT_TEAM_NAME,
  LIVE_GAME_STATUS_BADGE_CLASS_BY_STATUS,
} from "./liveGamesViewConstants";

export function format_live_game_kickoff(fixture: Fixture): string {
  return format_fixture_date(fixture.scheduled_date, fixture.scheduled_time);
}

export function get_live_game_status_badge_class(
  status: FixtureStatusValue,
): string {
  return LIVE_GAME_STATUS_BADGE_CLASS_BY_STATUS[status];
}

export function get_live_game_check_icon(status: CheckStatus): string {
  return LIVE_GAME_CHECK_ICON_BY_STATUS[status];
}

export function get_live_game_check_class(status: CheckStatus): string {
  return LIVE_GAME_CHECK_CLASS_BY_STATUS[status];
}

export function get_live_game_check_container_class(
  status: CheckStatus,
): string {
  return LIVE_GAME_CHECK_CONTAINER_CLASS_BY_STATUS[status];
}

export function get_live_game_matchup_label(
  fixture: Fixture,
  team_names: Record<string, string>,
): string {
  const home_team_name =
    team_names[fixture.home_team_id] ||
    fixture.home_team_name ||
    LIVE_GAME_DEFAULT_TEAM_NAME.HOME;
  const away_team_name =
    team_names[fixture.away_team_id] ||
    fixture.away_team_name ||
    LIVE_GAME_DEFAULT_TEAM_NAME.AWAY;
  return `${home_team_name} vs ${away_team_name}`;
}
