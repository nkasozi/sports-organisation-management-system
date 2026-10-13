import { v } from "convex/values";

import { internal } from "./_generated/api";
import { internalMutation, type MutationCtx, query } from "./_generated/server";
import { require_auth, type SystemUserRecord } from "./lib/auth_middleware";
import { CallerScopeKind, resolve_caller_scope } from "./lib/caller_scope";
import { OptionStatus } from "./lib/option";
import { SecurityEventType } from "./lib/security_event_types";
import {
  create_clear_job_state,
  transition_clear_job,
} from "./lib/sync_clear_job_machine";
import { run_clear_job_slice } from "./lib/sync_clear_job_runner";
import {
  authorize_clear_job_requester,
  type ClearJobId,
  insert_clear_job,
  load_clear_job,
  read_sequence_ceilings,
  save_clear_job,
} from "./lib/sync_clear_job_store";
import {
  ClearJobEventType,
  type ClearJobKindValue,
  type ClearJobState,
  ClearJobStatus,
} from "./lib/sync_clear_job_types";

const IMMEDIATE_DELAY_MILLISECONDS = 0;
const JOB_NOT_FOUND_STATUS = "not_found";

export interface ClearJobSliceSummary {
  job_id: ClearJobId;
  job_status: ClearJobState["status"];
  deleted_count: number;
}

interface StartClearJobCommand {
  kind: ClearJobKindValue;
  caller: SystemUserRecord;
  permission_entity_type: string;
  table_names: readonly string[];
}

async function audit_clear_job(
  ctx: MutationCtx,
  job_id: ClearJobId,
  state: ClearJobState,
): Promise<boolean> {
  await ctx.scheduler.runAfter(
    IMMEDIATE_DELAY_MILLISECONDS,
    internal.security_audit.log_security_event,
    {
      event_type: SecurityEventType.SYNC_MUTATION,
      entity_type: state.permission_entity_type,
      entity_id: String(job_id),
      user_email: state.requester_email,
      correlation_id: String(job_id),
      details: `${state.kind} ${state.status}: ${state.deleted_count} records deleted, ${state.rejected_count} rejected`,
    },
  );
  return true;
}

async function finalize_clear_slice(
  ctx: MutationCtx,
  job_id: ClearJobId,
  sliced_state: ClearJobState,
): Promise<ClearJobSliceSummary> {
  const state =
    sliced_state.status === ClearJobStatus.RUNNING
      ? transition_clear_job(
          sliced_state,
          { type: ClearJobEventType.CONTINUATION_SCHEDULED },
          new Date().toISOString(),
        )
      : sliced_state;
  await save_clear_job(ctx, job_id, state);
  if (state.status === ClearJobStatus.RUNNING)
    await ctx.scheduler.runAfter(
      IMMEDIATE_DELAY_MILLISECONDS,
      internal.sync.continue_sync_clear_job,
      { job_id },
    );
  if (state.status !== ClearJobStatus.RUNNING)
    await audit_clear_job(ctx, job_id, state);
  console.log("[SyncClearJob] Slice finished", {
    event: "sync_clear_job_slice_finished",
    correlation_id: String(job_id),
    status: state.status,
    table_index: state.table_index,
    deleted_count: state.deleted_count,
    rejected_count: state.rejected_count,
  });
  return {
    job_id,
    job_status: state.status,
    deleted_count: state.deleted_count,
  };
}

export async function start_clear_job(
  ctx: MutationCtx,
  command: StartClearJobCommand,
): Promise<ClearJobSliceSummary> {
  const initial_state = create_clear_job_state({
    kind: command.kind,
    requester_email: command.caller.email,
    permission_entity_type: command.permission_entity_type,
    table_names: [...command.table_names],
    sequence_ceilings: await read_sequence_ceilings(ctx, command.table_names),
    now_iso: new Date().toISOString(),
  });
  const job_id = await insert_clear_job(ctx, initial_state);
  const sliced_state = await run_clear_job_slice(
    ctx,
    initial_state,
    command.caller,
  );
  return finalize_clear_slice(ctx, job_id, sliced_state);
}

export const continue_sync_clear_job = internalMutation({
  args: { job_id: v.id("sync_clear_jobs") },
  handler: async (ctx, args) => {
    const job = await load_clear_job(ctx, args.job_id);
    if (job.status === OptionStatus.NONE)
      return { status: JOB_NOT_FOUND_STATUS };
    if (job.value.status !== ClearJobStatus.RUNNING)
      return { status: job.value.status };
    const requester = await authorize_clear_job_requester(ctx, job.value);
    const sliced_state = requester.success
      ? await run_clear_job_slice(ctx, job.value, requester.data)
      : transition_clear_job(
          job.value,
          { type: ClearJobEventType.ACCESS_REVOKED },
          new Date().toISOString(),
        );
    const summary = await finalize_clear_slice(ctx, args.job_id, sliced_state);
    return { status: summary.job_status };
  },
});

function can_view_clear_job(
  caller: SystemUserRecord,
  state: ClearJobState,
): boolean {
  return (
    resolve_caller_scope(caller).kind === CallerScopeKind.GLOBAL ||
    caller.email === state.requester_email
  );
}

export const get_clear_job_status = query({
  args: { job_id: v.id("sync_clear_jobs") },
  handler: async (ctx, args) => {
    const auth_result = await require_auth(ctx);
    const job = await load_clear_job(ctx, args.job_id);
    if (
      !auth_result.success ||
      job.status === OptionStatus.NONE ||
      !can_view_clear_job(auth_result.data, job.value)
    )
      return { status: JOB_NOT_FOUND_STATUS, deleted_count: 0 };
    return {
      status: job.value.status,
      deleted_count: job.value.deleted_count,
      rejected_count: job.value.rejected_count,
      failure_reason: job.value.failure_reason,
    };
  },
});
