import type {
  FixtureDetailsSetup,
  UpdateFixtureDetailsSetupInput,
} from "../entities/FixtureDetailsSetup";
import { CONFIRMATION_STATUS } from "../entities/StatusConstants";
import type { FixtureDetailsSetupRepository } from "../interfaces/ports";
import type { ScalarValueInput } from "../types/DomainScalars";
import type { AsyncResult, Result } from "../types/Result";
import { fail_use_case, UseCaseErrorCode } from "../types/UseCaseFailure";
import {
  create_log_target_builder,
  fail_missing_identifier,
  is_blank_identifier,
  relay_repository_result,
} from "./FailureRelay";
import {
  ASSIGNMENT_DECISION,
  type AssignmentDecision,
  FIXTURE_DETAILS_SETUP_EVENT,
  FIXTURE_DETAILS_SETUP_LOG_SCOPE,
  FIXTURE_DETAILS_SETUP_MESSAGE,
} from "./FixtureDetailsSetupConstants";

type SetupId = ScalarValueInput<FixtureDetailsSetup["id"]>;

const log_target = create_log_target_builder(FIXTURE_DETAILS_SETUP_LOG_SCOPE);

export function fail_missing_setup_id(): Result<never> {
  return fail_missing_identifier(
    log_target(FIXTURE_DETAILS_SETUP_EVENT.ID_MISSING),
    FIXTURE_DETAILS_SETUP_MESSAGE.ID_REQUIRED,
  );
}

async function find_existing_setup(
  repository: FixtureDetailsSetupRepository,
  id: SetupId,
): AsyncResult<FixtureDetailsSetup> {
  if (is_blank_identifier(id)) return fail_missing_setup_id();
  const existing_result = await repository.find_by_id(id);
  if (existing_result.success) return existing_result;
  return fail_use_case({
    code: UseCaseErrorCode.NOT_FOUND,
    ...log_target(FIXTURE_DETAILS_SETUP_EVENT.NOT_FOUND, { setup_id: id }),
    user_message: FIXTURE_DETAILS_SETUP_MESSAGE.NOT_FOUND,
    technical_detail: existing_result.error,
  });
}

export async function update_existing_setup(
  repository: FixtureDetailsSetupRepository,
  id: SetupId,
  input: UpdateFixtureDetailsSetupInput,
): AsyncResult<FixtureDetailsSetup> {
  const existing_result = await find_existing_setup(repository, id);
  if (!existing_result.success) return existing_result;
  return relay_repository_result(
    repository.update(id, input),
    log_target(FIXTURE_DETAILS_SETUP_EVENT.UPDATE_FAILED, { setup_id: id }),
  );
}

export async function delete_existing_setup(
  repository: FixtureDetailsSetupRepository,
  id: SetupId,
): AsyncResult<boolean> {
  const existing_result = await find_existing_setup(repository, id);
  if (!existing_result.success) return existing_result;
  return relay_repository_result(
    repository.delete_by_id(id),
    log_target(FIXTURE_DETAILS_SETUP_EVENT.DELETE_FAILED, { setup_id: id }),
  );
}

function confirmation_status_for(
  decision: AssignmentDecision,
): FixtureDetailsSetup["confirmation_status"] {
  switch (decision) {
    case ASSIGNMENT_DECISION.CONFIRM:
      return CONFIRMATION_STATUS.CONFIRMED;
    case ASSIGNMENT_DECISION.DECLINE:
      return CONFIRMATION_STATUS.DECLINED;
  }
}

export function decide_assignment(
  repository: FixtureDetailsSetupRepository,
  id: SetupId,
  decision: AssignmentDecision,
): AsyncResult<FixtureDetailsSetup> {
  return update_existing_setup(repository, id, {
    confirmation_status: confirmation_status_for(decision),
  });
}
