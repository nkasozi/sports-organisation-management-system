import type { MutationCtx } from "../_generated/server";
import type { E2eProfileRole } from "./e2e_profile_policy";
import {
  create_versioned_change_fields,
  NEW_RECORD_PREVIOUS_VERSION,
  SYSTEM_USERS_SYNC_TABLE,
} from "./sync_change_stamp";
import {
  SYSTEM_USER_EMAIL_INDEX_NAME,
  SYSTEM_USERS_TABLE_NAME,
  SystemUserStatus,
} from "./system_user_constants";

const E2E_LOCAL_ID_PREFIX = "e2e_profile_";
const EMAIL_KEY_PATTERN = /[^a-z0-9]/g;
const EMAIL_KEY_REPLACEMENT = "_";

interface E2eProfileCommand {
  email: string;
  role: E2eProfileRole;
  first_name: string;
  last_name: string;
  organization_id: string;
  team_id?: string;
  official_id?: string;
  player_id?: string;
}

type E2eProfileFields = Omit<E2eProfileCommand, "role"> & {
  role: string;
  name: string;
  status: string;
  updated_at: string;
};

function build_profile_fields(
  command: E2eProfileCommand,
  now: string,
): E2eProfileFields {
  return {
    email: command.email,
    first_name: command.first_name,
    last_name: command.last_name,
    name: `${command.first_name} ${command.last_name}`,
    role: command.role,
    organization_id: command.organization_id,
    team_id: command.team_id,
    official_id: command.official_id,
    player_id: command.player_id,
    status: SystemUserStatus.ACTIVE,
    updated_at: now,
  };
}

export async function upsert_e2e_profile(
  ctx: MutationCtx,
  command: E2eProfileCommand,
): Promise<string> {
  const existing = await ctx.db
    .query(SYSTEM_USERS_TABLE_NAME)
    .withIndex(SYSTEM_USER_EMAIL_INDEX_NAME, (query) =>
      query.eq("email", command.email),
    )
    .first();
  const now = new Date().toISOString();
  const profile_fields = build_profile_fields(command, now);
  const change_fields = await create_versioned_change_fields(ctx, {
    table_name: SYSTEM_USERS_SYNC_TABLE,
    changed_records: existing ? [existing, profile_fields] : [profile_fields],
    previous_version: existing?.version ?? NEW_RECORD_PREVIOUS_VERSION,
  });
  if (existing) {
    await ctx.db.patch(existing._id, { ...profile_fields, ...change_fields });
    return existing.local_id;
  }
  const local_id = `${E2E_LOCAL_ID_PREFIX}${command.email.replace(EMAIL_KEY_PATTERN, EMAIL_KEY_REPLACEMENT)}`;
  await ctx.db.insert(SYSTEM_USERS_TABLE_NAME, {
    ...profile_fields,
    ...change_fields,
    local_id,
    created_at: now,
  });
  return local_id;
}
