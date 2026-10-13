import type { Table } from "dexie";

import {
  type AsyncResult,
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";

import {
  get_push_eligible_record_ids,
  replace_inline_file_fields_until_record_fits_payload,
  type SyncRemediableRecord,
} from "./syncInlineFileRemediationHelpers";
import { MAX_SYNC_MUTATION_PAYLOAD_BYTES } from "./syncPushBatching";
import type { TableName } from "./syncTypes";

export type { SyncRemediableRecord };

const REMEDIATION_LOG_MESSAGE =
  "[Sync:Push] Remediated oversized inline file data";
const REMEDIATION_FAILED_LOG_MESSAGE =
  "[Sync:Push] Failed to remediate oversized inline file data";
const REMEDIATION_EVENT_NAME = "sync_inline_file_remediated";
const REMEDIATION_FAILED_EVENT_NAME = "sync_inline_file_remediation_failed";

interface BuildRemediatedSyncRecordsCommand {
  table_name: TableName;
  all_local_records: SyncRemediableRecord[];
  remote_latest_modified_at: string;
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
): AsyncResult<BuildRemediatedSyncRecordsResult> {
  const result = build_remediated_sync_records(command);
  if (result.remediated_records.length === 0) {
    return create_success_result(result);
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

    return create_failure_result(error_message);
  } finally {
    command.set_remote_sync_in_progress(was_remote_sync_in_progress);
  }

  console.warn(REMEDIATION_LOG_MESSAGE, {
    event: REMEDIATION_EVENT_NAME,
    table_name: command.table_name,
    record_ids: result.remediated_record_ids,
  });

  return create_success_result(result);
}
