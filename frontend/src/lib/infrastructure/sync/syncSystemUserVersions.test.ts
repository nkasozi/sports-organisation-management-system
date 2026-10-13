import { beforeEach, describe, expect, it, vi } from "vitest";

import { create_fake_sync_database } from "./syncFakeDatabase.test_support";
import { write_convex_user_to_local_dexie } from "./syncSystemUserOps";

const mock_sync_data_access = vi.hoisted(() => ({ get_database: vi.fn() }));

vi.mock("./syncDataAccess", () => ({
  get_database: mock_sync_data_access.get_database,
}));

const CONVEX_USER = {
  local_id: "usr_1",
  email: "User@Example.test",
  role: "org_admin",
};

describe("write_convex_user_to_local_dexie server versions", () => {
  let fake = create_fake_sync_database();

  beforeEach(() => {
    fake = create_fake_sync_database();
    mock_sync_data_access.get_database.mockReturnValue(fake.database);
  });

  it("records the server version so a later delete has a known base", async () => {
    await write_convex_user_to_local_dexie({ ...CONVEX_USER, version: 7 });

    expect(fake.rows("sync_record_versions")).toEqual([
      {
        table_name: "system_users",
        local_id: "usr_1",
        server_version: 7,
        record_state: "live",
      },
    ]);
  });

  it("records no version when the snapshot does not carry one", async () => {
    await write_convex_user_to_local_dexie(CONVEX_USER);

    expect(fake.rows("sync_record_versions")).toEqual([]);
    expect(fake.rows("system_users")).toHaveLength(1);
  });
});
