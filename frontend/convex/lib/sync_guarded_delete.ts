import type { MutationCtx } from "../_generated/server";
import type { SystemUserRecord } from "./auth_middleware";
import { create_none_option, create_some_option } from "./option";
import { read_record_local_id } from "./sync_clear_page_loading";
import { run_guarded_write, SyncResultAction } from "./sync_mutation_support";
import type { AllowedSyncTable } from "./sync_table_catalog";
import {
  apply_versioned_delete,
  DeleteAuditMode,
} from "./sync_versioned_delete";

export const GuardedDeleteOutcome = {
  DELETED: "deleted",
  REJECTED: "rejected",
  SKIPPED: "skipped",
} as const;

type GuardedDeleteOutcomeValue =
  (typeof GuardedDeleteOutcome)[keyof typeof GuardedDeleteOutcome];

interface DeleteRecordAsCallerCommand {
  table_name: AllowedSyncTable;
  caller: SystemUserRecord;
  existing_record: Record<string, unknown>;
}

export async function delete_record_as_caller(
  ctx: MutationCtx,
  command: DeleteRecordAsCallerCommand,
): Promise<GuardedDeleteOutcomeValue> {
  const local_id = read_record_local_id(command.existing_record);
  const existing_record = create_some_option(command.existing_record);
  const guarded = await run_guarded_write(ctx, {
    table_name: command.table_name,
    caller: command.caller,
    local_id,
    incoming_record: create_none_option(),
    existing_record,
  });
  if (!guarded.success) return GuardedDeleteOutcome.REJECTED;
  const outcome = await apply_versioned_delete(ctx, {
    table_name: command.table_name,
    caller: command.caller,
    audit_mode: DeleteAuditMode.COVERED_BY_JOB_AUDIT,
    local_id,
    existing_record,
    base_version: create_none_option(),
  });
  return outcome.action === SyncResultAction.DELETED
    ? GuardedDeleteOutcome.DELETED
    : GuardedDeleteOutcome.SKIPPED;
}
