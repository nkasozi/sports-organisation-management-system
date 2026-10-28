import type { QueryCtx } from "../_generated/server";
import {
  is_record_owned_by_shared_owners,
  SharedPermissionScope,
} from "../shared_own_record_permissions";
import type { SystemUserRecord } from "./auth_middleware";
import {
  type CallerOwnership,
  create_database_ownership_loader,
  load_caller_ownership,
  OwnershipRoleKind,
  type OwnershipRoleKindValue,
  resolve_ownership_role_kind,
} from "./caller_ownership";
import { is_table_official_lineup_write } from "./official_lineup_scope";
import {
  create_none_option,
  create_some_option,
  type Option,
  OptionStatus,
} from "./option";
import {
  DataAction,
  resolve_entity_permission_scope,
} from "./permission_checks";
import {
  is_record_owned_by_caller,
  is_self_scoped_table,
  type SelfScopedTable,
} from "./record_ownership";
import {
  type AllowedSyncTable,
  get_entity_type_for_table,
} from "./sync_table_catalog";
import {
  SyncWriteRejection,
  type SyncWriteRejectionValue,
} from "./sync_write_decision";
import {
  find_team_manager_membership_rejection,
  is_team_manager_created_player_write,
} from "./team_manager_write_scope";
import { blocks_verification_change } from "./verification_reset";

interface ScopedWriteCommand {
  table_name: AllowedSyncTable;
  caller: SystemUserRecord;
  incoming_record: Option<Record<string, unknown>>;
  existing_record: Option<Record<string, unknown>>;
}

const SELF_SCOPED_ROLE_KINDS: readonly OwnershipRoleKindValue[] = [
  OwnershipRoleKind.TEAM_MANAGER,
  OwnershipRoleKind.PLAYER,
  OwnershipRoleKind.OFFICIAL,
];
const OWNER_ONLY_TABLES = new Set<string>(["calendar_tokens"]);
const PLAYERS_TABLE_NAME = "players";

function resolve_write_action(
  command: Pick<ScopedWriteCommand, "incoming_record" | "existing_record">,
): DataAction {
  if (command.incoming_record.status === OptionStatus.NONE)
    return DataAction.DELETE;
  return command.existing_record.status === OptionStatus.SOME
    ? DataAction.UPDATE
    : DataAction.CREATE;
}

function requires_self_scope(
  role_kind: OwnershipRoleKindValue,
  table_name: AllowedSyncTable,
): table_name is AllowedSyncTable & SelfScopedTable {
  if (!is_self_scoped_table(table_name)) return false;
  if (OWNER_ONLY_TABLES.has(table_name))
    return role_kind !== OwnershipRoleKind.ADMINISTRATOR;
  return SELF_SCOPED_ROLE_KINDS.includes(role_kind);
}

function is_team_manager_player_creation(
  role_kind: OwnershipRoleKindValue,
  command: ScopedWriteCommand,
): boolean {
  return (
    role_kind === OwnershipRoleKind.TEAM_MANAGER &&
    command.table_name === PLAYERS_TABLE_NAME &&
    command.existing_record.status === OptionStatus.NONE
  );
}

function list_records_to_own(
  command: ScopedWriteCommand,
): Array<Record<string, unknown>> {
  const existing =
    command.existing_record.status === OptionStatus.SOME
      ? [command.existing_record.value]
      : [];
  if (command.incoming_record.status === OptionStatus.NONE) return existing;
  const merged = { ...existing[0], ...command.incoming_record.value };
  return [...existing, merged];
}

function check_self_scope(
  command: ScopedWriteCommand & { table_name: SelfScopedTable },
  ownership: CallerOwnership,
): Option<SyncWriteRejectionValue> {
  const all_owned = list_records_to_own(command).every((record) =>
    is_record_owned_by_caller(command.table_name, record, ownership),
  );
  return all_owned
    ? create_none_option()
    : create_some_option<SyncWriteRejectionValue>(
        SyncWriteRejection.OUTSIDE_CALLER_SCOPE,
      );
}

async function check_own_record_scope(
  ctx: { db: QueryCtx["db"] },
  command: ScopedWriteCommand,
  entity_type: string,
): Promise<Option<SyncWriteRejectionValue>> {
  const ownership = await load_caller_ownership(
    create_database_ownership_loader(ctx),
    command.caller,
  );
  const records_to_own = list_records_to_own(command);
  const all_owned = records_to_own.every((record) =>
    is_record_owned_by_shared_owners(entity_type, record, ownership),
  );
  if (!all_owned)
    return create_some_option<SyncWriteRejectionValue>(
      SyncWriteRejection.OUTSIDE_CALLER_SCOPE,
    );
  return find_team_manager_membership_rejection(
    ctx,
    { ...command, records_to_own },
    ownership,
  );
}

async function check_category_scope(
  ctx: { db: QueryCtx["db"] },
  command: ScopedWriteCommand,
): Promise<Option<SyncWriteRejectionValue>> {
  const role_kind = resolve_ownership_role_kind(command.caller.role);
  const table_name = command.table_name;
  if (
    !requires_self_scope(role_kind, table_name) ||
    is_team_manager_player_creation(role_kind, command)
  )
    return create_none_option();
  const ownership = await load_caller_ownership(
    create_database_ownership_loader(ctx),
    command.caller,
  );
  const is_created_player_write = await is_team_manager_created_player_write(
    ctx,
    { ...command, records_to_own: list_records_to_own(command) },
    ownership,
  );
  if (is_created_player_write) return create_none_option();
  const is_table_official_lineup = await is_table_official_lineup_write(ctx, {
    ...command,
    records_to_own: list_records_to_own(command),
  });
  if (is_table_official_lineup) return create_none_option();
  return check_self_scope({ ...command, table_name }, ownership);
}

export async function find_scoped_write_rejection(
  ctx: { db: QueryCtx["db"] },
  command: ScopedWriteCommand,
): Promise<Option<SyncWriteRejectionValue>> {
  const entity_type = get_entity_type_for_table(command.table_name);
  const scope = resolve_entity_permission_scope(
    command.caller.role,
    entity_type,
    resolve_write_action(command),
  );
  if (scope === SharedPermissionScope.NONE)
    return create_some_option(SyncWriteRejection.PERMISSION_DENIED);
  if (blocks_verification_change(command))
    return create_some_option(SyncWriteRejection.VERIFICATION_CHANGE);
  switch (scope) {
    case SharedPermissionScope.OWN_RECORDS:
      return check_own_record_scope(ctx, command, entity_type);
    case SharedPermissionScope.ALL_RECORDS:
      return check_category_scope(ctx, command);
  }
}
