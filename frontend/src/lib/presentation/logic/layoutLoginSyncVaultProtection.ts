import {
  create_failure_result,
  create_success_result,
  type Result,
} from "$lib/core/types/Result";
import type { PendingLocalVaultKey } from "$lib/infrastructure/localVault/localVaultContracts";
import type { ConvexUserProfile } from "$lib/presentation/stores/authTypes";
import { SESSION_SYNC_RETRY_KIND } from "$lib/presentation/stores/sessionSyncRetryNotice";

import { stop_login_sync_for_retry } from "./layoutLoginSyncFailure";
import type { LayoutLoginSyncDependencies } from "./layoutLoginSyncPorts";
import { create_inactive_sync_progress_subscription } from "./layoutLoginSyncProgress";
import { sign_out_after_failed_login } from "./layoutLoginSyncSignOut";
import { APP_ROUTE_PATH } from "./layoutRouteConstants";
import { LAYOUT_SESSION_PROGRESS } from "./layoutSessionConstants";
import { LOCAL_VAULT_PROTECTION_RESOLUTION } from "./localVaultPromptGate";
import {
  LOCAL_VAULT_DEFAULT_OWNER_LABEL,
  LOCAL_VAULT_PROMPT_MESSAGE,
} from "./localVaultPromptMessages";

const LOGIN_PROTECTION_DECLINED_EVENT = "login_local_protection_declined";
const LOGIN_PROTECTION_ACTIVATED_EVENT = "login_local_protection_activated";

function build_local_vault_owner_label(profile: ConvexUserProfile): string {
  const email = (profile.email || "").trim();
  return email.length > 0 ? email : LOCAL_VAULT_DEFAULT_OWNER_LABEL;
}

async function sign_out_instead_of_login_protection(
  dependencies: LayoutLoginSyncDependencies,
): Promise<Result<never>> {
  console.warn("[Layout] Sign-in stopped before local data was protected", {
    event: LOGIN_PROTECTION_DECLINED_EVENT,
  });
  dependencies.set_pulling_from_remote(false);
  dependencies.initial_sync_store.reset();
  await sign_out_after_failed_login(dependencies, APP_ROUTE_PATH.HOME);
  return create_failure_result(LOCAL_VAULT_PROMPT_MESSAGE.SIGN_OUT_INSTEAD);
}

async function clear_login_workspace_with_new_key(
  dependencies: LayoutLoginSyncDependencies,
  pending: PendingLocalVaultKey,
): Promise<Result<boolean>> {
  dependencies.initial_sync_store.update_progress(
    LAYOUT_SESSION_PROGRESS.CLEARING_LOCAL_DATA.message,
    LAYOUT_SESSION_PROGRESS.CLEARING_LOCAL_DATA.percentage,
  );
  await dependencies.reset_database();
  const activation = await dependencies.activate_local_vault(pending);
  if (!activation.success)
    return stop_login_sync_for_retry(
      dependencies,
      SESSION_SYNC_RETRY_KIND.DEVICE_PROTECTION_NOT_SAVED,
      activation.error,
      create_inactive_sync_progress_subscription(),
    );
  console.log("[Layout] Local data protection is active for this sign-in", {
    event: LOGIN_PROTECTION_ACTIVATED_EVENT,
    mode: activation.data,
  });
  return create_success_result(true);
}

export async function protect_and_clear_login_workspace(
  dependencies: LayoutLoginSyncDependencies,
  profile: ConvexUserProfile,
): Promise<Result<boolean>> {
  const protection = await dependencies.protect_local_data_for_sign_in(
    build_local_vault_owner_label(profile),
  );
  switch (protection.kind) {
    case LOCAL_VAULT_PROTECTION_RESOLUTION.SIGN_OUT_REQUESTED:
      return sign_out_instead_of_login_protection(dependencies);
    case LOCAL_VAULT_PROTECTION_RESOLUTION.PROTECTED:
      dependencies.set_pulling_from_remote(true);
      return clear_login_workspace_with_new_key(
        dependencies,
        protection.pending,
      );
  }
}
