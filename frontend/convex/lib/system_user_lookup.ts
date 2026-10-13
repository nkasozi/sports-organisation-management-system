import type {
  ConvexContext,
  ConvexResult,
  SystemUserRecord,
} from "./auth_middleware";
import { ConvexErrorCode, log_convex_failure } from "./convex_errors";
import {
  SYSTEM_USER_EMAIL_INDEX_NAME,
  SYSTEM_USERS_TABLE_NAME,
  SystemUserStatus,
} from "./system_user_constants";
import { is_object_record, is_string } from "./value_guards";

const AUTH_FAILED_EVENT = "auth_failed";
const AuthLookupFailureReason = {
  USER_NOT_FOUND: "user_not_found",
  ACCOUNT_INACTIVE: "account_inactive",
} as const;

function is_system_user_record(value: unknown): value is SystemUserRecord {
  if (!is_object_record(value)) return false;
  return is_string(value.email) && is_string(value.role) && "_id" in value;
}

export async function load_active_system_user_by_email(
  ctx: Pick<ConvexContext, "db">,
  email: string,
): Promise<ConvexResult<SystemUserRecord>> {
  const system_user_result = await ctx.db
    .query(SYSTEM_USERS_TABLE_NAME)
    .withIndex(SYSTEM_USER_EMAIL_INDEX_NAME, (query) =>
      query.eq("email", email.toLowerCase()),
    )
    .first();
  if (!is_system_user_record(system_user_result))
    return log_convex_failure(ConvexErrorCode.ACCESS_DENIED, {
      event: AUTH_FAILED_EVENT,
      reason: AuthLookupFailureReason.USER_NOT_FOUND,
    });
  if (system_user_result.status === SystemUserStatus.INACTIVE)
    return log_convex_failure(ConvexErrorCode.ACCESS_DENIED, {
      event: AUTH_FAILED_EVENT,
      reason: AuthLookupFailureReason.ACCOUNT_INACTIVE,
      user_id: system_user_result._id,
    });
  return { success: true, data: system_user_result };
}
