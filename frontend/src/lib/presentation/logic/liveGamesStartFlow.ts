import type { Fixture } from "$lib/core/entities/Fixture";
import type { PreFlightCheck } from "$lib/core/services/fixtureStartChecks";
import { check_fixture_can_start } from "$lib/core/services/fixtureStartChecks";
import { CHECK_STATUS } from "$lib/core/services/FixtureStartChecksConstants";

import { handle_missing_fixture_details } from "./liveGamesAutoSetupFlow";
import {
  type LiveGamesStartFlowDependencies,
  process_lineup_check,
  publish_checks,
  replace_last_check,
} from "./liveGamesStartFlowShared";

export type { LiveGamesStartFlowDependencies } from "./liveGamesStartFlowShared";

type FixtureStartCheckData = {
  officials_check: PreFlightCheck;
  home_lineup_check: PreFlightCheck;
  away_lineup_check: PreFlightCheck;
};

const FIXTURE_START_CHECK_OUTCOME = {
  READY: "ready",
  STOPPED: "stopped",
} as const;

type FixtureStartCheckOutcome =
  | {
      status: typeof FIXTURE_START_CHECK_OUTCOME.READY;
      data: FixtureStartCheckData;
    }
  | { status: typeof FIXTURE_START_CHECK_OUTCOME.STOPPED };

const LIVE_GAMES_ROUTE_PREFIX = "/live-games/";

async function run_fixture_start_checks(
  fixture: Fixture,
  checks: PreFlightCheck[],
  dependencies: LiveGamesStartFlowDependencies,
): Promise<FixtureStartCheckOutcome> {
  await publish_checks(fixture.id, checks, dependencies);
  const fixture_check_result = await check_fixture_can_start(
    fixture,
    dependencies.fixture_details_setup_use_cases as never,
    dependencies.fixture_lineup_use_cases as never,
  );
  if (!fixture_check_result.success) {
    replace_last_check(checks, {
      check_name: "officials",
      status: CHECK_STATUS.FAILED,
      message: fixture_check_result.error,
      fix_suggestion: "",
    });
    dependencies.update_checks(fixture.id, checks);
    dependencies.set_is_starting(fixture.id, false);
    return { status: FIXTURE_START_CHECK_OUTCOME.STOPPED };
  }
  const { officials_check } = fixture_check_result.data;
  if (
    officials_check.status === CHECK_STATUS.FAILED &&
    (await handle_missing_fixture_details(
      fixture,
      checks,
      officials_check,
      dependencies,
    ))
  )
    return { status: FIXTURE_START_CHECK_OUTCOME.STOPPED };
  replace_last_check(checks, officials_check);
  await publish_checks(fixture.id, checks, dependencies);
  return {
    status: FIXTURE_START_CHECK_OUTCOME.READY,
    data: fixture_check_result.data,
  };
}

async function process_team_lineup_checks(
  fixture: Fixture,
  checks: PreFlightCheck[],
  check_data: FixtureStartCheckData,
  dependencies: LiveGamesStartFlowDependencies,
): Promise<boolean> {
  const home_check_completed = await process_lineup_check(
    {
      fixture,
      checks,
      lineup_check: check_data.home_lineup_check,
      team_id: fixture.home_team_id,
      checking_message: "Checking home team lineup...",
      auto_generate_check_name: "auto_generate_home",
      failed_check_name: "home_lineup",
      fallback_team_name: "Home Team",
      fallback_failure_message: "Failed to auto-generate home team lineup",
    },
    dependencies,
  );
  if (!home_check_completed) return false;
  return process_lineup_check(
    {
      fixture,
      checks,
      lineup_check: check_data.away_lineup_check,
      team_id: fixture.away_team_id,
      checking_message: "Checking away team lineup...",
      auto_generate_check_name: "auto_generate_away",
      failed_check_name: "away_lineup",
      fallback_team_name: "Away Team",
      fallback_failure_message: "Failed to auto-generate away team lineup",
    },
    dependencies,
  );
}

async function finish_live_game_start(
  fixture: Fixture,
  checks: PreFlightCheck[],
  dependencies: LiveGamesStartFlowDependencies,
): Promise<void> {
  checks.push({
    check_name: "all_checks",
    status: CHECK_STATUS.PASSED,
    message: "All pre-flight checks passed! Starting game...",
    fix_suggestion: "",
  });
  await publish_checks(fixture.id, checks, dependencies);
  dependencies.set_is_starting(fixture.id, false);
  await dependencies.goto(`${LIVE_GAMES_ROUTE_PREFIX}${fixture.id}`);
}

export async function start_live_game_fixture(
  fixture: Fixture,
  dependencies: Omit<LiveGamesStartFlowDependencies, "restart">,
): Promise<void> {
  if (!fixture.id) return;
  const dependencies_with_restart: LiveGamesStartFlowDependencies = {
    ...dependencies,
    restart: async (fixture_to_restart: Fixture) => {
      await start_live_game_fixture(fixture_to_restart, dependencies);
    },
  };
  dependencies_with_restart.set_is_starting(fixture.id, true);
  dependencies_with_restart.update_checks(fixture.id, []);
  const checks: PreFlightCheck[] = [
    {
      check_name: "officials",
      status: CHECK_STATUS.CHECKING,
      message: "Checking fixture details & officials...",
      fix_suggestion: "",
    },
  ];
  const outcome = await run_fixture_start_checks(
    fixture,
    checks,
    dependencies_with_restart,
  );
  if (outcome.status === FIXTURE_START_CHECK_OUTCOME.STOPPED) return;
  const lineups_completed = await process_team_lineup_checks(
    fixture,
    checks,
    outcome.data,
    dependencies_with_restart,
  );
  if (!lineups_completed) return;
  await finish_live_game_start(fixture, checks, dependencies_with_restart);
}
