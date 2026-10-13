import { v } from "convex/values";

import { internal } from "./_generated/api";
import { mutation, type MutationCtx } from "./_generated/server";
import {
  type ConvexResult,
  DataAction,
  require_permission,
  type SystemUserRecord,
} from "./lib/auth_middleware";
import { CallerScopeKind, resolve_caller_scope } from "./lib/caller_scope";
import {
  ConvexErrorCode,
  type ConvexFailure,
  log_convex_failure,
  NO_ERROR_MESSAGE,
} from "./lib/convex_errors";
import { SecurityEventType } from "./lib/security_event_types";
import { authorize_global_metadata_writer } from "./lib/sync_admin_support";
import { ClearJobKind } from "./lib/sync_clear_job_types";
import {
  get_entity_type_for_table,
  validate_table_name,
} from "./lib/sync_validation";
import { type ClearJobSliceSummary, start_clear_job } from "./sync_clear_jobs";
import { DEMO_DATA_TABLE_NAMES } from "./sync_demo_tables";

const IMMEDIATE_DELAY_MILLISECONDS = 0;
const ORGANIZATION_ENTITY_TYPE = "organization";
const NO_JOB_ID = "";
const NOT_STARTED_STATUS = "not_started";
const UNSCOPED_CLEAR_DENIED_EVENT = "clear_requester_unscoped";
const SyncMetadataAction = {
  UPDATED: "updated",
  CREATED: "created",
} as const;

type ClearFailureResponse = ConvexFailure & {
  deleted_count: number;
  job_id: string;
  job_status: typeof NOT_STARTED_STATUS;
};

type ClearSuccessResponse = {
  success: true;
  error: typeof NO_ERROR_MESSAGE;
  deleted_count: number;
  job_id: string;
  job_status: ClearJobSliceSummary["job_status"];
};

function build_clear_failure(failure: ConvexFailure): ClearFailureResponse {
  return {
    ...failure,
    deleted_count: 0,
    job_id: NO_JOB_ID,
    job_status: NOT_STARTED_STATUS,
  };
}

function build_clear_success(
  summary: ClearJobSliceSummary,
): ClearSuccessResponse {
  return {
    success: true,
    error: NO_ERROR_MESSAGE,
    deleted_count: summary.deleted_count,
    job_id: String(summary.job_id),
    job_status: summary.job_status,
  };
}

async function authorize_clear_requester(
  ctx: MutationCtx,
  entity_type: string,
  attempted_operation: string,
): Promise<ConvexResult<SystemUserRecord>> {
  const permission = await require_permission(
    ctx,
    entity_type,
    DataAction.DELETE,
  );
  if (!permission.success) {
    await ctx.scheduler.runAfter(
      IMMEDIATE_DELAY_MILLISECONDS,
      internal.security_audit.log_security_event,
      {
        event_type: SecurityEventType.ACCESS_DENIED,
        entity_type,
        details: `Unauthorized ${attempted_operation} attempt`,
      },
    );
    return permission;
  }
  return resolve_caller_scope(permission.data).kind === CallerScopeKind.NONE
    ? log_convex_failure(ConvexErrorCode.ACCESS_DENIED, {
        event: UNSCOPED_CLEAR_DENIED_EVENT,
        user_id: permission.data._id,
        entity_type,
      })
    : permission;
}

export const update_sync_metadata = mutation({
  args: {
    table_name: v.string(),
    sync_status: v.string(),
    records_synced: v.number(),
    error_message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const table_validation = validate_table_name(args.table_name);
    if (!table_validation.success) return table_validation;
    const writer_authorization = await authorize_global_metadata_writer(ctx);
    if (!writer_authorization.success) return writer_authorization;
    const data = {
      table_name: args.table_name,
      last_sync_at: new Date().toISOString(),
      sync_status: args.sync_status,
      records_synced: args.records_synced,
      error_message: args.error_message,
    };
    const existing = await ctx.db
      .query("sync_metadata")
      .withIndex("by_table", (q) => q.eq("table_name", args.table_name))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, data);
      return { success: true, action: SyncMetadataAction.UPDATED };
    }
    await ctx.db.insert("sync_metadata", data);
    return { success: true, action: SyncMetadataAction.CREATED };
  },
});

export const clear_table = mutation({
  args: { table_name: v.string() },
  handler: async (ctx, args) => {
    const table_validation = validate_table_name(args.table_name);
    if (!table_validation.success) return build_clear_failure(table_validation);
    const entity_type = get_entity_type_for_table(table_validation.data);
    const requester = await authorize_clear_requester(
      ctx,
      entity_type,
      ClearJobKind.CLEAR_TABLE,
    );
    if (!requester.success) return build_clear_failure(requester);
    const summary = await start_clear_job(ctx, {
      kind: ClearJobKind.CLEAR_TABLE,
      caller: requester.data,
      permission_entity_type: entity_type,
      table_names: [table_validation.data],
    });
    return build_clear_success(summary);
  },
});

export const clear_all_demo_data = mutation({
  args: {},
  handler: async (ctx) => {
    const requester = await authorize_clear_requester(
      ctx,
      ORGANIZATION_ENTITY_TYPE,
      ClearJobKind.CLEAR_ALL_DEMO_DATA,
    );
    if (!requester.success) return build_clear_failure(requester);
    const summary = await start_clear_job(ctx, {
      kind: ClearJobKind.CLEAR_ALL_DEMO_DATA,
      caller: requester.data,
      permission_entity_type: ORGANIZATION_ENTITY_TYPE,
      table_names: DEMO_DATA_TABLE_NAMES,
    });
    return build_clear_success(summary);
  },
});
