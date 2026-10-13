import {
  apply_competition_fixture_player_limit_overrides,
  build_sport_fixture_player_limits,
  DEFAULT_FIXTURE_PLAYER_LIMITS,
} from "$lib/core/services/fixturePlayerLimits";

import type { LiveGameDetailPageState } from "./liveGameDetailPageState";

export function resolve_live_game_max_players_on_field(
  page_state: Pick<LiveGameDetailPageState, "sport" | "competition">,
): number {
  const sport_limits = page_state.sport
    ? build_sport_fixture_player_limits(page_state.sport)
    : DEFAULT_FIXTURE_PLAYER_LIMITS;
  return apply_competition_fixture_player_limit_overrides(sport_limits, {
    ...page_state.competition?.rule_overrides,
  }).starters_count;
}
