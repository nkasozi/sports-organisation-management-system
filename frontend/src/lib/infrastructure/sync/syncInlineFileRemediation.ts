import type { Table } from "dexie";

import { DEFAULT_OFFICIAL_AVATAR } from "$lib/core/entities/Official";
import { DEFAULT_PLAYER_AVATAR } from "$lib/core/entities/Player";
import { DEFAULT_TEAM_LOGO } from "$lib/core/entities/Team";
import { DEFAULT_STAFF_AVATAR } from "$lib/core/entities/TeamStaff";
import { DEFAULT_VENUE_IMAGE } from "$lib/core/entities/Venue";

import {
  build_sync_push_batches,
  MAX_SYNC_MUTATION_PAYLOAD_BYTES,
  type SyncBatchRecord,
} from "./syncPushBatching";
import { EPOCH_TIMESTAMP, type TableName } from "./syncTypes";

const DATA_URL_PREFIX = "data:";
const EMPTY_FILE_URL = "";
const REMEDIATION_LOG_MESSAGE =
  "[Sync:Push] Remediated oversized inline file data";
const REMEDIATION_FAILED_LOG_MESSAGE =
  "[Sync:Push] Failed to remediate oversized inline file data";
const REMEDIATION_EVENT_NAME = "sync_inline_file_remediated";
const REMEDIATION_FAILED_EVENT_NAME = "sync_inline_file_remediation_failed";
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

interface BuildRemediatedSyncRecordsCommand {
  table_name: TableName;
  all_local_records: SyncRemediableRecord[];
  remote_latest_modified_at: string | null;
  detect_conflicts: boolean;
  max_payload_bytes?: number;
}

interface BuildRemediatedSyncRecordsResult {
  records: SyncRemediableRecord[];
  remediated_records: SyncRemediableRecord[];
  remediated_record_ids: string[];
}

interface RemediateOversizedInlineFileRecordsCommand extends BuildRemediatedSyncRecordsCommand {
  table: Table<SyncRemediableRecord, string>;
  get_is_remote_sync_in_progress: () => boolean;
  set_remote_sync_in_progress: (value: boolean) => void;
}

interface RemediateOversizedInlineFileRecordsResult extends BuildRemediatedSyncRecordsResult {
  success: boolean;
  error: string | null;
}

function get_record_modified_at(record: SyncRemediableRecord): string {
  return record.updated_at || record.created_at || EPOCH_TIMESTAMP;
}

function is_inline_data_url(value: unknown): value is string {
  return typeof value === "string" && value.startsWith(DATA_URL_PREFIX);
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

function get_push_eligible_record_ids(command: {
  all_local_records: SyncRemediableRecord[];
  remote_latest_modified_at: string | null;
}): Set<string> {
  const remote_cutoff = command.remote_latest_modified_at || EPOCH_TIMESTAMP;

  if (!command.remote_latest_modified_at) {
    return new Set(command.all_local_records.map((record) => record.id));
  }

  return new Set(
    command.all_local_records
      .filter((record) => get_record_modified_at(record) > remote_cutoff)
      .map((record) => record.id),
  );
}

function replace_inline_file_fields_until_record_fits_payload(command: {
  table_name: TableName;
  record: SyncRemediableRecord;
  detect_conflicts: boolean;
  max_payload_bytes: number;
}): SyncRemediableRecord {
  if (
    record_fits_sync_payload({
      table_name: command.table_name,
      record: command.record,
      detect_conflicts: command.detect_conflicts,
      max_payload_bytes: command.max_payload_bytes,
    })
  ) {
    return command.record;
  }

  const file_field_fallbacks =
    FILE_FIELD_FALLBACKS_BY_TABLE[command.table_name];
  if (!file_field_fallbacks) {
    return command.record;
  }

  let remediated_record = command.record;

  for (const [field_name, fallback_value] of Object.entries(
    file_field_fallbacks,
  )) {
    const current_value = remediated_record[field_name];
    if (!is_inline_data_url(current_value)) {
      continue;
    }

    remediated_record = {
      ...remediated_record,
      [field_name]: fallback_value,
    };

    if (
      record_fits_sync_payload({
        table_name: command.table_name,
        record: remediated_record,
        detect_conflicts: command.detect_conflicts,
        max_payload_bytes: command.max_payload_bytes,
      })
    ) {
      return remediated_record;
    }
  }

  return remediated_record;
}

export function build_remediated_sync_records(
  command: BuildRemediatedSyncRecordsCommand,
): BuildRemediatedSyncRecordsResult {
  const max_payload_bytes =
    command.max_payload_bytes ?? MAX_SYNC_MUTATION_PAYLOAD_BYTES;
  const push_eligible_record_ids = get_push_eligible_record_ids({
    all_local_records: command.all_local_records,
    remote_latest_modified_at: command.remote_latest_modified_at,
  });
  const remediated_records: SyncRemediableRecord[] = [];
  const records = command.all_local_records.map((record) => {
    if (!push_eligible_record_ids.has(record.id)) {
      return record;
    }

    const remediated_record =
      replace_inline_file_fields_until_record_fits_payload({
        table_name: command.table_name,
        record,
        detect_conflicts: command.detect_conflicts,
        max_payload_bytes,
      });

    if (remediated_record === record) {
      return record;
    }

    remediated_records.push(remediated_record);
    return remediated_record;
  });

  return {
    records,
    remediated_records,
    remediated_record_ids: remediated_records.map((record) => record.id),
  };
}

export async function remediate_oversized_inline_file_records(
  command: RemediateOversizedInlineFileRecordsCommand,
): Promise<RemediateOversizedInlineFileRecordsResult> {
  const result = build_remediated_sync_records(command);
  if (result.remediated_records.length === 0) {
    return {
      ...result,
      success: true,
      error: null,
    };
  }

  const was_remote_sync_in_progress = command.get_is_remote_sync_in_progress();
  command.set_remote_sync_in_progress(true);

  try {
    await command.table.bulkPut(result.remediated_records);
  } catch (error) {
    const error_message =
      error instanceof Error ? error.message : String(error);
    console.error(REMEDIATION_FAILED_LOG_MESSAGE, {
      event: REMEDIATION_FAILED_EVENT_NAME,
      table_name: command.table_name,
      record_ids: result.remediated_record_ids,
      error: error_message,
    });
    return {
      ...result,
      success: false,
      error: error_message,
    };
  } finally {
    command.set_remote_sync_in_progress(was_remote_sync_in_progress);
  }

  console.warn(REMEDIATION_LOG_MESSAGE, {
    event: REMEDIATION_EVENT_NAME,
    table_name: command.table_name,
    record_ids: result.remediated_record_ids,
  });

  return {
    ...result,
    success: true,
    error: null,
  };
}
