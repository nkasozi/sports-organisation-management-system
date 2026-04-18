import type { Fixture } from "$lib/core/entities/Fixture";
import { auto_create_fixture_details_setup } from "$lib/core/services/fixtureDetailsAutoSetup";
import type { PreFlightCheck } from "$lib/core/services/fixtureStartChecks";

import {
  type LiveGamesStartFlowDependencies,
  publish_checks,
  replace_last_check,
} from "./liveGamesStartFlowShared";

const FIXTURE_DETAILS_ROUTE = "/fixture-details-setup";
const DEFAULT_ROLE = "player";

export async function handle_missing_fixture_details(
  fixture: Fixture,
  checks: PreFlightCheck[],
  officials_check: PreFlightCheck,
  dependencies: LiveGamesStartFlowDependencies,
): Promise<boolean> {
  replace_last_check(checks, {
    check_name: "officials",
    status: "failed",
    message: "No assigned fixture details found",
    fix_suggestion: "",
  });
  await publish_checks(fixture.id, checks, dependencies);

  const competition_result = await dependencies.competition_use_cases.get_by_id(
    fixture.competition_id,
  );
  const competition_allows_auto_setup = Boolean(
    competition_result.success &&
    competition_result.data?.allow_auto_fixture_details_setup,
  );
  if (!competition_allows_auto_setup) {
    replace_last_check(checks, officials_check);
    dependencies.update_checks(fixture.id, checks);
    dependencies.set_is_starting(fixture.id, false);
    return true;
  }

  checks.push({
    check_name: "auto_setup_check",
    status: "passed",
    message: "Auto Fixture Details Setup is enabled for this competition",
    fix_suggestion: "",
  });
  await publish_checks(fixture.id, checks, dependencies);

  const current_role = dependencies.get_current_role() || DEFAULT_ROLE;
  if (dependencies.can_access_route(current_role, FIXTURE_DETAILS_ROUTE)) {
    checks.push({
      check_name: "redirect",
      status: "checking",
      message: "Redirecting you to confirm Fixture Details...",
      fix_suggestion: "",
    });
    await publish_checks(fixture.id, checks, dependencies);
    dependencies.set_is_starting(fixture.id, false);
    await dependencies.goto(
      `${FIXTURE_DETAILS_ROUTE}?fixture_id=${fixture.id}`,
    );
    return true;
  }

  checks.push({
    check_name: "silent_create",
    status: "checking",
    message: "Auto-creating fixture details in the background...",
    fix_suggestion: "",
  });
  dependencies.update_checks(fixture.id, checks);
  const auto_create_result = await auto_create_fixture_details_setup(fixture, {
    fixture_details_setup_use_cases:
      dependencies.fixture_details_setup_use_cases,
    jersey_color_use_cases: dependencies.jersey_color_use_cases,
    official_use_cases: dependencies.official_use_cases,
    game_official_role_use_cases: dependencies.game_official_role_use_cases,
  });

  if (!auto_create_result.success) {
    replace_last_check(checks, {
      check_name: "silent_create",
      status: "failed",
      message: `Failed to auto-create fixture details: ${auto_create_result.error}`,
      fix_suggestion:
        "Contact an administrator to set up fixture details for this game",
    });
    dependencies.update_checks(fixture.id, checks);
    dependencies.set_is_starting(fixture.id, false);
    return true;
  }

  replace_last_check(checks, {
    check_name: "silent_create",
    status: "passed",
    message: "Fixture details auto-created successfully",
    fix_suggestion: "",
  });
  await publish_checks(fixture.id, checks, dependencies);
  dependencies.set_is_starting(fixture.id, false);
  await dependencies.restart(fixture);
  return true;
}
