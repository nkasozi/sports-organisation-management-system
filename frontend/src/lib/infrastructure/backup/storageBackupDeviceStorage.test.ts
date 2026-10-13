import { describe, expect, it, vi } from "vitest";

import {
  create_device_backup_storage_port,
  DEVICE_BACKUP_FILE_NAME,
  type DeviceBackupDirectoryAccess,
} from "./storageBackupDeviceStorage";
import { STORAGE_BACKUP_USER_MESSAGES } from "./storageBackupMessages";

function create_supported_access(
  directory: Partial<FileSystemDirectoryHandle>,
): () => DeviceBackupDirectoryAccess {
  return () => ({
    status: "supported",
    get_directory: async () => directory as FileSystemDirectoryHandle,
  });
}

const unsupported_access = (): DeviceBackupDirectoryAccess => ({
  status: "unsupported",
});

describe("create_device_backup_storage_port", () => {
  it("reports capability from directory access", () => {
    expect(
      create_device_backup_storage_port(unsupported_access).get_capability(),
    ).toEqual({ status: "unsupported" });
    expect(
      create_device_backup_storage_port(
        create_supported_access({}),
      ).get_capability(),
    ).toEqual({ status: "supported" });
  });

  it("deletes the device backup file", async () => {
    const remove_entry = vi.fn(async () => {});
    const port = create_device_backup_storage_port(
      create_supported_access({ removeEntry: remove_entry }),
    );

    expect(await port.delete_backup()).toEqual({ status: "deleted" });
    expect(remove_entry).toHaveBeenCalledWith(DEVICE_BACKUP_FILE_NAME);
  });

  it("treats a missing device backup file as already deleted", async () => {
    const port = create_device_backup_storage_port(
      create_supported_access({
        removeEntry: () =>
          Promise.reject(new DOMException("missing", "NotFoundError")),
      }),
    );

    expect(await port.delete_backup()).toEqual({ status: "already_missing" });
  });

  it("reports delete failures", async () => {
    const port = create_device_backup_storage_port(
      create_supported_access({
        removeEntry: () =>
          Promise.reject(
            new DOMException("locked", "NoModificationAllowedError"),
          ),
      }),
    );

    const delete_state = await port.delete_backup();

    expect(delete_state).toEqual({
      status: "failed",
      error: STORAGE_BACKUP_USER_MESSAGES.DEVICE_BACKUP_DELETE_FAILED,
    });
  });

  it("reports read failures with a user-safe message", async () => {
    const port = create_device_backup_storage_port(
      create_supported_access({
        getFileHandle: () => Promise.reject(new Error("disk exploded at 0x1")),
      }),
    );

    expect(await port.read_backup_json()).toEqual({
      status: "failed",
      error: STORAGE_BACKUP_USER_MESSAGES.DEVICE_BACKUP_READ_FAILED,
    });
  });

  it("reports write failures with a user-safe message", async () => {
    const port = create_device_backup_storage_port(
      create_supported_access({
        getFileHandle: () => Promise.reject(new Error("quota exceeded")),
      }),
    );

    const write_result = await port.write_backup_json("{}");

    expect(write_result.success).toBe(false);
    expect(write_result.success ? "" : write_result.error).toBe(
      STORAGE_BACKUP_USER_MESSAGES.DEVICE_BACKUP_WRITE_FAILED,
    );
  });

  it("reports unsupported deletes", async () => {
    expect(
      await create_device_backup_storage_port(
        unsupported_access,
      ).delete_backup(),
    ).toEqual({ status: "unsupported" });
  });

  it("reads a missing backup as missing", async () => {
    const port = create_device_backup_storage_port(
      create_supported_access({
        getFileHandle: () =>
          Promise.reject(new DOMException("missing", "NotFoundError")),
      }),
    );

    expect(await port.read_backup_json()).toEqual({ status: "missing" });
  });
});
