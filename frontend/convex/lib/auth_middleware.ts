import type { Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import type {
  SharedDataCategory,
  SharedUserRole,
} from "../shared_permission_definitions";
import {
  ConvexErrorCode,
  type ConvexFailure,
  log_convex_failure,
} from "./convex_errors";
import {
  check_entity_permission_in_any_scope,
  type DataAction,
} from "./permission_checks";
import { load_active_system_user_by_email } from "./system_user_lookup";
import { build_user_scope_filter } from "./user_scope_filter";
import { is_object_record, is_string } from "./value_guards";

export { AUTH_DENIED_MESSAGE } from "./convex_errors";
export {
  check_entity_permission,
  check_entity_permission_in_any_scope,
  check_permission,
  DataAction,
  get_entity_data_category,
} from "./permission_checks";

export type UserRole = SharedUserRole;
export type DataCategory = SharedDataCategory;

export interface SystemUserRecord {
  _id: Id<"system_users">;
  local_id?: string;
  email: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  role: string;
  organization_id?: string;
  team_id?: string;
  player_id?: string;
  official_id?: string;
  status?: string;
  version?: number;
}

interface ConvexIdentityRecord {
  subject: string;
  email?: string;
}

export type ConvexContext = Pick<QueryCtx, "db" | "auth">;

export type ConvexResult<TData> =
  | { success: true; data: TData }
  | ConvexFailure;

const AuthFailureReason = {
  NO_IDENTITY: "no_identity",
  NO_EMAIL_CLAIM: "no_email_claim",
} as const;

const AUTH_FAILED_EVENT = "auth_failed";
const PERMISSION_DENIED_EVENT = "permission_denied";

function is_identity_record(value: unknown): value is ConvexIdentityRecord {
  return is_object_record(value) && is_string(value.subject);
}

export async function require_auth(
  ctx: ConvexContext,
): Promise<ConvexResult<SystemUserRecord>> {
  const identity_result = await ctx.auth.getUserIdentity();
  if (!is_identity_record(identity_result))
    return log_convex_failure(ConvexErrorCode.ACCESS_DENIED, {
      event: AUTH_FAILED_EVENT,
      reason: AuthFailureReason.NO_IDENTITY,
    });
  const email = identity_result.email;
  if (!email)
    return log_convex_failure(ConvexErrorCode.ACCESS_DENIED, {
      event: AUTH_FAILED_EVENT,
      reason: AuthFailureReason.NO_EMAIL_CLAIM,
    });
  return load_active_system_user_by_email(ctx, email);
}

export async function require_permission(
  ctx: ConvexContext,
  entity_type: string,
  action: DataAction,
): Promise<ConvexResult<SystemUserRecord>> {
  const auth_result = await require_auth(ctx);
  if (!auth_result.success) return auth_result;
  const user = auth_result.data;
  if (check_entity_permission_in_any_scope(user.role, entity_type, action))
    return auth_result;
  return log_convex_failure(ConvexErrorCode.ACCESS_DENIED, {
    event: PERMISSION_DENIED_EVENT,
    user_id: user._id,
    role: user.role,
    action,
    entity_type,
  });
}

export function build_scope_filter(
  user: SystemUserRecord,
  entity_type: string,
): Record<string, string> {
  return build_user_scope_filter(user, entity_type);
}
