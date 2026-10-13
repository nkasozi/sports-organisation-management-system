import { describe, expect, it } from "vitest";

import { create_none_option, create_some_option } from "./option";
import { BaseVersionKind } from "./sync_versioning";
import {
  decide_versioned_delete,
  VersionedDeleteKind,
} from "./sync_versioning_delete";

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

describe("decide_versioned_delete", () => {
  it("is idempotent when the record is already gone", () => {
    expect(
      decide_versioned_delete({
        existing_record: create_none_option(),
        base_version: KNOWN_BASE_SEVEN,
      }),
    ).toEqual({ kind: VersionedDeleteKind.ALREADY_ABSENT });
  });

  it("deletes when the base version matches", () => {
    expect(
      decide_versioned_delete({
        existing_record: create_some_option(EXISTING_RECORD),
        base_version: KNOWN_BASE_SEVEN,
      }),
    ).toEqual({ kind: VersionedDeleteKind.DELETE, tombstone_version: 8 });
  });

  it("refuses to delete over a newer remote update", () => {
    expect(
      decide_versioned_delete({
        existing_record: create_some_option(EXISTING_RECORD),
        base_version: KNOWN_BASE_SIX,
      }),
    ).toEqual({ kind: VersionedDeleteKind.CONFLICT, current_version: 7 });
  });

  it("refuses an unknown-base delete over a record that carries a server version", () => {
    expect(
      decide_versioned_delete({
        existing_record: create_some_option(EXISTING_RECORD),
        base_version: UNKNOWN_BASE,
      }),
    ).toEqual({ kind: VersionedDeleteKind.CONFLICT, current_version: 7 });
  });

  it("deletes an unversioned record for an unknown base", () => {
    expect(
      decide_versioned_delete({
        existing_record: create_some_option({ local_id: "team_a" }),
        base_version: UNKNOWN_BASE,
      }),
    ).toEqual({ kind: VersionedDeleteKind.DELETE, tombstone_version: 1 });
  });

  it("keeps unconditional deletes for legacy callers without a base version", () => {
    expect(
      decide_versioned_delete({
        existing_record: create_some_option(EXISTING_RECORD),
        base_version: create_none_option(),
      }).kind,
    ).toBe(VersionedDeleteKind.DELETE);
  });
});
