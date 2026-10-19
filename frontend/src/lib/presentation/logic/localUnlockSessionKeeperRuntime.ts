import { local_data_key_holder } from "$lib/infrastructure/localVault/localDataKeyHolder";
import { listen_for_local_unlock_session_ended } from "$lib/infrastructure/localVault/localUnlockSessionChannel";
import { LOCAL_UNLOCK_SESSION_HEARTBEAT_MILLISECONDS } from "$lib/infrastructure/localVault/localUnlockSessionRules";
import { local_vault_service } from "$lib/infrastructure/localVault/localVaultServiceInstance";

import { keep_local_unlock_session_alive } from "./localUnlockSessionKeeper";

const VISIBLE_DOCUMENT_STATE = "visible";

export function start_local_unlock_session_keeper(): () => boolean {
  return keep_local_unlock_session_alive({
    beat_unlock_session: (is_in_sight: boolean) =>
      local_vault_service.beat_unlock_session(is_in_sight),
    has_unlock_session: () => local_vault_service.has_unlock_session(),
    is_page_in_sight: () => document.visibilityState === VISIBLE_DOCUMENT_STATE,
    forget_data_key: () => {
      local_data_key_holder.forget();
      return true;
    },
    reload_page: () => {
      window.location.reload();
      return true;
    },
    listen_for_session_ended: listen_for_local_unlock_session_ended,
    document_events: document,
    window_events: window,
    heartbeat_milliseconds: LOCAL_UNLOCK_SESSION_HEARTBEAT_MILLISECONDS,
  });
}
