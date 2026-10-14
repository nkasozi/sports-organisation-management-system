import {
  build_sync_outbox_key,
  create_known_base_version,
  SyncOutboxEntryStatus,
} from "$lib/adapters/repositories/syncOutbox/syncOutboxTypes";
import { is_record_value } from "$lib/infrastructure/utils/runtimeTypeGuards";

import {
  build_live_version_row,
  IncomingVersionRule,
  type IncomingVersionRuleValue,
} from "./syncRecordVersionRows";
import {
  convert_server_record_to_remote_change,
  type GenericTable,
  type RemoteApplyDependencies,
  type RemoteApplySummary,
  type RemoteRecordChange,
  run_remote_apply_transaction,
} from "./syncRemoteApply";
import {
  select_applicable_changes,
  write_applicable_changes,
} from "./syncRemoteApplyChanges";

export const ResolvedRecordGuardKind = {
  CHANGE_TOKEN: "change_token",
  CONFLICTED_ENTRY: "conflicted_entry",
} as const;

type ResolvedRecordGuard =
  | { kind: typeof ResolvedRecordGuardKind.CHANGE_TOKEN; change_token: string }
  | { kind: typeof ResolvedRecordGuardKind.CONFLICTED_ENTRY };

export const ResolvedApplyOutcome = {
  APPLIED: "applied",
  KEPT_NEWER_LOCAL_EDIT: "kept_newer_local_edit",
} as const;

type ResolvedApplyOutcomeValue =
  (typeof ResolvedApplyOutcome)[keyof typeof ResolvedApplyOutcome];

function is_superseded_by_local_edit(
  current: Record<string, unknown>,
  guard: ResolvedRecordGuard,
): boolean {
  switch (guard.kind) {
    case ResolvedRecordGuardKind.CHANGE_TOKEN:
      return current.change_token !== guard.change_token;
    case ResolvedRecordGuardKind.CONFLICTED_ENTRY:
      return current.status !== SyncOutboxEntryStatus.CONFLICTED;
  }
}

export async function apply_resolved_remote_record(
  dependencies: RemoteApplyDependencies,
  table_name: string,
  change: RemoteRecordChange,
  guard: ResolvedRecordGuard,
): Promise<ResolvedApplyOutcomeValue> {
  return run_remote_apply_transaction(
    dependencies,
    table_name,
    async (tables) => {
      const key = build_sync_outbox_key(table_name, change.local_id);
      const current = await tables.outbox.get(key);
      await tables.versions.put(
        build_live_version_row(
          table_name,
          change.local_id,
          change.server_version,
          change.server_sequence,
        ),
      );
      if (current !== void 0 && is_superseded_by_local_edit(current, guard)) {
        await tables.outbox.put({
          ...current,
          base_version: create_known_base_version(change.server_version),
        });
        return ResolvedApplyOutcome.KEPT_NEWER_LOCAL_EDIT;
      }
      await tables.data.put(change.local_data);
      await tables.outbox.delete(key);
      return ResolvedApplyOutcome.APPLIED;
    },
  );
}

export const SnapshotRecordScope = {
  FULL_RECORDS: "full_records",
  PUBLIC_PROJECTION: "public_projection",
} as const;

type SnapshotRecordScopeValue =
  (typeof SnapshotRecordScope)[keyof typeof SnapshotRecordScope];

function select_version_rule(
  scope: SnapshotRecordScopeValue,
): IncomingVersionRuleValue {
  switch (scope) {
    case SnapshotRecordScope.FULL_RECORDS:
      return IncomingVersionRule.CHANGE_FEED;
    case SnapshotRecordScope.PUBLIC_PROJECTION:
      return IncomingVersionRule.SNAPSHOT_PROJECTION;
  }
}

async function merge_onto_local_records(
  data: GenericTable,
  records: RemoteRecordChange[],
  scope: SnapshotRecordScopeValue,
): Promise<RemoteRecordChange[]> {
  if (scope === SnapshotRecordScope.FULL_RECORDS) return records;
  const existing = await data.bulkGet(records.map((record) => record.local_id));
  return records.map((record, index) => {
    const local_row = existing[index];
    return is_record_value(local_row)
      ? { ...record, local_data: { ...local_row, ...record.local_data } }
      : record;
  });
}

export async function apply_remote_snapshot_records(
  dependencies: RemoteApplyDependencies,
  table_name: string,
  server_records: Array<Record<string, unknown>>,
  scope: SnapshotRecordScopeValue,
): Promise<RemoteApplySummary> {
  return run_remote_apply_transaction(
    dependencies,
    table_name,
    async (tables) => {
      const applicable = await select_applicable_changes(
        tables,
        {
          table_name,
          records: server_records.map(convert_server_record_to_remote_change),
          deletions: [],
        },
        select_version_rule(scope),
      );
      const applied_count = await write_applicable_changes(tables, table_name, {
        records: await merge_onto_local_records(
          tables.data,
          applicable.records,
          scope,
        ),
        deletions: [],
      });
      return { applied_count, deferred_local_ids: [...applicable.dirty] };
    },
  );
}
