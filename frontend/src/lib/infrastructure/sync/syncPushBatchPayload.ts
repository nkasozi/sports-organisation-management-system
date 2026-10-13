import { is_string_value } from "$lib/infrastructure/utils/runtimeTypeGuards";
export const ONE_KIBIBYTE = 1024;
const DATA_URL_PREFIX = "data:";
const INLINE_DATA_SUFFIX_MESSAGE =
  "contains inline file data that exceeds the sync payload limit";
const OVERSIZED_RECORD_SUFFIX_MESSAGE =
  "is too large to sync because its payload exceeds the sync payload limit";
const SMALLER_IMAGE_RETRY_MESSAGE = "Choose a smaller image and try again.";

const text_encoder = new TextEncoder();

export interface SyncBatchRecord {
  local_id: string;
  data: Record<string, unknown>;
  version: number;
}

const INLINE_DATA_FIELD_FOUND_STATUS = "found";
const INLINE_DATA_FIELD_NOT_FOUND_STATUS = "not_found";

type InlineDataFieldLookupResult =
  | {
      status: typeof INLINE_DATA_FIELD_FOUND_STATUS;
      field_name: string;
    }
  | { status: typeof INLINE_DATA_FIELD_NOT_FOUND_STATUS };

export function calculate_sync_mutation_payload_bytes(command: {
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
): InlineDataFieldLookupResult {
  for (const [field_name, field_value] of Object.entries(record_data)) {
    if (!is_string_value(field_value)) {
      continue;
    }
    if (!field_value.startsWith(DATA_URL_PREFIX)) {
      continue;
    }
    return {
      status: INLINE_DATA_FIELD_FOUND_STATUS,
      field_name,
    };
  }

  return { status: INLINE_DATA_FIELD_NOT_FOUND_STATUS };
}

export function build_oversized_record_error(command: {
  table_name: string;
  record: SyncBatchRecord;
}): string {
  const inline_data_field_lookup = find_inline_data_field_name(
    command.record.data,
  );
  const record_label = `Record "${command.record.local_id}" in "${command.table_name}"`;

  if (inline_data_field_lookup.status === INLINE_DATA_FIELD_FOUND_STATUS) {
    return `${record_label} is too large to sync because "${inline_data_field_lookup.field_name}" ${INLINE_DATA_SUFFIX_MESSAGE}. ${SMALLER_IMAGE_RETRY_MESSAGE}`;
  }

  return `${record_label} ${OVERSIZED_RECORD_SUFFIX_MESSAGE}. ${SMALLER_IMAGE_RETRY_MESSAGE}`;
}
