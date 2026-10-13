import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { SystemUserRecord } from "./auth_middleware";
import { CallerScopeKind, resolve_caller_scope } from "./caller_scope";
import {
  type ChangeMarkerScope,
  ChangeMarkerScopeKind,
  resolve_change_marker_scope,
  SHARED_RECORDS_SCOPE_KEY,
} from "./sync_change_marker_scope";
import { read_latest_sync_sequence } from "./sync_sequence_counter";
import type { AllowedSyncTable } from "./sync_table_catalog";
import {
  get_table_tenancy_strategy,
  TableTenancyStrategy,
} from "./table_tenancy";

const MARKER_TABLE_NAME = "sync_change_markers";
const MARKER_SCOPE_INDEX = "by_table_scope";
const NO_CHANGES_SEQUENCE = 0;

interface BumpChangeMarkersCommand {
  table_name: AllowedSyncTable;
  changed_records: Array<Record<string, unknown>>;
  sync_sequence: number;
}

async function read_scope_marker(
  ctx: { db: QueryCtx["db"] },
  table_name: AllowedSyncTable,
  scope_key: string,
): Promise<number> {
  const marker = await ctx.db
    .query(MARKER_TABLE_NAME)
    .withIndex(MARKER_SCOPE_INDEX, (range) =>
      range.eq("table_name", table_name).eq("scope_key", scope_key),
    )
    .first();
  return marker ? marker.latest_sequence : NO_CHANGES_SEQUENCE;
}

async function write_scope_marker(
  ctx: MutationCtx,
  table_name: AllowedSyncTable,
  scope_key: string,
  sync_sequence: number,
): Promise<boolean> {
  const marker = await ctx.db
    .query(MARKER_TABLE_NAME)
    .withIndex(MARKER_SCOPE_INDEX, (range) =>
      range.eq("table_name", table_name).eq("scope_key", scope_key),
    )
    .first();
  if (!marker) {
    await ctx.db.insert(MARKER_TABLE_NAME, {
      table_name,
      scope_key,
      latest_sequence: sync_sequence,
    });
    return true;
  }
  await ctx.db.patch(marker._id, {
    latest_sequence: Math.max(marker.latest_sequence, sync_sequence),
  });
  return true;
}

function collect_bucket_keys(scopes: ChangeMarkerScope[]): string[] {
  return [
    ...new Set(
      scopes.flatMap((scope) =>
        scope.kind === ChangeMarkerScopeKind.SCOPE_BUCKET
          ? [scope.scope_key]
          : [],
      ),
    ),
  ];
}

export async function bump_change_markers(
  ctx: MutationCtx,
  command: BumpChangeMarkersCommand,
): Promise<number> {
  const scopes = await Promise.all(
    command.changed_records.map((record) =>
      resolve_change_marker_scope(ctx, command.table_name, record),
    ),
  );
  const bucket_keys = collect_bucket_keys(scopes);
  for (const scope_key of bucket_keys)
    await write_scope_marker(
      ctx,
      command.table_name,
      scope_key,
      command.sync_sequence,
    );
  return bucket_keys.length;
}

async function read_organization_marker(
  ctx: { db: QueryCtx["db"] },
  table_name: AllowedSyncTable,
  organization_id: string,
): Promise<number> {
  switch (get_table_tenancy_strategy(table_name)) {
    case TableTenancyStrategy.SHARED_REFERENCE:
      return read_latest_sync_sequence(ctx, table_name);
    case TableTenancyStrategy.ORGANIZATION_IDENTITY:
    case TableTenancyStrategy.PARENT_SCOPED:
      return read_scope_marker(ctx, table_name, organization_id);
    case TableTenancyStrategy.ORGANIZATION_FIELD:
      return Math.max(
        await read_scope_marker(ctx, table_name, organization_id),
        await read_scope_marker(ctx, table_name, SHARED_RECORDS_SCOPE_KEY),
      );
  }
}

export async function read_caller_change_marker(
  ctx: { db: QueryCtx["db"] },
  caller: SystemUserRecord,
  table_name: AllowedSyncTable,
): Promise<number> {
  const caller_scope = resolve_caller_scope(caller);
  switch (caller_scope.kind) {
    case CallerScopeKind.GLOBAL:
      return read_latest_sync_sequence(ctx, table_name);
    case CallerScopeKind.ORGANIZATION:
      return read_organization_marker(
        ctx,
        table_name,
        caller_scope.organization_id,
      );
    case CallerScopeKind.NONE:
      return NO_CHANGES_SEQUENCE;
  }
}
