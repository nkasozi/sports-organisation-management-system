import type { TableName } from "./syncTypes";

const ONE_KIBIBYTE = 1024;
const DATA_URL_PREFIX = "data:";
const INLINE_DATA_SUFFIX_MESSAGE =
  "contains inline file data that exceeds the sync payload limit";
const OVERSIZED_RECORD_SUFFIX_MESSAGE =
  "is too large to sync because its payload exceeds the sync payload limit";
const SMALLER_IMAGE_RETRY_MESSAGE = "Choose a smaller image and try again.";

export const MAX_SYNC_BATCH_RECORD_COUNT = 25;
export const MAX_SYNC_MUTATION_PAYLOAD_BYTES = 900 * ONE_KIBIBYTE;

const text_encoder = new TextEncoder();

export interface SyncBatchRecord {
  local_id: string;
  data: Record<string, unknown>;
  version: number;
}

export interface BuildSyncPushBatchesCommand {
  table_name: TableName;
  records: SyncBatchRecord[];
  detect_conflicts: boolean;
  max_batch_record_count?: number;
  max_payload_bytes?: number;
}

export interface BuildSyncPushBatchesResult {
  success: boolean;
  batches: SyncBatchRecord[][];
  error: string | null;
}

function calculate_sync_mutation_payload_bytes(command: {
  table_name: string;
  records: SyncBatchRecord[];
  detect_conflicts: boolean;
}): number {
  return text_encoder.encode(
    JSON.stringify({
      table_name: command.table_name,
      records: command.records,
      detect_conflicts: command.detect_conflicts,
    }),
  ).length;
}

function find_inline_data_field_name(
  record_data: Record<string, unknown>,
): string | null {
  for (const [field_name, field_value] of Object.entries(record_data)) {
    if (typeof field_value !== "string") {
      continue;
    }
    if (!field_value.startsWith(DATA_URL_PREFIX)) {
      continue;
    }
    return field_name;
  }
  return null;
}

function build_oversized_record_error(command: {
  table_name: string;
  record: SyncBatchRecord;
}): string {
  const inline_data_field_name = find_inline_data_field_name(
    command.record.data,
  );
  const record_label = `Record "${command.record.local_id}" in "${command.table_name}"`;

  if (inline_data_field_name) {
    return `${record_label} is too large to sync because "${inline_data_field_name}" ${INLINE_DATA_SUFFIX_MESSAGE}. ${SMALLER_IMAGE_RETRY_MESSAGE}`;
  }

  return `${record_label} ${OVERSIZED_RECORD_SUFFIX_MESSAGE}. ${SMALLER_IMAGE_RETRY_MESSAGE}`;
}

function can_add_record_to_batch(command: {
  table_name: string;
  current_batch: SyncBatchRecord[];
  current_record: SyncBatchRecord;
  detect_conflicts: boolean;
  max_batch_record_count: number;
  max_payload_bytes: number;
}): boolean {
  const next_batch = [...command.current_batch, command.current_record];
  if (next_batch.length > command.max_batch_record_count) {
    return false;
  }

  return (
    calculate_sync_mutation_payload_bytes({
      table_name: command.table_name,
      records: next_batch,
      detect_conflicts: command.detect_conflicts,
    }) <= command.max_payload_bytes
  );
}

function build_single_record_batch(command: {
  table_name: string;
  current_record: SyncBatchRecord;
  detect_conflicts: boolean;
  max_payload_bytes: number;
}): BuildSyncPushBatchesResult {
  const single_record_payload_bytes = calculate_sync_mutation_payload_bytes({
    table_name: command.table_name,
    records: [command.current_record],
    detect_conflicts: command.detect_conflicts,
  });
  if (single_record_payload_bytes > command.max_payload_bytes) {
    return {
      success: false,
      batches: [],
      error: build_oversized_record_error({
        table_name: command.table_name,
        record: command.current_record,
      }),
    };
  }

  return {
    success: true,
    batches: [[command.current_record]],
    error: null,
  };
}

export function build_sync_push_batches(
  command: BuildSyncPushBatchesCommand,
): BuildSyncPushBatchesResult {
  const max_batch_record_count =
    command.max_batch_record_count ?? MAX_SYNC_BATCH_RECORD_COUNT;
  const max_payload_bytes =
    command.max_payload_bytes ?? MAX_SYNC_MUTATION_PAYLOAD_BYTES;
  const batches: SyncBatchRecord[][] = [];
  let current_batch: SyncBatchRecord[] = [];

  for (const current_record of command.records) {
    const can_append_record = can_add_record_to_batch({
      table_name: command.table_name,
      detect_conflicts: command.detect_conflicts,
      current_batch,
      current_record,
      max_batch_record_count,
      max_payload_bytes,
    });

    if (can_append_record) {
      current_batch = [...current_batch, current_record];
      continue;
    }

    if (current_batch.length > 0) {
      batches.push(current_batch);
    }

    const single_record_batch = build_single_record_batch({
      table_name: command.table_name,
      current_record,
      detect_conflicts: command.detect_conflicts,
      max_payload_bytes,
    });
    if (!single_record_batch.success) {
      return single_record_batch;
    }

    current_batch = single_record_batch.batches[0];
  }

  if (current_batch.length > 0) {
    batches.push(current_batch);
  }

  return {
    success: true,
    batches,
    error: null,
  };
}
