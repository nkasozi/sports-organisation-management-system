import type { Fixture } from "$lib/core/entities/Fixture";
import type { PreFlightCheck } from "$lib/core/services/fixtureStartChecks";
import { auto_generate_lineups_if_possible } from "$lib/core/services/fixtureStartChecks";

type TeamLookupResult = Promise<{ success: boolean; data?: { name: string } }>;
type CompetitionLookupResult = Promise<{
  success: boolean;
  data?: { allow_auto_fixture_details_setup?: boolean };
}>;

export interface LiveGamesStartFlowDependencies {
  fixture_details_setup_use_cases: unknown;
  fixture_lineup_use_cases: unknown;
  membership_use_cases: unknown;
  player_use_cases: unknown;
  player_position_use_cases: unknown;
  fixture_use_cases: unknown;
  team_use_cases: { get_by_id(team_id: string): TeamLookupResult };
  sport_use_cases: unknown;
  competition_use_cases: { get_by_id(competition_id: string): CompetitionLookupResult };
  organization_use_cases: unknown;
  jersey_color_use_cases: unknown;
  official_use_cases: unknown;
  game_official_role_use_cases: unknown;
  goto(path: string): Promise<void>;
  get_current_role(): string;
  can_access_route(role: string, route: string): boolean;
  update_checks(fixture_id: string, checks: PreFlightCheck[]): void;
  set_is_starting(fixture_id: string, is_starting: boolean): void;
  delay(milliseconds: number): Promise<void>;
  check_delay_ms: number;
  restart(fixture: Fixture): Promise<void>;
}

export function replace_last_check(
  checks: PreFlightCheck[],
  next_check: PreFlightCheck,
): void {
  checks[checks.length - 1] = next_check;
}

export async function publish_checks(
  fixture_id: string,
  checks: PreFlightCheck[],
  dependencies: LiveGamesStartFlowDependencies,
): Promise<void> {
  dependencies.update_checks(fixture_id, checks);
  await dependencies.delay(dependencies.check_delay_ms);
}

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

export async function process_lineup_check(
  fixture: Fixture,
  checks: PreFlightCheck[],
  lineup_check: PreFlightCheck,
  team_id: string,
  checking_message: string,
  auto_generate_check_name: string,
  failed_check_name: string,
  fallback_team_name: string,
  fallback_failure_message: string,
  dependencies: LiveGamesStartFlowDependencies,
): Promise<boolean> {
  checks.push({
    check_name: failed_check_name,
    status: "checking",
    message: checking_message,
    fix_suggestion: null,
  });
  await publish_checks(fixture.id, checks, dependencies);

  if (lineup_check.status !== "failed") {
    replace_last_check(checks, lineup_check);
    await publish_checks(fixture.id, checks, dependencies);
    return true;
  }

  const team_name = await resolve_team_name(
    team_id,
    fallback_team_name,
    dependencies,
  );
  checks.push({
    check_name: auto_generate_check_name,
    status: "checking",
    message: `Attempting to auto-generate lineup for ${team_name}...`,
    fix_suggestion: null,
  });
  await publish_checks(fixture.id, checks, dependencies);

  const auto_generate_result = await auto_generate_lineups_if_possible(
    fixture,
    team_id,
    team_name,
    dependencies.membership_use_cases,
    dependencies.player_use_cases,
    dependencies.player_position_use_cases,
    dependencies.fixture_lineup_use_cases,
    dependencies.fixture_use_cases,
    dependencies.competition_use_cases,
    dependencies.organization_use_cases,
    dependencies.sport_use_cases,
  );

  if (!auto_generate_result.success) {
    replace_last_check(checks, {
      check_name: failed_check_name,
      status: "failed",
      message:
        auto_generate_result.error_message || fallback_failure_message,
      fix_suggestion: (auto_generate_result.fix_suggestion || null) as
        | string
        | null,
    });
    dependencies.update_checks(fixture.id, checks);
    dependencies.set_is_starting(fixture.id, false);
    return false;
  }

  replace_last_check(checks, {
    check_name: failed_check_name,
    status: "passed",
    message:
      auto_generate_result.generation_message ||
      `Auto-generated lineup for ${team_name}`,
    fix_suggestion: null,
  });
  await publish_checks(fixture.id, checks, dependencies);
  return true;
}