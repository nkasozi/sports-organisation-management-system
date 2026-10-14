import type { FixtureLineup } from "../entities/FixtureLineup";
import type { FixtureStatusValue } from "../entities/StatusConstants";
import type { FixtureRepository } from "../interfaces/ports";
import type { AsyncResult } from "../types/Result";
import { create_success_result } from "../types/Result";
import { fail_use_case, UseCaseErrorCode } from "../types/UseCaseFailure";
import { create_log_target_builder } from "./FailureRelay";
import {
  FIXTURE_LINEUP_EVENT,
  FIXTURE_LINEUP_LOG_SCOPE,
  FIXTURE_LINEUP_MESSAGE,
} from "./FixtureLineupConstants";

const log_target = create_log_target_builder(FIXTURE_LINEUP_LOG_SCOPE);

export async function find_lineup_fixture_status(
  fixture_repository: FixtureRepository,
  lineup: FixtureLineup,
): AsyncResult<FixtureStatusValue> {
  const fixture_result = await fixture_repository.find_by_id(lineup.fixture_id);
  if (fixture_result.success)
    return create_success_result(fixture_result.data.status);
  return fail_use_case({
    code: UseCaseErrorCode.DEPENDENCY_FAILED,
    ...log_target(FIXTURE_LINEUP_EVENT.FIXTURE_LOOKUP_FAILED, {
      lineup_id: lineup.id,
      fixture_id: lineup.fixture_id,
    }),
    user_message: FIXTURE_LINEUP_MESSAGE.FIXTURE_LOOKUP_FAILED,
    technical_detail: fixture_result.error,
  });
}
