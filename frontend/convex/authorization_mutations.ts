import { v } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";
import { mutation, type MutationCtx } from "./_generated/server";
import {
  check_role_permission,
  DataAction,
  get_system_user_from_context,
  type SystemUser,
} from "./authorization_helpers";
import {
  ConvexErrorCode,
  type ConvexFailure,
  log_convex_failure,
} from "./lib/convex_errors";
import {
  create_none_option,
  create_some_option,
  type Option,
  OptionStatus,
} from "./lib/option";
import { authorize_super_admin_seed } from "./lib/super_admin_seed_access";
import {
  SuperAdminSeedOutcomeKind,
  upsert_seeded_super_admin,
} from "./lib/super_admin_seed_writer";
import {
  SYSTEM_USER_EMAIL_INDEX_NAME,
  SYSTEM_USERS_TABLE_NAME,
} from "./lib/system_user_constants";
import {
  apply_user_role_change,
  authorize_user_role_change,
  option_from_argument,
  type UserRoleChangeCommand,
} from "./lib/user_role_change";

const ROLE_MANAGEMENT_CATEGORY = "org_administrator_level";
const ROLE_CHANGE_DENIED_EVENT = "role_change_denied";
const SEED_COMPLETED_EVENT = "seed_super_admin_completed";
const DEFAULT_SEED_FIRST_NAME = "Super";
const DEFAULT_SEED_LAST_NAME = "Admin";
const DEFAULT_SEED_DISPLAY_NAME = `${DEFAULT_SEED_FIRST_NAME} ${DEFAULT_SEED_LAST_NAME}`;

const SEED_OUTCOME_MESSAGES = {
  [SuperAdminSeedOutcomeKind.PROMOTED]: "Existing user promoted to super admin",
  [SuperAdminSeedOutcomeKind.ALREADY_ACTIVE]: "Super admin already exists",
  [SuperAdminSeedOutcomeKind.CREATED]: "Super admin created successfully",
} as const;

type RoleMutationResult = { success: true } | ConvexFailure;

type SeedSuperAdminResult =
  | { success: true; message: string; user_id: Id<"system_users"> }
  | ConvexFailure;

const RoleChangeDenialReason = {
  MISSING_ROLE_PERMISSION: "missing_role_permission",
  TARGET_NOT_FOUND: "target_not_found",
  CHANGE_NOT_AUTHORIZED: "change_not_authorized",
} as const;

type RoleChangeDenialReasonValue =
  (typeof RoleChangeDenialReason)[keyof typeof RoleChangeDenialReason];

interface UpdateUserRoleArguments {
  target_email: string;
  role: string;
  organization_id?: string;
  team_id?: string;
  player_id?: string;
  official_id?: string;
}

function deny_role_change(
  caller: SystemUser,
  reason: RoleChangeDenialReasonValue,
): ConvexFailure {
  return log_convex_failure(ConvexErrorCode.ACCESS_DENIED, {
    event: ROLE_CHANGE_DENIED_EVENT,
    caller_user_id: caller.local_id,
    reason,
  });
}

async function find_system_user_by_email(
  ctx: MutationCtx,
  email: string,
): Promise<Option<Doc<"system_users">>> {
  const system_user = await ctx.db
    .query(SYSTEM_USERS_TABLE_NAME)
    .withIndex(SYSTEM_USER_EMAIL_INDEX_NAME, (query) =>
      query.eq("email", email.toLowerCase()),
    )
    .first();
  return system_user ? create_some_option(system_user) : create_none_option();
}

function build_role_change_command(
  caller: SystemUser,
  target_user: Doc<"system_users">,
  args: UpdateUserRoleArguments,
): UserRoleChangeCommand {
  return {
    caller,
    target_user,
    request: {
      role: args.role,
      organization_id: option_from_argument(args.organization_id),
      references: {
        team_id: option_from_argument(args.team_id),
        player_id: option_from_argument(args.player_id),
        official_id: option_from_argument(args.official_id),
      },
    },
  };
}

async function change_user_role(
  ctx: MutationCtx,
  caller: SystemUser,
  args: UpdateUserRoleArguments,
): Promise<RoleMutationResult> {
  const role_permitted = check_role_permission(
    caller.role,
    ROLE_MANAGEMENT_CATEGORY,
    DataAction.UPDATE,
  );
  if (!role_permitted)
    return deny_role_change(
      caller,
      RoleChangeDenialReason.MISSING_ROLE_PERMISSION,
    );
  const target_lookup = await find_system_user_by_email(ctx, args.target_email);
  if (target_lookup.status === OptionStatus.NONE)
    return deny_role_change(caller, RoleChangeDenialReason.TARGET_NOT_FOUND);
  const command = build_role_change_command(caller, target_lookup.value, args);
  if (!(await authorize_user_role_change(ctx, command)))
    return deny_role_change(
      caller,
      RoleChangeDenialReason.CHANGE_NOT_AUTHORIZED,
    );
  await apply_user_role_change(ctx, command);
  return { success: true };
}

export const update_user_role = mutation({
  args: {
    target_email: v.string(),
    role: v.string(),
    organization_id: v.optional(v.string()),
    team_id: v.optional(v.string()),
    player_id: v.optional(v.string()),
    official_id: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<RoleMutationResult> => {
    const caller_result = await get_system_user_from_context(ctx);
    if (!caller_result.success) return caller_result;
    return change_user_role(ctx, caller_result.data, args);
  },
});

export const seed_super_admin = mutation({
  args: { email: v.string(), display_name: v.optional(v.string()) },
  handler: async (ctx, args): Promise<SeedSuperAdminResult> => {
    const normalized_email = args.email.trim().toLowerCase();
    const seed_authorization = await authorize_super_admin_seed(
      ctx,
      normalized_email,
    );
    if (!seed_authorization.success) return seed_authorization;
    const outcome = await upsert_seeded_super_admin(ctx, {
      email: normalized_email,
      first_name: DEFAULT_SEED_FIRST_NAME,
      last_name: DEFAULT_SEED_LAST_NAME,
      display_name: args.display_name || DEFAULT_SEED_DISPLAY_NAME,
    });
    console.log("[authorization] Super admin seeded", {
      event: SEED_COMPLETED_EVENT,
      outcome: outcome.kind,
      user_id: outcome.user_id,
    });
    return {
      success: true,
      message: SEED_OUTCOME_MESSAGES[outcome.kind],
      user_id: outcome.user_id,
    };
  },
});
