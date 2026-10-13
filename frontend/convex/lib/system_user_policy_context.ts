import type { MutationCtx } from "../_generated/server";
import type { SystemUserCensus } from "./bootstrap_gate";
import type { SystemUserSnapshot } from "./system_user_change_types";
import {
  SUPER_ADMIN_ROLE,
  SYSTEM_USER_EMAIL_INDEX_NAME,
  SYSTEM_USER_ROLE_INDEX_NAME,
  SYSTEM_USERS_TABLE_NAME,
  SystemUserStatus,
} from "./system_user_constants";
import { is_non_empty_string } from "./value_guards";

const EMPTY_FIELD_VALUE = "";

function read_string_field(
  record: Record<string, unknown>,
  field_name: string,
  default_value: string,
): string {
  const field_value = record[field_name];
  return is_non_empty_string(field_value) ? field_value.trim() : default_value;
}

export function to_system_user_snapshot(
  record: Record<string, unknown>,
): SystemUserSnapshot {
  return {
    email: read_string_field(record, "email", EMPTY_FIELD_VALUE).toLowerCase(),
    role: read_string_field(record, "role", EMPTY_FIELD_VALUE),
    organization_id: read_string_field(
      record,
      "organization_id",
      EMPTY_FIELD_VALUE,
    ),
    status: read_string_field(record, "status", SystemUserStatus.ACTIVE),
  };
}

export function merge_requested_snapshot(
  current: SystemUserSnapshot,
  incoming: Record<string, unknown>,
): SystemUserSnapshot {
  return {
    email: read_string_field(incoming, "email", current.email).toLowerCase(),
    role: read_string_field(incoming, "role", current.role),
    organization_id: read_string_field(
      incoming,
      "organization_id",
      current.organization_id,
    ),
    status: read_string_field(incoming, "status", current.status),
  };
}

export async function count_active_super_admins(
  ctx: Pick<MutationCtx, "db">,
): Promise<number> {
  const super_admins = await ctx.db
    .query(SYSTEM_USERS_TABLE_NAME)
    .withIndex(SYSTEM_USER_ROLE_INDEX_NAME, (query) =>
      query.eq("role", SUPER_ADMIN_ROLE),
    )
    .collect();
  return super_admins.filter(
    (user) => user.status !== SystemUserStatus.INACTIVE,
  ).length;
}

export async function load_system_user_census(
  ctx: Pick<MutationCtx, "db">,
): Promise<SystemUserCensus> {
  const any_system_user = await ctx.db.query(SYSTEM_USERS_TABLE_NAME).first();
  return {
    has_registered_users: Boolean(any_system_user),
    active_super_admin_count: await count_active_super_admins(ctx),
  };
}

export async function is_email_registered(
  ctx: MutationCtx,
  email: string,
): Promise<boolean> {
  const existing_user = await ctx.db
    .query(SYSTEM_USERS_TABLE_NAME)
    .withIndex(SYSTEM_USER_EMAIL_INDEX_NAME, (query) =>
      query.eq("email", email.toLowerCase()),
    )
    .first();
  return Boolean(existing_user);
}
