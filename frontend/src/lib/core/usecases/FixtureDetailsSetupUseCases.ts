import type {
  CreateFixtureDetailsSetupInput,
  FixtureDetailsSetup,
} from "../entities/FixtureDetailsSetup";
import { validate_fixture_details_setup_input } from "../entities/FixtureDetailsSetup";
import type { FixtureDetailsSetupRepository } from "../interfaces/ports";
import type { FixtureDetailsSetupUseCasesPort } from "../interfaces/ports";
import type { AsyncResult } from "../types/Result";
import { create_success_result } from "../types/Result";
import { fail_use_case, UseCaseErrorCode } from "../types/UseCaseFailure";
import {
  create_log_target_builder,
  fail_validation,
  relay_repository_failure,
  relay_repository_result,
} from "./FailureRelay";
import {
  decide_assignment,
  delete_existing_setup,
  update_existing_setup,
} from "./FixtureDetailsSetupAssignments";
import {
  ASSIGNMENT_DECISION,
  EXISTING_SETUP_PROBE_PAGE_SIZE,
  FIXTURE_DETAILS_SETUP_EVENT,
  FIXTURE_DETAILS_SETUP_LOG_SCOPE,
  FIXTURE_DETAILS_SETUP_MESSAGE,
} from "./FixtureDetailsSetupConstants";
import { create_fixture_details_setup_queries } from "./FixtureDetailsSetupQueries";

export type FixtureDetailsSetupUseCases = FixtureDetailsSetupUseCasesPort;

const log_target = create_log_target_builder(FIXTURE_DETAILS_SETUP_LOG_SCOPE);

async function ensure_fixture_has_no_setup(
  repository: FixtureDetailsSetupRepository,
  fixture_id: CreateFixtureDetailsSetupInput["fixture_id"],
): AsyncResult<boolean> {
  const existing_setups = await repository.find_all(
    { fixture_id },
    { page_number: 1, page_size: EXISTING_SETUP_PROBE_PAGE_SIZE },
  );
  if (!existing_setups.success)
    return relay_repository_failure(
      log_target(FIXTURE_DETAILS_SETUP_EVENT.EXISTING_CHECK_FAILED, {
        fixture_id,
      }),
      existing_setups.error,
    );
  if (existing_setups.data.items.length === 0)
    return create_success_result(true);
  return fail_use_case({
    code: UseCaseErrorCode.CONFLICT,
    ...log_target(FIXTURE_DETAILS_SETUP_EVENT.ALREADY_EXISTS, { fixture_id }),
    user_message: FIXTURE_DETAILS_SETUP_MESSAGE.ALREADY_EXISTS,
  });
}

async function create_setup(
  repository: FixtureDetailsSetupRepository,
  input: CreateFixtureDetailsSetupInput,
): AsyncResult<FixtureDetailsSetup> {
  const validation = validate_fixture_details_setup_input(input);
  if (!validation.is_valid)
    return fail_validation(
      log_target(FIXTURE_DETAILS_SETUP_EVENT.VALIDATION_FAILED),
      Object.values(validation.errors).at(0) ||
        FIXTURE_DETAILS_SETUP_MESSAGE.VALIDATION_FAILED,
    );
  const unique_result = await ensure_fixture_has_no_setup(
    repository,
    input.fixture_id,
  );
  if (!unique_result.success) return unique_result;
  return relay_repository_result(
    repository.create(input),
    log_target(FIXTURE_DETAILS_SETUP_EVENT.CREATE_FAILED, {
      fixture_id: input.fixture_id,
    }),
  );
}

export function create_fixture_details_setup_use_cases(
  repository: FixtureDetailsSetupRepository,
): FixtureDetailsSetupUseCases {
  return {
    ...create_fixture_details_setup_queries(repository),
    create: (input) => create_setup(repository, input),
    update: (id, input) => update_existing_setup(repository, id, input),
    delete: (id) => delete_existing_setup(repository, id),
    confirm_assignment: (id) =>
      decide_assignment(repository, id, ASSIGNMENT_DECISION.CONFIRM),
    decline_assignment: (id) =>
      decide_assignment(repository, id, ASSIGNMENT_DECISION.DECLINE),
  };
}
