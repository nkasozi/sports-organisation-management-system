import type { Fixture } from "$lib/core/entities/Fixture";
import type { PreFlightCheck } from "$lib/core/services/fixtureStartChecks";
import { auto_generate_lineups_if_possible } from "$lib/core/services/fixtureStartChecks";
import { CHECK_STATUS } from "$lib/core/services/FixtureStartChecksConstants";

import {
  type LiveGamesStartFlowDependencies,
  publish_checks,
  replace_last_check,
} from "./liveGamesStartFlowChecks";

type LiveGamesLineupCheckRequest = {
  fixture: Fixture;
  checks: PreFlightCheck[];
  lineup_check: PreFlightCheck;
  team_id: string;
  checking_message: string;
  auto_generate_check_name: string;
  failed_check_name: string;
  fallback_team_name: string;
  fallback_failure_message: string;
};

async function resolve_team_name(
  team_id: string,
  fallback_name: string,
  dependencies: LiveGamesStartFlowDependencies,
): Promise<string> {
  const team_result = await dependencies.team_use_cases.get_by_id(team_id);
  if (!team_result.success || !team_result.data) {
    return fallback_name;
  }

  return team_result.data.name;
}

type LineupAutoGenerationRequest = {
  fixture: Fixture;
  checks: PreFlightCheck[];
  team_id: string;
  team_name: string;
  failed_check_name: string;
  fallback_failure_message: string;
};

function request_lineup_auto_generation(
  request: LineupAutoGenerationRequest,
  dependencies: LiveGamesStartFlowDependencies,
): ReturnType<typeof auto_generate_lineups_if_possible> {
  return auto_generate_lineups_if_possible(
    request.fixture,
    request.team_id,
    request.team_name,
    dependencies.membership_use_cases,
    dependencies.player_use_cases,
    dependencies.player_position_use_cases,
    dependencies.fixture_lineup_use_cases,
    dependencies.fixture_use_cases,
    dependencies.competition_use_cases,
    dependencies.organization_use_cases,
    dependencies.sport_use_cases,
  );
}

async function auto_generate_missing_team_lineup(
  request: LineupAutoGenerationRequest,
  dependencies: LiveGamesStartFlowDependencies,
): Promise<boolean> {
  const { fixture, checks } = request;
  const auto_generate_result = await request_lineup_auto_generation(
    request,
    dependencies,
  );
  if (!auto_generate_result.success) {
    replace_last_check(checks, {
      check_name: request.failed_check_name,
      status: CHECK_STATUS.FAILED,
      message:
        auto_generate_result.error_message || request.fallback_failure_message,
      fix_suggestion: auto_generate_result.fix_suggestion || "",
    });
    dependencies.update_checks(fixture.id, checks);
    dependencies.set_is_starting(fixture.id, false);
    return false;
  }
  replace_last_check(checks, {
    check_name: request.failed_check_name,
    status: CHECK_STATUS.PASSED,
    message:
      auto_generate_result.generation_message ||
      `Auto-generated lineup for ${request.team_name}`,
    fix_suggestion: "",
  });
  await publish_checks(fixture.id, checks, dependencies);
  return true;
}

async function publish_lineup_check_progress(
  request: LiveGamesLineupCheckRequest,
  dependencies: LiveGamesStartFlowDependencies,
): Promise<boolean> {
  const { fixture, checks, lineup_check } = request;
  checks.push({
    check_name: request.failed_check_name,
    status: CHECK_STATUS.CHECKING,
    message: request.checking_message,
    fix_suggestion: "",
  });
  await publish_checks(fixture.id, checks, dependencies);
  if (lineup_check.status === CHECK_STATUS.FAILED) return false;
  replace_last_check(checks, lineup_check);
  await publish_checks(fixture.id, checks, dependencies);
  return true;
}

async function announce_lineup_auto_generation(
  fixture: Fixture,
  checks: PreFlightCheck[],
  team_name: string,
  auto_generate_check_name: string,
  dependencies: LiveGamesStartFlowDependencies,
): Promise<void> {
  checks.push({
    check_name: auto_generate_check_name,
    status: CHECK_STATUS.CHECKING,
    message: `Attempting to auto-generate lineup for ${team_name}...`,
    fix_suggestion: "",
  });
  await publish_checks(fixture.id, checks, dependencies);
}

export async function run_live_games_lineup_check(
  request: LiveGamesLineupCheckRequest,
  dependencies: LiveGamesStartFlowDependencies,
): Promise<boolean> {
  const { fixture, checks } = request;
  const lineup_check_passed = await publish_lineup_check_progress(
    request,
    dependencies,
  );
  if (lineup_check_passed) return true;
  const team_name = await resolve_team_name(
    request.team_id,
    request.fallback_team_name,
    dependencies,
  );
  await announce_lineup_auto_generation(
    fixture,
    checks,
    team_name,
    request.auto_generate_check_name,
    dependencies,
  );
  return auto_generate_missing_team_lineup(
    {
      fixture,
      checks,
      team_id: request.team_id,
      team_name,
      failed_check_name: request.failed_check_name,
      fallback_failure_message: request.fallback_failure_message,
    },
    dependencies,
  );
}
