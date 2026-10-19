import { read_browser_passkey_platform } from "./browserPasskeyPlatform";
import { local_data_key_holder } from "./localDataKeyHolder";
import { announce_local_unlock_session_ended } from "./localUnlockSessionChannel";
import { create_local_unlock_session_storage } from "./localUnlockSessionStorage";
import {
  create_local_vault_database,
  LOCAL_VAULT_DATABASE_NAME,
} from "./localVaultDatabase";
import { create_local_vault_service } from "./localVaultService";
import { create_local_vault_storage } from "./localVaultStorage";
import { PIN_KEY_ITERATIONS } from "./localVaultWrappingKeys";
import { create_passkey_prf_authenticator } from "./passkeyPrfAuthenticator";

const local_vault_database = create_local_vault_database(
  LOCAL_VAULT_DATABASE_NAME,
);

export const local_vault_service = create_local_vault_service({
  storage: create_local_vault_storage(local_vault_database),
  unlock_session_storage:
    create_local_unlock_session_storage(local_vault_database),
  announce_unlock_session_ended: announce_local_unlock_session_ended,
  key_holder: local_data_key_holder,
  passkey_authenticator: create_passkey_prf_authenticator(
    read_browser_passkey_platform,
  ),
  read_relying_party_id: () => location.hostname,
  read_current_time: () => new Date(),
  pin_iterations: PIN_KEY_ITERATIONS,
});
