import type { Result } from "$lib/core/types/Result";
import {
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";

import { ENTITY_STATUS } from "../../core/entities/StatusConstants";
import { get_database, get_table_from_database } from "./syncDataAccess";
import { pull_table_from_convex } from "./syncPullService";
import type { ConvexClient } from "./syncTypes";
import { EPOCH_TIMESTAMP } from "./syncTypes";

const RECORD_LOOKUP_FOUND_STATUS = "found";
const RECORD_LOOKUP_NOT_FOUND_STATUS = "not_found";
const RECORD_LOOKUP_FAILURE_STATUS = "failure";

type ScopedRecordLookupResult =
  | {
      status: typeof RECORD_LOOKUP_FOUND_STATUS;
      record: Record<string, unknown>;
    }
  | { status: typeof RECORD_LOOKUP_NOT_FOUND_STATUS }
  | { status: typeof RECORD_LOOKUP_FAILURE_STATUS; error: string };

export async function pull_system_users_from_convex(
  get_sync_manager_fn: () => {
    get_convex_client: () => Result<ConvexClient>;
  },
): Promise<boolean> {
  const convex_client_result = get_sync_manager_fn().get_convex_client();

  if (!convex_client_result.success) {
    console.warn("[Sync:SystemUsers] Convex client not configured");
    return false;
  }

  const convex_client = convex_client_result.data;

  const database = get_database();
  const table = get_table_from_database(database, "system_users");

  console.log(
    "[Sync:SystemUsers] Pulling all system_users from Convex (full fetch for auth recovery)...",
  );
  const result = await pull_table_from_convex(
    convex_client,
    table,
    "system_users",
    EPOCH_TIMESTAMP,
  );

  if (result.success) {
    console.log(
      `[Sync:SystemUsers] Pulled ${result.data.records_pulled} record(s) from Convex`,
    );
  } else {
    console.warn(`[Sync:SystemUsers] Pull failed: ${result.error}`);
  }

  return result.success;
}

export async function write_convex_user_to_local_dexie(convex_user: {
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
}): Promise<string> {
  const database = get_database();
  const user_id = convex_user.local_id ?? `usr_${Date.now()}`;
  console.log(
    `[Sync:SystemUsers] Writing Convex user ${convex_user.email} directly to local Dexie (id: ${user_id})`,
  );
  await database.system_users.put({
    id: user_id,
    email: convex_user.email.toLowerCase(),
    first_name: convex_user.first_name ?? "",
    last_name: convex_user.last_name ?? "",
    role: convex_user.role as any,
    status: (convex_user.status ?? ENTITY_STATUS.ACTIVE) as any,
    organization_id: convex_user.organization_id ?? "",
    team_id: convex_user.team_id,
    player_id: convex_user.player_id,
    official_id: convex_user.official_id,
    created_at: EPOCH_TIMESTAMP,
    updated_at: EPOCH_TIMESTAMP,
  } as any);
  return user_id;
}

export async function pull_user_scoped_record_from_convex(
  table_name: "organizations" | "teams",
  local_id: string,
  get_sync_manager_fn: () => {
    get_convex_client: () => Result<ConvexClient>;
  },
): Promise<Result<boolean>> {
  const convex_client_result = get_sync_manager_fn().get_convex_client();

  if (!convex_client_result.success) {
    return create_failure_result(convex_client_result.error);
  }

  const convex_client = convex_client_result.data;

  try {
    const record_lookup_result = (await convex_client.query(
      "sync:get_record_by_local_id",
      {
        table_name,
        local_id,
      },
    )) as ScopedRecordLookupResult;

    switch (record_lookup_result.status) {
      case RECORD_LOOKUP_NOT_FOUND_STATUS:
        return create_success_result(false);

      case RECORD_LOOKUP_FAILURE_STATUS:
        return create_failure_result(
          `Failed to pull ${table_name} record: ${record_lookup_result.error}`,
        );

      case RECORD_LOOKUP_FOUND_STATUS:
        break;
    }

    if (record_lookup_result.status !== RECORD_LOOKUP_FOUND_STATUS) {
      return create_success_result(false);
    }

    const database = get_database();
    const table = get_table_from_database(database, table_name);

    const raw = record_lookup_result.record;
    const local_data = { ...raw };
    delete local_data._id;
    delete local_data._creationTime;
    delete local_data.local_id;
    delete local_data.synced_at;
    delete local_data.version;
    local_data.id = local_id;

    await table.put(
      local_data as unknown as {
        id: string;
        updated_at?: string;
        created_at?: string;
      },
    );
    return create_success_result(true);
  } catch (error) {
    console.warn("[SyncUserOps] Failed to pull", {
      event: "repository_pull_failed",
      error: String(error),
    });
    const error_message =
      error instanceof Error ? error.message : String(error);
    return create_failure_result(
      `Failed to pull ${table_name} record: ${error_message}`,
    );
  }
}
