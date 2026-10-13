import { describe, expect, it, vi } from "vitest";

import {
  create_persistent_storage_requester,
  type PersistentStorageManagerAccess,
} from "./storageBackupPersistence";

function create_supported_access(
  persisted_value: boolean,
  persist: () => Promise<boolean>,
): () => PersistentStorageManagerAccess {
  return () => ({
    status: "supported",
    storage_manager: {
      persisted: async () => persisted_value,
      persist,
    },
  });
}

describe("create_persistent_storage_requester", () => {
  it("reports unsupported when the browser has no persistent storage API", async () => {
    const requester = create_persistent_storage_requester(() => ({
      status: "unsupported",
    }));

    expect(await requester.request_once()).toEqual({ status: "unsupported" });
  });

  it("does not ask again when storage is already persisted", async () => {
    const persist = vi.fn(async () => true);
    const requester = create_persistent_storage_requester(
      create_supported_access(true, persist),
    );

    expect(await requester.request_once()).toEqual({
      status: "already_persisted",
    });
    expect(persist).not.toHaveBeenCalled();
  });

  it("reports granted and denied outcomes", async () => {
    expect(
      await create_persistent_storage_requester(
        create_supported_access(false, async () => true),
      ).request_once(),
    ).toEqual({ status: "granted" });
    expect(
      await create_persistent_storage_requester(
        create_supported_access(false, async () => false),
      ).request_once(),
    ).toEqual({ status: "denied" });
  });

  it("reports failures from the storage manager", async () => {
    const requester = create_persistent_storage_requester(
      create_supported_access(false, () =>
        Promise.reject(new Error("Not allowed")),
      ),
    );

    expect(await requester.request_once()).toEqual({
      status: "failed",
      error: "Error: Not allowed",
    });
  });

  it("requests persistence only once per requester", async () => {
    const persist = vi.fn(async () => true);
    const requester = create_persistent_storage_requester(
      create_supported_access(false, persist),
    );

    const first_state = await requester.request_once();
    const second_state = await requester.request_once();

    expect(first_state).toEqual({ status: "granted" });
    expect(second_state).toEqual({ status: "granted" });
    expect(persist).toHaveBeenCalledOnce();
  });
});
