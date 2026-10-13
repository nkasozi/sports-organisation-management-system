import type { Fixture } from "../entities/Fixture";
import type { FixtureLineup } from "../entities/FixtureLineup";
import type { Result } from "../types/Result";
import { create_success_result } from "../types/Result";
import { fail_use_case, UseCaseErrorCode } from "../types/UseCaseFailure";
import type { FixtureDetailsSetupUseCases } from "../usecases/FixtureDetailsSetupUseCases";
import type { FixtureLineupUseCases } from "../usecases/FixtureLineupUseCases";
import {
  build_lineup_check,
  build_officials_check,
} from "./fixtureStartCheckBuilders";
import {
  CHECK_STATUS,
  FIXTURE_START_CHECK_NAME,
  FIXTURE_START_CHECKS_EVENT,
  FIXTURE_START_CHECKS_LOG_SCOPE,
  FIXTURE_START_CHECKS_MESSAGES,
} from "./FixtureStartChecksConstants";

export { auto_generate_lineups_if_possible } from "./fixtureLineupGeneration";
export type CheckStatus = (typeof CHECK_STATUS)[keyof typeof CHECK_STATUS];

export interface PreFlightCheck {
  check_name: string;
  status: CheckStatus;
  message: string;
  fix_suggestion: string;
}

interface FixtureCanStartResult {
  can_start: boolean;
  officials_check: PreFlightCheck;
  home_lineup_check: PreFlightCheck;
  away_lineup_check: PreFlightCheck;
}

interface StartCheckInputs {
  officials_count: number;
  lineups: FixtureLineup[];
}

function fail_start_check(
  code: UseCaseErrorCode,
  event: string,
  context: Record<string, unknown>,
  details: { user_message: string; technical_detail?: string },
): Result<never, string> {
  return fail_use_case({
    code,
    event,
    log_scope: FIXTURE_START_CHECKS_LOG_SCOPE,
    context,
    ...details,
  });
}

export async function check_fixture_can_start(
  fixture: Fixture,
  official_use_cases: FixtureDetailsSetupUseCases,
  lineup_use_cases: FixtureLineupUseCases,
): Promise<Result<FixtureCanStartResult>> {
  if (!fixture.id) {
    return fail_start_check(
      UseCaseErrorCode.MISSING_IDENTIFIER,
      FIXTURE_START_CHECKS_EVENT.MISSING_FIXTURE_ID,
      {},
      { user_message: FIXTURE_START_CHECKS_MESSAGES.MISSING_FIXTURE_ID },
    );
  }
  console.debug(FIXTURE_START_CHECKS_LOG_SCOPE, {
    event: FIXTURE_START_CHECKS_EVENT.STARTED,
    fixture_id: fixture.id,
  });
  const inputs_result = await load_start_check_inputs(
    fixture.id,
    official_use_cases,
    lineup_use_cases,
  );
  if (!inputs_result.success) return inputs_result;
  return create_success_result(
    build_fixture_can_start_result(
      fixture,
      inputs_result.data.officials_count,
      inputs_result.data.lineups,
    ),
  );
}

function count_assigned_officials(
  setups: ReadonlyArray<{
    assigned_officials?: ReadonlyArray<{ official_id: string }>;
  }>,
): number {
  return setups.reduce(
    (total: number, setup) =>
      total +
      (setup.assigned_officials ?? []).filter(
        (assignment) => assignment.official_id.length > 0,
      ).length,
    0,
  );
}

async function load_start_check_inputs(
  fixture_id: Fixture["id"],
  official_use_cases: FixtureDetailsSetupUseCases,
  lineup_use_cases: FixtureLineupUseCases,
): Promise<Result<StartCheckInputs>> {
  const officials_result = await official_use_cases.list_by_fixture(fixture_id);
  if (!officials_result.success) {
    return fail_start_check(
      UseCaseErrorCode.DEPENDENCY_FAILED,
      FIXTURE_START_CHECKS_EVENT.OFFICIALS_LOOKUP_FAILED,
      { fixture_id },
      {
        user_message: FIXTURE_START_CHECKS_MESSAGES.OFFICIALS_LOOKUP_FAILED,
        technical_detail: officials_result.error,
      },
    );
  }
  const lineups_result = await lineup_use_cases.list({ fixture_id });
  if (!lineups_result.success) {
    return fail_start_check(
      UseCaseErrorCode.DEPENDENCY_FAILED,
      FIXTURE_START_CHECKS_EVENT.LINEUPS_LOOKUP_FAILED,
      { fixture_id },
      {
        user_message: FIXTURE_START_CHECKS_MESSAGES.LINEUPS_LOOKUP_FAILED,
        technical_detail: lineups_result.error,
      },
    );
  }
  return create_success_result({
    officials_count: count_assigned_officials(officials_result.data.items),
    lineups: lineups_result.data.items,
  });
}

function build_fixture_can_start_result(
  fixture: Fixture,
  officials_count: number,
  lineups: FixtureLineup[],
): FixtureCanStartResult {
  const messages = FIXTURE_START_CHECKS_MESSAGES;
  const officials_check = build_officials_check(officials_count);
  const home_lineup_check = build_lineup_check(lineups, {
    check_name: FIXTURE_START_CHECK_NAME.HOME_LINEUP,
    team_label: messages.HOME_TEAM_LABEL,
    team_id: fixture.home_team_id,
  });
  const away_lineup_check = build_lineup_check(lineups, {
    check_name: FIXTURE_START_CHECK_NAME.AWAY_LINEUP,
    team_label: messages.AWAY_TEAM_LABEL,
    team_id: fixture.away_team_id,
  });
  const can_start = [
    officials_check,
    home_lineup_check,
    away_lineup_check,
  ].every((check) => check.status === CHECK_STATUS.PASSED);
  console.debug(FIXTURE_START_CHECKS_LOG_SCOPE, {
    event: FIXTURE_START_CHECKS_EVENT.COMPLETED,
    fixture_id: fixture.id,
    officials_count,
    can_start,
  });
  return { can_start, officials_check, home_lineup_check, away_lineup_check };
}
