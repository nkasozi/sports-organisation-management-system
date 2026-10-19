import type { Option } from "$lib/core/types/Option";
import type { AsyncResult } from "$lib/core/types/Result";

import type { LocalUnlockSessionTimes } from "./localUnlockSessionRules";

export const LOCAL_VAULT_MODE = {
  DEVICE: "device",
  PASSKEY: "passkey",
  PIN: "pin",
} as const;

export type LocalVaultMode =
  (typeof LOCAL_VAULT_MODE)[keyof typeof LOCAL_VAULT_MODE];

export const LOCAL_VAULT_STATUS = {
  NO_VAULT: "no_vault",
  UNREADABLE: "unreadable",
  LOCKED: "locked",
  UNLOCKED: "unlocked",
} as const;

export type LocalVaultStatus =
  | { kind: typeof LOCAL_VAULT_STATUS.NO_VAULT }
  | { kind: typeof LOCAL_VAULT_STATUS.UNREADABLE }
  | { kind: typeof LOCAL_VAULT_STATUS.LOCKED; mode: LocalVaultMode }
  | { kind: typeof LOCAL_VAULT_STATUS.UNLOCKED; mode: LocalVaultMode };

export const LOCAL_DATA_KEY_LENGTH_BYTES = 32;

export interface LocalDataKeyHolder {
  current(): Option<Uint8Array>;
  remember(data_key: Uint8Array): void;
  forget(): void;
}

export interface LocalRecordTamperReport {
  table_name: string;
  record_count: number;
  detected_at: string;
}

export interface LocalRecordTamperNotifier {
  report(table_name: string, record_count: number): void;
  subscribe(listener: (report: LocalRecordTamperReport) => void): () => void;
}

export const LOCAL_VAULT_RECORD_ID = "current";

export type LocalVaultUnlockMaterial =
  | { mode: typeof LOCAL_VAULT_MODE.DEVICE; wrapping_key: CryptoKey }
  | {
      mode: typeof LOCAL_VAULT_MODE.PASSKEY;
      credential_id: string;
      prf_salt: Uint8Array;
    }
  | {
      mode: typeof LOCAL_VAULT_MODE.PIN;
      pin_salt: Uint8Array;
      pin_iterations: number;
    };

export interface LocalVaultRecord {
  id: typeof LOCAL_VAULT_RECORD_ID;
  wrapped_data_key: Uint8Array;
  wrap_iv: Uint8Array;
  unlock: LocalVaultUnlockMaterial;
  created_at: string;
}

export const LOCAL_UNLOCK_SESSION_RECORD_ID = "current";

export interface LocalUnlockSessionRecord extends LocalUnlockSessionTimes {
  id: typeof LOCAL_UNLOCK_SESSION_RECORD_ID;
  session_key: CryptoKey;
  wrapped_data_key: Uint8Array;
  wrap_iv: Uint8Array;
}

export interface PendingLocalVaultKey {
  data_key: Uint8Array;
  record: LocalVaultRecord;
}

export interface LocalVaultService {
  read_status(): Promise<LocalVaultStatus>;
  is_passkey_unlock_available(): Promise<boolean>;
  unlock_with_device_key(): AsyncResult<LocalVaultMode>;
  unlock_with_passkey(): AsyncResult<LocalVaultMode>;
  unlock_with_pin(pin: string): AsyncResult<LocalVaultMode>;
  create_device_unlock(): AsyncResult<PendingLocalVaultKey>;
  create_passkey_unlock(owner_label: string): AsyncResult<PendingLocalVaultKey>;
  create_pin_unlock(pin: string): AsyncResult<PendingLocalVaultKey>;
  activate_pending_vault(
    pending: PendingLocalVaultKey,
  ): AsyncResult<LocalVaultMode>;
  resume_unlock_session(): AsyncResult<LocalVaultMode>;
  beat_unlock_session(is_in_sight: boolean): AsyncResult<boolean>;
  end_unlock_session(): AsyncResult<boolean>;
  has_unlock_session(): boolean;
  lock(): AsyncResult<boolean>;
}
