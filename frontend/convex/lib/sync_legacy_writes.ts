import type { MutationCtx } from "../_generated/server";
import type { SystemUserRecord } from "./auth_middleware";
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
import type { AllowedSyncTable } from "./sync_table_catalog";
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

const NO_PREVIOUS_VERSION = 0;

interface LegacyUpsertCommand {
  table_name: AllowedSyncTable;
  caller: SystemUserRecord;
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
): Promise<BatchRecordOutcome> {
  const tombstone = await load_sync_tombstone(
    ctx,
    command.table_name,
    command.local_id,
  );
  const versioned = decide_legacy_upsert(command, tombstone);
  switch (versioned.kind) {
    case VersionedUpsertKind.CONFLICT:
      return build_outcome(command.local_id, {
        success: false,
        name: SyncResultAction.CONFLICT_DETECTED,
        server_version: versioned.current_version,
      });
    case VersionedUpsertKind.DELETED_REMOTELY:
      return build_outcome(command.local_id, {
        success: true,
        name: SyncResultAction.DELETED_REMOTELY,
        server_version: versioned.remote_deletion.version,
      });
    case VersionedUpsertKind.INSERT:
    case VersionedUpsertKind.UPDATE:
    case VersionedUpsertKind.UNCHANGED:
      return persist_versioned_upsert(ctx, {
        ...command,
        tombstone,
        versioned,
      });
  }
}

export const ResolvedWriteStatus = {
  WRITTEN: "written",
  CONFLICT: "conflict",
  DELETED_REMOTELY: "deleted_remotely",
} as const;

export type ResolvedWriteOutcome =
  | {
      status: typeof ResolvedWriteStatus.WRITTEN;
      action: string;
      server_version: number;
    }
  | {
      status:
        | typeof ResolvedWriteStatus.CONFLICT
        | typeof ResolvedWriteStatus.DELETED_REMOTELY;
      server_version: number;
    };

interface ResolvedWriteCommand {
  table_name: AllowedSyncTable;
  caller: SystemUserRecord;
  local_id: string;
  record_data: Record<string, unknown>;
  existing_record: Option<Record<string, unknown>>;
  base_version: BaseVersion;
}

function build_resolved_write(
  command: { existing_record: Option<Record<string, unknown>> },
  server_version: number,
): ResolvedWriteOutcome {
  return {
    status: ResolvedWriteStatus.WRITTEN,
    action:
      command.existing_record.status === OptionStatus.SOME
        ? SyncResultAction.CONFLICT_RESOLVED
        : SyncResultAction.CREATED_AFTER_CONFLICT,
    server_version,
  };
}

async function settle_resolved_decision(
  ctx: MutationCtx,
  command: ResolvedWriteCommand & {
    tombstone: Option<SyncTombstone>;
    versioned: VersionedUpsertDecision;
  },
): Promise<ResolvedWriteOutcome> {
  const versioned = command.versioned;
  switch (versioned.kind) {
    case VersionedUpsertKind.CONFLICT:
      return {
        status: ResolvedWriteStatus.CONFLICT,
        server_version: versioned.current_version,
      };
    case VersionedUpsertKind.DELETED_REMOTELY:
      return {
        status: ResolvedWriteStatus.DELETED_REMOTELY,
        server_version: versioned.remote_deletion.version,
      };
    case VersionedUpsertKind.INSERT:
    case VersionedUpsertKind.UPDATE:
    case VersionedUpsertKind.UNCHANGED: {
      const outcome = await persist_versioned_upsert(ctx, command);
      return build_resolved_write(command, outcome.result.server_version);
    }
  }
}

export async function write_resolved_record(
  ctx: MutationCtx,
  command: ResolvedWriteCommand,
): Promise<ResolvedWriteOutcome> {
  const tombstone = await load_sync_tombstone(
    ctx,
    command.table_name,
    command.local_id,
  );
  const versioned = decide_versioned_upsert({
    existing_record: command.existing_record,
    remote_deletion: read_remote_deletion(tombstone),
    base_version: create_some_option(command.base_version),
    incoming_data: command.record_data,
    legacy_incoming_version: NO_PREVIOUS_VERSION,
  });
  return settle_resolved_decision(ctx, {
    ...command,
    tombstone,
    versioned,
  });
}
