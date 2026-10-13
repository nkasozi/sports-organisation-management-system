import { mark_outbox_entry_rejected } from "./syncOutboxEntryUpdates";
import { MAX_SYNC_MUTATION_PAYLOAD_BYTES } from "./syncPushBatching";
import { calculate_sync_mutation_payload_bytes } from "./syncPushBatchPayload";
import {
  build_rejected_record,
  RECORD_TOO_LARGE_REJECTION,
} from "./syncPushOutcomes";
import type { LoadedOutboxRecord } from "./syncPushRecordLoading";
import {
  create_empty_push_summary,
  type PushTableOutboxCommand,
  type PushTableOutboxSummary,
} from "./syncPushTransport";

const PROBE_VERSION = 0;

interface SendableRecords {
  records: LoadedOutboxRecord[];
  summary: PushTableOutboxSummary;
}

function is_oversized(
  command: PushTableOutboxCommand,
  loaded: LoadedOutboxRecord,
): boolean {
  return (
    calculate_sync_mutation_payload_bytes({
      table_name: command.table_name,
      records: [
        {
          local_id: loaded.entry.local_id,
          data: loaded.record,
          version: PROBE_VERSION,
        },
      ],
      detect_conflicts: command.detect_conflicts,
    }) > MAX_SYNC_MUTATION_PAYLOAD_BYTES
  );
}

async function reject_oversized_record(
  command: PushTableOutboxCommand,
  loaded: LoadedOutboxRecord,
): Promise<boolean> {
  console.warn("[Sync:Push] Record too large to sync; parked as rejected", {
    event: "sync_push_record_too_large",
    correlation_id: command.correlation_id,
    table_name: command.table_name,
    local_id: loaded.entry.local_id,
  });
  return mark_outbox_entry_rejected(
    command.database,
    loaded.entry,
    RECORD_TOO_LARGE_REJECTION,
  );
}

export async function reject_oversized_records(
  command: PushTableOutboxCommand,
  loaded_records: LoadedOutboxRecord[],
): Promise<SendableRecords> {
  const oversized = loaded_records.filter((loaded) =>
    is_oversized(command, loaded),
  );
  for (const loaded of oversized)
    await reject_oversized_record(command, loaded);
  return {
    records: loaded_records.filter((loaded) => !oversized.includes(loaded)),
    summary: {
      ...create_empty_push_summary(),
      rejected: oversized.map((loaded) =>
        build_rejected_record(loaded.entry, RECORD_TOO_LARGE_REJECTION.code),
      ),
    },
  };
}
