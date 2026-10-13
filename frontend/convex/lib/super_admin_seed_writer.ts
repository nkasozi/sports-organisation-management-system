import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import {
  create_versioned_change_fields,
  NEW_RECORD_PREVIOUS_VERSION,
  SYSTEM_USERS_SYNC_TABLE,
} from "./sync_change_stamp";
import {
  GLOBAL_ORGANIZATION_ID,
  SUPER_ADMIN_ROLE,
  SYSTEM_USER_EMAIL_INDEX_NAME,
  SYSTEM_USERS_TABLE_NAME,
  SystemUserStatus,
} from "./system_user_constants";

const SEEDED_LOCAL_ID_PREFIX = "admin_seed_";
const EMAIL_KEY_SEPARATOR_PATTERN = /[@.]/g;
const EMAIL_KEY_REPLACEMENT = "_";

export const SuperAdminSeedOutcomeKind = {
  CREATED: "created",
  PROMOTED: "promoted",
  ALREADY_ACTIVE: "already_active",
} as const;

type SuperAdminSeedOutcomeKindValue =
  (typeof SuperAdminSeedOutcomeKind)[keyof typeof SuperAdminSeedOutcomeKind];

interface SuperAdminSeedOutcome {
  kind: SuperAdminSeedOutcomeKindValue;
  user_id: Id<"system_users">;
}

interface SuperAdminSeedCommand {
  email: string;
  first_name: string;
  last_name: string;
  display_name: string;
}

function is_active_global_super_admin(user: Doc<"system_users">): boolean {
  return (
    user.role === SUPER_ADMIN_ROLE &&
    user.organization_id === GLOBAL_ORGANIZATION_ID &&
    user.status !== SystemUserStatus.INACTIVE
  );
}

async function insert_super_admin(
  ctx: MutationCtx,
  command: SuperAdminSeedCommand,
  now: string,
): Promise<Id<"system_users">> {
  const email_key = command.email.replace(
    EMAIL_KEY_SEPARATOR_PATTERN,
    EMAIL_KEY_REPLACEMENT,
  );
  return ctx.db.insert(SYSTEM_USERS_TABLE_NAME, {
    local_id: `${SEEDED_LOCAL_ID_PREFIX}${email_key}`,
    email: command.email,
    first_name: command.first_name,
    last_name: command.last_name,
    name: command.display_name,
    role: SUPER_ADMIN_ROLE,
    organization_id: GLOBAL_ORGANIZATION_ID,
    status: SystemUserStatus.ACTIVE,
    ...(await create_versioned_change_fields(ctx, {
      table_name: SYSTEM_USERS_SYNC_TABLE,
      changed_records: [{ organization_id: GLOBAL_ORGANIZATION_ID }],
      previous_version: NEW_RECORD_PREVIOUS_VERSION,
    })),
    created_at: now,
    updated_at: now,
  });
}

async function promote_to_super_admin(
  ctx: MutationCtx,
  existing: Doc<"system_users">,
  now: string,
): Promise<Id<"system_users">> {
  await ctx.db.patch(existing._id, {
    ...(await create_versioned_change_fields(ctx, {
      table_name: SYSTEM_USERS_SYNC_TABLE,
      changed_records: [existing, { organization_id: GLOBAL_ORGANIZATION_ID }],
      previous_version: existing.version,
    })),
    role: SUPER_ADMIN_ROLE,
    organization_id: GLOBAL_ORGANIZATION_ID,
    status: SystemUserStatus.ACTIVE,
    updated_at: now,
  });
  return existing._id;
}

export async function upsert_seeded_super_admin(
  ctx: MutationCtx,
  command: SuperAdminSeedCommand,
): Promise<SuperAdminSeedOutcome> {
  const now = new Date().toISOString();
  const existing = await ctx.db
    .query(SYSTEM_USERS_TABLE_NAME)
    .withIndex(SYSTEM_USER_EMAIL_INDEX_NAME, (query) =>
      query.eq("email", command.email),
    )
    .first();
  if (!existing)
    return {
      kind: SuperAdminSeedOutcomeKind.CREATED,
      user_id: await insert_super_admin(ctx, command, now),
    };
  if (is_active_global_super_admin(existing))
    return {
      kind: SuperAdminSeedOutcomeKind.ALREADY_ACTIVE,
      user_id: existing._id,
    };
  return {
    kind: SuperAdminSeedOutcomeKind.PROMOTED,
    user_id: await promote_to_super_admin(ctx, existing, now),
  };
}
