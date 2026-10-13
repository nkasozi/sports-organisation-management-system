import { order_tables_children_first } from "./lib/sync_clear_table_order";
import {
  ALLOWED_SYNC_TABLES,
  type AllowedSyncTable,
} from "./lib/sync_table_catalog";

export const NON_DEMO_SYNC_TABLES: ReadonlySet<AllowedSyncTable> =
  new Set<AllowedSyncTable>(["system_users", "organization_settings"]);

export const DEMO_DATA_TABLE_NAMES: readonly AllowedSyncTable[] =
  order_tables_children_first(
    ALLOWED_SYNC_TABLES.filter(
      (table_name) => !NON_DEMO_SYNC_TABLES.has(table_name),
    ),
  );
