import { strip_convex_fields } from "../sync_record_helpers";
import {
  BatchFollowUpKind,
  type BatchRecordInput,
  type BatchRecordOutcome,
  type RemoteAuthor,
  RemoteAuthorKind,
} from "./sync_batch_record_types";
import { SyncResultAction } from "./sync_mutation_support";
import { read_record_version } from "./sync_record_store";
import type { RemoteDeletion } from "./sync_versioning";
import { is_string } from "./value_guards";

const REMOTE_UPDATE_TIME_FIELD_NAMES = ["updated_at", "synced_at"];
const UPDATED_BY_FIELD_NAME = "updated_by";
const UNKNOWN_REMOTE_UPDATE_TIME = "";

function read_remote_author(
  existing_record: Record<string, unknown>,
): RemoteAuthor {
  const updated_by = existing_record[UPDATED_BY_FIELD_NAME];
  return is_string(updated_by)
    ? { kind: RemoteAuthorKind.KNOWN, updated_by }
    : { kind: RemoteAuthorKind.UNKNOWN };
}

function read_remote_updated_at(
  existing_record: Record<string, unknown>,
): string {
  const update_times = REMOTE_UPDATE_TIME_FIELD_NAMES.flatMap((field_name) => {
    const field_value = existing_record[field_name];
    return is_string(field_value) && field_value ? [field_value] : [];
  });
  return update_times.length > 0 ? update_times[0] : UNKNOWN_REMOTE_UPDATE_TIME;
}

export function build_conflict_outcome(
  record: BatchRecordInput,
  existing_record: Record<string, unknown>,
): BatchRecordOutcome {
  const remote_version = read_record_version(existing_record);
  return {
    result: {
      local_id: record.local_id,
      success: true,
      action: SyncResultAction.CONFLICT_DETECTED,
      server_version: remote_version,
    },
    follow_up: {
      kind: BatchFollowUpKind.CONFLICT,
      conflict: {
        local_id: record.local_id,
        local_data: record.data,
        local_version: record.version,
        remote_data: strip_convex_fields(existing_record),
        remote_version,
        remote_updated_at: read_remote_updated_at(existing_record),
        remote_updated_by: read_remote_author(existing_record),
      },
    },
  };
}

export function build_deleted_remotely_outcome(
  record: BatchRecordInput,
  remote_deletion: RemoteDeletion,
): BatchRecordOutcome {
  return {
    result: {
      local_id: record.local_id,
      success: true,
      action: SyncResultAction.DELETED_REMOTELY,
      server_version: remote_deletion.version,
    },
    follow_up: {
      kind: BatchFollowUpKind.DELETED_REMOTELY,
      deleted_remotely: {
        local_id: record.local_id,
        local_version: record.version,
        tombstone_version: remote_deletion.version,
        deleted_at: remote_deletion.deleted_at,
      },
    },
  };
}
