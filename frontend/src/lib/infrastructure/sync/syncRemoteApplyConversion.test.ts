import { describe, expect, it } from "vitest";

import {
  convert_server_record_to_remote_change,
  convert_tombstone_to_remote_deletion,
} from "./syncRemoteApply";

describe("convert_server_record_to_remote_change", () => {
  it("strips server bookkeeping and keys the record by its local id", () => {
    expect(
      convert_server_record_to_remote_change({
        _id: "convex_id",
        _creationTime: 1,
        local_id: "team_a",
        synced_at: "2024-01-01T00:00:00.000Z",
        version: 4,
        sync_sequence: 9,
        name: "Lions",
      }),
    ).toEqual({
      local_id: "team_a",
      server_version: 4,
      server_sequence: 9,
      local_data: { id: "team_a", name: "Lions" },
    });
  });
});

describe("convert_tombstone_to_remote_deletion", () => {
  it("keeps the server sequence so later re-creations can be ordered", () => {
    expect(
      convert_tombstone_to_remote_deletion({
        local_id: "team_a",
        version: 4,
        sync_sequence: 11,
      }),
    ).toEqual({ local_id: "team_a", server_version: 4, server_sequence: 11 });
  });

  it("records an unknown sequence when the server omits it", () => {
    expect(
      convert_tombstone_to_remote_deletion({ local_id: "team_a", version: 4 }),
    ).toEqual({ local_id: "team_a", server_version: 4, server_sequence: 0 });
  });
});
