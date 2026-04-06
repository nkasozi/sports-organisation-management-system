import type { Fixture } from "$lib/core/entities/Fixture";
import type { PreFlightCheck } from "$lib/core/services/fixtureStartChecks";
import { check_fixture_can_start } from "$lib/core/services/fixtureStartChecks";
import { handle_missing_fixture_details } from "./liveGamesAutoSetupFlow";
import {
  process_lineup_check,
  publish_checks,
  replace_last_check,
  type LiveGamesStartFlowDependencies,
} from "./liveGamesStartFlowShared";

export type { LiveGamesStartFlowDependencies } from "./liveGamesStartFlowShared";

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
      status: "checking",
      message: "Checking fixture details & officials...",
      fix_suggestion: null,
    },
  ];
  await publish_checks(fixture.id, checks, dependencies_with_restart);

  const fixture_check_result = await check_fixture_can_start(
    fixture,
    dependencies.fixture_details_setup_use_cases as never,
    dependencies.fixture_lineup_use_cases as never,
  );
  if (!fixture_check_result.success) {
    replace_last_check(checks, {
      check_name: "officials",
      status: "failed",
      message: fixture_check_result.error,
      fix_suggestion: null,
    });
    dependencies_with_restart.update_checks(fixture.id, checks);
    dependencies_with_restart.set_is_starting(fixture.id, false);
    return;
  }

  const { officials_check, home_lineup_check, away_lineup_check } =
    fixture_check_result.data;
  if (officials_check.status === "failed") {
    const handled = await handle_missing_fixture_details(
      fixture,
      checks,
      officials_check,
      dependencies_with_restart,
    );
    if (handled) return;
  }

  replace_last_check(checks, officials_check);
  await publish_checks(fixture.id, checks, dependencies_with_restart);

  const home_check_completed = await process_lineup_check(
    fixture,
    checks,
    home_lineup_check,
    fixture.home_team_id,
    "Checking home team lineup...",
    "auto_generate_home",
    "home_lineup",
    "Home Team",
    "Failed to auto-generate home team lineup",
    dependencies_with_restart,
  );
  if (!home_check_completed) return;

  const away_check_completed = await process_lineup_check(
    fixture,
    checks,
    away_lineup_check,
    fixture.away_team_id,
    "Checking away team lineup...",
    "auto_generate_away",
    "away_lineup",
    "Away Team",
    "Failed to auto-generate away team lineup",
    dependencies_with_restart,
  );
  if (!away_check_completed) return;

  checks.push({
    check_name: "all_checks",
    status: "passed",
    message: "All pre-flight checks passed! Starting game...",
    fix_suggestion: null,
  });
  await publish_checks(fixture.id, checks, dependencies_with_restart);
  dependencies_with_restart.set_is_starting(fixture.id, false);
  await dependencies_with_restart.goto(`/live-games/${fixture.id}`);
}