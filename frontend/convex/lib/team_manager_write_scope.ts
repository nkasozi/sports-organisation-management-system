import type { QueryCtx } from "../_generated/server";
import type { SystemUserRecord } from "./auth_middleware";
import {
  type CallerOwnership,
  OwnershipRoleKind,
  resolve_ownership_role_kind,
} from "./caller_ownership";
import { create_none_option, create_some_option, type Option } from "./option";
import { CREATED_BY_USER_ID_FIELD_NAME } from "./record_creator_stamp";
import {
  SyncWriteRejection,
  type SyncWriteRejectionValue,
} from "./sync_write_decision";
import { read_string_or } from "./value_guards";

const PLAYERS_TABLE_NAME = "players";
const MEMBERSHIPS_TABLE_NAME = "player_team_memberships";
const PLAYER_ID_FIELD_NAME = "player_id";
const LOCAL_ID_FIELD_NAME = "local_id";
const ENDED_MEMBERSHIP_STATUSES = new Set(["inactive", "ended"]);
const EMPTY_VALUE = "";

interface TeamManagerWriteCommand {
  table_name: string;
  caller: SystemUserRecord;
  records_to_own: Array<Record<string, unknown>>;
}

function is_team_manager(caller: SystemUserRecord): boolean {
  return (
    resolve_ownership_role_kind(caller.role) === OwnershipRoleKind.TEAM_MANAGER
  );
}

async function is_player_created_by_caller(
  ctx: { db: QueryCtx["db"] },
  player_id: string,
  ownership: CallerOwnership,
): Promise<boolean> {
  const player = await ctx.db
    .query(PLAYERS_TABLE_NAME)
    .withIndex("by_local_id", (range) => range.eq("local_id", player_id))
    .first();
  const creator = read_string_or(
    player ? player[CREATED_BY_USER_ID_FIELD_NAME] : EMPTY_VALUE,
    EMPTY_VALUE,
  );
  return creator.length > 0 && ownership.user_ids.has(creator);
}

async function has_active_membership_outside_caller_teams(
  ctx: { db: QueryCtx["db"] },
  player_id: string,
  ownership: CallerOwnership,
): Promise<boolean> {
  const memberships = await ctx.db
    .query(MEMBERSHIPS_TABLE_NAME)
    .withIndex("by_player", (range) => range.eq("player_id", player_id))
    .collect();
  return memberships.some(
    (membership) =>
      !ENDED_MEMBERSHIP_STATUSES.has(
        read_string_or(membership.status, EMPTY_VALUE),
      ) && !ownership.team_ids.has(membership.team_id),
  );
}

async function is_player_controlled_by_team_manager(
  ctx: { db: QueryCtx["db"] },
  player_id: string,
  ownership: CallerOwnership,
): Promise<boolean> {
  if (!player_id) return false;
  if (ownership.player_ids.has(player_id)) return true;
  if (!(await is_player_created_by_caller(ctx, player_id, ownership)))
    return false;
  return !(await has_active_membership_outside_caller_teams(
    ctx,
    player_id,
    ownership,
  ));
}

async function are_all_players_controlled(
  ctx: { db: QueryCtx["db"] },
  player_ids: string[],
  ownership: CallerOwnership,
): Promise<boolean> {
  for (const player_id of player_ids)
    if (
      !(await is_player_controlled_by_team_manager(ctx, player_id, ownership))
    )
      return false;
  return true;
}

function read_record_ids(
  records: Array<Record<string, unknown>>,
  field_name: string,
): string[] {
  return records.map((record) =>
    read_string_or(record[field_name], EMPTY_VALUE),
  );
}

export async function is_team_manager_created_player_write(
  ctx: { db: QueryCtx["db"] },
  command: TeamManagerWriteCommand,
  ownership: CallerOwnership,
): Promise<boolean> {
  if (!is_team_manager(command.caller)) return false;
  if (command.table_name !== PLAYERS_TABLE_NAME) return false;
  return are_all_players_controlled(
    ctx,
    read_record_ids(command.records_to_own, LOCAL_ID_FIELD_NAME),
    ownership,
  );
}

export async function find_team_manager_membership_rejection(
  ctx: { db: QueryCtx["db"] },
  command: TeamManagerWriteCommand,
  ownership: CallerOwnership,
): Promise<Option<SyncWriteRejectionValue>> {
  if (!is_team_manager(command.caller)) return create_none_option();
  if (command.table_name !== MEMBERSHIPS_TABLE_NAME)
    return create_none_option();
  const all_controlled = await are_all_players_controlled(
    ctx,
    read_record_ids(command.records_to_own, PLAYER_ID_FIELD_NAME),
    ownership,
  );
  return all_controlled
    ? create_none_option()
    : create_some_option<SyncWriteRejectionValue>(
        SyncWriteRejection.OUTSIDE_CALLER_SCOPE,
      );
}
