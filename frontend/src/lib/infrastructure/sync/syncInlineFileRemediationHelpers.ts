import { DEFAULT_OFFICIAL_AVATAR } from "$lib/core/entities/Official";
import { DEFAULT_PLAYER_AVATAR } from "$lib/core/entities/Player";
import { DEFAULT_TEAM_LOGO } from "$lib/core/entities/Team";
import { DEFAULT_STAFF_AVATAR } from "$lib/core/entities/TeamStaff";
import { DEFAULT_VENUE_IMAGE } from "$lib/core/entities/Venue";
import { is_string_value } from "$lib/infrastructure/utils/runtimeTypeGuards";

import {
  build_sync_push_batches,
  type SyncBatchRecord,
} from "./syncPushBatching";
import { EPOCH_TIMESTAMP, type TableName } from "./syncTypes";

const DATA_URL_PREFIX = "data:";
const EMPTY_FILE_URL = "";
const VERSION_PLACEHOLDER = 0;

const FILE_FIELD_FALLBACKS_BY_TABLE: Partial<
  Record<TableName, Record<string, string>>
> = {
  teams: { logo_url: DEFAULT_TEAM_LOGO },
  venues: { image_url: DEFAULT_VENUE_IMAGE },
  players: { profile_image_url: DEFAULT_PLAYER_AVATAR },
  officials: { profile_image_url: DEFAULT_OFFICIAL_AVATAR },
  team_staff: { profile_image_url: DEFAULT_STAFF_AVATAR },
  identifications: { document_image_url: EMPTY_FILE_URL },
  organization_settings: { logo_url: EMPTY_FILE_URL },
};

export type SyncRemediableRecord = Record<string, unknown> & {
  id: string;
  updated_at?: string;
  created_at?: string;
};

function get_record_modified_at(record: SyncRemediableRecord): string {
  return record.updated_at || record.created_at || EPOCH_TIMESTAMP;
}

function is_inline_data_url(value: unknown): value is string {
  return is_string_value(value) && value.startsWith(DATA_URL_PREFIX);
}

function create_sync_batch_record(
  record: SyncRemediableRecord,
): SyncBatchRecord {
  return {
    local_id: record.id,
    data: record,
    version: VERSION_PLACEHOLDER,
  };
}

function record_fits_sync_payload(command: {
  table_name: TableName;
  record: SyncRemediableRecord;
  detect_conflicts: boolean;
  max_payload_bytes: number;
}): boolean {
  return build_sync_push_batches({
    table_name: command.table_name,
    records: [create_sync_batch_record(command.record)],
    detect_conflicts: command.detect_conflicts,
    max_batch_record_count: 1,
    max_payload_bytes: command.max_payload_bytes,
  }).success;
}

export function get_push_eligible_record_ids(command: {
  all_local_records: SyncRemediableRecord[];
  remote_latest_modified_at: string;
}): Set<string> {
  const remote_cutoff = command.remote_latest_modified_at;

  if (remote_cutoff === EPOCH_TIMESTAMP) {
    return new Set(command.all_local_records.map((record) => record.id));
  }

  return new Set(
    command.all_local_records
      .filter((record) => get_record_modified_at(record) > remote_cutoff)
      .map((record) => record.id),
  );
}

interface InlineFileRemediationCommand {
  table_name: TableName;
  record: SyncRemediableRecord;
  detect_conflicts: boolean;
  max_payload_bytes: number;
}

function replace_inline_file_fields(
  command: InlineFileRemediationCommand,
  file_field_fallbacks: Record<string, string>,
): SyncRemediableRecord {
  let remediated_record = command.record;

  for (const [field_name, fallback_value] of Object.entries(
    file_field_fallbacks,
  )) {
    if (!is_inline_data_url(remediated_record[field_name])) {
      continue;
    }

    remediated_record = { ...remediated_record, [field_name]: fallback_value };

    if (record_fits_sync_payload({ ...command, record: remediated_record })) {
      return remediated_record;
    }
  }

  return remediated_record;
}

export function replace_inline_file_fields_until_record_fits_payload(
  command: InlineFileRemediationCommand,
): SyncRemediableRecord {
  if (record_fits_sync_payload(command)) {
    return command.record;
  }

  const file_field_fallbacks =
    FILE_FIELD_FALLBACKS_BY_TABLE[command.table_name];
  if (!file_field_fallbacks) {
    return command.record;
  }

  return replace_inline_file_fields(command, file_field_fallbacks);
}
