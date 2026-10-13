import type { SportSyncDatabase } from "$lib/adapters/repositories/database";
import {
  type AsyncResult,
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";

import { list_tables_with_pending_entries } from "./syncOutboxRepository";

const PULL_DIRECTION = "pull";

export async function load_tables_with_pending_changes(
  database: SportSyncDatabase,
  is_pull_only: boolean,
  correlation_id: string,
): AsyncResult<Set<string>> {
  if (is_pull_only) return create_success_result(new Set<string>());
  try {
    return create_success_result(
      await list_tables_with_pending_entries(database),
    );
  } catch (error) {
    console.error("[Sync] Failed to read pending outbox tables", {
      event: "sync_outbox_pending_tables_read_failed",
      correlation_id,
      error: String(error),
    });
    return create_failure_result(String(error));
  }
}
