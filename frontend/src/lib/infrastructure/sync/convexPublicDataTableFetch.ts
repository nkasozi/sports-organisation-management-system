import { get_database } from "$lib/adapters/repositories/database";
import { sync_change_tracking_gate } from "$lib/adapters/repositories/syncOutbox/syncChangeTrackingGate";
import type { Option } from "$lib/core/types/Option";
import {
  type AsyncResult,
  create_failure_result,
  create_success_result,
  type Result,
} from "$lib/core/types/Result";

import {
  type ConvexRecordQuery,
  read_all_record_pages,
} from "./convexRecordPages";
import type { TableName } from "./convexSyncService";
import {
  apply_remote_snapshot_records,
  SnapshotRecordScope,
} from "./syncRemoteApplyRecords";

export interface PublicTableFetchCommand {
  convex_query: ConvexRecordQuery;
  organization_scope: Option<string>;
}

const TABLE_FETCH_TIMEOUT_MS = 8000;
const FETCH_TIMED_OUT_PREFIX = "fetch_timed_out: ";

function wait_for_table_timeout(table_name: TableName): Promise<Result<never>> {
  return new Promise((resolve) =>
    setTimeout(
      () =>
        resolve(
          create_failure_result(`${FETCH_TIMED_OUT_PREFIX}${table_name}`),
        ),
      TABLE_FETCH_TIMEOUT_MS,
    ),
  );
}

async function store_table_snapshot(
  table_name: TableName,
  records: Array<Record<string, unknown>>,
): AsyncResult<number> {
  try {
    await apply_remote_snapshot_records(
      { database: get_database(), gate: sync_change_tracking_gate },
      table_name,
      records,
      SnapshotRecordScope.PUBLIC_PROJECTION,
    );
    return create_success_result(records.length);
  } catch (error) {
    return create_failure_result(
      error instanceof Error ? error.message : String(error),
    );
  }
}

export async function fetch_and_store_public_table(
  command: PublicTableFetchCommand,
  table_name: TableName,
): AsyncResult<number> {
  const remote_records = await Promise.race([
    read_all_record_pages({ ...command, table_name }),
    wait_for_table_timeout(table_name),
  ]);
  if (!remote_records.success) return remote_records;
  if (remote_records.data.length === 0) return create_success_result(0);
  return store_table_snapshot(table_name, remote_records.data);
}
