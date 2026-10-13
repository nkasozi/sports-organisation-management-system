import type Dexie from "dexie";

import { TABLE_NAMES } from "$lib/infrastructure/sync/syncTypes";

import { sync_change_tracking_gate } from "./syncChangeTrackingGate";
import { sync_local_change_notifier } from "./syncLocalChangeNotifier";
import { create_sync_outbox_middleware } from "./syncOutboxMiddleware";

const NOTIFY_AFTER_TRANSACTION_DELAY_MS = 0;

export function register_sync_outbox_middleware(database: Dexie): boolean {
  database.use(
    create_sync_outbox_middleware({
      tracked_table_names: TABLE_NAMES,
      gate: sync_change_tracking_gate,
      generate_change_token: (): string => crypto.randomUUID(),
      now_iso: (): string => new Date().toISOString(),
      on_local_changes_recorded: (
        table_name: string,
        change_count: number,
      ): boolean => {
        setTimeout(
          () => sync_local_change_notifier.notify(table_name, change_count),
          NOTIFY_AFTER_TRANSACTION_DELAY_MS,
        );
        return true;
      },
    }),
  );
  return true;
}
