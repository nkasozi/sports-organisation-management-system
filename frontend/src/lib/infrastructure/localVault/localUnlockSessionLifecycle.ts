import {
  type AsyncResult,
  create_success_result,
} from "$lib/core/types/Result";

import { LOCAL_UNLOCK_SESSION_RECORD_ID } from "./localVaultContracts";
import { wrap_local_data_key } from "./localVaultKeyCrypto";
import { LOCAL_VAULT_LOG_EVENT } from "./localVaultMessages";
import type { LocalVaultServiceDependencies } from "./localVaultServiceTypes";
import { create_device_wrapping_key } from "./localVaultWrappingKeys";

export const LOCAL_UNLOCK_SESSION_END_REASON = {
  REQUESTED: "requested",
  LOCKED: "locked",
  DEVICE_VAULT_ACTIVATED: "device_vault_activated",
  AWAY_TOO_LONG: "away_too_long",
  CLEARED_ELSEWHERE: "cleared_elsewhere",
  UNREADABLE: "unreadable",
} as const;

type LocalUnlockSessionEndReason =
  (typeof LOCAL_UNLOCK_SESSION_END_REASON)[keyof typeof LOCAL_UNLOCK_SESSION_END_REASON];

export interface LocalUnlockSessionTracker {
  is_active(): boolean;
  mark_active(is_active: boolean): boolean;
}

export interface LocalUnlockSessionContext {
  dependencies: LocalVaultServiceDependencies;
  tracker: LocalUnlockSessionTracker;
}

export function create_local_unlock_session_tracker(): LocalUnlockSessionTracker {
  const session_state = { is_active: false };
  return {
    is_active: () => session_state.is_active,
    mark_active: (is_active: boolean) => {
      session_state.is_active = is_active;
      return is_active;
    },
  };
}

async function save_new_session(
  dependencies: LocalVaultServiceDependencies,
  data_key: Uint8Array,
): AsyncResult<boolean> {
  const session_key_result = await create_device_wrapping_key();
  if (!session_key_result.success) return session_key_result;
  const wrapped_result = await wrap_local_data_key(
    data_key,
    session_key_result.data,
  );
  if (!wrapped_result.success) return wrapped_result;
  const now = dependencies.read_current_time().getTime();
  return dependencies.unlock_session_storage.save_record({
    id: LOCAL_UNLOCK_SESSION_RECORD_ID,
    session_key: session_key_result.data,
    wrapped_data_key: wrapped_result.data.wrapped_data_key,
    wrap_iv: wrapped_result.data.wrap_iv,
    last_seen_at: now,
    last_in_sight_at: now,
  });
}

export async function start_local_unlock_session(
  context: LocalUnlockSessionContext,
  data_key: Uint8Array,
): AsyncResult<boolean> {
  const saved_result = await save_new_session(context.dependencies, data_key);
  if (!saved_result.success) {
    console.error("[LocalVault] Unlock session could not be started", {
      event: LOCAL_VAULT_LOG_EVENT.UNLOCK_SESSION_START_FAILED,
      error: saved_result.error,
    });
    return saved_result;
  }
  context.tracker.mark_active(true);
  console.info("[LocalVault] Unlock session started", {
    event: LOCAL_VAULT_LOG_EVENT.UNLOCK_SESSION_STARTED,
  });
  return create_success_result(true);
}

export async function end_local_unlock_session(
  context: LocalUnlockSessionContext,
  reason: LocalUnlockSessionEndReason,
): AsyncResult<boolean> {
  context.tracker.mark_active(false);
  const deleted_result =
    await context.dependencies.unlock_session_storage.delete_record();
  context.dependencies.announce_unlock_session_ended();
  if (!deleted_result.success) {
    console.error("[LocalVault] Unlock session could not be cleared", {
      event: LOCAL_VAULT_LOG_EVENT.UNLOCK_SESSION_END_FAILED,
      reason,
      error: deleted_result.error,
    });
    return deleted_result;
  }
  console.info("[LocalVault] Unlock session ended", {
    event: LOCAL_VAULT_LOG_EVENT.UNLOCK_SESSION_ENDED,
    reason,
  });
  return create_success_result(true);
}
