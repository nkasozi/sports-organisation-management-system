import type { SystemUserRecord } from "./auth_middleware";
import type { AllowedSyncTable } from "./sync_table_catalog";
import type { BaseVersion } from "./sync_versioning";

export const NO_SERVER_VERSION = 0;

export const BatchBaseVersionKind = {
  PROVIDED: "provided",
  LEGACY_CLIENT: "legacy_client",
} as const;

export type BatchBaseVersion =
  | { kind: typeof BatchBaseVersionKind.PROVIDED; base_version: BaseVersion }
  | { kind: typeof BatchBaseVersionKind.LEGACY_CLIENT };

export interface BatchRecordInput {
  local_id: string;
  data: Record<string, unknown>;
  version: number;
  base: BatchBaseVersion;
}

export interface BatchRecordResult {
  local_id: string;
  success: boolean;
  action: string;
  server_version: number;
}

export const RemoteAuthorKind = {
  KNOWN: "known",
  UNKNOWN: "unknown",
} as const;

export type RemoteAuthor =
  | { kind: typeof RemoteAuthorKind.KNOWN; updated_by: string }
  | { kind: typeof RemoteAuthorKind.UNKNOWN };

export interface BatchRecordConflict {
  local_id: string;
  local_data: Record<string, unknown>;
  local_version: number;
  remote_data: Record<string, unknown>;
  remote_version: number;
  remote_updated_at: string;
  remote_updated_by: RemoteAuthor;
}

export interface BatchRecordDeletedRemotely {
  local_id: string;
  local_version: number;
  tombstone_version: number;
  deleted_at: string;
}

export interface BatchRecordCommand {
  table_name: AllowedSyncTable;
  caller: SystemUserRecord;
  record: BatchRecordInput;
}

export const BatchFollowUpKind = {
  NONE: "none",
  CONFLICT: "conflict",
  DELETED_REMOTELY: "deleted_remotely",
} as const;

export type BatchFollowUp =
  | { kind: typeof BatchFollowUpKind.NONE }
  | { kind: typeof BatchFollowUpKind.CONFLICT; conflict: BatchRecordConflict }
  | {
      kind: typeof BatchFollowUpKind.DELETED_REMOTELY;
      deleted_remotely: BatchRecordDeletedRemotely;
    };

export interface BatchRecordOutcome {
  result: BatchRecordResult;
  follow_up: BatchFollowUp;
}

export function build_outcome(
  local_id: string,
  action: { success: boolean; name: string; server_version: number },
): BatchRecordOutcome {
  return {
    result: {
      local_id,
      success: action.success,
      action: action.name,
      server_version: action.server_version,
    },
    follow_up: { kind: BatchFollowUpKind.NONE },
  };
}
