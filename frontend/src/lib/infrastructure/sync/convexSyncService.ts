import type { Result } from "$lib/core/types/Result";

import { clear_all_demo_data_in_convex as clear_demo_impl } from "./syncMaintenanceOps";
import {
  ConvexSyncManager,
  get_sync_manager as get_sync_manager_impl,
  initialize_sync_manager as initialize_sync_manager_impl,
} from "./syncManager";
import { pull_user_scoped_record_from_convex as pull_scoped_impl } from "./syncSystemUserOps";

export { resolve_conflict_with_outcome } from "./syncConflictResolution";
export {
  get_last_sync_timestamp,
  reset_sync_metadata,
} from "./syncMaintenanceOps";
export { ConvexSyncManager } from "./syncManager";
export { write_convex_user_to_local_dexie } from "./syncSystemUserOps";
export type {
  ConflictResolutionRequest,
  SyncConfig,
  SyncDirection,
  SyncProgress,
  SyncResult,
  SyncStatus,
  TableName,
} from "./syncTypes";
export { TABLE_NAMES } from "./syncTypes";

export function get_sync_manager(): ConvexSyncManager {
  return get_sync_manager_impl();
}

export function initialize_sync_manager(
  config: Partial<import("./syncTypes").SyncConfig>,
): ConvexSyncManager {
  return initialize_sync_manager_impl(config);
}

export async function clear_all_demo_data_in_convex(): Promise<boolean> {
  return clear_demo_impl(get_sync_manager_impl);
}

export async function pull_user_scoped_record_from_convex(
  table_name: "organizations" | "teams",
  local_id: string,
): Promise<Result<boolean>> {
  return pull_scoped_impl(table_name, local_id, get_sync_manager_impl);
}
