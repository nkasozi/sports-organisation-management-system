import { sync_change_tracking_gate } from "$lib/adapters/repositories/syncOutbox/syncChangeTrackingGate";
import type { Result } from "$lib/core/types/Result";
import {
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";

import { ENTITY_STATUS } from "../../core/entities/StatusConstants";
import { get_database } from "./syncDataAccess";
import {
  type RemoteApplyDependencies,
  run_remote_apply_transaction,
} from "./syncRemoteApply";
import {
  apply_remote_snapshot_records,
  SnapshotCursorPolicy,
} from "./syncRemoteApplyRecords";
import type { ConvexClient } from "./syncTypes";
import { EPOCH_TIMESTAMP } from "./syncTypes";

const RECORD_LOOKUP_FOUND_STATUS = "found";
const RECORD_LOOKUP_NOT_FOUND_STATUS = "not_found";
const RECORD_LOOKUP_FAILURE_STATUS = "failure";
const SYSTEM_USERS_TABLE_NAME = "system_users";
const RECORD_LOOKUP_QUERY_NAME = "sync:get_record_by_local_id";
const GENERATED_USER_ID_PREFIX = "usr_";

type ScopedRecordLookupResult =
  | {
      status: typeof RECORD_LOOKUP_FOUND_STATUS;
      record: Record<string, unknown>;
    }
  | { status: typeof RECORD_LOOKUP_NOT_FOUND_STATUS }
  | { status: typeof RECORD_LOOKUP_FAILURE_STATUS; error: string };

interface ConvexUserSnapshot {
  local_id?: string;
  email: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  role: string;
  organization_id?: string;
  team_id?: string;
  player_id?: string;
  official_id?: string;
  status?: string;
}

type ScopedTableName = "organizations" | "teams";

function create_remote_apply_dependencies(): RemoteApplyDependencies {
  return { database: get_database(), gate: sync_change_tracking_gate };
}

function build_local_user_record(
  convex_user: ConvexUserSnapshot,
  user_id: string,
): Record<string, unknown> {
  return {
    id: user_id,
    email: convex_user.email.toLowerCase(),
    first_name: convex_user.first_name ?? "",
    last_name: convex_user.last_name ?? "",
    role: convex_user.role,
    status: convex_user.status ?? ENTITY_STATUS.ACTIVE,
    organization_id: convex_user.organization_id ?? "",
    team_id: convex_user.team_id,
    player_id: convex_user.player_id,
    official_id: convex_user.official_id,
    created_at: EPOCH_TIMESTAMP,
    updated_at: EPOCH_TIMESTAMP,
  };
}

export async function write_convex_user_to_local_dexie(
  convex_user: ConvexUserSnapshot,
): Promise<string> {
  const user_id =
    convex_user.local_id ?? `${GENERATED_USER_ID_PREFIX}${Date.now()}`;
  console.log("[Sync:SystemUsers] Writing Convex user to local Dexie", {
    event: "sync_convex_user_written_locally",
    correlation_id: user_id,
    user_id,
  });
  await run_remote_apply_transaction(
    create_remote_apply_dependencies(),
    SYSTEM_USERS_TABLE_NAME,
    async (tables) =>
      tables.data.put(build_local_user_record(convex_user, user_id)),
  );
  return user_id;
}

async function apply_found_scoped_record(
  table_name: ScopedTableName,
  record: Record<string, unknown>,
): Promise<Result<boolean>> {
  await apply_remote_snapshot_records(
    create_remote_apply_dependencies(),
    table_name,
    [record],
    SnapshotCursorPolicy.KEEP_CURSOR,
  );
  return create_success_result(true);
}

async function lookup_and_apply_scoped_record(
  convex_client: ConvexClient,
  table_name: ScopedTableName,
  local_id: string,
): Promise<Result<boolean>> {
  const record_lookup_result = (await convex_client.query(
    RECORD_LOOKUP_QUERY_NAME,
    { table_name, local_id },
  )) as ScopedRecordLookupResult;
  switch (record_lookup_result.status) {
    case RECORD_LOOKUP_NOT_FOUND_STATUS:
      return create_success_result(false);
    case RECORD_LOOKUP_FAILURE_STATUS:
      return create_failure_result(
        `Failed to pull ${table_name} record: ${record_lookup_result.error}`,
      );
    case RECORD_LOOKUP_FOUND_STATUS:
      return apply_found_scoped_record(table_name, record_lookup_result.record);
  }
}

export async function pull_user_scoped_record_from_convex(
  table_name: ScopedTableName,
  local_id: string,
  get_sync_manager_fn: () => {
    get_convex_client: () => Result<ConvexClient>;
  },
): Promise<Result<boolean>> {
  const convex_client_result = get_sync_manager_fn().get_convex_client();
  if (!convex_client_result.success)
    return create_failure_result(convex_client_result.error);
  try {
    return await lookup_and_apply_scoped_record(
      convex_client_result.data,
      table_name,
      local_id,
    );
  } catch (error) {
    console.warn("[SyncUserOps] Failed to pull", {
      event: "repository_pull_failed",
      correlation_id: local_id,
      table_name,
      error: String(error),
    });
    const error_message =
      error instanceof Error ? error.message : String(error);
    return create_failure_result(
      `Failed to pull ${table_name} record: ${error_message}`,
    );
  }
}
