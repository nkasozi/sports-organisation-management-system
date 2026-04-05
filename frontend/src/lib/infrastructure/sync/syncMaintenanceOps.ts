import { is_signed_in } from "../../adapters/iam/clerkAuthService";
import { get } from "svelte/store";
import { get_app_settings_storage } from "$lib/infrastructure/container";
import type { ConvexClient } from "./syncTypes";
import { EPOCH_TIMESTAMP, TABLE_NAMES } from "./syncTypes";

interface SyncManagerAccessor {
  get_convex_client(): ConvexClient | null;
}

export function get_last_sync_timestamp(): string {
  return EPOCH_TIMESTAMP;
}

export async function reset_sync_metadata(): Promise<void> {
  await get_app_settings_storage().remove_setting("convex_sync_metadata");
  console.debug("[ConvexSync] Reset sync metadata", {
    event: "sync_metadata_reset",
  });
}

export async function delete_record_in_convex(
  table_name: string,
  local_id: string,
  get_sync_manager_fn: () => SyncManagerAccessor,
): Promise<boolean> {
  if (!get(is_signed_in)) return false;

  const convex_client = get_sync_manager_fn().get_convex_client();

  if (!convex_client) return false;

  try {
    const result = (await convex_client.mutation("sync:delete_record", {
      table_name,
      local_id,
    })) as { success: boolean; action: string; error?: string };

    if (result.success) {
      console.log(`[Sync:Delete] ${table_name}/${local_id} — ${result.action}`);
    } else {
      console.warn(
        `[Sync:Delete] ${table_name}/${local_id} — failed: ${result.error}`,
      );
    }
    return result.success;
  } catch (error) {
    console.warn(`[Sync:Delete] ${table_name}/${local_id} — error: ${error}`);
    return false;
  }
}

export async function clear_all_synced_tables_in_convex(
  get_sync_manager_fn: () => SyncManagerAccessor,
): Promise<boolean> {
  if (!get(is_signed_in)) {
    console.warn("[Sync:Reset] User not signed in — skipping remote clear");
    return false;
  }

  const convex_client = get_sync_manager_fn().get_convex_client();

  if (!convex_client) {
    console.warn(
      "[Sync:Reset] Convex client not configured, skipping remote clear",
    );
    return false;
  }

  console.log("[Sync:Reset] Clearing all synced tables in Convex...");
  let total_deleted = 0;

  for (const table_name of TABLE_NAMES) {
    try {
      const result = (await convex_client.mutation("sync:clear_table", {
        table_name,
      })) as { success: boolean; deleted_count: number; error?: string };

      if (result.success) {
        total_deleted += result.deleted_count;
        if (result.deleted_count > 0) {
          console.log(
            `[Sync:Reset] ${table_name}: deleted ${result.deleted_count} records`,
          );
        }
      } else {
        console.warn(`[Sync:Reset] ${table_name}: ${result.error}`);
      }
    } catch (error) {
      console.warn(`[Sync:Reset] ${table_name}: failed — ${error}`);
    }
  }

  console.log(`[Sync:Reset] Done. Total deleted: ${total_deleted}`);
  return true;
}

export async function clear_all_demo_data_in_convex(
  get_sync_manager_fn: () => SyncManagerAccessor,
): Promise<boolean> {
  if (!get(is_signed_in)) {
    console.warn("[Sync:Reset] User not signed in — skipping remote clear");
    return false;
  }

  const convex_client = get_sync_manager_fn().get_convex_client();

  if (!convex_client) {
    console.warn(
      "[Sync:Reset] Convex client not configured, skipping remote clear",
    );
    return false;
  }

  console.log(
    "[Sync:Reset] Clearing all demo data in Convex (system_users preserved)...",
  );

  const result = (await convex_client.mutation(
    "sync:clear_all_demo_data",
    {},
  )) as {
    success: boolean;
    deleted_count: number;
    error?: string;
  };

  if (result.success) {
    console.log(
      `[Sync:Reset] Done. Deleted ${result.deleted_count} demo records (system_users preserved)`,
    );
  } else {
    console.error(`[Sync:Reset] clear_all_demo_data failed: ${result.error}`);
  }

  return result.success;
}
