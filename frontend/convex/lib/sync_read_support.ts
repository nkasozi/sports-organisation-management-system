import type { QueryCtx } from "../_generated/server";
import type { SystemUserRecord } from "./auth_middleware";
import { option_from_document, OptionStatus } from "./option";
import {
  NOT_VISIBLE_ABSENCE,
  type RecordAbsence,
  resolve_missing_record_absence,
} from "./record_absence";
import { authorize_records_for_reader } from "./sync_read_authorization";
import type { AllowedSyncTable } from "./sync_validation";
import { is_string, read_string_or } from "./value_guards";

export const RecordLookupStatus = {
  FOUND: "found",
  NOT_FOUND: "not_found",
  FAILURE: "failure",
} as const;

type VisibleRecordLookup =
  | { status: typeof RecordLookupStatus.FOUND; record: Record<string, unknown> }
  | ({ status: typeof RecordLookupStatus.NOT_FOUND } & RecordAbsence);

interface VisibleRecordLookupCommand {
  caller: SystemUserRecord;
  table_name: AllowedSyncTable;
  local_id: string;
}

const LOCAL_ID_INDEX_NAME = "by_local_id";
const CHANGE_TIMESTAMP_FIELD_NAMES = [
  "synced_at",
  "updated_at",
  "created_at",
] as const;
const MISSING_CHANGE_TIMESTAMP = "";
const NOT_VISIBLE_LOOKUP: VisibleRecordLookup = {
  status: RecordLookupStatus.NOT_FOUND,
  ...NOT_VISIBLE_ABSENCE,
};

export function read_first_string_field(
  record: Record<string, unknown>,
  field_names: readonly string[],
): string {
  const field_value = field_names
    .map((field_name) => record[field_name])
    .find((value) => is_string(value) && value.length > 0);
  return read_string_or(field_value, MISSING_CHANGE_TIMESTAMP);
}

export function read_record_change_timestamp(
  record: Record<string, unknown>,
): string {
  return read_first_string_field(record, CHANGE_TIMESTAMP_FIELD_NAMES);
}

export async function load_records_for_caller(
  ctx: QueryCtx,
  table_name: AllowedSyncTable,
  caller: SystemUserRecord,
): Promise<Array<Record<string, unknown>>> {
  const all_records: Array<Record<string, unknown>> = await ctx.db
    .query(table_name)
    .collect();
  return authorize_records_for_reader(ctx, {
    records: all_records,
    caller,
    table_name,
  });
}

export async function load_visible_record(
  ctx: QueryCtx,
  command: VisibleRecordLookupCommand,
): Promise<VisibleRecordLookup> {
  const lookup = option_from_document(
    await ctx.db
      .query(command.table_name)
      .withIndex(LOCAL_ID_INDEX_NAME, (query) =>
        query.eq("local_id", command.local_id),
      )
      .first(),
  );
  if (lookup.status === OptionStatus.NONE)
    return {
      status: RecordLookupStatus.NOT_FOUND,
      ...(await resolve_missing_record_absence(ctx, command)),
    };
  const record = lookup.value;
  const visible_records = await authorize_records_for_reader(ctx, {
    records: [record],
    caller: command.caller,
    table_name: command.table_name,
  });
  return visible_records.length === 0
    ? NOT_VISIBLE_LOOKUP
    : { status: RecordLookupStatus.FOUND, record: visible_records[0] };
}
