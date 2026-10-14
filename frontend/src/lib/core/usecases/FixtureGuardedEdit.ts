import type { Fixture, UpdateFixtureInput } from "../entities/Fixture";
import type { FixtureRepository } from "../interfaces/ports";
import type { ScalarValueInput } from "../types/DomainScalars";
import type { AsyncResult } from "../types/Result";
import { fail_use_case, UseCaseErrorCode } from "../types/UseCaseFailure";
import { create_log_target_builder, is_blank_identifier } from "./FailureRelay";
import { decide_fixture_edit, FIXTURE_EDIT_DECISION } from "./FixtureEditGuard";
import {
  fail_missing_fixture_id,
  find_fixture_for_event,
} from "./FixtureGameEventLookups";
import {
  plan_from_updates,
  PREVIOUS_FIXTURE_STATUS,
  update_and_emit,
} from "./FixtureGameEventUpdates";
import { FIXTURE_EVENT, FIXTURE_LOG_SCOPE } from "./FixtureUseCaseConstants";
import type { KeyedSerialExecutor } from "./KeyedSerialExecutor";

type FixtureId = ScalarValueInput<Fixture["id"]>;

const log_target = create_log_target_builder(FIXTURE_LOG_SCOPE);

async function apply_guarded_edit(
  repository: FixtureRepository,
  id: FixtureId,
  input: UpdateFixtureInput,
): AsyncResult<Fixture> {
  const fixture_result = await find_fixture_for_event(repository, id);
  if (!fixture_result.success) return fixture_result;
  const decision = decide_fixture_edit(fixture_result.data, input);
  if (decision.kind === FIXTURE_EDIT_DECISION.REJECTED)
    return fail_use_case({
      code: UseCaseErrorCode.INVALID_STATE_TRANSITION,
      ...log_target(FIXTURE_EVENT.EDIT_REJECTED, {
        fixture_id: id,
        fixture_status: fixture_result.data.status,
        requested_fields: Object.keys(input),
      }),
      user_message: decision.reason,
    });
  return update_and_emit(repository, id, plan_from_updates(decision.updates), {
    status: PREVIOUS_FIXTURE_STATUS.KNOWN,
    fixture: fixture_result.data,
  });
}

export function update_fixture_details(
  repository: FixtureRepository,
  executor: KeyedSerialExecutor,
  id: FixtureId,
  input: UpdateFixtureInput,
): AsyncResult<Fixture> {
  if (is_blank_identifier(id))
    return Promise.resolve(fail_missing_fixture_id());
  return executor.run(String(id), () =>
    apply_guarded_edit(repository, id, input),
  );
}
