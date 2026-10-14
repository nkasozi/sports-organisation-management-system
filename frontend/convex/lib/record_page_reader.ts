import type { QueryCtx } from "../_generated/server";
import { query_table_dynamically, type StoredRow } from "./dynamic_table_query";
import { type Option, OptionStatus } from "./option";
import {
  LOCAL_ID_INDEX,
  ORGANIZATION_LOCAL_ID_INDEX,
} from "./scoped_row_loader";
import type { AllowedSyncTable } from "./sync_table_catalog";
import {
  get_table_tenancy_strategy,
  TableTenancyStrategy,
} from "./table_tenancy";
import { read_string_or } from "./value_guards";

const LOCAL_ID_FIELD_NAME = "local_id";
const ORGANIZATION_FIELD_NAME = "organization_id";
const LOOKAHEAD_ROW_COUNT = 1;

interface RawRecordPage {
  rows: StoredRow[];
  next_cursor: string;
  has_more: boolean;
}

interface RawRecordPageRequest {
  table_name: AllowedSyncTable;
  organization_id: Option<string>;
  after_local_id: string;
  page_size: number;
}

async function load_rows_after_cursor(
  ctx: { db: QueryCtx["db"] },
  request: RawRecordPageRequest,
): Promise<StoredRow[]> {
  const row_limit = request.page_size + LOOKAHEAD_ROW_COUNT;
  const table_query = query_table_dynamically(ctx, request.table_name);
  const organization_id = request.organization_id;
  if (
    organization_id.status === OptionStatus.SOME &&
    get_table_tenancy_strategy(request.table_name) ===
      TableTenancyStrategy.ORGANIZATION_FIELD
  )
    return table_query
      .withIndex(ORGANIZATION_LOCAL_ID_INDEX, (range) =>
        range
          .eq(ORGANIZATION_FIELD_NAME, organization_id.value)
          .gt(LOCAL_ID_FIELD_NAME, request.after_local_id),
      )
      .take(row_limit);
  return table_query
    .withIndex(LOCAL_ID_INDEX, (range) =>
      range.gt(LOCAL_ID_FIELD_NAME, request.after_local_id),
    )
    .take(row_limit);
}

export async function read_raw_record_page(
  ctx: { db: QueryCtx["db"] },
  request: RawRecordPageRequest,
): Promise<RawRecordPage> {
  const loaded_rows = await load_rows_after_cursor(ctx, request);
  const rows = loaded_rows.slice(0, request.page_size);
  const last_row = rows[rows.length - 1];
  return {
    rows,
    next_cursor: last_row
      ? read_string_or(last_row[LOCAL_ID_FIELD_NAME], request.after_local_id)
      : request.after_local_id,
    has_more: loaded_rows.length > request.page_size,
  };
}
