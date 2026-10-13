export const SYNC_OUTBOX_TABLE_NAME = "sync_outbox";
export const SYNC_RECORD_VERSIONS_TABLE_NAME = "sync_record_versions";
export const SYNC_CURSORS_TABLE_NAME = "sync_cursors";

export const SYNC_BOOKKEEPING_TABLE_NAMES = [
  SYNC_OUTBOX_TABLE_NAME,
  SYNC_RECORD_VERSIONS_TABLE_NAME,
  SYNC_CURSORS_TABLE_NAME,
] as const;

export const SyncOutboxOperation = {
  UPSERT: "upsert",
  DELETE: "delete",
} as const;

export type SyncOutboxOperationValue =
  (typeof SyncOutboxOperation)[keyof typeof SyncOutboxOperation];

export const SyncOutboxEntryStatus = {
  PENDING: "pending",
  REJECTED: "rejected",
  CONFLICTED: "conflicted",
} as const;

type SyncOutboxEntryStatusValue =
  (typeof SyncOutboxEntryStatus)[keyof typeof SyncOutboxEntryStatus];

export const SyncBaseVersionKind = {
  KNOWN: "known",
  UNKNOWN: "unknown",
  RECREATE: "recreate",
} as const;

export type SyncBaseVersion =
  | { kind: typeof SyncBaseVersionKind.KNOWN; version: number }
  | { kind: typeof SyncBaseVersionKind.UNKNOWN }
  | { kind: typeof SyncBaseVersionKind.RECREATE };

interface SyncOutboxEntryFields {
  table_name: string;
  local_id: string;
  operation: SyncOutboxOperationValue;
  base_version: SyncBaseVersion;
  change_token: string;
  enqueued_at: string;
}

export type SyncOutboxEntry =
  | (SyncOutboxEntryFields & { status: typeof SyncOutboxEntryStatus.PENDING })
  | (SyncOutboxEntryFields & {
      status: typeof SyncOutboxEntryStatus.REJECTED;
      rejection_code: string;
      rejection_message: string;
    })
  | (SyncOutboxEntryFields & {
      status: typeof SyncOutboxEntryStatus.CONFLICTED;
      remote_version: number;
    });

export type SyncOutboxKey = [string, string];

export interface SyncRecordVersion {
  table_name: string;
  local_id: string;
  server_version: number;
}

export interface SyncCursor {
  table_name: string;
  after_sequence: number;
}

export const INITIAL_SYNC_CURSOR_SEQUENCE = 0;

export function build_sync_outbox_key(
  table_name: string,
  local_id: string,
): SyncOutboxKey {
  return [table_name, local_id];
}

export function create_known_base_version(version: number): SyncBaseVersion {
  return { kind: SyncBaseVersionKind.KNOWN, version };
}

export function create_unknown_base_version(): SyncBaseVersion {
  return { kind: SyncBaseVersionKind.UNKNOWN };
}

export function create_recreate_base_version(): SyncBaseVersion {
  return { kind: SyncBaseVersionKind.RECREATE };
}

export const SYNC_BOOKKEEPING_STORE_SCHEMA: Record<string, string> = {
  [SYNC_OUTBOX_TABLE_NAME]: "[table_name+local_id], table_name, status",
  [SYNC_RECORD_VERSIONS_TABLE_NAME]: "[table_name+local_id]",
  [SYNC_CURSORS_TABLE_NAME]: "table_name",
};
