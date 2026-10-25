import { PublicDataPageKind } from "$lib/infrastructure/sync/convexPublicDataTables";

import { is_game_clock_interval_running } from "./gameClockIntervalState";
import { reload_live_game_detail_fixture_bundle } from "./liveGameDetailControllerClockLoading";
import { should_resume_live_game_detail_clock } from "./liveGameDetailControllerClockSaving";
import {
  type LiveGameDetailClockContext,
  start_live_game_detail_clock,
  stop_live_game_detail_clock,
} from "./liveGameDetailControllerClockTicking";
import { build_public_organization_scope } from "./publicDataOrganizationScope";

const SPECTATOR_REFRESH_INTERVAL_MILLISECONDS = 5000;
const SPECTATOR_REFRESH_EVENT = "live_game_spectator_refreshed";

export interface SpectatorRefreshHandle {
  stop: () => void;
}

export const NOT_WATCHING: SpectatorRefreshHandle = { stop: () => {} };

export function should_watch_live_game(can_modify_game: boolean): boolean {
  return !can_modify_game;
}

async function pull_latest_public_game(
  context: LiveGameDetailClockContext,
): Promise<boolean> {
  if (!context.command.is_public_viewer()) return false;
  const fixture = context.command.get_page_state().fixture;
  if (!fixture) return false;
  const { fetch_public_data_from_convex } =
    await import("$lib/infrastructure/sync/convexPublicDataService");
  const result = await fetch_public_data_from_convex(
    PublicDataPageKind.LIVE_GAMES,
    build_public_organization_scope(String(fixture.organization_id)),
  );
  return result.success;
}

function match_clock_to_game(
  context: LiveGameDetailClockContext,
  should_run: boolean,
): boolean {
  const is_running = is_game_clock_interval_running(
    context.interval_holder.state,
  );
  if (should_run && !is_running) start_live_game_detail_clock(context);
  if (!should_run && is_running) stop_live_game_detail_clock(context);
  return should_run;
}

async function refresh_watched_live_game(
  context: LiveGameDetailClockContext,
): Promise<boolean> {
  await pull_latest_public_game(context);
  const fixture = await reload_live_game_detail_fixture_bundle(context);
  if (!fixture) return false;
  match_clock_to_game(
    context,
    should_resume_live_game_detail_clock(context, fixture),
  );
  console.debug("[LiveGameDetail] Watched game refreshed", {
    event: SPECTATOR_REFRESH_EVENT,
    fixture_id: fixture.id,
  });
  return true;
}

export function start_watching_live_game(
  context: LiveGameDetailClockContext,
): SpectatorRefreshHandle {
  if (!should_watch_live_game(context.command.get_page_state().can_modify_game))
    return NOT_WATCHING;
  const timer = setInterval(() => {
    if (document.hidden) return;
    void refresh_watched_live_game(context);
  }, SPECTATOR_REFRESH_INTERVAL_MILLISECONDS);
  return { stop: () => clearInterval(timer) };
}
