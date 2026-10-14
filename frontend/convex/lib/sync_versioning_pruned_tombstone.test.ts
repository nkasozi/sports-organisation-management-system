import { describe, expect, it } from "vitest";

import { create_none_option, create_some_option } from "./option";
import {
  BaseVersionKind,
  decide_versioned_upsert,
  PRUNED_DELETION_TIMESTAMP,
  VersionedUpsertKind,
} from "./sync_versioning";

const INCOMING_DATA = { name: "Lions" };

function decide_for_absent_record(
  base_version: Parameters<typeof decide_versioned_upsert>[0]["base_version"],
): ReturnType<typeof decide_versioned_upsert> {
  return decide_versioned_upsert({
    existing_record: create_none_option(),
    remote_deletion: create_none_option(),
    base_version,
    incoming_data: INCOMING_DATA,
    legacy_incoming_version: 1,
  });
}

describe("decide_versioned_upsert after tombstone pruning", () => {
  it("reports a remote deletion when a known server version has no row and no tombstone", () => {
    expect(
      decide_for_absent_record(
        create_some_option({ kind: BaseVersionKind.KNOWN, version: 6 }),
      ),
    ).toEqual({
      kind: VersionedUpsertKind.DELETED_REMOTELY,
      remote_deletion: { version: 6, deleted_at: PRUNED_DELETION_TIMESTAMP },
    });
  });

  it("still inserts when the known base version is zero", () => {
    expect(
      decide_for_absent_record(
        create_some_option({ kind: BaseVersionKind.KNOWN, version: 0 }),
      ),
    ).toEqual({ kind: VersionedUpsertKind.INSERT, next_version: 1 });
  });

  it("still inserts records from legacy clients without a base version", () => {
    expect(decide_for_absent_record(create_none_option())).toEqual({
      kind: VersionedUpsertKind.INSERT,
      next_version: 1,
    });
  });

  it("re-creates the record when the client explicitly asks to re-create it", () => {
    expect(
      decide_for_absent_record(
        create_some_option({ kind: BaseVersionKind.RECREATE }),
      ),
    ).toEqual({ kind: VersionedUpsertKind.INSERT, next_version: 1 });
  });
});
