import type { MutationCtx } from "../_generated/server";
import {
  build_caller_visible_record,
  project_record_for_caller,
} from "./caller_record_projection";
import { apply_cleared_fields } from "./cleared_fields";
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
import { load_existing_sync_record } from "./sync_record_store";
import {
  load_sync_tombstone,
  read_remote_deletion,
  type SyncTombstone,
} from "./sync_tombstones";
import {
  type BaseVersion,
  decide_versioned_upsert,
  type VersionedUpsertDecision,
  VersionedUpsertKind,
} from "./sync_versioning";
import { SyncWriteStatus } from "./sync_write_decision";
import {
  audit_rejected_sync_write,
  guard_sync_record_write,
} from "./sync_write_guard";

interface LoadedBatchRecordState {
  existing_record: Option<Record<string, unknown>>;
  tombstone: Option<SyncTombstone>;
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

async function guard_and_persist_record(
  ctx: MutationCtx,
  command: BatchRecordCommand,
  state: LoadedBatchRecordState,
  versioned: VersionedUpsertDecision,
): Promise<BatchRecordOutcome> {
  const { table_name, record } = command;
  const write_command = {
    table_name,
    caller: command.caller,
    local_id: record.local_id,
    incoming_record: create_some_option(
      apply_cleared_fields(record.data, record.cleared_fields),
    ),
    existing_record: state.existing_record,
  };
  const decision = await guard_sync_record_write(ctx, write_command);
  if (decision.status === SyncWriteStatus.REJECTED) {
    await audit_rejected_sync_write(ctx, write_command, decision);
    return build_outcome(record.local_id, {
      success: false,
      name: decision.rejection,
      server_version: NO_SERVER_VERSION,
    });
  }
  return persist_versioned_upsert(ctx, {
    table_name,
    local_id: record.local_id,
    record_data: decision.record_data,
    existing_record: state.existing_record,
    tombstone: state.tombstone,
    versioned,
  });
}

async function build_visible_conflict_outcome(
  ctx: MutationCtx,
  command: BatchRecordCommand,
  existing_record: Record<string, unknown>,
): Promise<BatchRecordOutcome> {
  return build_conflict_outcome(
    command.record,
    existing_record,
    await build_caller_visible_record(ctx, {
      caller: command.caller,
      table_name: command.table_name,
      record: existing_record,
    }),
  );
}

async function attach_stored_record(
  ctx: MutationCtx,
  command: BatchRecordCommand,
  outcome: BatchRecordOutcome,
): Promise<BatchRecordOutcome> {
  if (!outcome.result.success) return outcome;
  const stored = await load_existing_sync_record(
    ctx,
    command.table_name,
    command.record.local_id,
  );
  if (stored.status === OptionStatus.NONE) return outcome;
  const visible = await project_record_for_caller(ctx, {
    caller: command.caller,
    table_name: command.table_name,
    record: stored.value,
  });
  return visible.status === OptionStatus.SOME
    ? { ...outcome, result: { ...outcome.result, record: visible.value } }
    : outcome;
}

async function settle_versioned_decision(
  ctx: MutationCtx,
  command: BatchRecordCommand,
  state: LoadedBatchRecordState,
  versioned: VersionedUpsertDecision,
): Promise<BatchRecordOutcome> {
  switch (versioned.kind) {
    case VersionedUpsertKind.CONFLICT:
      return build_visible_conflict_outcome(
        ctx,
        command,
        read_existing_document(state.existing_record),
      );
    case VersionedUpsertKind.DELETED_REMOTELY:
      return build_deleted_remotely_outcome(
        command.record,
        versioned.remote_deletion,
      );
    case VersionedUpsertKind.UNCHANGED:
      return attach_stored_record(
        ctx,
        command,
        build_outcome(command.record.local_id, {
          success: true,
          name: SyncResultAction.SKIPPED,
          server_version: versioned.current_version,
        }),
      );
    case VersionedUpsertKind.INSERT:
    case VersionedUpsertKind.UPDATE:
      return attach_stored_record(
        ctx,
        command,
        await guard_and_persist_record(ctx, command, state, versioned),
      );
  }
}

export async function process_batch_record(
  ctx: MutationCtx,
  command: BatchRecordCommand,
): Promise<BatchRecordOutcome> {
  const { table_name, record } = command;
  const state: LoadedBatchRecordState = {
    existing_record: await load_existing_sync_record(
      ctx,
      table_name,
      record.local_id,
    ),
    tombstone: await load_sync_tombstone(ctx, table_name, record.local_id),
  };
  const versioned = decide_versioned_upsert({
    existing_record: state.existing_record,
    remote_deletion: read_remote_deletion(state.tombstone),
    base_version: read_base_version(record),
    incoming_data: apply_cleared_fields(record.data, record.cleared_fields),
    legacy_incoming_version: record.version,
  });
  return settle_versioned_decision(ctx, command, state, versioned);
}
