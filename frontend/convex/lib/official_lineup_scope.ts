import type { QueryCtx } from "../_generated/server";
import type { SystemUserRecord } from "./auth_middleware";
import {
  OwnershipRoleKind,
  resolve_ownership_role_kind,
} from "./caller_ownership";
import { is_boolean, is_object_record, read_string_or } from "./value_guards";

const FIXTURE_LINEUPS_TABLE_NAME = "fixture_lineups";
const FIXTURES_TABLE_NAME = "fixtures";
const OFFICIAL_ROLES_TABLE_NAME = "game_official_roles";
const LOCAL_ID_INDEX_NAME = "by_local_id";
const EMPTY_VALUE = "";
const TABLE_OFFICIAL_ROLE_CODES = new Set([
  "TO",
  "TECHNICAL_OFFICER",
  "TABLE_OFFICIAL",
  "SCORER",
  "TIMEKEEPER",
]);

interface OfficialLineupWriteCommand {
  table_name: string;
  caller: SystemUserRecord;
  records_to_own: Array<Record<string, unknown>>;
}

async function is_table_official_role(
  ctx: { db: QueryCtx["db"] },
  role_id: string,
): Promise<boolean> {
  const role = await ctx.db
    .query(OFFICIAL_ROLES_TABLE_NAME)
    .withIndex(LOCAL_ID_INDEX_NAME, (range) => range.eq("local_id", role_id))
    .first();
  if (!role) return false;
  if (is_boolean(role.is_table_official)) return role.is_table_official;
  return TABLE_OFFICIAL_ROLE_CODES.has(
    read_string_or(role.code, EMPTY_VALUE).toUpperCase(),
  );
}

async function is_caller_table_official_for_fixture(
  ctx: { db: QueryCtx["db"] },
  official_id: string,
  fixture_id: string,
): Promise<boolean> {
  const fixture = await ctx.db
    .query(FIXTURES_TABLE_NAME)
    .withIndex(LOCAL_ID_INDEX_NAME, (range) => range.eq("local_id", fixture_id))
    .first();
  const assignments = (fixture?.assigned_officials ?? []).filter(
    (assignment) =>
      is_object_record(assignment) && assignment.official_id === official_id,
  );
  for (const assignment of assignments)
    if (await is_table_official_role(ctx, assignment.role_id)) return true;
  return false;
}

export async function is_table_official_lineup_write(
  ctx: { db: QueryCtx["db"] },
  command: OfficialLineupWriteCommand,
): Promise<boolean> {
  const is_official =
    resolve_ownership_role_kind(command.caller.role) ===
    OwnershipRoleKind.OFFICIAL;
  const official_id = read_string_or(command.caller.official_id, EMPTY_VALUE);
  if (!is_official || !official_id) return false;
  if (command.table_name !== FIXTURE_LINEUPS_TABLE_NAME) return false;
  if (command.records_to_own.length === 0) return false;
  for (const record of command.records_to_own) {
    const fixture_id = read_string_or(record.fixture_id, EMPTY_VALUE);
    const is_allowed =
      fixture_id.length > 0 &&
      (await is_caller_table_official_for_fixture(
        ctx,
        official_id,
        fixture_id,
      ));
    if (!is_allowed) return false;
  }
  return true;
}
