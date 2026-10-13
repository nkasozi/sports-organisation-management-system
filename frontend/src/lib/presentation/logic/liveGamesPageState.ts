import type { Fixture } from "$lib/core/entities/Fixture";
import type { PreFlightCheck } from "$lib/core/services/fixtureStartChecks";

import type { LiveGamesStartFlowDependencies } from "./liveGamesStartFlow";

export {
  get_live_games_current_profile_state,
  get_live_games_current_role,
  get_live_games_current_token_state,
} from "./liveGamesPageAuthState";
export {
  initialize_live_games_page,
  refresh_live_games_page_fixture_state,
  refresh_live_games_page_fixture_state_result,
} from "./liveGamesPageInitialization";

export const LIVE_GAMES_PENDING_START_STATUS = {
  IDLE: "idle",
  CONFIRMING: "confirming",
} as const;

export type LiveGamesPendingStartFixtureState =
  | { status: typeof LIVE_GAMES_PENDING_START_STATUS.IDLE }
  | {
      status: typeof LIVE_GAMES_PENDING_START_STATUS.CONFIRMING;
      fixture: Fixture;
    };

interface LiveGamesPageStartFlowCommand extends Omit<
  LiveGamesStartFlowDependencies,
  "delay" | "restart" | "check_delay_ms"
> {
  check_delay_ms: number;
}

export function update_live_games_checks(
  current_checks: Record<string, PreFlightCheck[]>,
  fixture_id: string,
  checks: PreFlightCheck[],
): Record<string, PreFlightCheck[]> {
  return { ...current_checks, [fixture_id]: [...checks] };
}

export function update_live_games_starting_state(
  current_state: Record<string, boolean>,
  fixture_id: string,
  value: boolean,
): Record<string, boolean> {
  return { ...current_state, [fixture_id]: value };
}

export function wait_for_live_games_delay(milliseconds: number): Promise<void> {
  return new Promise((resolve: () => void) =>
    setTimeout(resolve, milliseconds),
  );
}

export function build_live_games_start_flow_dependencies(
  command: LiveGamesPageStartFlowCommand,
): Omit<LiveGamesStartFlowDependencies, "restart"> {
  return {
    ...command,
    delay: wait_for_live_games_delay,
  };
}
