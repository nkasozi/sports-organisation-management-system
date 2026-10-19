import type { LocalUnlockSessionStorage } from "./localUnlockSessionStorage";
import type { LocalDataKeyHolder } from "./localVaultContracts";
import type { LocalVaultStorage } from "./localVaultStorage";
import type { PasskeyPrfAuthenticator } from "./passkeyPrfTypes";

export interface LocalVaultServiceDependencies {
  storage: LocalVaultStorage;
  unlock_session_storage: LocalUnlockSessionStorage;
  announce_unlock_session_ended: () => boolean;
  key_holder: LocalDataKeyHolder;
  passkey_authenticator: PasskeyPrfAuthenticator;
  read_relying_party_id: () => string;
  read_current_time: () => Date;
  pin_iterations: number;
}
