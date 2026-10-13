import {
  create_failure_result,
  create_success_result,
  type Result,
} from "$lib/core/types/Result";

import {
  build_oversized_record_error,
  calculate_sync_mutation_payload_bytes,
  ONE_KIBIBYTE,
  type SyncBatchRecord,
} from "./syncPushBatchPayload";
import type { TableName } from "./syncTypes";

export type { SyncBatchRecord };

const MAX_SYNC_BATCH_RECORD_COUNT = 25;
export const MAX_SYNC_MUTATION_PAYLOAD_BYTES = 900 * ONE_KIBIBYTE;

interface BuildSyncPushBatchesCommand<TRecord extends SyncBatchRecord> {
  table_name: TableName;
  records: TRecord[];
  detect_conflicts: boolean;
  max_batch_record_count?: number;
  max_payload_bytes?: number;
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
}): Result<SyncBatchRecord[][]> {
  const single_record_payload_bytes = calculate_sync_mutation_payload_bytes({
    table_name: command.table_name,
    records: [command.current_record],
    detect_conflicts: command.detect_conflicts,
  });
  if (single_record_payload_bytes > command.max_payload_bytes) {
    return create_failure_result(
      build_oversized_record_error({
        table_name: command.table_name,
        record: command.current_record,
      }),
    );
  }

  return create_success_result([[command.current_record]]);
}

interface ResolvedSyncBatchLimits {
  table_name: TableName;
  detect_conflicts: boolean;
  max_batch_record_count: number;
  max_payload_bytes: number;
}

interface SyncBatchAccumulator<TRecord extends SyncBatchRecord> {
  batches: TRecord[][];
  current_batch: TRecord[];
}

function place_record_in_batches<TRecord extends SyncBatchRecord>(
  limits: ResolvedSyncBatchLimits,
  accumulator: SyncBatchAccumulator<TRecord>,
  current_record: TRecord,
): Result<SyncBatchAccumulator<TRecord>> {
  const { batches, current_batch } = accumulator;
  const can_append_record = can_add_record_to_batch({
    ...limits,
    current_batch,
    current_record,
  });

  if (can_append_record) {
    return create_success_result({
      batches,
      current_batch: [...current_batch, current_record],
    });
  }

  const closed_batches =
    current_batch.length > 0 ? [...batches, current_batch] : batches;
  const single_record_batch = build_single_record_batch({
    table_name: limits.table_name,
    current_record,
    detect_conflicts: limits.detect_conflicts,
    max_payload_bytes: limits.max_payload_bytes,
  });
  if (!single_record_batch.success) {
    return single_record_batch;
  }

  return create_success_result({
    batches: closed_batches,
    current_batch: [current_record],
  });
}

export function build_sync_push_batches<TRecord extends SyncBatchRecord>(
  command: BuildSyncPushBatchesCommand<TRecord>,
): Result<TRecord[][]> {
  const limits: ResolvedSyncBatchLimits = {
    table_name: command.table_name,
    detect_conflicts: command.detect_conflicts,
    max_batch_record_count:
      command.max_batch_record_count ?? MAX_SYNC_BATCH_RECORD_COUNT,
    max_payload_bytes:
      command.max_payload_bytes ?? MAX_SYNC_MUTATION_PAYLOAD_BYTES,
  };
  let accumulator: SyncBatchAccumulator<TRecord> = {
    batches: [],
    current_batch: [],
  };

  for (const current_record of command.records) {
    const placement = place_record_in_batches(
      limits,
      accumulator,
      current_record,
    );
    if (!placement.success) {
      return placement;
    }
    accumulator = placement.data;
  }

  const { batches, current_batch } = accumulator;
  return create_success_result(
    current_batch.length > 0 ? [...batches, current_batch] : batches,
  );
}
