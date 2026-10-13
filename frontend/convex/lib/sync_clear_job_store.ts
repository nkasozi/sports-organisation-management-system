import type { GenericId } from "convex/values";

import type { MutationCtx, QueryCtx } from "../_generated/server";
import {
  check_permission,
  type ConvexResult,
  DataAction,
  get_entity_data_category,
  type SystemUserRecord,
} from "./auth_middleware";
import { ConvexErrorCode, log_convex_failure } from "./convex_errors";
import { create_none_option, create_some_option, type Option } from "./option";
import type { ClearJobState, StoredClearJob } from "./sync_clear_job_types";
import { read_latest_sync_sequence } from "./sync_sequence_counter";
import { load_active_system_user_by_email } from "./system_user_lookup";

const CLEAR_JOBS_TABLE_NAME = "sync_clear_jobs";
const REQUESTER_NO_LONGER_PERMITTED_EVENT =
  "clear_job_requester_no_longer_permitted";

export type ClearJobId = GenericId<"sync_clear_jobs">;

export async function read_sequence_ceilings(
  ctx: { db: QueryCtx["db"] },
  table_names: readonly string[],
): Promise<number[]> {
  return Promise.all(
    table_names.map((table_name) => read_latest_sync_sequence(ctx, table_name)),
  );
}

export async function insert_clear_job(
  ctx: MutationCtx,
  state: ClearJobState,
): Promise<ClearJobId> {
  return ctx.db.insert(CLEAR_JOBS_TABLE_NAME, state);
}

export async function save_clear_job(
  ctx: MutationCtx,
  job_id: ClearJobId,
  state: ClearJobState,
): Promise<boolean> {
  await ctx.db.patch(job_id, state);
  return true;
}

export async function load_clear_job(
  ctx: { db: QueryCtx["db"] },
  job_id: ClearJobId,
): Promise<Option<StoredClearJob>> {
  const job = await ctx.db.get(job_id);
  return job ? create_some_option(job as StoredClearJob) : create_none_option();
}

export async function authorize_clear_job_requester(
  ctx: { db: QueryCtx["db"] },
  state: ClearJobState,
): Promise<ConvexResult<SystemUserRecord>> {
  const requester = await load_active_system_user_by_email(
    ctx,
    state.requester_email,
  );
  if (!requester.success) return requester;
  const still_permitted = check_permission(
    requester.data.role,
    get_entity_data_category(state.permission_entity_type),
    DataAction.DELETE,
  );
  return still_permitted
    ? requester
    : log_convex_failure(ConvexErrorCode.ACCESS_DENIED, {
        event: REQUESTER_NO_LONGER_PERMITTED_EVENT,
        user_id: requester.data._id,
        entity_type: state.permission_entity_type,
      });
}
