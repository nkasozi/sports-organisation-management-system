import type { Fixture } from "$lib/core/entities/Fixture";
import { FIXTURE_STATUS } from "$lib/core/entities/StatusConstants";
import { get_team_logo, type Team } from "$lib/core/entities/Team";
import {
  create_none_option,
  create_some_option,
  type Option,
  OptionStatus,
} from "$lib/core/types/Option";
import type { LiveGameDetailPageState } from "$lib/presentation/logic/liveGameDetailPageState";

import { LIVE_GAME_DETAIL_TEXT } from "./liveGameDetailMessages";

export const LIVE_GAME_DETAIL_CONTENT_STATUS = {
  LOADING: "loading",
  FAILED: "failed",
  EMPTY: "empty",
  READY: "ready",
} as const;

export type LiveGameDetailContentState =
  | { status: typeof LIVE_GAME_DETAIL_CONTENT_STATUS.LOADING }
  | { status: typeof LIVE_GAME_DETAIL_CONTENT_STATUS.FAILED; message: string }
  | { status: typeof LIVE_GAME_DETAIL_CONTENT_STATUS.EMPTY }
  | {
      status: typeof LIVE_GAME_DETAIL_CONTENT_STATUS.READY;
      fixture: Fixture;
      home_team: Option<Team>;
      away_team: Option<Team>;
      competition_name: string;
    };

export type LiveGameDetailContentSource = Pick<
  LiveGameDetailPageState,
  | "is_loading"
  | "error_message"
  | "fixture"
  | "home_team"
  | "away_team"
  | "competition"
>;

export function to_option<TValue>(value: TValue | undefined): Option<TValue> {
  return value === void 0 ? create_none_option() : create_some_option(value);
}

export function build_live_game_detail_content_state(
  source: LiveGameDetailContentSource,
): LiveGameDetailContentState {
  if (source.is_loading) {
    return { status: LIVE_GAME_DETAIL_CONTENT_STATUS.LOADING };
  }
  if (source.error_message) {
    return {
      status: LIVE_GAME_DETAIL_CONTENT_STATUS.FAILED,
      message: source.error_message,
    };
  }
  if (!source.fixture) return { status: LIVE_GAME_DETAIL_CONTENT_STATUS.EMPTY };
  return {
    status: LIVE_GAME_DETAIL_CONTENT_STATUS.READY,
    fixture: source.fixture,
    home_team: to_option(source.home_team),
    away_team: to_option(source.away_team),
    competition_name: source.competition?.name ?? "",
  };
}

export function get_team_option_name(
  team: Option<Team>,
  fallback_name: string,
): string {
  switch (team.status) {
    case OptionStatus.SOME:
      return team.value.name;
    case OptionStatus.NONE:
      return fallback_name;
  }
}

export function get_team_option_logo(team: Option<Team>): string {
  switch (team.status) {
    case OptionStatus.SOME:
      return get_team_logo(team.value);
    case OptionStatus.NONE:
      return "";
  }
}

export function get_lineup_team_fallback_name(
  fixture_status: Fixture["status"],
  is_home: boolean,
): string {
  const is_scheduled = fixture_status === FIXTURE_STATUS.SCHEDULED;
  if (is_home) {
    return is_scheduled
      ? LIVE_GAME_DETAIL_TEXT.HOME_TEAM_FALLBACK
      : LIVE_GAME_DETAIL_TEXT.HOME_FALLBACK;
  }
  return is_scheduled
    ? LIVE_GAME_DETAIL_TEXT.AWAY_TEAM_FALLBACK
    : LIVE_GAME_DETAIL_TEXT.AWAY_FALLBACK;
}

interface LiveGameTeamLabels {
  home_name: string;
  away_name: string;
  lineup_home_name: string;
  lineup_away_name: string;
}

export function build_live_game_team_labels(
  fixture: Fixture,
  home_team: Option<Team>,
  away_team: Option<Team>,
): LiveGameTeamLabels {
  return {
    home_name: get_team_option_name(
      home_team,
      LIVE_GAME_DETAIL_TEXT.HOME_FALLBACK,
    ),
    away_name: get_team_option_name(
      away_team,
      LIVE_GAME_DETAIL_TEXT.AWAY_FALLBACK,
    ),
    lineup_home_name: get_team_option_name(
      home_team,
      get_lineup_team_fallback_name(fixture.status, true),
    ),
    lineup_away_name: get_team_option_name(
      away_team,
      get_lineup_team_fallback_name(fixture.status, false),
    ),
  };
}
