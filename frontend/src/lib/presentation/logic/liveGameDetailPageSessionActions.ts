import { create_game_event, type Fixture } from "$lib/core/entities/Fixture";
import type { SportGamePeriod } from "$lib/core/entities/Sport";
import { NO_SCORE_AWARD } from "$lib/core/entities/SportEventCatalog";
import { GAME_PERIOD } from "$lib/core/entities/StatusConstants";
import {
  end_game_session,
  start_game_session,
} from "$lib/presentation/logic/gameManageActions";
import { ensure_live_game_lineups_before_start } from "$lib/presentation/logic/liveGameDetailActions";

import {
  build_game_action_failure,
  GAME_ACTION_EVENT,
  GAME_ACTION_USER_MESSAGE,
} from "./gameActionMessages";
import { TEAM_SIDE } from "./gameEventConstants";
import { GAME_EVENT_TYPE } from "./gameEventConstants";
import type {
  FixtureUseCases,
  LiveGameDetailPageActionDependencies,
} from "./liveGameDetailPageActionTypes";

type StartLiveGameCommand = {
  allow_auto_submission: boolean;
  away_players: Parameters<typeof ensure_live_game_lineups_before_start>[2];
  away_team: Parameters<typeof ensure_live_game_lineups_before_start>[4];
  fixture: Fixture;
  home_players: Parameters<typeof ensure_live_game_lineups_before_start>[1];
  home_team: Parameters<typeof ensure_live_game_lineups_before_start>[3];
  playing_periods: SportGamePeriod[];
  reload_fixture: () => Promise<Fixture | undefined>;
} & LiveGameDetailPageActionDependencies;

type StartLiveGameResult =
  | { fixture: Fixture; success: true; toast_message: string }
  | { error_message: string; success: false };

type ActiveFixtureResult =
  | { fixture: Fixture; success: true }
  | { error_message: string; success: false };

const GAME_STARTED_TOAST_MESSAGE = "Game started! Clock is running.";
const DEFAULT_FIRST_PERIOD_ID = GAME_PERIOD.FIRST_HALF;

async function resolve_active_fixture_for_start(
  command: StartLiveGameCommand,
): Promise<ActiveFixtureResult> {
  const lineup_result = await ensure_live_game_lineups_before_start(
    command.fixture,
    command.home_players,
    command.away_players,
    command.home_team,
    command.away_team,
    command.allow_auto_submission,
    command.player_membership_use_cases,
    command.player_use_cases,
    command.fixture_lineup_use_cases,
  );
  if (!lineup_result.success)
    return { success: false, error_message: lineup_result.error_message };
  const active_fixture = lineup_result.reloaded_required
    ? await command.reload_fixture()
    : command.fixture;
  if (!active_fixture)
    return build_game_action_failure({
      event: GAME_ACTION_EVENT.RELOAD_AFTER_LINEUPS_FAILED,
      fixture_id: command.fixture.id,
      technical_error: GAME_ACTION_EVENT.RELOAD_AFTER_LINEUPS_FAILED,
      user_message: GAME_ACTION_USER_MESSAGE.RELOAD_AFTER_LINEUPS_FAILED,
    });
  return { success: true, fixture: active_fixture };
}

function resolve_first_playing_period(
  playing_periods: SportGamePeriod[],
): Fixture["current_period"] {
  return playing_periods.length > 0
    ? playing_periods[0].id
    : DEFAULT_FIRST_PERIOD_ID;
}

export async function start_live_game_detail_action(
  command: StartLiveGameCommand,
): Promise<StartLiveGameResult> {
  const active_fixture_result = await resolve_active_fixture_for_start(command);
  if (!active_fixture_result.success) return active_fixture_result;
  const start_result = await start_game_session(
    active_fixture_result.fixture.id,
    command.fixture_use_cases,
    resolve_first_playing_period(command.playing_periods),
  );
  if (!start_result.success)
    return build_game_action_failure({
      event: GAME_ACTION_EVENT.START_GAME_FAILED,
      fixture_id: active_fixture_result.fixture.id,
      technical_error: start_result.error,
      user_message: GAME_ACTION_USER_MESSAGE.START_GAME_FAILED,
    });
  return {
    success: true,
    fixture: start_result.data,
    toast_message: GAME_STARTED_TOAST_MESSAGE,
  };
}

type EndLiveGameCommand = {
  away_score: number;
  elapsed_minutes: number;
  fixture: Fixture;
  fixture_use_cases: FixtureUseCases;
  home_score: number;
};

function record_final_whistle(
  command: EndLiveGameCommand,
): ReturnType<FixtureUseCases["record_game_event"]> {
  return command.fixture_use_cases.record_game_event(
    command.fixture.id,
    create_game_event(
      GAME_EVENT_TYPE.PERIOD_END,
      command.elapsed_minutes,
      TEAM_SIDE.MATCH,
      "",
      `Match ended. Final score: ${command.home_score}-${command.away_score}`,
    ),
    NO_SCORE_AWARD,
  );
}

export async function end_live_game_detail_action(
  command: EndLiveGameCommand,
): Promise<
  | { fixture: Fixture; success: true }
  | { error_message: string; success: false }
> {
  const record_result = await record_final_whistle(command);
  if (!record_result.success)
    return build_game_action_failure({
      event: GAME_ACTION_EVENT.END_GAME_EVENT_RECORD_FAILED,
      fixture_id: command.fixture.id,
      technical_error: record_result.error,
      user_message: GAME_ACTION_USER_MESSAGE.END_GAME_FAILED,
    });
  const result = await end_game_session(
    command.fixture.id,
    command.fixture_use_cases,
  );
  return result.success
    ? { success: true, fixture: result.data }
    : build_game_action_failure({
        event: GAME_ACTION_EVENT.END_GAME_FAILED,
        fixture_id: command.fixture.id,
        technical_error: result.error,
        user_message: GAME_ACTION_USER_MESSAGE.END_GAME_FAILED,
      });
}
