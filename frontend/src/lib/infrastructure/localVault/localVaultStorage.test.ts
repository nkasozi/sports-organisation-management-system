import Dexie from "dexie";
import { IDBKeyRange, indexedDB } from "fake-indexeddb";
import { describe, expect, it } from "vitest";

import { OptionStatus } from "$lib/core/types/Option";

import {
  LOCAL_VAULT_MODE,
  LOCAL_VAULT_RECORD_ID,
  type LocalVaultRecord,
} from "./localVaultContracts";
import {
  create_local_vault_database,
  LOCAL_VAULT_DATABASE_NAME,
} from "./localVaultDatabase";
import { create_local_vault_storage } from "./localVaultStorage";

Dexie.dependencies.indexedDB = indexedDB;
Dexie.dependencies.IDBKeyRange = IDBKeyRange;

function create_test_storage(): ReturnType<typeof create_local_vault_storage> {
  const database = create_local_vault_database(
    `vault_test_${crypto.randomUUID()}`,
  );
  return create_local_vault_storage(database);
}

async function create_device_record(): Promise<LocalVaultRecord> {
  const wrapping_key = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
  return {
    id: LOCAL_VAULT_RECORD_ID,
    wrapped_data_key: new Uint8Array([1, 2, 3]),
    wrap_iv: new Uint8Array([4, 5, 6]),
    unlock: { mode: LOCAL_VAULT_MODE.DEVICE, wrapping_key },
    created_at: "2026-10-19T00:00:00.000Z",
  };
}

describe("local vault storage", () => {
  it("uses a database separate from the app data database", () => {
    expect(LOCAL_VAULT_DATABASE_NAME).toBe("SportSyncVault");
  });

  it("reads nothing when no vault has been saved", async () => {
    const storage = create_test_storage();

    const read_result = await storage.read_record();

    expect(read_result).toEqual({
      success: true,
      data: { status: OptionStatus.NONE },
    });
  });

  it("keeps a saved record including its non-extractable device key", async () => {
    const storage = create_test_storage();
    const record = await create_device_record();

    const save_result = await storage.save_record(record);
    const read_result = await storage.read_record();

    expect(save_result.success).toBe(true);
    if (!read_result.success || read_result.data.status !== OptionStatus.SOME)
      return expect.unreachable("record should be stored");
    const stored = read_result.data.value;
    expect(stored.wrapped_data_key).toEqual(record.wrapped_data_key);
    expect(stored.unlock.mode).toBe(LOCAL_VAULT_MODE.DEVICE);
    if (stored.unlock.mode !== LOCAL_VAULT_MODE.DEVICE)
      return expect.unreachable("mode should be device");
    expect(stored.unlock.wrapping_key.extractable).toBe(false);
  });

  it("replaces the previous record when saving again", async () => {
    const storage = create_test_storage();
    const first_record = await create_device_record();
    const second_record = {
      ...(await create_device_record()),
      wrapped_data_key: new Uint8Array([9, 9]),
    };

    const first_save = await storage.save_record(first_record);
    const second_save = await storage.save_record(second_record);
    const read_result = await storage.read_record();

    if (!read_result.success || read_result.data.status !== OptionStatus.SOME)
      return expect.unreachable("record should be stored");
    expect(first_save.success && second_save.success).toBe(true);
    expect(read_result.data.value.wrapped_data_key).toEqual(
      new Uint8Array([9, 9]),
    );
  });

  it("deletes the saved record", async () => {
    const storage = create_test_storage();
    const save_result = await storage.save_record(await create_device_record());
    expect(save_result.success).toBe(true);

    const delete_result = await storage.delete_record();
    const read_result = await storage.read_record();

    expect(delete_result).toEqual({ success: true, data: true });
    expect(read_result).toEqual({
      success: true,
      data: { status: OptionStatus.NONE },
    });
  });

  it("returns a failure when the database cannot be opened", async () => {
    const database = create_local_vault_database(`vault_test_closed`);
    database.close({ disableAutoOpen: true });
    const storage = create_local_vault_storage(database);

    const read_result = await storage.read_record();

    expect(read_result.success).toBe(false);
  });
});
