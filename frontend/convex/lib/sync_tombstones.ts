import type { GenericId } from "convex/values";

import type { MutationCtx } from "../_generated/server";
import {
  create_none_option,
  create_some_option,
  type Option,
  OptionStatus,
} from "./option";
import {
  build_legacy_scope_fields,
  type StoredTombstoneScope,
  type StoredTombstoneVisibility,
  TombstoneVisibilityKind,
} from "./sync_tombstone_scope";
import { resolve_tombstone_scope } from "./sync_tombstone_scope_resolution";
import type { RemoteDeletion } from "./sync_versioning";

const TOMBSTONE_TABLE_NAME = "sync_tombstones";
const TOMBSTONE_LOCAL_ID_INDEX = "by_table_local_id";

export type TombstoneVisibility =
  | { kind: typeof TombstoneVisibilityKind.LEGACY }
  | StoredTombstoneVisibility;

export interface SyncTombstoneFields {
  table_name: string;
  local_id: string;
  version: number;
  sync_sequence: number;
  deleted_at: string;
  scope: Record<string, string>;
}

export interface StoredSyncTombstoneDocument extends SyncTombstoneFields {
  _id: GenericId<"sync_tombstones">;
  visibility?: StoredTombstoneVisibility;
}

export interface SyncTombstone extends SyncTombstoneFields {
  _id: GenericId<"sync_tombstones">;
  visibility: TombstoneVisibility;
}

interface WriteTombstoneCommand {
  table_name: string;
  local_id: string;
  deleted_record: Record<string, unknown>;
  version: number;
  sync_sequence: number;
  deleted_at: string;
}

interface WriteScopeExitTombstoneCommand {
  table_name: string;
  local_id: string;
  previous_record: Record<string, unknown>;
  previous_scope: StoredTombstoneScope;
  current_scope: StoredTombstoneScope;
  version: number;
  sync_sequence: number;
  exited_at: string;
}

export function classify_stored_tombstone(
  document: StoredSyncTombstoneDocument,
): SyncTombstone {
  const { visibility, ...fields } = document;
  return {
    ...fields,
    visibility: visibility ?? { kind: TombstoneVisibilityKind.LEGACY },
  };
}

export function read_remote_deletion(
  tombstone: Option<SyncTombstone>,
): Option<RemoteDeletion> {
  if (tombstone.status === OptionStatus.NONE) return create_none_option();
  const { version, deleted_at, visibility } = tombstone.value;
  switch (visibility.kind) {
    case TombstoneVisibilityKind.LEGACY:
    case TombstoneVisibilityKind.DELETED:
      return create_some_option({ version, deleted_at });
    case TombstoneVisibilityKind.SCOPE_EXIT:
    case TombstoneVisibilityKind.ACCESS_REVIEW:
      return create_none_option();
  }
}

export async function load_sync_tombstone(
  ctx: MutationCtx,
  table_name: string,
  local_id: string,
): Promise<Option<SyncTombstone>> {
  const tombstone = await ctx.db
    .query(TOMBSTONE_TABLE_NAME)
    .withIndex(TOMBSTONE_LOCAL_ID_INDEX, (query) =>
      query.eq("table_name", table_name).eq("local_id", local_id),
    )
    .first();
  return tombstone
    ? create_some_option(
        classify_stored_tombstone(tombstone as StoredSyncTombstoneDocument),
      )
    : create_none_option();
}

export async function upsert_tombstone_row(
  ctx: MutationCtx,
  fields: SyncTombstoneFields & { visibility: StoredTombstoneVisibility },
): Promise<boolean> {
  const existing = await load_sync_tombstone(
    ctx,
    fields.table_name,
    fields.local_id,
  );
  if (existing.status === OptionStatus.SOME) {
    await ctx.db.patch(existing.value._id, fields);
    return true;
  }
  await ctx.db.insert(TOMBSTONE_TABLE_NAME, fields);
  return true;
}

export async function write_sync_tombstone(
  ctx: MutationCtx,
  command: WriteTombstoneCommand,
): Promise<boolean> {
  return upsert_tombstone_row(ctx, {
    table_name: command.table_name,
    local_id: command.local_id,
    version: command.version,
    sync_sequence: command.sync_sequence,
    deleted_at: command.deleted_at,
    scope: build_legacy_scope_fields(
      command.table_name,
      command.deleted_record,
    ),
    visibility: {
      kind: TombstoneVisibilityKind.DELETED,
      scope: await resolve_tombstone_scope(
        ctx,
        command.table_name,
        command.deleted_record,
      ),
    },
  });
}

export async function write_scope_exit_tombstone(
  ctx: MutationCtx,
  command: WriteScopeExitTombstoneCommand,
): Promise<boolean> {
  return upsert_tombstone_row(ctx, {
    table_name: command.table_name,
    local_id: command.local_id,
    version: command.version,
    sync_sequence: command.sync_sequence,
    deleted_at: command.exited_at,
    scope: build_legacy_scope_fields(
      command.table_name,
      command.previous_record,
    ),
    visibility: {
      kind: TombstoneVisibilityKind.SCOPE_EXIT,
      previous_scope: command.previous_scope,
      current_scope: command.current_scope,
    },
  });
}

export async function remove_sync_tombstone(
  ctx: MutationCtx,
  tombstone: Option<SyncTombstone>,
): Promise<boolean> {
  if (tombstone.status === OptionStatus.NONE) return false;
  await ctx.db.delete(tombstone.value._id);
  return true;
}
