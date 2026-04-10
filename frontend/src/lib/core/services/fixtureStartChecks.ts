import type { Fixture } from "../entities/Fixture";
import type { FixtureLineup } from "../entities/FixtureLineup";
import { LINEUP_STATUS } from "../entities/StatusConstants";
import type { Result } from "../types/Result";
import { create_failure_result, create_success_result } from "../types/Result";
import type { FixtureDetailsSetupUseCases } from "../usecases/FixtureDetailsSetupUseCases";
import type { FixtureLineupUseCases } from "../usecases/FixtureLineupUseCases";

export { auto_generate_lineups_if_possible } from "./fixtureLineupGeneration";
export type CheckStatus = "pending" | "checking" | "passed" | "failed";

export interface PreFlightCheck {
  check_name: string;
  status: CheckStatus;
  message: string;
  fix_suggestion: string | null;
}

interface FixtureCanStartResult {
  can_start: boolean;
  officials_check: PreFlightCheck;
  home_lineup_check: PreFlightCheck;
  away_lineup_check: PreFlightCheck;
}

export async function check_fixture_can_start(
  fixture: Fixture,
  official_use_cases: FixtureDetailsSetupUseCases,
  lineup_use_cases: FixtureLineupUseCases,
): Promise<Result<FixtureCanStartResult>> {
  if (!fixture.id) return create_failure_result("Fixture must have an ID");

  console.log("[fixtureStartChecks] Checking fixture:", {
    event: "fixture_start_check",
    fixture_id: fixture.id,
  });
  const officials_result = await official_use_cases.list_by_fixture(fixture.id);
  const officials =
    officials_result.success && officials_result.data
      ? officials_result.data.items
      : [];
  console.log("[fixtureStartChecks] Officials fetched:", {
    event: "officials_fetched",
    count: officials.length,
  });

  const officials_check = build_officials_check(officials);
  const lineups_result = await lineup_use_cases.list({
    fixture_id: fixture.id,
  });
  const lineups = lineups_result.success ? lineups_result.data.items : [];

  const home_lineup = lineups.find(
    (l: FixtureLineup) => l.team_id === fixture.home_team_id,
  );
  const away_lineup = lineups.find(
    (l: FixtureLineup) => l.team_id === fixture.away_team_id,
  );
  const home_lineup_check = build_lineup_check(
    "home_lineup",
    "Home",
    home_lineup,
  );
  const away_lineup_check = build_lineup_check(
    "away_lineup",
    "Away",
    away_lineup,
  );

  return create_success_result({
    can_start:
      officials_check.status === "passed" &&
      home_lineup_check.status === "passed" &&
      away_lineup_check.status === "passed",
    officials_check,
    home_lineup_check,
    away_lineup_check,
  });
}

function build_officials_check(officials: unknown[]): PreFlightCheck {
  const has_officials = officials.length > 0;
  return {
    check_name: "officials",
    status: has_officials ? "passed" : "failed",
    message: has_officials
      ? `${officials.length} official(s) assigned`
      : "No officials assigned to this fixture",
    fix_suggestion: has_officials
      ? null
      : "Go to the Fixture Details Setup page and assign officials, team jerseys and official jerseys for this fixture",
  };
}

function build_lineup_check(
  check_name: string,
  team_label: string,
  lineup: FixtureLineup | undefined,
): PreFlightCheck {
  const is_submitted =
    lineup &&
    (lineup.status === LINEUP_STATUS.SUBMITTED ||
      lineup.status === LINEUP_STATUS.LOCKED);
  if (is_submitted) {
    return {
      check_name,
      status: "passed",
      message: `${team_label} team lineup submitted with ${lineup.selected_players.length} players`,
      fix_suggestion: null,
    };
  }
  const message = lineup
    ? `${team_label} team lineup exists but not submitted (status: ${lineup.status})`
    : `No ${team_label.toLowerCase()} team lineup found`;
  return {
    check_name,
    status: "failed",
    message,
    fix_suggestion: "Submit the lineup in Team Fixture Lineups page",
  };
}
