import { get } from "svelte/store";

import type { Result } from "$lib/core/types/Result";
import { get_app_settings_storage } from "$lib/infrastructure/container";

import { is_signed_in } from "../../adapters/iam/clerkAuthService";
import { run_remote_demo_data_clear } from "./syncRemoteDemoClear";
import type { ConvexClient } from "./syncTypes";
import { EPOCH_TIMESTAMP } from "./syncTypes";

interface SyncManagerAccessor {
  get_convex_client(): Result<ConvexClient>;
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

export async function clear_all_demo_data_in_convex(
  get_sync_manager_fn: () => SyncManagerAccessor,
): Promise<boolean> {
  if (!get(is_signed_in)) {
    console.warn("[Sync:Reset] User not signed in; remote clear skipped", {
      event: "sync_remote_demo_clear_skipped_signed_out",
    });
    return false;
  }

  const convex_client_result = get_sync_manager_fn().get_convex_client();

  if (!convex_client_result.success) {
    console.warn("[Sync:Reset] Convex client not configured", {
      event: "sync_remote_demo_clear_client_unconfigured",
    });
    return false;
  }

  const result = await run_remote_demo_data_clear({
    convex_client: convex_client_result.data,
    delay: (milliseconds: number) =>
      new Promise((resolve) => setTimeout(resolve, milliseconds)),
  });
  if (!result.success) {
    console.error("[Sync:Reset] clear_all_demo_data failed", {
      event: "sync_remote_demo_clear_failed",
      error: result.error,
    });
    return false;
  }
  console.log("[Sync:Reset] Server demo data cleared with tombstones", {
    event: "sync_remote_demo_clear_completed",
    deleted_count: result.data.deleted_count,
  });
  return true;
}
