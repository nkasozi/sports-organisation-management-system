import { strip_convex_fields } from "../sync_record_helpers";
import type { SystemUserRecord } from "./auth_middleware";
import { CallerScopeKind, resolve_caller_scope } from "./caller_scope";
import { can_caller_read_table } from "./sync_read_authorization";
import {
  ALLOWED_SYNC_TABLES,
  type AllowedSyncTable,
} from "./sync_table_catalog";

const PUBLIC_METADATA_FIELDS = [
  "table_name",
  "last_sync_at",
  "sync_status",
  "records_synced",
] as const;
const TABLE_NAME_FIELD = "table_name";

function pick_public_metadata_fields(
  record: Record<string, unknown>,
): Record<string, unknown> {
  return Object.fromEntries(
    PUBLIC_METADATA_FIELDS.filter((field_name) => field_name in record).map(
      (field_name) => [field_name, record[field_name]],
    ),
  );
}

function is_metadata_table_readable(
  caller: SystemUserRecord,
  record: Record<string, unknown>,
): boolean {
  const table_name = ALLOWED_SYNC_TABLES.find(
    (allowed_table: AllowedSyncTable) =>
      allowed_table === record[TABLE_NAME_FIELD],
  );
  return table_name !== undefined && can_caller_read_table(caller, table_name);
}

export function project_sync_metadata_for_caller(
  caller: SystemUserRecord,
  records: Array<Record<string, unknown>>,
): Array<Record<string, unknown>> {
  switch (resolve_caller_scope(caller).kind) {
    case CallerScopeKind.GLOBAL:
      return records.map(strip_convex_fields);
    case CallerScopeKind.ORGANIZATION:
    case CallerScopeKind.NONE:
      return records
        .filter((record) => is_metadata_table_readable(caller, record))
        .map(pick_public_metadata_fields);
  }
}
