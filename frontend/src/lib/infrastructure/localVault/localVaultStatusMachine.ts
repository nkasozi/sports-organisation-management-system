import { type Option, OptionStatus } from "$lib/core/types/Option";

import {
  LOCAL_VAULT_STATUS,
  type LocalVaultMode,
  type LocalVaultRecord,
  type LocalVaultStatus,
} from "./localVaultContracts";

export const LOCAL_VAULT_EVENT = {
  RECORD_FOUND: "record_found",
  RECORD_MISSING: "record_missing",
  KEY_REMEMBERED: "key_remembered",
  KEY_FORGOTTEN: "key_forgotten",
} as const;

type LocalVaultEvent =
  | { kind: typeof LOCAL_VAULT_EVENT.RECORD_FOUND; mode: LocalVaultMode }
  | { kind: typeof LOCAL_VAULT_EVENT.RECORD_MISSING }
  | { kind: typeof LOCAL_VAULT_EVENT.KEY_REMEMBERED }
  | { kind: typeof LOCAL_VAULT_EVENT.KEY_FORGOTTEN };

const INITIAL_LOCAL_VAULT_STATUS: LocalVaultStatus = {
  kind: LOCAL_VAULT_STATUS.NO_VAULT,
};

function unlock_status(status: LocalVaultStatus): LocalVaultStatus {
  switch (status.kind) {
    case LOCAL_VAULT_STATUS.NO_VAULT:
    case LOCAL_VAULT_STATUS.UNREADABLE:
    case LOCAL_VAULT_STATUS.UNLOCKED:
      return status;
    case LOCAL_VAULT_STATUS.LOCKED:
      return { kind: LOCAL_VAULT_STATUS.UNLOCKED, mode: status.mode };
  }
}

function lock_status(status: LocalVaultStatus): LocalVaultStatus {
  switch (status.kind) {
    case LOCAL_VAULT_STATUS.NO_VAULT:
    case LOCAL_VAULT_STATUS.UNREADABLE:
    case LOCAL_VAULT_STATUS.LOCKED:
      return status;
    case LOCAL_VAULT_STATUS.UNLOCKED:
      return { kind: LOCAL_VAULT_STATUS.LOCKED, mode: status.mode };
  }
}

export function transition_local_vault_status(
  status: LocalVaultStatus,
  event: LocalVaultEvent,
): LocalVaultStatus {
  switch (event.kind) {
    case LOCAL_VAULT_EVENT.RECORD_FOUND:
      return { kind: LOCAL_VAULT_STATUS.LOCKED, mode: event.mode };
    case LOCAL_VAULT_EVENT.RECORD_MISSING:
      return { kind: LOCAL_VAULT_STATUS.NO_VAULT };
    case LOCAL_VAULT_EVENT.KEY_REMEMBERED:
      return unlock_status(status);
    case LOCAL_VAULT_EVENT.KEY_FORGOTTEN:
      return lock_status(status);
  }
}

function describe_record_event(
  record: Option<LocalVaultRecord>,
): LocalVaultEvent {
  return record.status === OptionStatus.SOME
    ? { kind: LOCAL_VAULT_EVENT.RECORD_FOUND, mode: record.value.unlock.mode }
    : { kind: LOCAL_VAULT_EVENT.RECORD_MISSING };
}

function describe_key_event(data_key: Option<Uint8Array>): LocalVaultEvent {
  return data_key.status === OptionStatus.SOME
    ? { kind: LOCAL_VAULT_EVENT.KEY_REMEMBERED }
    : { kind: LOCAL_VAULT_EVENT.KEY_FORGOTTEN };
}

export function resolve_local_vault_status(
  record: Option<LocalVaultRecord>,
  data_key: Option<Uint8Array>,
): LocalVaultStatus {
  return [describe_record_event(record), describe_key_event(data_key)].reduce(
    transition_local_vault_status,
    INITIAL_LOCAL_VAULT_STATUS,
  );
}
