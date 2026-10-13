import type {
  Activity,
  CreateActivityInput,
  UpdateActivityInput,
} from "../entities/Activity";
import {
  can_delete_activity,
  can_edit_activity,
  validate_activity_input,
} from "../entities/Activity";
import type { ActivityRepository } from "../interfaces/ports";
import type { ScalarValueInput } from "../types/DomainScalars";
import type { AsyncResult } from "../types/Result";
import { create_success_result } from "../types/Result";
import { fail_use_case, UseCaseErrorCode } from "../types/UseCaseFailure";
import {
  ACTIVITY_EVENT,
  ACTIVITY_LOG_SCOPE,
  ACTIVITY_MESSAGE,
} from "./ActivityUseCaseConstants";
import {
  create_log_target_builder,
  fail_missing_identifier,
  fail_validation,
  is_blank_identifier,
  relay_repository_failure,
  relay_repository_result,
} from "./FailureRelay";

type ActivityId = ScalarValueInput<Activity["id"]>;

interface ManualActivityGuard {
  is_allowed: (activity: Activity) => boolean;
  blocked_event: string;
  blocked_message: string;
}

const log_target = create_log_target_builder(ACTIVITY_LOG_SCOPE);

const EDIT_GUARD: ManualActivityGuard = {
  is_allowed: can_edit_activity,
  blocked_event: ACTIVITY_EVENT.EDIT_BLOCKED,
  blocked_message: ACTIVITY_MESSAGE.EDIT_BLOCKED,
};

const DELETE_GUARD: ManualActivityGuard = {
  is_allowed: can_delete_activity,
  blocked_event: ACTIVITY_EVENT.DELETE_BLOCKED,
  blocked_message: ACTIVITY_MESSAGE.DELETE_BLOCKED,
};

export function fail_missing_activity_id(): ReturnType<
  typeof fail_missing_identifier
> {
  return fail_missing_identifier(
    log_target(ACTIVITY_EVENT.ID_MISSING),
    ACTIVITY_MESSAGE.ID_REQUIRED,
  );
}

async function find_modifiable_activity(
  repository: ActivityRepository,
  id: ActivityId,
  guard: ManualActivityGuard,
): AsyncResult<Activity> {
  if (is_blank_identifier(id)) return fail_missing_activity_id();
  const existing_result = await repository.find_by_id(id);
  if (!existing_result.success)
    return relay_repository_failure(
      log_target(ACTIVITY_EVENT.LOOKUP_FAILED, { activity_id: id }),
      existing_result.error,
    );
  if (guard.is_allowed(existing_result.data))
    return create_success_result(existing_result.data);
  return fail_use_case({
    code: UseCaseErrorCode.PERMISSION_DENIED,
    ...log_target(guard.blocked_event, {
      activity_id: id,
      source_type: existing_result.data.source_type,
    }),
    user_message: guard.blocked_message,
  });
}

export async function create_activity(
  repository: ActivityRepository,
  input: CreateActivityInput,
): AsyncResult<Activity> {
  const validation = validate_activity_input(input);
  if (!validation.is_valid)
    return fail_validation(
      log_target(ACTIVITY_EVENT.VALIDATION_FAILED),
      Object.values(validation.errors).join(", "),
    );
  return relay_repository_result(
    repository.create(input),
    log_target(ACTIVITY_EVENT.CREATE_FAILED),
  );
}

export async function update_activity(
  repository: ActivityRepository,
  id: ActivityId,
  input: UpdateActivityInput,
): AsyncResult<Activity> {
  const activity_result = await find_modifiable_activity(
    repository,
    id,
    EDIT_GUARD,
  );
  if (!activity_result.success) return activity_result;
  return relay_repository_result(
    repository.update(id, input),
    log_target(ACTIVITY_EVENT.UPDATE_FAILED, { activity_id: id }),
  );
}

export async function delete_activity(
  repository: ActivityRepository,
  id: ActivityId,
): AsyncResult<boolean> {
  const activity_result = await find_modifiable_activity(
    repository,
    id,
    DELETE_GUARD,
  );
  if (!activity_result.success) return activity_result;
  return relay_repository_result(
    repository.delete_by_id(id),
    log_target(ACTIVITY_EVENT.DELETE_FAILED, { activity_id: id }),
  );
}
