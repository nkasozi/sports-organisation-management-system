import type { QueryCtx } from "../_generated/server";
import { strip_convex_fields } from "../sync_record_helpers";
import type { SystemUserRecord } from "./auth_middleware";
import {
  create_none_option,
  create_some_option,
  type Option,
  OptionStatus,
} from "./option";
import { authorize_records_for_reader } from "./sync_read_authorization";
import type { AllowedSyncTable } from "./sync_table_catalog";

export const RemoteDataStatus = {
  VISIBLE: "visible",
  HIDDEN: "hidden",
} as const;

export type RemoteDataStatusValue =
  (typeof RemoteDataStatus)[keyof typeof RemoteDataStatus];

export interface CallerVisibleRecord {
  remote_data: Record<string, unknown>;
  remote_data_status: RemoteDataStatusValue;
}

const HIDDEN_REMOTE_RECORD: CallerVisibleRecord = {
  remote_data: {},
  remote_data_status: RemoteDataStatus.HIDDEN,
};

interface CallerRecordProjectionCommand {
  caller: SystemUserRecord;
  table_name: AllowedSyncTable;
  record: Record<string, unknown>;
}

export async function project_record_for_caller(
  ctx: { db: QueryCtx["db"] },
  command: CallerRecordProjectionCommand,
): Promise<Option<Record<string, unknown>>> {
  const visible_records = await authorize_records_for_reader(ctx, {
    caller: command.caller,
    table_name: command.table_name,
    records: [command.record],
  });
  return visible_records.length === 0
    ? create_none_option()
    : create_some_option(strip_convex_fields(visible_records[0]));
}

export async function build_caller_visible_record(
  ctx: { db: QueryCtx["db"] },
  command: CallerRecordProjectionCommand,
): Promise<CallerVisibleRecord> {
  const projected = await project_record_for_caller(ctx, command);
  return projected.status === OptionStatus.SOME
    ? {
        remote_data: projected.value,
        remote_data_status: RemoteDataStatus.VISIBLE,
      }
    : HIDDEN_REMOTE_RECORD;
}
