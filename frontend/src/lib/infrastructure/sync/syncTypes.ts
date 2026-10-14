import type { SyncDirection } from "$lib/core/interfaces/ports";
import type {
  EntityId,
  IsoDateTimeString,
  ScalarInput,
} from "$lib/core/types/DomainScalars";
import { parse_entity_id } from "$lib/core/types/DomainScalars";
import {
  create_none_option,
  create_some_option,
  type Option,
  OptionStatus,
} from "$lib/core/types/Option";
import { is_string_value } from "$lib/infrastructure/utils/runtimeTypeGuards";

import {
  type ConflictFieldValue,
  type ConflictRecord,
  create_known_conflict_field_value,
  create_unknown_conflict_field_value,
} from "./conflictTypes";
import {
  type ConflictRemoteDataStatusValue,
  normalize_remote_data_status,
} from "./syncConflictVisibility";

export {
  get_push_excluded_tables,
  get_push_excluded_tables_for_unsigned_user,
  TABLE_NAMES,
  type TableName,
} from "./syncTableNames";

export type { SyncDirection };
export type SyncStatus = "idle" | "syncing" | "success" | "error" | "conflict";

export interface SyncProgress {
  table_name: string;
  total_records: number;
  synced_records: number;
  status: SyncStatus;
  errors: string[];
  tables_completed: number;
  total_tables: number;
  percentage: number;
}

export interface ConflictFromServer {
  local_id: ScalarInput<ConflictRecord>["local_id"];
  local_data: Record<string, unknown>;
  local_version: number;
  remote_data: Record<string, unknown>;
  remote_data_status: ConflictRemoteDataStatusValue;
  remote_version: number;
  remote_updated_at: ScalarInput<ConflictRecord>["remote_updated_at"];
  remote_updated_by: ConflictFieldValue<EntityId>;
}

export interface RawConflictFromServer {
  local_id: ScalarInput<ConflictRecord>["local_id"];
  local_data: Record<string, unknown>;
  local_version: number;
  remote_data: Record<string, unknown>;
  remote_data_status: unknown;
  remote_version: number;
  remote_updated_at: ScalarInput<ConflictRecord>["remote_updated_at"];
  remote_updated_by: unknown;
}

export interface SyncResult {
  success: boolean;
  tables_synced: number;
  records_pushed: number;
  records_pulled: number;
  errors: Array<{ table_name: string; error: string }>;
  duration_ms: number;
  conflicts: Array<{ table_name: string; conflicts: ConflictFromServer[] }>;
  rejected_records: Array<{
    table_name: string;
    local_id: string;
    rejection_code: string;
    rejection_message: string;
  }>;
  deleted_remotely: Array<{
    table_name: string;
    local_id: string;
    local_data: Record<string, unknown>;
    tombstone_version: number;
    deleted_at: string;
  }>;
}

export interface SyncConfig {
  convex_url: string;
  sync_interval_ms: number;
  enabled_tables: string[];
  direction: SyncDirection;
}

export interface ConvexClient {
  mutation: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  query: (name: string, args: Record<string, unknown>) => Promise<unknown>;
}

export interface ConflictResolutionRequest {
  table_name: string;
  local_id: ScalarInput<ConflictRecord>["local_id"];
  resolved_data: Record<string, unknown>;
  resolution_action: "keep_local" | "keep_remote" | "merge";
  base_version: number;
  resolved_by?: EntityId;
}

export const EPOCH_TIMESTAMP = "1970-01-01T00:00:00.000Z" as IsoDateTimeString;
const INVALID_CONFLICT_ACTOR_ID_ERROR = "Conflict actor id is invalid";

const RemoteAuthorKind = {
  KNOWN: "known",
  UNKNOWN: "unknown",
} as const;

function read_remote_author_id(remote_updated_by: unknown): Option<string> {
  if (!(remote_updated_by instanceof Object)) return create_none_option();
  const author = remote_updated_by as { kind?: unknown; updated_by?: unknown };
  return author.kind === RemoteAuthorKind.KNOWN &&
    is_string_value(author.updated_by)
    ? create_some_option(author.updated_by)
    : create_none_option();
}

function normalize_remote_author(
  remote_updated_by: unknown,
): ConflictFieldValue<EntityId> {
  const author_id = read_remote_author_id(remote_updated_by);
  if (author_id.status === OptionStatus.NONE)
    return create_unknown_conflict_field_value<EntityId>();
  const parsed = parse_entity_id(
    author_id.value,
    INVALID_CONFLICT_ACTOR_ID_ERROR,
  );
  return parsed.success
    ? create_known_conflict_field_value(parsed.data)
    : create_unknown_conflict_field_value<EntityId>();
}

export function normalize_conflict_from_server(
  raw_conflict: RawConflictFromServer,
): ConflictFromServer {
  return {
    ...raw_conflict,
    remote_data_status: normalize_remote_data_status(
      raw_conflict.remote_data_status,
    ),
    remote_updated_by: normalize_remote_author(raw_conflict.remote_updated_by),
  };
}
