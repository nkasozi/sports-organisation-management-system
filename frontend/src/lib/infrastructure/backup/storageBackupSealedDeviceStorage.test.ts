import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  create_none_option,
  create_some_option,
  type Option,
} from "$lib/core/types/Option";

import {
  open_local_json,
  seal_local_json,
} from "../localVault/localVaultCipher";
import type {
  DeviceBackupReadState,
  DeviceBackupStoragePort,
} from "./storageBackupContracts";
import { create_sealed_device_backup_storage_port } from "./storageBackupSealedDeviceStorage";

const DATA_KEY = new Uint8Array(32).fill(3);
const OTHER_DATA_KEY = new Uint8Array(32).fill(4);
const BACKUP_JSON = JSON.stringify({ teams: [{ id: "team_1" }] });

function create_memory_port(): DeviceBackupStoragePort & { stored: string[] } {
  const stored: string[] = [];
  return {
    stored,
    get_capability: () => ({ status: "supported" }),
    read_backup_json: async (): Promise<DeviceBackupReadState> =>
      stored.length === 0
        ? { status: "missing" }
        : { status: "available", serialized_backup: stored[0] },
    write_backup_json: async (serialized_backup: string) => {
      stored.splice(0, stored.length, serialized_backup);
      return { success: true, data: true };
    },
    delete_backup: async () => ({ status: "deleted" }),
  };
}

function create_port(
  inner: DeviceBackupStoragePort,
  read_key: () => Option<Uint8Array>,
): DeviceBackupStoragePort {
  return create_sealed_device_backup_storage_port(inner, {
    current_data_key: read_key,
    seal: seal_local_json,
    open: open_local_json,
  });
}

describe("create_sealed_device_backup_storage_port", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("writes an unreadable file and reads the original backup back", async () => {
    const inner = create_memory_port();
    const port = create_port(inner, () => create_some_option(DATA_KEY));

    const written = await port.write_backup_json(BACKUP_JSON);

    expect(written.success).toBe(true);
    expect(inner.stored[0]).not.toContain("team_1");
    await expect(port.read_backup_json()).resolves.toEqual({
      status: "available",
      serialized_backup: BACKUP_JSON,
    });
  });

  it("treats a backup sealed with another key as missing", async () => {
    const inner = create_memory_port();
    const written = await create_port(inner, () =>
      create_some_option(OTHER_DATA_KEY),
    ).write_backup_json(BACKUP_JSON);
    expect(written.success).toBe(true);

    const read_state = await create_port(inner, () =>
      create_some_option(DATA_KEY),
    ).read_backup_json();

    expect(read_state).toEqual({ status: "missing" });
    expect(console.warn).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ event: "device_backup_unreadable_ignored" }),
    );
  });

  it("treats an edited or plain-text backup as missing", async () => {
    const inner = create_memory_port();
    inner.stored.push(BACKUP_JSON);

    const read_state = await create_port(inner, () =>
      create_some_option(DATA_KEY),
    ).read_backup_json();

    expect(read_state).toEqual({ status: "missing" });
  });

  it("refuses to write a backup without a data key", async () => {
    const inner = create_memory_port();

    const result = await create_port(
      inner,
      create_none_option,
    ).write_backup_json(BACKUP_JSON);

    expect(result.success).toBe(false);
    expect(inner.stored).toEqual([]);
  });

  it("reports a read failure when no data key is available", async () => {
    const inner = create_memory_port();
    inner.stored.push("c2VhbGVk");

    const read_state = await create_port(
      inner,
      create_none_option,
    ).read_backup_json();

    expect(read_state.status).toBe("failed");
  });

  it("passes missing backups, capability and deletes straight through", async () => {
    const inner = create_memory_port();
    const port = create_port(inner, () => create_some_option(DATA_KEY));

    await expect(port.read_backup_json()).resolves.toEqual({
      status: "missing",
    });
    expect(port.get_capability()).toEqual({ status: "supported" });
    await expect(port.delete_backup()).resolves.toEqual({ status: "deleted" });
  });
});
