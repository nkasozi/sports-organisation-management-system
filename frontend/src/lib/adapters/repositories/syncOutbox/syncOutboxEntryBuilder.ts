import {
  create_none_option,
  create_some_option,
  type Option,
  option_from_document,
  OptionStatus,
} from "$lib/core/types/Option";

import {
  create_known_base_version,
  create_unknown_base_version,
  type SyncBaseVersion,
  type SyncOutboxEntry,
  SyncOutboxEntryStatus,
  type SyncOutboxOperationValue,
  SyncRecordState,
  type SyncRecordVersionRow,
} from "./syncOutboxTypes";

interface BuildPendingOutboxEntryCommand {
  table_name: string;
  local_id: string;
  operation: SyncOutboxOperationValue;
  existing_entry: Option<SyncOutboxEntry>;
  known_server_version: Option<number>;
  change_token: string;
  enqueued_at: string;
}

function resolve_base_version(
  command: BuildPendingOutboxEntryCommand,
): SyncBaseVersion {
  if (command.existing_entry.status === OptionStatus.SOME)
    return command.existing_entry.value.base_version;
  return command.known_server_version.status === OptionStatus.SOME
    ? create_known_base_version(command.known_server_version.value)
    : create_unknown_base_version();
}

export function build_pending_outbox_entry(
  command: BuildPendingOutboxEntryCommand,
): SyncOutboxEntry {
  return {
    table_name: command.table_name,
    local_id: command.local_id,
    operation: command.operation,
    base_version: resolve_base_version(command),
    change_token: command.change_token,
    enqueued_at:
      command.existing_entry.status === OptionStatus.SOME
        ? command.existing_entry.value.enqueued_at
        : command.enqueued_at,
    status: SyncOutboxEntryStatus.PENDING,
  };
}

function is_tombstone_row(row: SyncRecordVersionRow): boolean {
  return row.record_state === SyncRecordState.DELETED;
}

export function read_known_server_version(row: unknown): Option<number> {
  const version_row = option_from_document(row);
  if (version_row.status === OptionStatus.NONE) return create_none_option();
  const known = version_row.value as unknown as SyncRecordVersionRow;
  return is_tombstone_row(known)
    ? create_none_option()
    : create_some_option(known.server_version);
}

export function read_existing_entry(row: unknown): Option<SyncOutboxEntry> {
  const entry_row = option_from_document(row);
  return entry_row.status === OptionStatus.SOME
    ? create_some_option(entry_row.value as unknown as SyncOutboxEntry)
    : create_none_option();
}
