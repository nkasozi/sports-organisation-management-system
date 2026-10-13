import {
  type SyncBaseVersion,
  SyncBaseVersionKind,
  type SyncOutboxEntry,
  SyncOutboxEntryStatus,
  SyncOutboxOperation,
  type SyncOutboxOperationValue,
  type SyncRecordVersion,
} from "$lib/adapters/repositories/syncOutbox/syncOutboxTypes";
import {
  create_failure_result,
  create_success_result,
  type Result,
} from "$lib/core/types/Result";
import {
  TABLE_NAMES,
  type TableName,
} from "$lib/infrastructure/sync/syncTypes";

const OUTBOX_ENTRY_INVALID_ERROR =
  "Backup contains an invalid sync outbox entry";
const RECORD_VERSION_INVALID_ERROR =
  "Backup contains an invalid sync record version";
const OBJECT_TYPE_NAME = "object";
const STRING_TYPE_NAME = "string";
const NUMBER_TYPE_NAME = "number";

type RawObject = Record<string, unknown>;

export function is_backup_raw_object(value: unknown): value is RawObject {
  return (
    typeof value === OBJECT_TYPE_NAME && Boolean(value) && !Array.isArray(value)
  );
}

function is_non_empty_string(value: unknown): value is string {
  return typeof value === STRING_TYPE_NAME && (value as string).length > 0;
}

function is_finite_number(value: unknown): value is number {
  return typeof value === NUMBER_TYPE_NAME && Number.isFinite(value);
}

function is_table_name(value: unknown): value is TableName {
  return TABLE_NAMES.includes(value as TableName);
}

function is_outbox_operation(
  value: unknown,
): value is SyncOutboxOperationValue {
  return Object.values(SyncOutboxOperation).includes(
    value as SyncOutboxOperationValue,
  );
}

function parse_base_version(value: unknown): Result<SyncBaseVersion> {
  if (!is_backup_raw_object(value))
    return create_failure_result(OUTBOX_ENTRY_INVALID_ERROR);
  switch (value.kind) {
    case SyncBaseVersionKind.UNKNOWN:
      return create_success_result({ kind: SyncBaseVersionKind.UNKNOWN });
    case SyncBaseVersionKind.RECREATE:
      return create_success_result({ kind: SyncBaseVersionKind.RECREATE });
    case SyncBaseVersionKind.KNOWN:
      return is_finite_number(value.version)
        ? create_success_result({
            kind: SyncBaseVersionKind.KNOWN,
            version: value.version,
          })
        : create_failure_result(OUTBOX_ENTRY_INVALID_ERROR);
    default:
      return create_failure_result(OUTBOX_ENTRY_INVALID_ERROR);
  }
}

function has_valid_outbox_entry_fields(value: RawObject): boolean {
  return (
    is_table_name(value.table_name) &&
    is_non_empty_string(value.local_id) &&
    is_outbox_operation(value.operation) &&
    is_non_empty_string(value.change_token) &&
    is_non_empty_string(value.enqueued_at)
  );
}

function attach_outbox_entry_status(
  value: RawObject,
  base_version: SyncBaseVersion,
): Result<SyncOutboxEntry> {
  const fields = {
    table_name: value.table_name as string,
    local_id: value.local_id as string,
    operation: value.operation as SyncOutboxOperationValue,
    base_version,
    change_token: value.change_token as string,
    enqueued_at: value.enqueued_at as string,
  };
  switch (value.status) {
    case SyncOutboxEntryStatus.PENDING:
      return create_success_result({
        ...fields,
        status: SyncOutboxEntryStatus.PENDING,
      });
    case SyncOutboxEntryStatus.REJECTED:
      return typeof value.rejection_code === STRING_TYPE_NAME &&
        typeof value.rejection_message === STRING_TYPE_NAME
        ? create_success_result({
            ...fields,
            status: SyncOutboxEntryStatus.REJECTED,
            rejection_code: value.rejection_code as string,
            rejection_message: value.rejection_message as string,
          })
        : create_failure_result(OUTBOX_ENTRY_INVALID_ERROR);
    case SyncOutboxEntryStatus.CONFLICTED:
      return is_finite_number(value.remote_version)
        ? create_success_result({
            ...fields,
            status: SyncOutboxEntryStatus.CONFLICTED,
            remote_version: value.remote_version,
          })
        : create_failure_result(OUTBOX_ENTRY_INVALID_ERROR);
    default:
      return create_failure_result(OUTBOX_ENTRY_INVALID_ERROR);
  }
}

export function parse_sync_outbox_entry(
  value: unknown,
): Result<SyncOutboxEntry> {
  if (!is_backup_raw_object(value) || !has_valid_outbox_entry_fields(value))
    return create_failure_result(OUTBOX_ENTRY_INVALID_ERROR);
  const base_version_result = parse_base_version(value.base_version);
  if (!base_version_result.success) return base_version_result;
  return attach_outbox_entry_status(value, base_version_result.data);
}

export function parse_sync_record_version(
  value: unknown,
): Result<SyncRecordVersion> {
  if (
    !is_backup_raw_object(value) ||
    !is_table_name(value.table_name) ||
    !is_non_empty_string(value.local_id) ||
    !is_finite_number(value.server_version)
  )
    return create_failure_result(RECORD_VERSION_INVALID_ERROR);
  return create_success_result({
    table_name: value.table_name,
    local_id: value.local_id,
    server_version: value.server_version,
  });
}
