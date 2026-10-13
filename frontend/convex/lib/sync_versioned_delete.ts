import type { MutationCtx } from "../_generated/server";
import { strip_convex_fields } from "../sync_record_helpers";
import {
  create_none_option,
  create_some_option,
  type Option,
  OptionStatus,
} from "./option";
import { NO_SERVER_VERSION } from "./sync_batch_record_types";
import { create_sync_change_stamp } from "./sync_change_stamp";
import { SyncResultAction } from "./sync_mutation_support";
import { read_document_id } from "./sync_record_store";
import type { AllowedSyncTable } from "./sync_table_catalog";
import { write_sync_tombstone } from "./sync_tombstones";
import type { BaseVersion } from "./sync_versioning";
import {
  decide_versioned_delete,
  VersionedDeleteKind,
} from "./sync_versioning_delete";

interface VersionedDeleteCommand {
  table_name: AllowedSyncTable;
  local_id: string;
  existing_record: Option<Record<string, unknown>>;
  base_version: Option<BaseVersion>;
}

interface VersionedDeleteOutcome {
  success: true;
  action: string;
  server_version: number;
  remote_record: Option<Record<string, unknown>>;
}

function build_delete_outcome(
  action: string,
  server_version: number,
  remote_record: Option<Record<string, unknown>>,
): VersionedDeleteOutcome {
  return { success: true, action, server_version, remote_record };
}

async function delete_and_tombstone(
  ctx: MutationCtx,
  command: VersionedDeleteCommand,
  existing_record: Record<string, unknown>,
  tombstone_version: number,
): Promise<VersionedDeleteOutcome> {
  const stamp = await create_sync_change_stamp(ctx, {
    table_name: command.table_name,
    changed_records: [existing_record],
  });
  await ctx.db.delete(read_document_id(existing_record));
  await write_sync_tombstone(ctx, {
    table_name: command.table_name,
    local_id: command.local_id,
    deleted_record: existing_record,
    version: tombstone_version,
    sync_sequence: stamp.sync_sequence,
    deleted_at: stamp.synced_at,
  });
  return build_delete_outcome(
    SyncResultAction.DELETED,
    tombstone_version,
    create_none_option(),
  );
}

export async function apply_versioned_delete(
  ctx: MutationCtx,
  command: VersionedDeleteCommand,
): Promise<VersionedDeleteOutcome> {
  const decision = decide_versioned_delete(command);
  const existing_record = command.existing_record;
  if (existing_record.status === OptionStatus.NONE)
    return build_delete_outcome(
      SyncResultAction.NOT_FOUND,
      NO_SERVER_VERSION,
      create_none_option(),
    );
  switch (decision.kind) {
    case VersionedDeleteKind.DELETE:
      return delete_and_tombstone(
        ctx,
        command,
        existing_record.value,
        decision.tombstone_version,
      );
    case VersionedDeleteKind.CONFLICT:
      return build_delete_outcome(
        SyncResultAction.CONFLICT_DETECTED,
        decision.current_version,
        create_some_option(strip_convex_fields(existing_record.value)),
      );
    case VersionedDeleteKind.ALREADY_ABSENT:
      return build_delete_outcome(
        SyncResultAction.NOT_FOUND,
        NO_SERVER_VERSION,
        create_none_option(),
      );
  }
}
