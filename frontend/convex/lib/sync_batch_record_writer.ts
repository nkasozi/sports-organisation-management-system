import type { MutationCtx } from "../_generated/server";
import { omit_cleared_values } from "./cleared_fields";
import {
  create_none_option,
  create_some_option,
  type Option,
  OptionStatus,
} from "./option";
import { refresh_ownership_dependents } from "./ownership_refresh";
import {
  type BatchRecordOutcome,
  build_outcome,
  NO_SERVER_VERSION,
} from "./sync_batch_record_types";
import { record_scope_exit_if_moved } from "./sync_batch_scope_exit";
import { create_sync_change_stamp } from "./sync_change_stamp";
import { SyncResultAction } from "./sync_mutation_support";
import { read_document_id } from "./sync_record_store";
import type { AllowedSyncTable } from "./sync_table_catalog";
import { remove_sync_tombstone, type SyncTombstone } from "./sync_tombstones";
import {
  type VersionedUpsertDecision,
  VersionedUpsertKind,
} from "./sync_versioning";

type PersistableUpsertDecision = Extract<
  VersionedUpsertDecision,
  {
    kind:
      | typeof VersionedUpsertKind.INSERT
      | typeof VersionedUpsertKind.UPDATE
      | typeof VersionedUpsertKind.UNCHANGED;
  }
>;

interface PersistVersionedUpsertCommand {
  table_name: AllowedSyncTable;
  local_id: string;
  record_data: Record<string, unknown>;
  existing_record: Option<Record<string, unknown>>;
  tombstone: Option<SyncTombstone>;
  versioned: VersionedUpsertDecision;
}

const UNPERSISTABLE_DECISION_ACTION = "unpersistable_decision";

async function build_stamped_record_data(
  ctx: MutationCtx,
  command: PersistVersionedUpsertCommand,
  next_version: number,
): Promise<Record<string, unknown>> {
  const stamp = await create_sync_change_stamp(ctx, {
    table_name: command.table_name,
    changed_records: [
      ...(command.existing_record.status === OptionStatus.SOME
        ? [command.existing_record.value]
        : []),
      { ...command.record_data, local_id: command.local_id },
    ],
  });
  return {
    ...command.record_data,
    local_id: command.local_id,
    synced_at: stamp.synced_at,
    sync_sequence: stamp.sync_sequence,
    version: next_version,
  };
}

async function insert_versioned_record(
  ctx: MutationCtx,
  command: PersistVersionedUpsertCommand,
  next_version: number,
): Promise<BatchRecordOutcome> {
  const record_data = await build_stamped_record_data(
    ctx,
    command,
    next_version,
  );
  await ctx.db.insert(
    command.table_name,
    omit_cleared_values(record_data) as never,
  );
  await remove_sync_tombstone(ctx, command.tombstone);
  await refresh_ownership_dependents(ctx, {
    table_name: command.table_name,
    previous_record: create_none_option(),
    next_record: create_some_option(record_data),
  });
  return build_outcome(command.local_id, {
    success: true,
    name: SyncResultAction.CREATED,
    server_version: next_version,
  });
}

async function update_versioned_record(
  ctx: MutationCtx,
  command: PersistVersionedUpsertCommand,
  next_version: number,
): Promise<BatchRecordOutcome> {
  if (command.existing_record.status === OptionStatus.NONE)
    return insert_versioned_record(ctx, command, next_version);
  const record_data = await build_stamped_record_data(
    ctx,
    command,
    next_version,
  );
  const previous_record = { ...command.existing_record.value };
  await record_scope_exit_if_moved(ctx, {
    table_name: command.table_name,
    local_id: command.local_id,
    previous_record,
    next_record: { ...previous_record, ...record_data },
    version: next_version,
  });
  await ctx.db.patch(
    read_document_id(command.existing_record.value),
    record_data as never,
  );
  await refresh_ownership_dependents(ctx, {
    table_name: command.table_name,
    previous_record: create_some_option(previous_record),
    next_record: create_some_option(record_data),
  });
  return build_outcome(command.local_id, {
    success: true,
    name: SyncResultAction.UPDATED,
    server_version: next_version,
  });
}

function is_persistable_decision(
  versioned: VersionedUpsertDecision,
): versioned is PersistableUpsertDecision {
  return (
    versioned.kind === VersionedUpsertKind.INSERT ||
    versioned.kind === VersionedUpsertKind.UPDATE ||
    versioned.kind === VersionedUpsertKind.UNCHANGED
  );
}

export async function persist_versioned_upsert(
  ctx: MutationCtx,
  command: PersistVersionedUpsertCommand,
): Promise<BatchRecordOutcome> {
  const versioned = command.versioned;
  if (!is_persistable_decision(versioned))
    return build_outcome(command.local_id, {
      success: false,
      name: UNPERSISTABLE_DECISION_ACTION,
      server_version: NO_SERVER_VERSION,
    });
  switch (versioned.kind) {
    case VersionedUpsertKind.INSERT:
      return insert_versioned_record(ctx, command, versioned.next_version);
    case VersionedUpsertKind.UPDATE:
      return update_versioned_record(ctx, command, versioned.next_version);
    case VersionedUpsertKind.UNCHANGED:
      return build_outcome(command.local_id, {
        success: true,
        name: SyncResultAction.SKIPPED,
        server_version: versioned.current_version,
      });
  }
}
