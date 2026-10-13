import { v } from "convex/values";

import { query } from "./_generated/server";
import { require_auth } from "./lib/auth_middleware";
import {
  load_records_for_caller,
  read_first_string_field,
  read_record_change_timestamp,
} from "./lib/sync_read_support";
import { validate_table_name } from "./lib/sync_validation";
import { strip_convex_fields } from "./sync_record_helpers";

const EPOCH_TIMESTAMP = "1970-01-01T00:00:00.000Z";
const NO_TIMESTAMP = "";
const SYNC_METADATA_TABLE_NAME = "sync_metadata";
const SYNC_METADATA_TABLE_INDEX_NAME = "by_table";
const MODIFIED_TIMESTAMP_FIELD_NAMES = [
  "updated_at",
  "modified_at",
  "created_at",
] as const;

const SyncMetadataStatus = {
  UNAUTHORIZED: "unauthorized",
  RECORD: "record",
  NOT_FOUND: "not_found",
  RECORDS: "records",
} as const;

function find_latest_timestamp(timestamps: string[]): string {
  return timestamps.reduce(
    (latest, timestamp) => (timestamp > latest ? timestamp : latest),
    NO_TIMESTAMP,
  );
}

export const get_latest_modified_at = query({
  args: { table_name: v.string() },
  handler: async (ctx, args) => {
    const empty_summary = {
      table_name: args.table_name,
      record_count: 0,
      latest_modified_at: EPOCH_TIMESTAMP,
    };
    const table_validation = validate_table_name(args.table_name);
    if (!table_validation.success) return empty_summary;
    const auth_result = await require_auth(ctx);
    if (!auth_result.success) return empty_summary;
    const records = await load_records_for_caller(
      ctx,
      table_validation.data,
      auth_result.data,
    );
    const latest_modified_at = find_latest_timestamp(
      records.map((record) =>
        read_first_string_field(record, MODIFIED_TIMESTAMP_FIELD_NAMES),
      ),
    );
    return {
      table_name: args.table_name,
      record_count: records.length,
      latest_modified_at: latest_modified_at || EPOCH_TIMESTAMP,
    };
  },
});

export const get_sync_metadata = query({
  args: { table_name: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const auth_result = await require_auth(ctx);
    if (!auth_result.success)
      return { status: SyncMetadataStatus.UNAUTHORIZED };
    const table_name = args.table_name;
    if (!table_name)
      return {
        status: SyncMetadataStatus.RECORDS,
        records: await ctx.db.query(SYNC_METADATA_TABLE_NAME).collect(),
      };
    if (!validate_table_name(table_name).success)
      return { status: SyncMetadataStatus.NOT_FOUND };
    const record = await ctx.db
      .query(SYNC_METADATA_TABLE_NAME)
      .withIndex(SYNC_METADATA_TABLE_INDEX_NAME, (index_query) =>
        index_query.eq("table_name", table_name),
      )
      .first();
    return record
      ? { status: SyncMetadataStatus.RECORD, record }
      : { status: SyncMetadataStatus.NOT_FOUND };
  },
});

export const subscribe_to_table_changes = query({
  args: { table_name: v.string() },
  handler: async (ctx, args) => {
    const empty_snapshot = {
      table_name: args.table_name,
      record_count: 0,
      latest_timestamp: NO_TIMESTAMP,
      records: [],
    };
    const table_validation = validate_table_name(args.table_name);
    if (!table_validation.success) return empty_snapshot;
    const auth_result = await require_auth(ctx);
    if (!auth_result.success) return empty_snapshot;
    const records = await load_records_for_caller(
      ctx,
      table_validation.data,
      auth_result.data,
    );
    return {
      table_name: args.table_name,
      record_count: records.length,
      latest_timestamp: find_latest_timestamp(
        records.map(read_record_change_timestamp),
      ),
      records: records.map(strip_convex_fields),
    };
  },
});

export const check_auth = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    return { authenticated: Boolean(identity) };
  },
});
