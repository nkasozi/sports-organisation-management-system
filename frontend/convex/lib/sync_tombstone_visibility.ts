import type { QueryCtx } from "../_generated/server";
import { build_scope_filter, type SystemUserRecord } from "./auth_middleware";
import { CallerScopeKind, resolve_caller_scope } from "./caller_scope";
import { filter_records_for_caller } from "./scoped_record_reader";
import {
  type ParentOrganizationSnapshot,
  ParentOrganizationSnapshotKind,
  type StoredTombstoneScope,
  type StoredTombstoneVisibility,
  TombstoneVisibilityKind,
} from "./sync_tombstone_scope";
import type { SyncTombstone } from "./sync_tombstones";
import {
  filter_records_by_organization_scope,
  get_entity_type_for_table,
  is_global_table,
} from "./sync_validation";

interface VisibleTombstoneCommand {
  caller: SystemUserRecord;
  table_name: string;
  tombstones: SyncTombstone[];
}

function is_parent_organization_visible(
  caller: SystemUserRecord,
  parent_organization: Exclude<
    ParentOrganizationSnapshot,
    { kind: typeof ParentOrganizationSnapshotKind.NOT_PARENT_SCOPED }
  >,
): boolean {
  const caller_scope = resolve_caller_scope(caller);
  switch (caller_scope.kind) {
    case CallerScopeKind.GLOBAL:
      return true;
    case CallerScopeKind.NONE:
      return false;
    case CallerScopeKind.ORGANIZATION:
      return (
        parent_organization.kind === ParentOrganizationSnapshotKind.RESOLVED &&
        parent_organization.organization_id === caller_scope.organization_id
      );
  }
}

function is_stored_scope_visible(
  caller: SystemUserRecord,
  table_name: string,
  scope: StoredTombstoneScope,
): boolean {
  if (is_global_table(table_name)) return true;
  const parent_organization = scope.parent_organization;
  if (
    parent_organization.kind !==
    ParentOrganizationSnapshotKind.NOT_PARENT_SCOPED
  )
    return is_parent_organization_visible(caller, parent_organization);
  const scope_filter = build_scope_filter(
    caller,
    get_entity_type_for_table(table_name),
  );
  return (
    filter_records_by_organization_scope(
      [scope.fields],
      caller,
      table_name,
      scope_filter,
    ).length > 0
  );
}

export function is_stored_visibility_visible(
  caller: SystemUserRecord,
  table_name: string,
  visibility: StoredTombstoneVisibility,
): boolean {
  switch (visibility.kind) {
    case TombstoneVisibilityKind.DELETED:
      return is_stored_scope_visible(caller, table_name, visibility.scope);
    case TombstoneVisibilityKind.SCOPE_EXIT:
      return (
        is_stored_scope_visible(
          caller,
          table_name,
          visibility.previous_scope,
        ) &&
        !is_stored_scope_visible(caller, table_name, visibility.current_scope)
      );
  }
}

async function collect_visible_legacy_ids(
  ctx: { db: QueryCtx["db"] },
  command: VisibleTombstoneCommand,
): Promise<Set<string>> {
  const legacy_scopes = command.tombstones
    .filter(
      (tombstone) =>
        tombstone.visibility.kind === TombstoneVisibilityKind.LEGACY,
    )
    .map((tombstone) => ({ ...tombstone.scope, local_id: tombstone.local_id }));
  if (legacy_scopes.length === 0) return new Set<string>();
  const visible_rows = await filter_records_for_caller(ctx, {
    records: legacy_scopes,
    caller: command.caller,
    table_name: command.table_name,
  });
  return new Set(visible_rows.map((row) => row.local_id));
}

export async function filter_visible_tombstones(
  ctx: { db: QueryCtx["db"] },
  command: VisibleTombstoneCommand,
): Promise<SyncTombstone[]> {
  const visible_legacy_ids = await collect_visible_legacy_ids(ctx, command);
  return command.tombstones.filter((tombstone) => {
    const visibility = tombstone.visibility;
    return visibility.kind === TombstoneVisibilityKind.LEGACY
      ? visible_legacy_ids.has(tombstone.local_id)
      : is_stored_visibility_visible(
          command.caller,
          command.table_name,
          visibility,
        );
  });
}
