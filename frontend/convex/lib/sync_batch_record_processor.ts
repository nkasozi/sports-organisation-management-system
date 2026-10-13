import type { MutationCtx } from "../_generated/server";
import { has_meaningful_changes } from "../sync_record_helpers";
import {
  create_none_option,
  create_some_option,
  type Option,
  OptionStatus,
} from "./option";
import {
  build_conflict_outcome,
  build_deleted_remotely_outcome,
} from "./sync_batch_record_follow_ups";
import {
  BatchBaseVersionKind,
  type BatchRecordCommand,
  type BatchRecordInput,
  type BatchRecordOutcome,
  build_outcome,
  NO_SERVER_VERSION,
} from "./sync_batch_record_types";
import { persist_versioned_upsert } from "./sync_batch_record_writer";
import { SyncResultAction } from "./sync_mutation_support";
import {
  load_existing_sync_record,
  read_record_version,
} from "./sync_record_store";
import { load_sync_tombstone, read_remote_deletion } from "./sync_tombstones";
import {
  type BaseVersion,
  decide_versioned_upsert,
  VersionedUpsertKind,
} from "./sync_versioning";
import { SyncWriteStatus } from "./sync_write_decision";
import {
  audit_rejected_sync_write,
  guard_sync_record_write,
} from "./sync_write_guard";

function resolve_legacy_stale_record(
  command: BatchRecordCommand,
  existing_record: Record<string, unknown>,
): BatchRecordOutcome {
  if (
    !command.detect_conflicts ||
    !has_meaningful_changes(command.record.data, existing_record)
  )
    return build_outcome(command.record.local_id, {
      success: true,
      name: SyncResultAction.SKIPPED,
      server_version: read_record_version(existing_record),
    });
  return build_conflict_outcome(command.record, existing_record);
}

function read_existing_document(
  existing_record: Option<Record<string, unknown>>,
): Record<string, unknown> {
  return existing_record.status === OptionStatus.SOME
    ? existing_record.value
    : {};
}

function read_base_version(record: BatchRecordInput): Option<BaseVersion> {
  switch (record.base.kind) {
    case BatchBaseVersionKind.PROVIDED:
      return create_some_option(record.base.base_version);
    case BatchBaseVersionKind.LEGACY_CLIENT:
      return create_none_option();
  }
}

async function apply_allowed_record(
  ctx: MutationCtx,
  command: BatchRecordCommand,
  existing_record: Option<Record<string, unknown>>,
  record_data: Record<string, unknown>,
): Promise<BatchRecordOutcome> {
  const { table_name, record } = command;
  const tombstone = await load_sync_tombstone(ctx, table_name, record.local_id);
  const versioned = decide_versioned_upsert({
    existing_record,
    remote_deletion: read_remote_deletion(tombstone),
    base_version: read_base_version(record),
    incoming_data: record_data,
    legacy_incoming_version: record.version,
  });
  const existing_document = read_existing_document(existing_record);
  switch (versioned.kind) {
    case VersionedUpsertKind.CONFLICT:
      return build_conflict_outcome(record, existing_document);
    case VersionedUpsertKind.LEGACY_STALE:
      return resolve_legacy_stale_record(command, existing_document);
    case VersionedUpsertKind.DELETED_REMOTELY:
      return build_deleted_remotely_outcome(record, versioned.remote_deletion);
    case VersionedUpsertKind.INSERT:
    case VersionedUpsertKind.UPDATE:
    case VersionedUpsertKind.UNCHANGED:
      return persist_versioned_upsert(ctx, {
        table_name,
        local_id: record.local_id,
        record_data,
        existing_record,
        tombstone,
        versioned,
      });
  }
}

export async function process_batch_record(
  ctx: MutationCtx,
  command: BatchRecordCommand,
): Promise<BatchRecordOutcome> {
  const { table_name, record } = command;
  const existing_record = await load_existing_sync_record(
    ctx,
    table_name,
    record.local_id,
  );
  const write_command = {
    table_name,
    caller: command.caller,
    local_id: record.local_id,
    incoming_record: create_some_option(record.data),
    existing_record,
  };
  const decision = await guard_sync_record_write(ctx, write_command);
  if (decision.status === SyncWriteStatus.ALLOWED)
    return apply_allowed_record(
      ctx,
      command,
      existing_record,
      decision.record_data,
    );
  await audit_rejected_sync_write(ctx, write_command, decision);
  return build_outcome(record.local_id, {
    success: false,
    name: decision.rejection,
    server_version: NO_SERVER_VERSION,
  });
}
