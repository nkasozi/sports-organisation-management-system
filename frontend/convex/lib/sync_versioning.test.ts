import { describe, expect, it } from "vitest";

import { create_none_option, create_some_option } from "./option";
import {
  BaseVersionKind,
  decide_versioned_upsert,
  type RemoteDeletion,
  VersionedUpsertKind,
} from "./sync_versioning";

const EXISTING_RECORD = { local_id: "team_a", name: "Lions", version: 7 };
const KNOWN_BASE_SEVEN = create_some_option({
  kind: BaseVersionKind.KNOWN,
  version: 7,
});
const KNOWN_BASE_SIX = create_some_option({
  kind: BaseVersionKind.KNOWN,
  version: 6,
});
const UNKNOWN_BASE = create_some_option({ kind: BaseVersionKind.UNKNOWN });
const REMOTE_DELETION: RemoteDeletion = {
  version: 9,
  deleted_at: "2024-01-01T00:00:00.000Z",
};
const RECREATE_BASE = create_some_option({ kind: BaseVersionKind.RECREATE });

describe("decide_versioned_upsert", () => {
  it("inserts a brand new record at version one", () => {
    expect(
      decide_versioned_upsert({
        existing_record: create_none_option(),
        remote_deletion: create_none_option(),
        base_version: UNKNOWN_BASE,
        incoming_data: { name: "Lions" },
        legacy_incoming_version: 1,
      }),
    ).toEqual({ kind: VersionedUpsertKind.INSERT, next_version: 1 });
  });

  it("re-creates a tombstoned record above the tombstone version only on explicit re-create", () => {
    expect(
      decide_versioned_upsert({
        existing_record: create_none_option(),
        remote_deletion: create_some_option(REMOTE_DELETION),
        base_version: RECREATE_BASE,
        incoming_data: { name: "Lions" },
        legacy_incoming_version: 1,
      }),
    ).toEqual({ kind: VersionedUpsertKind.INSERT, next_version: 10 });
  });

  it.each([
    ["known", KNOWN_BASE_SIX],
    ["unknown", UNKNOWN_BASE],
    ["legacy", create_none_option<never>()],
  ])(
    "reports deleted remotely instead of resurrecting for a %s base",
    (_label, base_version) => {
      expect(
        decide_versioned_upsert({
          existing_record: create_none_option(),
          remote_deletion: create_some_option(REMOTE_DELETION),
          base_version,
          incoming_data: { name: "Lions" },
          legacy_incoming_version: 1,
        }),
      ).toEqual({
        kind: VersionedUpsertKind.DELETED_REMOTELY,
        remote_deletion: REMOTE_DELETION,
      });
    },
  );

  it("treats an explicit re-create over a live record like an unknown base", () => {
    expect(
      decide_versioned_upsert({
        existing_record: create_some_option(EXISTING_RECORD),
        remote_deletion: create_none_option(),
        base_version: RECREATE_BASE,
        incoming_data: { name: "Tigers" },
        legacy_incoming_version: 1,
      }),
    ).toEqual({ kind: VersionedUpsertKind.CONFLICT, current_version: 7 });
  });

  it("updates when the base version matches the stored version", () => {
    expect(
      decide_versioned_upsert({
        existing_record: create_some_option(EXISTING_RECORD),
        remote_deletion: create_none_option(),
        base_version: KNOWN_BASE_SEVEN,
        incoming_data: { name: "Tigers" },
        legacy_incoming_version: 1,
      }),
    ).toEqual({ kind: VersionedUpsertKind.UPDATE, next_version: 8 });
  });

  it("reports unchanged when the incoming data matches the stored data", () => {
    expect(
      decide_versioned_upsert({
        existing_record: create_some_option(EXISTING_RECORD),
        remote_deletion: create_none_option(),
        base_version: KNOWN_BASE_SIX,
        incoming_data: { name: "Lions" },
        legacy_incoming_version: 1,
      }),
    ).toEqual({ kind: VersionedUpsertKind.UNCHANGED, current_version: 7 });
  });

  it("reports a conflict when the base version is stale and data differs", () => {
    expect(
      decide_versioned_upsert({
        existing_record: create_some_option(EXISTING_RECORD),
        remote_deletion: create_none_option(),
        base_version: KNOWN_BASE_SIX,
        incoming_data: { name: "Tigers" },
        legacy_incoming_version: 1,
      }),
    ).toEqual({ kind: VersionedUpsertKind.CONFLICT, current_version: 7 });
  });

  it("reports a conflict for an unknown base when data differs", () => {
    expect(
      decide_versioned_upsert({
        existing_record: create_some_option(EXISTING_RECORD),
        remote_deletion: create_none_option(),
        base_version: UNKNOWN_BASE,
        incoming_data: { name: "Tigers" },
        legacy_incoming_version: 1,
      }).kind,
    ).toBe(VersionedUpsertKind.CONFLICT);
  });

  it("treats a legacy client version as the base version it edited", () => {
    const legacy_command = {
      existing_record: create_some_option(EXISTING_RECORD),
      remote_deletion: create_none_option<RemoteDeletion>(),
      base_version: create_none_option<never>(),
      incoming_data: { name: "Tigers" },
    };
    expect(
      decide_versioned_upsert({
        ...legacy_command,
        legacy_incoming_version: 7,
      }),
    ).toEqual({ kind: VersionedUpsertKind.UPDATE, next_version: 8 });
    expect(
      decide_versioned_upsert({
        ...legacy_command,
        legacy_incoming_version: 8,
      }),
    ).toEqual({ kind: VersionedUpsertKind.CONFLICT, current_version: 7 });
    expect(
      decide_versioned_upsert({
        ...legacy_command,
        legacy_incoming_version: 1_000_000_000,
      }),
    ).toEqual({ kind: VersionedUpsertKind.CONFLICT, current_version: 7 });
  });
});
