import type { SportSyncDatabase } from "$lib/adapters/repositories/database";

import { SYNCED_TABLE_NAMES } from "./backgroundSyncSharedState";
import { delete_record_in_convex } from "./convexSyncService";

export function install_dexie_hooks(
  database: SportSyncDatabase,
  on_local_write: (table_name: string) => void,
): boolean {
  for (const table_name of SYNCED_TABLE_NAMES) {
    const table = (database as unknown as Record<string, unknown>)[
      table_name
    ] as {
      hook: (event: string) => {
        subscribe: (fn: (primKey: unknown) => void) => void;
      };
    };
    if (!table?.hook) continue;

    table.hook("creating").subscribe(() => {
      on_local_write(table_name);
    });
    table.hook("updating").subscribe(() => {
      on_local_write(table_name);
    });
    table.hook("deleting").subscribe((primKey: unknown) => {
      const local_id = typeof primKey === "string" ? primKey : String(primKey);
      console.log(
        `[BackgroundSync] Dexie delete detected on ${table_name}: local_id=${local_id}`,
      );
      delete_record_in_convex(table_name, local_id);
    });
  }
  console.log(
    `[BackgroundSync] Dexie hooks installed on ${SYNCED_TABLE_NAMES.length} tables`,
  );
  return true;
}
