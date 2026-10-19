import { describe, expect, it } from "vitest";

import { create_none_option, create_some_option } from "$lib/core/types/Option";

import {
  LOCAL_VAULT_MODE,
  LOCAL_VAULT_RECORD_ID,
  LOCAL_VAULT_STATUS,
  type LocalVaultRecord,
} from "./localVaultContracts";
import {
  LOCAL_VAULT_EVENT,
  resolve_local_vault_status,
  transition_local_vault_status,
} from "./localVaultStatusMachine";

const PIN_RECORD: LocalVaultRecord = {
  id: LOCAL_VAULT_RECORD_ID,
  wrapped_data_key: new Uint8Array(),
  wrap_iv: new Uint8Array(),
  unlock: {
    mode: LOCAL_VAULT_MODE.PIN,
    pin_salt: new Uint8Array(),
    pin_iterations: 1,
  },
  created_at: "2026-10-19T00:00:00.000Z",
};

describe("local vault status machine", () => {
  it("has no vault when no record is stored, even with a key in memory", () => {
    expect(
      resolve_local_vault_status(
        create_none_option(),
        create_some_option(new Uint8Array(32)),
      ),
    ).toEqual({ kind: LOCAL_VAULT_STATUS.NO_VAULT });
  });

  it("is locked in the record's mode when no key is in memory", () => {
    expect(
      resolve_local_vault_status(
        create_some_option(PIN_RECORD),
        create_none_option(),
      ),
    ).toEqual({ kind: LOCAL_VAULT_STATUS.LOCKED, mode: LOCAL_VAULT_MODE.PIN });
  });

  it("is unlocked in the record's mode when a key is in memory", () => {
    expect(
      resolve_local_vault_status(
        create_some_option(PIN_RECORD),
        create_some_option(new Uint8Array(32)),
      ),
    ).toEqual({
      kind: LOCAL_VAULT_STATUS.UNLOCKED,
      mode: LOCAL_VAULT_MODE.PIN,
    });
  });

  it("locks an unlocked vault when the key is forgotten", () => {
    expect(
      transition_local_vault_status(
        { kind: LOCAL_VAULT_STATUS.UNLOCKED, mode: LOCAL_VAULT_MODE.PASSKEY },
        { kind: LOCAL_VAULT_EVENT.KEY_FORGOTTEN },
      ),
    ).toEqual({
      kind: LOCAL_VAULT_STATUS.LOCKED,
      mode: LOCAL_VAULT_MODE.PASSKEY,
    });
  });

  it("drops to no vault when the record disappears", () => {
    expect(
      transition_local_vault_status(
        { kind: LOCAL_VAULT_STATUS.UNLOCKED, mode: LOCAL_VAULT_MODE.DEVICE },
        { kind: LOCAL_VAULT_EVENT.RECORD_MISSING },
      ),
    ).toEqual({ kind: LOCAL_VAULT_STATUS.NO_VAULT });
  });
});
