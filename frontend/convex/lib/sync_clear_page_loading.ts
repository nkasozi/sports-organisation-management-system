import type { QueryCtx } from "../_generated/server";
import { ORGANIZATION_LOCAL_ID_INDEX_NAME } from "../schema_validators";
import {
  CLEAR_PAGE_SIZE,
  ClearCursorKind,
  type ClearJobState,
} from "./sync_clear_job_types";
import { type ClearScanPlan, ClearScanPlanKind } from "./sync_clear_scope";
import type { AllowedSyncTable } from "./sync_table_catalog";
import { is_number, read_string_or } from "./value_guards";

const LOCAL_ID_INDEX_NAME = "by_local_id";
const LOCAL_ID_FIELD_NAME = "local_id";
const SYNC_SEQUENCE_FIELD_NAME = "sync_sequence";
const ORGANIZATION_FIELD_NAME = "organization_id";

interface OrganizationRange {
  eq(field_name: string, value: string): OrganizationRange;
  gt(field_name: string, value: string): OrganizationRange;
}

interface OrganizationIndexedQuery {
  withIndex(
    index_name: string,
    range: (builder: OrganizationRange) => OrganizationRange,
  ): { take(limit: number): Promise<Array<Record<string, unknown>>> };
}
const LOWEST_LOCAL_ID = "";
const MISSING_LOCAL_ID = "";

export interface ClearPage {
  scanned_records: Array<Record<string, unknown>>;
  eligible_records: Array<Record<string, unknown>>;
  page_was_full: boolean;
  last_scanned_local_id: string;
}

export function read_record_local_id(record: Record<string, unknown>): string {
  const local_id = record[LOCAL_ID_FIELD_NAME];
  return read_string_or(local_id, MISSING_LOCAL_ID);
}

function existed_when_clear_was_requested(
  record: Record<string, unknown>,
  sequence_ceiling: number,
): boolean {
  const sync_sequence = record[SYNC_SEQUENCE_FIELD_NAME];
  return !is_number(sync_sequence) || sync_sequence <= sequence_ceiling;
}

function load_full_table_page(
  ctx: { db: QueryCtx["db"] },
  table_name: AllowedSyncTable,
  state: ClearJobState,
): Promise<Array<Record<string, unknown>>> {
  const query = ctx.db.query(table_name);
  const ranged =
    state.cursor_kind === ClearCursorKind.AFTER
      ? query.withIndex(LOCAL_ID_INDEX_NAME, (range) =>
          range.gt(LOCAL_ID_FIELD_NAME, state.cursor_local_id),
        )
      : query.withIndex(LOCAL_ID_INDEX_NAME, (range) =>
          range.gte(LOCAL_ID_FIELD_NAME, LOWEST_LOCAL_ID),
        );
  return ranged.take(CLEAR_PAGE_SIZE) as Promise<
    Array<Record<string, unknown>>
  >;
}

function load_organization_page(
  ctx: { db: QueryCtx["db"] },
  table_name: AllowedSyncTable,
  state: ClearJobState,
  organization_id: string,
): Promise<Array<Record<string, unknown>>> {
  const query = ctx.db.query(table_name) as unknown as OrganizationIndexedQuery;
  return query
    .withIndex(ORGANIZATION_LOCAL_ID_INDEX_NAME, (range) => {
      const in_organization = range.eq(
        ORGANIZATION_FIELD_NAME,
        organization_id,
      );
      return state.cursor_kind === ClearCursorKind.AFTER
        ? in_organization.gt(LOCAL_ID_FIELD_NAME, state.cursor_local_id)
        : in_organization;
    })
    .take(CLEAR_PAGE_SIZE);
}

async function load_records_after_cursor(
  ctx: { db: QueryCtx["db"] },
  table_name: AllowedSyncTable,
  state: ClearJobState,
  scan_plan: ClearScanPlan,
): Promise<Array<Record<string, unknown>>> {
  switch (scan_plan.kind) {
    case ClearScanPlanKind.FULL_TABLE:
      return load_full_table_page(ctx, table_name, state);
    case ClearScanPlanKind.ORGANIZATION_INDEX:
      return load_organization_page(
        ctx,
        table_name,
        state,
        scan_plan.organization_id,
      );
    case ClearScanPlanKind.NOTHING_CLEARABLE:
      return [];
  }
}

export async function load_clear_page(
  ctx: { db: QueryCtx["db"] },
  table_name: AllowedSyncTable,
  state: ClearJobState,
  scan_plan: ClearScanPlan,
): Promise<ClearPage> {
  const scanned_records = await load_records_after_cursor(
    ctx,
    table_name,
    state,
    scan_plan,
  );
  const sequence_ceiling = state.sequence_ceilings[state.table_index];
  const last_record = scanned_records[scanned_records.length - 1];
  return {
    scanned_records,
    eligible_records: scanned_records.filter((record) =>
      existed_when_clear_was_requested(record, sequence_ceiling),
    ),
    page_was_full: scanned_records.length >= CLEAR_PAGE_SIZE,
    last_scanned_local_id: last_record
      ? read_record_local_id(last_record)
      : state.cursor_local_id,
  };
}
