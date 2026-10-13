import type { MutationCtx } from "../_generated/server";
import {
  create_none_option,
  create_some_option,
  type Option,
  OptionStatus,
} from "./option";
import {
  type BatchRecordOutcome,
  build_outcome,
} from "./sync_batch_record_types";
import { persist_versioned_upsert } from "./sync_batch_record_writer";
import { SyncResultAction } from "./sync_mutation_support";
import { read_record_version } from "./sync_record_store";
import type { AllowedSyncTable } from "./sync_table_catalog";
import {
  load_sync_tombstone,
  read_remote_deletion,
  type SyncTombstone,
} from "./sync_tombstones";
import {
  decide_versioned_upsert,
  type VersionedUpsertDecision,
  VersionedUpsertKind,
} from "./sync_versioning";

const VERSION_INCREMENT = 1;
const NO_PREVIOUS_VERSION = 0;

function read_previous_version(
  existing_record: Option<Record<string, unknown>>,
  tombstone: Option<SyncTombstone>,
): number {
  if (existing_record.status === OptionStatus.SOME)
    return read_record_version(existing_record.value);
  return tombstone.status === OptionStatus.SOME
    ? tombstone.value.version
    : NO_PREVIOUS_VERSION;
}

interface LegacyUpsertCommand {
  table_name: AllowedSyncTable;
  local_id: string;
  record_data: Record<string, unknown>;
  existing_record: Option<Record<string, unknown>>;
  legacy_incoming_version: number;
}

function decide_legacy_upsert(
  command: LegacyUpsertCommand,
  tombstone: Option<SyncTombstone>,
): VersionedUpsertDecision {
  return decide_versioned_upsert({
    existing_record: command.existing_record,
    remote_deletion: read_remote_deletion(tombstone),
    base_version: create_none_option(),
    incoming_data: command.record_data,
    legacy_incoming_version: command.legacy_incoming_version,
  });
}

export async function apply_legacy_upsert(
  ctx: MutationCtx,
  command: LegacyUpsertCommand,
): Promise<Option<BatchRecordOutcome>> {
  const tombstone = await load_sync_tombstone(
    ctx,
    command.table_name,
    command.local_id,
  );
  const versioned = decide_legacy_upsert(command, tombstone);
  switch (versioned.kind) {
    case VersionedUpsertKind.LEGACY_STALE:
      return create_none_option();
    case VersionedUpsertKind.DELETED_REMOTELY:
      return create_some_option(
        build_outcome(command.local_id, {
          success: true,
          name: SyncResultAction.DELETED_REMOTELY,
          server_version: versioned.remote_deletion.version,
        }),
      );
    case VersionedUpsertKind.INSERT:
    case VersionedUpsertKind.UPDATE:
    case VersionedUpsertKind.UNCHANGED:
    case VersionedUpsertKind.CONFLICT:
      return create_some_option(
        await persist_versioned_upsert(ctx, {
          ...command,
          tombstone,
          versioned,
        }),
      );
  }
}

export async function write_resolved_record(
  ctx: MutationCtx,
  command: {
    table_name: AllowedSyncTable;
    local_id: string;
    record_data: Record<string, unknown>;
    existing_record: Option<Record<string, unknown>>;
  },
): Promise<{ action: string; server_version: number }> {
  const tombstone = await load_sync_tombstone(
    ctx,
    command.table_name,
    command.local_id,
  );
  const next_version =
    read_previous_version(command.existing_record, tombstone) +
    VERSION_INCREMENT;
  const outcome = await persist_versioned_upsert(ctx, {
    ...command,
    tombstone,
    versioned: {
      kind:
        command.existing_record.status === OptionStatus.SOME
          ? VersionedUpsertKind.UPDATE
          : VersionedUpsertKind.INSERT,
      next_version,
    },
  });
  return {
    action:
      command.existing_record.status === OptionStatus.SOME
        ? SyncResultAction.CONFLICT_RESOLVED
        : SyncResultAction.CREATED_AFTER_CONFLICT,
    server_version: outcome.result.server_version,
  };
}
