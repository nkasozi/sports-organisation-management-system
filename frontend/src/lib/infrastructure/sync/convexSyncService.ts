import type { Result } from "$lib/core/types/Result";
import {
  get_sync_manager as get_sync_manager_impl,
  initialize_sync_manager as initialize_sync_manager_impl,
  ConvexSyncManager,
} from "./syncManager";
import {
  delete_record_in_convex as delete_record_impl,
  clear_all_synced_tables_in_convex as clear_all_tables_impl,
  clear_all_demo_data_in_convex as clear_demo_impl,
  get_last_sync_timestamp,
  reset_sync_metadata,
} from "./syncMaintenanceOps";
import {
  pull_system_users_from_convex as pull_users_impl,
  write_convex_user_to_local_dexie,
  pull_user_scoped_record_from_convex as pull_scoped_impl,
} from "./syncSystemUserOps";
import {
  resolve_conflict,
  resolve_multiple_conflicts,
} from "./syncConflictResolution";
import { pull_table_from_convex } from "./syncPullService";
import {
  get_local_latest_modified_at,
  get_table_from_database,
} from "./syncDataAccess";

export type {
  SyncDirection,
  SyncStatus,
  SyncProgress,
  ConflictFromServer,
  SyncResult,
  SyncConfig,
  ConflictResolutionRequest,
  TableName,
} from "./syncTypes";
export { TABLE_NAMES } from "./syncTypes";

export {
  get_local_latest_modified_at,
  get_table_from_database,
} from "./syncDataAccess";

export { pull_table_from_convex } from "./syncPullService";
export { resolve_conflict } from "./syncConflictResolution";
export {
  get_last_sync_timestamp,
  reset_sync_metadata,
} from "./syncMaintenanceOps";
export { write_convex_user_to_local_dexie } from "./syncSystemUserOps";
export { ConvexSyncManager } from "./syncManager";

export function get_sync_manager(): ConvexSyncManager {
  return get_sync_manager_impl();
}

export function initialize_sync_manager(
  config: Partial<import("./syncTypes").SyncConfig>,
): ConvexSyncManager {
  return initialize_sync_manager_impl(config);
}

export async function delete_record_in_convex(
  table_name: string,
  local_id: string,
): Promise<boolean> {
  return delete_record_impl(table_name, local_id, get_sync_manager_impl);
}

export async function clear_all_synced_tables_in_convex(): Promise<boolean> {
  return clear_all_tables_impl(get_sync_manager_impl);
}

export async function clear_all_demo_data_in_convex(): Promise<boolean> {
  return clear_demo_impl(get_sync_manager_impl);
}

export async function pull_system_users_from_convex(): Promise<boolean> {
  return pull_users_impl(get_sync_manager_impl);
}

export async function pull_user_scoped_record_from_convex(
  table_name: "organizations" | "teams",
  local_id: string,
): Promise<Result<boolean>> {
  return pull_scoped_impl(table_name, local_id, get_sync_manager_impl);
}
