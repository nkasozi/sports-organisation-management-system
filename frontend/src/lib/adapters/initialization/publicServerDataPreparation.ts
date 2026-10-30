import { get_database } from "$lib/adapters/repositories/database";
import {
  sync_change_tracking_gate,
  UntrackedWriteReason,
} from "$lib/adapters/repositories/syncOutbox/syncChangeTrackingGate";
import { SYNC_BOOKKEEPING_TABLE_NAMES } from "$lib/adapters/repositories/syncOutbox/syncOutboxTypes";
import { TABLE_NAMES } from "$lib/infrastructure/sync/syncTypes";

import {
  SEEDING_COMPLETE_SETTING_KEY,
  SEEDING_COMPLETION_STATE,
} from "./initializationConstants";
import { is_seeding_already_complete, type SeedResult } from "./seedingTypes";
import {
  create_failed_seed_result,
  create_skipped_seed_result,
} from "./seedResults";

const READ_WRITE_TRANSACTION_MODE = "rw";
const APP_SETTINGS_TABLE_NAME = "app_settings";
const DEMO_DATA_NOT_CLEARED_MESSAGE =
  "Old demo data could not be cleared from this device. Please reload the page.";
const UNSYNCED_CHANGES_KEPT_MESSAGE =
  "This device has changes that were never sent to the server, so they were kept. Sign in to send them.";

const PUBLIC_SERVER_DATA_EVENT = {
  READY: "public_server_data_ready",
  DEMO_DATA_CLEARED: "public_server_demo_data_cleared",
  DEMO_DATA_CLEAR_FAILED: "public_server_demo_data_clear_failed",
  UNSYNCED_CHANGES_KEPT: "public_server_unsynced_changes_kept",
} as const;

async function has_unsynced_changes(): Promise<boolean> {
  return (await get_database().sync_outbox.count()) > 0;
}

async function clear_local_demo_tables(): Promise<boolean> {
  const database = get_database();
  await database.transaction(
    READ_WRITE_TRANSACTION_MODE,
    [...TABLE_NAMES, ...SYNC_BOOKKEEPING_TABLE_NAMES, APP_SETTINGS_TABLE_NAME],
    async (transaction) => {
      sync_change_tracking_gate.mark_untracked_transaction(
        transaction.idbtrans,
        UntrackedWriteReason.DATA_RESET,
      );
      for (const table_name of [
        ...TABLE_NAMES,
        ...SYNC_BOOKKEEPING_TABLE_NAMES,
      ])
        transaction.idbtrans.objectStore(table_name).clear();
      transaction.idbtrans
        .objectStore(APP_SETTINGS_TABLE_NAME)
        .delete(SEEDING_COMPLETE_SETTING_KEY);
    },
  );
  return true;
}

async function replace_demo_data_with_server_data(): Promise<SeedResult> {
  if (await has_unsynced_changes()) {
    console.warn(
      "[Seeding] Unsynced local changes kept for a signed-out visitor",
      {
        event: PUBLIC_SERVER_DATA_EVENT.UNSYNCED_CHANGES_KEPT,
      },
    );
    return create_failed_seed_result(UNSYNCED_CHANGES_KEPT_MESSAGE);
  }
  try {
    await clear_local_demo_tables();
    console.log("[Seeding] Demo data cleared; public pages read the server", {
      event: PUBLIC_SERVER_DATA_EVENT.DEMO_DATA_CLEARED,
    });
    return create_skipped_seed_result();
  } catch (error) {
    console.error("[Seeding] Demo data could not be cleared", {
      event: PUBLIC_SERVER_DATA_EVENT.DEMO_DATA_CLEAR_FAILED,
      error: String(error),
    });
    return create_failed_seed_result(DEMO_DATA_NOT_CLEARED_MESSAGE);
  }
}

export async function prepare_public_server_data(): Promise<SeedResult> {
  const completion_state = await is_seeding_already_complete();
  switch (completion_state) {
    case SEEDING_COMPLETION_STATE.NOT_COMPLETE:
      console.log("[Seeding] Public pages read the server", {
        event: PUBLIC_SERVER_DATA_EVENT.READY,
      });
      return create_skipped_seed_result();
    case SEEDING_COMPLETION_STATE.COMPLETE:
    case SEEDING_COMPLETION_STATE.UNREADABLE:
      return replace_demo_data_with_server_data();
  }
}
