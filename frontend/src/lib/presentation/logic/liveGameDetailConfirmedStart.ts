import { FIXTURE_STATUS } from "$lib/core/entities/StatusConstants";

import type { LiveGameDetailPageState } from "./liveGameDetailPageState";

const LIVE_GAMES_ROUTE_PREFIX = "/live-games/";
const START_CONFIRMED_PARAMETER = "start_confirmed";
const START_CONFIRMED_VALUE = "true";
const CONFIRMED_START_LOG_SCOPE = "[LiveGameDetail] Confirmed start";
const CONFIRMED_START_EVENT = {
  STARTED: "live_game_confirmed_start_started",
  SKIPPED: "live_game_confirmed_start_skipped",
} as const;

interface ConfirmedLiveGameStartCommand {
  search_parameters: URLSearchParams;
  get_page_state: () => Pick<LiveGameDetailPageState, "fixture">;
  start_game: () => Promise<void>;
  clear_request: () => Promise<unknown>;
}

export function build_confirmed_live_game_url(fixture_id: string): string {
  const parameters = new URLSearchParams({
    [START_CONFIRMED_PARAMETER]: START_CONFIRMED_VALUE,
  });
  return `${LIVE_GAMES_ROUTE_PREFIX}${fixture_id}?${parameters.toString()}`;
}

function is_start_confirmed(search_parameters: URLSearchParams): boolean {
  return (
    search_parameters.get(START_CONFIRMED_PARAMETER) === START_CONFIRMED_VALUE
  );
}

export async function start_confirmed_live_game_if_requested(
  command: ConfirmedLiveGameStartCommand,
): Promise<boolean> {
  if (!is_start_confirmed(command.search_parameters)) return false;
  const { fixture } = command.get_page_state();
  if (!fixture) return false;
  await command.clear_request();
  if (fixture.status !== FIXTURE_STATUS.SCHEDULED) {
    console.info(CONFIRMED_START_LOG_SCOPE, {
      event: CONFIRMED_START_EVENT.SKIPPED,
      fixture_id: fixture.id,
      fixture_status: fixture.status,
    });
    return false;
  }
  console.info(CONFIRMED_START_LOG_SCOPE, {
    event: CONFIRMED_START_EVENT.STARTED,
    fixture_id: fixture.id,
  });
  await command.start_game();
  return true;
}
