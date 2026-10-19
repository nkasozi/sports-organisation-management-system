import { OptionStatus } from "$lib/core/types/Option";
import {
  type AsyncResult,
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";

import {
  end_local_unlock_session,
  LOCAL_UNLOCK_SESSION_END_REASON,
  type LocalUnlockSessionContext,
} from "./localUnlockSessionLifecycle";
import {
  can_resume_local_unlock_session,
  has_been_away_too_long,
  type LocalUnlockSessionTimes,
} from "./localUnlockSessionRules";
import {
  LOCAL_UNLOCK_SESSION_REFRESH,
  type LocalUnlockSessionRefresh,
} from "./localUnlockSessionStorage";
import {
  LOCAL_VAULT_MODE,
  type LocalUnlockSessionRecord,
  type LocalVaultMode,
} from "./localVaultContracts";
import { unwrap_local_data_key } from "./localVaultKeyCrypto";
import {
  LOCAL_VAULT_LOG_EVENT,
  LOCAL_VAULT_MESSAGE,
} from "./localVaultMessages";

function cannot_resume(times: LocalUnlockSessionTimes, now: number): boolean {
  return !can_resume_local_unlock_session(times, now);
}

function refuse_resume(message: string): AsyncResult<LocalVaultMode> {
  console.info("[LocalVault] Unlock session not picked up", {
    event: LOCAL_VAULT_LOG_EVENT.UNLOCK_SESSION_NOT_RESUMED,
    reason: message,
  });
  return Promise.resolve(create_failure_result(message));
}

async function read_protected_vault_mode(
  context: LocalUnlockSessionContext,
): AsyncResult<LocalVaultMode> {
  const record_result = await context.dependencies.storage.read_record();
  if (!record_result.success) return record_result;
  if (record_result.data.status === OptionStatus.NONE)
    return create_failure_result(LOCAL_VAULT_MESSAGE.NO_VAULT);
  const mode = record_result.data.value.unlock.mode;
  return mode === LOCAL_VAULT_MODE.DEVICE
    ? create_failure_result(LOCAL_VAULT_MESSAGE.UNLOCK_SESSION_WRONG_MODE)
    : create_success_result(mode);
}

async function refuse_unreadable_session(
  context: LocalUnlockSessionContext,
): AsyncResult<LocalVaultMode> {
  const ended_result = await end_local_unlock_session(
    context,
    LOCAL_UNLOCK_SESSION_END_REASON.UNREADABLE,
  );
  if (!ended_result.success) return ended_result;
  return refuse_resume(LOCAL_VAULT_MESSAGE.UNLOCK_SESSION_EXPIRED);
}

async function remember_session_data_key(
  context: LocalUnlockSessionContext,
  record: LocalUnlockSessionRecord,
  mode: LocalVaultMode,
): AsyncResult<LocalVaultMode> {
  const data_key_result = await unwrap_local_data_key(
    record,
    record.session_key,
  );
  if (!data_key_result.success) return refuse_unreadable_session(context);
  context.dependencies.key_holder.remember(data_key_result.data);
  context.tracker.mark_active(true);
  console.info("[LocalVault] Unlock session picked up", {
    event: LOCAL_VAULT_LOG_EVENT.UNLOCK_SESSION_RESUMED,
    mode,
  });
  return create_success_result(mode);
}

function finish_resume(
  context: LocalUnlockSessionContext,
  refresh: LocalUnlockSessionRefresh,
  mode: LocalVaultMode,
): AsyncResult<LocalVaultMode> {
  switch (refresh.kind) {
    case LOCAL_UNLOCK_SESSION_REFRESH.MISSING:
      return refuse_resume(LOCAL_VAULT_MESSAGE.NO_UNLOCK_SESSION);
    case LOCAL_UNLOCK_SESSION_REFRESH.EXPIRED:
      return refuse_resume(LOCAL_VAULT_MESSAGE.UNLOCK_SESSION_EXPIRED);
    case LOCAL_UNLOCK_SESSION_REFRESH.REFRESHED:
      return remember_session_data_key(context, refresh.record, mode);
  }
}

export async function resume_local_unlock_session(
  context: LocalUnlockSessionContext,
): AsyncResult<LocalVaultMode> {
  const mode_result = await read_protected_vault_mode(context);
  if (!mode_result.success) return refuse_resume(mode_result.error);
  const refresh_result =
    await context.dependencies.unlock_session_storage.refresh_record({
      now: context.dependencies.read_current_time().getTime(),
      is_in_sight: true,
      is_expired: cannot_resume,
    });
  if (!refresh_result.success) return refresh_result;
  return finish_resume(context, refresh_result.data, mode_result.data);
}

async function end_beaten_session(
  context: LocalUnlockSessionContext,
  refresh: LocalUnlockSessionRefresh,
): AsyncResult<boolean> {
  if (refresh.kind === LOCAL_UNLOCK_SESSION_REFRESH.REFRESHED)
    return create_success_result(true);
  const ended_result = await end_local_unlock_session(
    context,
    refresh.kind === LOCAL_UNLOCK_SESSION_REFRESH.EXPIRED
      ? LOCAL_UNLOCK_SESSION_END_REASON.AWAY_TOO_LONG
      : LOCAL_UNLOCK_SESSION_END_REASON.CLEARED_ELSEWHERE,
  );
  console.info("[LocalVault] Unlock session over, this tab must lock", {
    event: LOCAL_VAULT_LOG_EVENT.UNLOCK_SESSION_OVER,
    refresh: refresh.kind,
    is_session_cleared: ended_result.success,
  });
  return create_success_result(false);
}

export async function beat_local_unlock_session(
  context: LocalUnlockSessionContext,
  is_in_sight: boolean,
): AsyncResult<boolean> {
  if (!context.tracker.is_active()) return create_success_result(true);
  const refresh_result =
    await context.dependencies.unlock_session_storage.refresh_record({
      now: context.dependencies.read_current_time().getTime(),
      is_in_sight,
      is_expired: has_been_away_too_long,
    });
  if (!refresh_result.success) return refresh_result;
  return end_beaten_session(context, refresh_result.data);
}
