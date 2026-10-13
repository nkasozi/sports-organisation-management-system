import { is_verification_change_permitted } from "$convex/shared_verification_policy";
import type { DataAction, RecordOwners } from "$lib/core/interfaces/ports";
import {
  ENTITY_PERMISSION_SCOPE,
  type EntityPermissionScope,
  is_entity_action_permitted_for_record,
  resolve_entity_permission_scope,
} from "$lib/core/interfaces/ports";
import type { Result } from "$lib/core/types/Result";
import { create_success_result } from "$lib/core/types/Result";
import { UseCaseErrorCode } from "$lib/core/types/UseCaseFailure";

import {
  IDENTIFICATION_ENTITY_TYPE,
  IDENTIFICATION_USE_CASES_LOG_SCOPE,
  IdentificationUseCaseEvent,
  IdentificationUseCaseMessage,
} from "./IdentificationUseCasesConstants";
import { fail_with_message } from "./UseCaseResultGuards";

export const IdentificationActorStatus = {
  AVAILABLE: "available",
  ANONYMOUS: "anonymous",
} as const;

export type IdentificationActor =
  | {
      status: typeof IdentificationActorStatus.AVAILABLE;
      role: string;
      owners: RecordOwners;
    }
  | { status: typeof IdentificationActorStatus.ANONYMOUS };

export type IdentificationActorProvider = () => IdentificationActor;

export const ANONYMOUS_IDENTIFICATION_ACTOR: IdentificationActor = {
  status: IdentificationActorStatus.ANONYMOUS,
};

interface IdentificationWriteAccessCheck {
  actor: IdentificationActor;
  action: DataAction;
  records: readonly object[];
  incoming_record: object;
  existing_record: object;
}

function to_field_view(record: object): Readonly<Record<string, unknown>> {
  return Object.fromEntries(Object.entries(record));
}

export function resolve_identification_actor_scope(
  actor: IdentificationActor,
  action: DataAction,
): EntityPermissionScope {
  switch (actor.status) {
    case IdentificationActorStatus.ANONYMOUS:
      return ENTITY_PERMISSION_SCOPE.ALL_RECORDS;
    case IdentificationActorStatus.AVAILABLE:
      return resolve_entity_permission_scope(
        actor.role,
        IDENTIFICATION_ENTITY_TYPE,
        action,
      );
  }
}

function deny_identification_write(
  event: string,
  user_message: string,
  check: IdentificationWriteAccessCheck,
): Result<never, string> {
  return fail_with_message(
    {
      log_scope: IDENTIFICATION_USE_CASES_LOG_SCOPE,
      event,
      context: { action: check.action },
      user_message,
    },
    UseCaseErrorCode.PERMISSION_DENIED,
  );
}

function is_scope_satisfied(
  check: IdentificationWriteAccessCheck & {
    actor: Extract<
      IdentificationActor,
      { status: typeof IdentificationActorStatus.AVAILABLE }
    >;
  },
): boolean {
  return check.records.every((record) =>
    is_entity_action_permitted_for_record({
      role: check.actor.role,
      entity_type: IDENTIFICATION_ENTITY_TYPE,
      action: check.action,
      record: to_field_view(record),
      owners: check.actor.owners,
    }),
  );
}

export function check_identification_write_access(
  check: IdentificationWriteAccessCheck,
): Result<true> {
  if (check.actor.status === IdentificationActorStatus.ANONYMOUS)
    return create_success_result(true);
  const actor_check = { ...check, actor: check.actor };
  if (!is_scope_satisfied(actor_check))
    return deny_identification_write(
      IdentificationUseCaseEvent.WRITE_OUTSIDE_OWN_SCOPE,
      IdentificationUseCaseMessage.OWN_RECORDS_ONLY,
      check,
    );
  return is_verification_change_permitted(
    check.actor.role,
    to_field_view(check.incoming_record),
    to_field_view(check.existing_record),
  )
    ? create_success_result(true)
    : deny_identification_write(
        IdentificationUseCaseEvent.VERIFICATION_CHANGE_BLOCKED,
        IdentificationUseCaseMessage.VERIFICATION_ADMIN_ONLY,
        check,
      );
}
