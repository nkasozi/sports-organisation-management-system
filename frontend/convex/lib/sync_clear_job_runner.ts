import type { MutationCtx } from "../_generated/server";
import type { SystemUserRecord } from "./auth_middleware";
import { transition_clear_job } from "./sync_clear_job_machine";
import {
  CLEAR_SCAN_BUDGET_PER_SLICE,
  ClearJobEventType,
  type ClearJobState,
  ClearJobStatus,
} from "./sync_clear_job_types";
import { type ClearPage, load_clear_page } from "./sync_clear_page_loading";
import { plan_clear_scan, select_clearable_records } from "./sync_clear_scope";
import {
  delete_record_as_caller,
  GuardedDeleteOutcome,
} from "./sync_guarded_delete";
import {
  type AllowedSyncTable,
  validate_table_name,
} from "./sync_table_catalog";

interface ClearSliceResult {
  state: ClearJobState;
  scanned_count: number;
}

async function delete_clearable_records(
  ctx: MutationCtx,
  command: {
    table_name: AllowedSyncTable;
    caller: SystemUserRecord;
    page: ClearPage;
  },
): Promise<{ deleted_count: number; rejected_count: number }> {
  const clearable_records = await select_clearable_records(ctx, {
    records: command.page.eligible_records,
    caller: command.caller,
    table_name: command.table_name,
  });
  let deleted_count = 0;
  let rejected_count = 0;
  for (const existing_record of clearable_records) {
    const outcome = await delete_record_as_caller(ctx, {
      table_name: command.table_name,
      caller: command.caller,
      existing_record,
    });
    if (outcome === GuardedDeleteOutcome.DELETED) deleted_count += 1;
    if (outcome === GuardedDeleteOutcome.REJECTED) rejected_count += 1;
  }
  return { deleted_count, rejected_count };
}

function build_table_rejected_slice(
  state: ClearJobState,
  now_iso: string,
): ClearSliceResult {
  return {
    state: transition_clear_job(
      state,
      { type: ClearJobEventType.TABLE_REJECTED },
      now_iso,
    ),
    scanned_count: 0,
  };
}

async function clear_next_page(
  ctx: MutationCtx,
  state: ClearJobState,
  caller: SystemUserRecord,
): Promise<ClearSliceResult> {
  const table_validation = validate_table_name(
    state.table_names[state.table_index],
  );
  const now_iso = new Date().toISOString();
  if (!table_validation.success)
    return build_table_rejected_slice(state, now_iso);
  const page = await load_clear_page(
    ctx,
    table_validation.data,
    state,
    plan_clear_scan(caller, table_validation.data),
  );
  const counts = await delete_clearable_records(ctx, {
    table_name: table_validation.data,
    caller,
    page,
  });
  return {
    state: transition_clear_job(
      state,
      {
        type: ClearJobEventType.PAGE_PROCESSED,
        ...counts,
        last_scanned_local_id: page.last_scanned_local_id,
        page_was_full: page.page_was_full,
      },
      now_iso,
    ),
    scanned_count: Math.max(page.scanned_records.length, 1),
  };
}

export async function run_clear_job_slice(
  ctx: MutationCtx,
  initial_state: ClearJobState,
  caller: SystemUserRecord,
): Promise<ClearJobState> {
  let state = initial_state;
  let scanned_count = 0;
  while (
    state.status === ClearJobStatus.RUNNING &&
    scanned_count < CLEAR_SCAN_BUDGET_PER_SLICE
  ) {
    const slice = await clear_next_page(ctx, state, caller);
    state = slice.state;
    scanned_count += slice.scanned_count;
  }
  return state;
}
