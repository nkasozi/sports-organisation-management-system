import { v } from "convex/values";

import { query } from "./_generated/server";
import {
  type AuthorizationResult,
  check_role_permission,
  type DataAction,
  type DataCategory,
  get_actions_from_permissions,
  get_entity_data_category,
  get_system_user_from_context,
  type SystemUser,
} from "./authorization_helpers";
import type { ConvexResult } from "./lib/auth_middleware";
import { ConvexErrorCode, log_convex_failure } from "./lib/convex_errors";
import { mask_email_for_logging } from "./lib/log_masking";
import { OptionStatus } from "./lib/option";
import {
  ALL_DATA_ACTIONS,
  parse_data_action,
  parse_user_role,
} from "./lib/permission_checks";
import { SHARED_ROLE_PERMISSIONS } from "./shared_permission_definitions";

const ACCESS_CHECK_DENIED_EVENT = "access_check_denied";
const ACCESS_CHECK_GRANTED_EVENT = "access_check_granted";
const UNKNOWN_ENTITY_TYPE_EVENT = "authorization_unknown_entity_type";
const REQUEST_ID_PREFIX = "acc_";
const REQUEST_ID_RADIX = 36;
const REQUEST_ID_START = 2;
const REQUEST_ID_END = 9;
const ACTION_NOT_PERMITTED_REASON =
  "Your role does not have permission for this action.";

const AccessCheckDenialReason = {
  EMAIL_MISMATCH: "email_mismatch",
  CALLER_NOT_AUTHORIZED: "caller_not_authorized",
} as const;

function build_request_id(): string {
  const random_suffix = Math.random()
    .toString(REQUEST_ID_RADIX)
    .substring(REQUEST_ID_START, REQUEST_ID_END);
  return `${REQUEST_ID_PREFIX}${Date.now()}_${random_suffix}`;
}

function build_authorization_result(
  user_role: string,
  data_category: DataCategory,
  is_authorized: boolean,
): AuthorizationResult {
  return is_authorized
    ? { is_authorized: true, user_role, data_category }
    : {
        is_authorized: false,
        user_role,
        data_category,
        reason: ACTION_NOT_PERMITTED_REASON,
      };
}

function list_role_actions(role: string, entity_type: string): DataAction[] {
  const parsed_role = parse_user_role(role);
  const data_category = get_entity_data_category(entity_type);
  if (
    parsed_role.status === OptionStatus.NONE ||
    data_category.status === OptionStatus.NONE
  )
    return [];
  return get_actions_from_permissions(
    SHARED_ROLE_PERMISSIONS[parsed_role.value][data_category.value],
  );
}

export const check_user_access = query({
  args: { email: v.string() },
  handler: async (ctx, args): Promise<ConvexResult<{ email: string }>> => {
    const request_id = build_request_id();
    const requested_email = args.email.trim().toLowerCase();
    const caller_result = await get_system_user_from_context(ctx);
    if (!caller_result.success || caller_result.data.email !== requested_email)
      return log_convex_failure(ConvexErrorCode.ACCESS_DENIED, {
        event: ACCESS_CHECK_DENIED_EVENT,
        request_id,
        email: mask_email_for_logging(requested_email),
        reason: caller_result.success
          ? AccessCheckDenialReason.EMAIL_MISMATCH
          : AccessCheckDenialReason.CALLER_NOT_AUTHORIZED,
      });
    console.log("[authorization] Access check succeeded", {
      event: ACCESS_CHECK_GRANTED_EVENT,
      request_id,
      email: mask_email_for_logging(caller_result.data.email),
      role: caller_result.data.role,
    });
    return { success: true, data: { email: caller_result.data.email } };
  },
});

export const get_current_user_profile = query({
  args: {},
  handler: async (ctx): Promise<ConvexResult<SystemUser>> =>
    get_system_user_from_context(ctx),
});

export const check_entity_authorized = query({
  args: { entity_type: v.string(), action: v.string() },
  handler: async (ctx, args): Promise<ConvexResult<AuthorizationResult>> => {
    const user_result = await get_system_user_from_context(ctx);
    if (!user_result.success) return user_result;
    const role = user_result.data.role;
    const data_category = get_entity_data_category(args.entity_type);
    if (data_category.status === OptionStatus.NONE)
      return log_convex_failure(ConvexErrorCode.INVALID_REQUEST, {
        event: UNKNOWN_ENTITY_TYPE_EVENT,
        entity_type: args.entity_type,
      });
    const parsed_action = parse_data_action(args.action);
    const is_authorized =
      parsed_action.status === OptionStatus.SOME &&
      check_role_permission(role, data_category.value, parsed_action.value);
    return {
      success: true,
      data: build_authorization_result(
        role,
        data_category.value,
        is_authorized,
      ),
    };
  },
});

export const get_allowed_entity_actions = query({
  args: { entity_type: v.string() },
  handler: async (ctx, args): Promise<ConvexResult<DataAction[]>> => {
    const user_result = await get_system_user_from_context(ctx);
    if (!user_result.success) return user_result;
    return {
      success: true,
      data: list_role_actions(user_result.data.role, args.entity_type),
    };
  },
});

export const get_disabled_entity_actions = query({
  args: { entity_type: v.string() },
  handler: async (ctx, args): Promise<ConvexResult<DataAction[]>> => {
    const user_result = await get_system_user_from_context(ctx);
    if (!user_result.success) return user_result;
    const allowed_actions = list_role_actions(
      user_result.data.role,
      args.entity_type,
    );
    return {
      success: true,
      data: ALL_DATA_ACTIONS.filter(
        (action) => !allowed_actions.includes(action),
      ),
    };
  },
});
