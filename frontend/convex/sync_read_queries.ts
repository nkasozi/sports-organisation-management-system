import { v } from "convex/values";

import { query } from "./_generated/server";
import { require_auth } from "./lib/auth_middleware";
import { NO_ERROR_MESSAGE } from "./lib/convex_errors";
import {
  create_none_option,
  create_some_option,
  type Option,
} from "./lib/option";
import { load_public_snapshot } from "./lib/public_read_support";
import {
  load_records_for_caller,
  load_visible_record,
  read_record_change_timestamp,
  RecordLookupStatus,
} from "./lib/sync_read_support";
import { validate_table_name } from "./lib/sync_validation";

const NO_ORGANIZATION = "";

function read_requested_organization(
  organization_id: string | undefined,
): Option<string> {
  const trimmed = (organization_id ?? NO_ORGANIZATION).trim();
  return trimmed ? create_some_option(trimmed) : create_none_option();
}

export const get_changes_since = query({
  args: { table_name: v.string(), since_timestamp: v.string() },
  handler: async (ctx, args) => {
    const table_validation = validate_table_name(args.table_name);
    if (!table_validation.success) return { ...table_validation, data: [] };
    const auth_result = await require_auth(ctx);
    if (!auth_result.success) return { ...auth_result, data: [] };
    const visible_records = await load_records_for_caller(
      ctx,
      table_validation.data,
      auth_result.data,
    );
    return {
      success: true,
      data: visible_records.filter(
        (record) => read_record_change_timestamp(record) > args.since_timestamp,
      ),
      error: NO_ERROR_MESSAGE,
    };
  },
});

export const get_all_records = query({
  args: { table_name: v.string(), organization_id: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const table_validation = validate_table_name(args.table_name);
    if (!table_validation.success) return [];
    const auth_result = await require_auth(ctx);
    if (!auth_result.success)
      return load_public_snapshot(
        ctx,
        table_validation.data,
        read_requested_organization(args.organization_id),
      );
    return load_records_for_caller(
      ctx,
      table_validation.data,
      auth_result.data,
    );
  },
});

export const get_record_by_local_id = query({
  args: { table_name: v.string(), local_id: v.string() },
  handler: async (ctx, args) => {
    const table_validation = validate_table_name(args.table_name);
    if (!table_validation.success)
      return { ...table_validation, status: RecordLookupStatus.FAILURE };
    const auth_result = await require_auth(ctx);
    if (!auth_result.success)
      return { ...auth_result, status: RecordLookupStatus.FAILURE };
    return load_visible_record(ctx, {
      caller: auth_result.data,
      table_name: table_validation.data,
      local_id: args.local_id,
    });
  },
});
