import type { MutationCtx } from "../_generated/server";
import { create_sync_change_stamp } from "./sync_change_stamp";
import type { AllowedSyncTable } from "./sync_table_catalog";
import { tombstone_scopes_equal } from "./sync_tombstone_scope";
import { resolve_tombstone_scope } from "./sync_tombstone_scope_resolution";
import { write_scope_exit_tombstone } from "./sync_tombstones";

const ScopeExitOutcomeKind = {
  SCOPE_UNCHANGED: "scope_unchanged",
  SCOPE_EXIT_RECORDED: "scope_exit_recorded",
} as const;

type ScopeExitOutcome =
  | { kind: typeof ScopeExitOutcomeKind.SCOPE_UNCHANGED }
  | {
      kind: typeof ScopeExitOutcomeKind.SCOPE_EXIT_RECORDED;
      sync_sequence: number;
    };

const SCOPE_EXIT_RECORDED_EVENT = "sync_scope_exit_recorded";

interface ScopeExitCommand {
  table_name: AllowedSyncTable;
  local_id: string;
  previous_record: Record<string, unknown>;
  next_record: Record<string, unknown>;
  version: number;
}

export async function record_scope_exit_if_moved(
  ctx: MutationCtx,
  command: ScopeExitCommand,
): Promise<ScopeExitOutcome> {
  const [previous_scope, current_scope] = await Promise.all(
    [command.previous_record, command.next_record].map((record) =>
      resolve_tombstone_scope(ctx, command.table_name, record),
    ),
  );
  if (tombstone_scopes_equal(previous_scope, current_scope))
    return { kind: ScopeExitOutcomeKind.SCOPE_UNCHANGED };
  const stamp = await create_sync_change_stamp(ctx, {
    table_name: command.table_name,
    changed_records: [command.previous_record],
  });
  await write_scope_exit_tombstone(ctx, {
    table_name: command.table_name,
    local_id: command.local_id,
    previous_record: command.previous_record,
    previous_scope,
    current_scope,
    version: command.version,
    sync_sequence: stamp.sync_sequence,
    exited_at: stamp.synced_at,
  });
  console.log("[SyncScopeExit] Scope exit tombstone recorded", {
    event: SCOPE_EXIT_RECORDED_EVENT,
    correlation_id: `${command.table_name}:${command.local_id}:${command.version}`,
    table_name: command.table_name,
    sync_sequence: stamp.sync_sequence,
  });
  return {
    kind: ScopeExitOutcomeKind.SCOPE_EXIT_RECORDED,
    sync_sequence: stamp.sync_sequence,
  };
}
