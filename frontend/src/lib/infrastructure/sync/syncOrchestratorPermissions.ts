import { get } from "svelte/store";

import type { SyncDirection } from "$lib/core/interfaces/ports";
import {
  type AsyncResult,
  create_success_result,
} from "$lib/core/types/Result";

import { current_user_role } from "../../presentation/stores/auth";
import { get_database } from "./syncDataAccess";
import { reject_unpermitted_pending_entries } from "./syncOutboxPermissionRejection";
import type { RejectedOutboxRecord } from "./syncPushOutcomes";
import {
  get_push_excluded_tables,
  get_push_excluded_tables_for_unsigned_user,
} from "./syncTypes";

const PULL_DIRECTION = "pull";

export async function reject_changes_role_cannot_push(
  direction: SyncDirection,
  correlation_id: string,
): AsyncResult<RejectedOutboxRecord[]> {
  const role = get(current_user_role);
  if (!role || direction === PULL_DIRECTION) return create_success_result([]);
  return reject_unpermitted_pending_entries(
    get_database(),
    role,
    correlation_id,
  );
}

export function resolve_push_excluded_tables(): Set<string> {
  const role = get(current_user_role);
  return role
    ? get_push_excluded_tables(role)
    : get_push_excluded_tables_for_unsigned_user();
}
