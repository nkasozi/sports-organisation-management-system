import {
  build_sync_outbox_key,
  create_known_base_version,
  INITIAL_SYNC_CURSOR_SEQUENCE,
  SyncOutboxEntryStatus,
} from "$lib/adapters/repositories/syncOutbox/syncOutboxTypes";
import { is_number_value } from "$lib/infrastructure/utils/runtimeTypeGuards";

import {
  apply_remote_change_page,
  convert_server_record_to_remote_change,
  type RemoteApplyDependencies,
  type RemoteApplySummary,
  type RemoteRecordChange,
  run_remote_apply_transaction,
} from "./syncRemoteApply";

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
      await tables.versions.put({
        table_name,
        local_id: change.local_id,
        server_version: change.server_version,
      });
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

export const SnapshotCursorPolicy = {
  KEEP_CURSOR: "keep_cursor",
  ADVANCE_TO_SNAPSHOT: "advance_to_snapshot",
} as const;

type SnapshotCursorPolicyValue =
  (typeof SnapshotCursorPolicy)[keyof typeof SnapshotCursorPolicy];

const SYNC_SEQUENCE_FIELD_NAME = "sync_sequence";

function resolve_snapshot_cursor(
  server_records: Array<Record<string, unknown>>,
  policy: SnapshotCursorPolicyValue,
): number {
  if (policy === SnapshotCursorPolicy.KEEP_CURSOR)
    return INITIAL_SYNC_CURSOR_SEQUENCE;
  const sequences = server_records.map(
    (record) => record[SYNC_SEQUENCE_FIELD_NAME],
  );
  const numeric_sequences = sequences.filter(is_number_value);
  return numeric_sequences.length === sequences.length
    ? Math.max(INITIAL_SYNC_CURSOR_SEQUENCE, ...numeric_sequences)
    : INITIAL_SYNC_CURSOR_SEQUENCE;
}

export async function apply_remote_snapshot_records(
  dependencies: RemoteApplyDependencies,
  table_name: string,
  server_records: Array<Record<string, unknown>>,
  policy: SnapshotCursorPolicyValue,
): Promise<RemoteApplySummary> {
  return apply_remote_change_page(dependencies, {
    table_name,
    records: server_records.map(convert_server_record_to_remote_change),
    deletions: [],
    next_cursor: resolve_snapshot_cursor(server_records, policy),
  });
}
