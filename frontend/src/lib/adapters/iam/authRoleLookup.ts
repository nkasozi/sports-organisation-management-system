import type {
  SystemUserRepository,
  UserRole,
} from "$lib/core/interfaces/ports";
import { USER_ROLE_DISPLAY_NAMES } from "$lib/core/interfaces/ports";
import type {
  EmailAddress,
  ScalarValueInput,
} from "$lib/core/types/DomainScalars";

import { ENTITY_STATUS } from "../../core/entities/StatusConstants";
import { IAM_LOG_EVENT, IAM_MESSAGE } from "./iamConstants";

export const ROLE_LOOKUP_STATUS = {
  FOUND: "found",
  USER_REJECTED: "user_rejected",
  LOOKUP_FAILED: "lookup_failed",
} as const;

type RoleLookupOutcome =
  | { status: typeof ROLE_LOOKUP_STATUS.FOUND; role: UserRole }
  | { status: typeof ROLE_LOOKUP_STATUS.USER_REJECTED; message: string }
  | { status: typeof ROLE_LOOKUP_STATUS.LOOKUP_FAILED; message: string };

function is_known_user_role(value: string): value is UserRole {
  return value in USER_ROLE_DISPLAY_NAMES;
}

function reject_user(event: string, user_id: string): RoleLookupOutcome {
  console.warn("[LocalAuthorizationAdapter] Role lookup rejected user", {
    event,
    user_id,
  });
  return {
    status: ROLE_LOOKUP_STATUS.USER_REJECTED,
    message: IAM_MESSAGE.ACCESS_DENIED,
  };
}

export async function lookup_role_for_email(
  system_user_repository: SystemUserRepository,
  email: ScalarValueInput<EmailAddress>,
): Promise<RoleLookupOutcome> {
  const user_result = await system_user_repository.find_by_email(email);
  if (!user_result.success) {
    console.error("[LocalAuthorizationAdapter] Role lookup failed", {
      event: IAM_LOG_EVENT.ROLE_LOOKUP_FAILED,
      error: user_result.error,
    });
    return {
      status: ROLE_LOOKUP_STATUS.LOOKUP_FAILED,
      message: IAM_MESSAGE.AUTHORIZATION_UNAVAILABLE,
    };
  }
  if (user_result.data.items.length === 0)
    return reject_user(IAM_LOG_EVENT.ROLE_LOOKUP_USER_NOT_FOUND, "");
  const system_user = user_result.data.items[0];
  if (system_user.status === ENTITY_STATUS.INACTIVE)
    return reject_user(IAM_LOG_EVENT.ROLE_LOOKUP_USER_INACTIVE, system_user.id);
  if (!is_known_user_role(system_user.role))
    return reject_user(IAM_LOG_EVENT.ROLE_LOOKUP_ROLE_UNKNOWN, system_user.id);
  return { status: ROLE_LOOKUP_STATUS.FOUND, role: system_user.role };
}
