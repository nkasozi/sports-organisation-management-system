import { create_game_event, type Fixture } from "$lib/core/entities/Fixture";
import type { SportGamePeriod } from "$lib/core/entities/Sport";
import type { Team } from "$lib/core/entities/Team";
import {
  end_game_session,
  start_game_session,
} from "$lib/presentation/logic/gameManageActions";
import { ensure_live_game_lineups_before_start } from "$lib/presentation/logic/liveGameDetailActions";

import type {
  FixtureUseCases,
  LiveGameDetailPageActionDependencies,
} from "./liveGameDetailPageActionTypes";

export async function start_live_game_detail_action(
  command: {
    allow_auto_submission: boolean;
    away_players: Parameters<typeof ensure_live_game_lineups_before_start>[2];
    away_team: Team | null;
    fixture: Fixture;
    home_players: Parameters<typeof ensure_live_game_lineups_before_start>[1];
    home_team: Team | null;
    playing_periods: SportGamePeriod[];
    reload_fixture: () => Promise<Fixture | null>;
  } & LiveGameDetailPageActionDependencies,
): Promise<
  | { fixture: Fixture; success: true; toast_message: string }
  | { error_message: string; success: false }
> {
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
    return {
      success: false,
      error_message: "Failed to reload fixture after generating lineups.",
    };
  const start_result = await start_game_session(
    active_fixture.id,
    command.fixture_use_cases,
  );
  if (!start_result.success)
    return {
      success: false,
      error_message: `Failed to start game: ${start_result.error}`,
    };
  const first_period_id = command.playing_periods[0]?.id ?? "first_half";
  if (first_period_id === "first_half")
    return {
      success: true,
      fixture: start_result.data,
      toast_message: "Game started! Clock is running.",
    };
  const period_result = await command.fixture_use_cases.update_period(
    start_result.data.id,
    first_period_id,
    0,
  );
  return {
    success: true,
    fixture: period_result.success
      ? ({ ...start_result.data, current_period: first_period_id } as Fixture)
      : start_result.data,
    toast_message: "Game started! Clock is running.",
  };
}

export async function end_live_game_detail_action(command: {
  away_score: number;
  elapsed_minutes: number;
  fixture: Fixture;
  fixture_use_cases: FixtureUseCases;
  home_score: number;
}): Promise<
  | { fixture: Fixture; success: true }
  | { error_message: string; success: false }
> {
  await command.fixture_use_cases.record_game_event(
    command.fixture.id,
    create_game_event(
      "period_end",
      command.elapsed_minutes,
      "match",
      "",
      `Match ended. Final score: ${command.home_score}-${command.away_score}`,
    ),
  );
  const result = await end_game_session(
    command.fixture.id,
    command.fixture_use_cases,
  );
  return result.success
    ? { success: true, fixture: result.data }
    : { success: false, error_message: `Failed to end game: ${result.error}` };
}
