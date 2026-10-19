import { OptionStatus } from "$lib/core/types/Option";
import {
  type AsyncResult,
  create_success_result,
  type Result,
} from "$lib/core/types/Result";

import {
  beat_local_unlock_session,
  resume_local_unlock_session,
} from "./localUnlockSession";
import {
  end_local_unlock_session,
  LOCAL_UNLOCK_SESSION_END_REASON,
  type LocalUnlockSessionContext,
  start_local_unlock_session,
} from "./localUnlockSessionLifecycle";
import {
  LOCAL_VAULT_MODE,
  type LocalVaultMode,
  type LocalVaultService,
} from "./localVaultContracts";
import { LOCAL_VAULT_LOG_EVENT } from "./localVaultMessages";

type LocalUnlockSessionMethods = Pick<
  LocalVaultService,
  | "resume_unlock_session"
  | "beat_unlock_session"
  | "end_unlock_session"
  | "has_unlock_session"
  | "lock"
>;

function settle_unlock_session(
  mode: LocalVaultMode,
  session_result: Result<boolean>,
): Result<LocalVaultMode> {
  if (!session_result.success)
    console.warn("[LocalVault] Unlocked without keeping an unlock session", {
      event: LOCAL_VAULT_LOG_EVENT.UNLOCK_SESSION_SKIPPED,
      mode,
      error: session_result.error,
    });
  return create_success_result(mode);
}

function apply_unlock_session_for_mode(
  context: LocalUnlockSessionContext,
  mode: LocalVaultMode,
  data_key: Uint8Array,
): AsyncResult<boolean> {
  switch (mode) {
    case LOCAL_VAULT_MODE.DEVICE:
      return end_local_unlock_session(
        context,
        LOCAL_UNLOCK_SESSION_END_REASON.DEVICE_VAULT_ACTIVATED,
      );
    case LOCAL_VAULT_MODE.PASSKEY:
    case LOCAL_VAULT_MODE.PIN:
      return start_local_unlock_session(context, data_key);
  }
}

export async function keep_unlock_session_for_mode(
  context: LocalUnlockSessionContext,
  mode: LocalVaultMode,
  data_key: Uint8Array,
): AsyncResult<LocalVaultMode> {
  const session_result = await apply_unlock_session_for_mode(
    context,
    mode,
    data_key,
  );
  return settle_unlock_session(mode, session_result);
}

export async function start_session_after_unlock(
  context: LocalUnlockSessionContext,
  unlock: AsyncResult<LocalVaultMode>,
): AsyncResult<LocalVaultMode> {
  const unlock_result = await unlock;
  if (!unlock_result.success) return unlock_result;
  const data_key = context.dependencies.key_holder.current();
  if (data_key.status === OptionStatus.NONE) return unlock_result;
  return keep_unlock_session_for_mode(
    context,
    unlock_result.data,
    data_key.value,
  );
}

function lock_vault(context: LocalUnlockSessionContext): AsyncResult<boolean> {
  context.dependencies.key_holder.forget();
  console.info("[LocalVault] Local data locked", {
    event: LOCAL_VAULT_LOG_EVENT.VAULT_LOCKED,
  });
  return end_local_unlock_session(
    context,
    LOCAL_UNLOCK_SESSION_END_REASON.LOCKED,
  );
}

export function create_unlock_session_methods(
  context: LocalUnlockSessionContext,
): LocalUnlockSessionMethods {
  return {
    resume_unlock_session: () => resume_local_unlock_session(context),
    beat_unlock_session: (is_in_sight: boolean) =>
      beat_local_unlock_session(context, is_in_sight),
    end_unlock_session: () =>
      end_local_unlock_session(
        context,
        LOCAL_UNLOCK_SESSION_END_REASON.REQUESTED,
      ),
    has_unlock_session: () => context.tracker.is_active(),
    lock: () => lock_vault(context),
  };
}
