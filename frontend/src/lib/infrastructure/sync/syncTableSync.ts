import type { SyncDirection } from "$lib/core/interfaces/ports";

import { is_auth_error } from "./syncAuthUtils";
import { pull_table_changes_from_convex } from "./syncPullService";
import { BackfillPullStatus } from "./syncPullTypes";
import type { RejectedOutboxRecord } from "./syncPushOutcomes";
import { push_table_outbox_to_convex } from "./syncPushService";
import type { DeletedRemotelyRecord } from "./syncPushTransport";
import type { RemoteApplyDependencies } from "./syncRemoteApply";
import type { SyncBackfillDeferrals } from "./syncRunSignals";
import type { ConflictFromServer, ConvexClient, TableName } from "./syncTypes";

const SyncDirectionValue = {
  PUSH: "push",
  PULL: "pull",
} as const;

export interface TableSyncResult {
  records_pushed: number;
  records_pulled: number;
  errors: Array<{ table_name: string; error: string }>;
  conflicts: Array<{ table_name: string; conflicts: ConflictFromServer[] }>;
  rejected_records: RejectedOutboxRecord[];
  deleted_remotely: DeletedRemotelyRecord[];
  auth_failed: boolean;
  success: boolean;
}

interface TableSyncCommand extends RemoteApplyDependencies {
  convex_client: ConvexClient;
  table_name: TableName;
  direction: SyncDirection;
  should_push: boolean;
  detect_conflicts: boolean;
  correlation_id: string;
  backfill_deferrals: SyncBackfillDeferrals;
}

function create_table_result(): TableSyncResult {
  return {
    records_pushed: 0,
    records_pulled: 0,
    errors: [],
    conflicts: [],
    rejected_records: [],
    deleted_remotely: [],
    auth_failed: false,
    success: true,
  };
}

function fail_table_result(
  result: TableSyncResult,
  table_name: string,
  error: string,
): TableSyncResult {
  return {
    ...result,
    errors: [{ table_name, error }],
    auth_failed: is_auth_error(error),
    success: false,
  };
}

async function pull_into_result(
  command: TableSyncCommand,
  result: TableSyncResult,
): Promise<TableSyncResult> {
  if (command.direction === SyncDirectionValue.PUSH) return result;
  const pull_result = await pull_table_changes_from_convex(command);
  if (!pull_result.success)
    return fail_table_result(result, command.table_name, pull_result.error);
  const backfill = pull_result.data.backfill;
  if (backfill.status === BackfillPullStatus.IN_PROGRESS)
    command.backfill_deferrals.record(
      command.table_name,
      backfill.retry_after_milliseconds,
    );
  return { ...result, records_pulled: pull_result.data.records_pulled };
}

async function push_into_result(
  command: TableSyncCommand,
  result: TableSyncResult,
): Promise<TableSyncResult> {
  if (command.direction === SyncDirectionValue.PULL || !command.should_push)
    return result;
  const push_result = await push_table_outbox_to_convex(command);
  if (!push_result.success)
    return fail_table_result(result, command.table_name, push_result.error);
  return {
    ...result,
    records_pushed: push_result.data.records_pushed,
    rejected_records: push_result.data.rejected,
    deleted_remotely: push_result.data.deleted_remotely,
    conflicts:
      push_result.data.conflicts.length > 0
        ? [
            {
              table_name: command.table_name,
              conflicts: push_result.data.conflicts,
            },
          ]
        : [],
  };
}

export async function sync_table_changes(
  command: TableSyncCommand,
): Promise<TableSyncResult> {
  const pulled = await pull_into_result(command, create_table_result());
  if (!pulled.success) return pulled;
  return push_into_result(command, pulled);
}
