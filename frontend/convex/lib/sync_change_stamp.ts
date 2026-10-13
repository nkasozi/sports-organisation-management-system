import type { MutationCtx } from "../_generated/server";
import { bump_change_markers } from "./sync_change_markers";
import { allocate_serialized_table_sync_sequence } from "./sync_sequence_counter";
import type { AllowedSyncTable } from "./sync_table_catalog";

const VERSION_INCREMENT = 1;
export const SYSTEM_USERS_SYNC_TABLE: AllowedSyncTable = "system_users";
export const NEW_RECORD_PREVIOUS_VERSION = 0;

interface SyncChangeStamp {
  sync_sequence: number;
  synced_at: string;
}

interface SyncChangeCommand {
  table_name: AllowedSyncTable;
  changed_records: Array<Record<string, unknown>>;
}

export async function create_sync_change_stamp(
  ctx: MutationCtx,
  command: SyncChangeCommand,
): Promise<SyncChangeStamp> {
  const sync_sequence = await allocate_serialized_table_sync_sequence(
    ctx,
    command.table_name,
  );
  await bump_change_markers(ctx, { ...command, sync_sequence });
  return { sync_sequence, synced_at: new Date().toISOString() };
}

interface VersionedChangeFields extends SyncChangeStamp {
  version: number;
}

export async function create_versioned_change_fields(
  ctx: MutationCtx,
  command: SyncChangeCommand & { previous_version: number },
): Promise<VersionedChangeFields> {
  const stamp = await create_sync_change_stamp(ctx, command);
  return { ...stamp, version: command.previous_version + VERSION_INCREMENT };
}
