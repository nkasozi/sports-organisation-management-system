import type { Fixture } from "../entities/Fixture";
import type { FixtureRepository } from "../interfaces/ports";
import type { ScalarValueInput } from "../types/DomainScalars";
import type { AsyncResult, Result } from "../types/Result";
import { fail_use_case, UseCaseErrorCode } from "../types/UseCaseFailure";
import {
  create_log_target_builder,
  fail_missing_identifier,
} from "./FailureRelay";
import {
  FIXTURE_EVENT,
  FIXTURE_LOG_SCOPE,
  FIXTURE_MESSAGE,
} from "./FixtureUseCaseConstants";

type FixtureId = ScalarValueInput<Fixture["id"]>;

const log_target = create_log_target_builder(FIXTURE_LOG_SCOPE);

export function fail_missing_fixture_id(): Result<never> {
  return fail_missing_identifier(
    log_target(FIXTURE_EVENT.ID_MISSING),
    FIXTURE_MESSAGE.ID_REQUIRED,
  );
}

export async function find_fixture_for_event(
  repository: FixtureRepository,
  id: FixtureId,
): AsyncResult<Fixture> {
  const fixture_result = await repository.find_by_id(id);
  if (fixture_result.success) return fixture_result;
  return fail_use_case({
    code: UseCaseErrorCode.NOT_FOUND,
    ...log_target(FIXTURE_EVENT.NOT_FOUND, { fixture_id: id }),
    user_message: FIXTURE_MESSAGE.NOT_FOUND,
    technical_detail: fixture_result.error,
  });
}
