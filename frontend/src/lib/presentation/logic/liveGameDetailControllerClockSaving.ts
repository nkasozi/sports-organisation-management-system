import type { Fixture } from "$lib/core/entities/Fixture";
import { derive_live_game_detail_view_state } from "$lib/presentation/logic/liveGameDetailPageDerivedState";

import {
  CLOCK_PERSIST_OUTCOME,
  type ClockPersistOutcome,
  persist_live_game_clock_state,
  should_resume_live_game_clock_on_load,
} from "./liveGameDetailClockPersistence";
import type { LiveGameDetailClockContext } from "./liveGameDetailControllerClockTicking";

function is_current_period_playing(
  context: LiveGameDetailClockContext,
): boolean {
  return derive_live_game_detail_view_state({
    page_state: context.command.get_page_state(),
    event_state: context.command.get_event_state(),
  }).is_current_period_playing;
}

export async function save_live_game_detail_clock_state(
  context: LiveGameDetailClockContext,
): Promise<ClockPersistOutcome> {
  const page_state = context.command.get_page_state();
  if (!page_state.fixture) return { status: CLOCK_PERSIST_OUTCOME.SKIPPED };
  return persist_live_game_clock_state({
    fixture_use_cases: context.command.data_dependencies.fixture_use_cases,
    fixture: page_state.fixture,
    game_clock_seconds: page_state.game_clock_seconds,
    is_clock_running: page_state.is_clock_running,
    is_current_period_playing: is_current_period_playing(context),
    now: context.now(),
  });
}

export function should_resume_live_game_detail_clock(
  context: LiveGameDetailClockContext,
  fixture: Fixture,
): boolean {
  return should_resume_live_game_clock_on_load(
    fixture,
    is_current_period_playing(context),
  );
}
