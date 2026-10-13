import { describe, expect, it } from "vitest";

import { build_conflict_changes } from "./conflictAuditService.test_support";

describe("build_conflict_changes", () => {
  it("builds field changes with local and remote prefixes", () => {
    const differences = [
      {
        field_name: "name",
        local_value: "Local Name",
        remote_value: "Remote Name",
        display_name: "Name",
      },
    ];

    const changes = build_conflict_changes(differences);

    expect(changes).toHaveLength(1);
    expect(changes[0].field_name).toBe("name");
    expect(changes[0].old_value).toBe("Local: Local Name");
    expect(changes[0].new_value).toBe("Remote: Remote Name");
  });

  it("handles multiple field differences", () => {
    const differences = [
      {
        field_name: "name",
        local_value: "A",
        remote_value: "B",
        display_name: "Name",
      },
      {
        field_name: "city",
        local_value: "X",
        remote_value: "Y",
        display_name: "City",
      },
    ];

    const changes = build_conflict_changes(differences);

    expect(changes).toHaveLength(2);
    expect(changes[0].field_name).toBe("name");
    expect(changes[1].field_name).toBe("city");
  });

  it("formats missing values in changes", () => {
    const differences = [
      {
        field_name: "optional",
        local_value: JSON.parse("null"),
        remote_value: "value",
        display_name: "Optional",
      },
    ];

    const changes = build_conflict_changes(differences);

    expect(changes[0].old_value).toBe("Local: null");
    expect(changes[0].new_value).toBe("Remote: value");
  });

  it("formats undefined values in changes", () => {
    const differences = [
      {
        field_name: "field",
        local_value: "value",
        remote_value: void 0,

        display_name: "Field",
      },
    ];

    const changes = build_conflict_changes(differences);

    expect(changes[0].old_value).toBe("Local: value");
    expect(changes[0].new_value).toBe("Remote: undefined");
  });

  it("formats object values in changes", () => {
    const differences = [
      {
        field_name: "metadata",
        local_value: { color: "red" },
        remote_value: { color: "blue" },
        display_name: "Metadata",
      },
    ];

    const changes = build_conflict_changes(differences);

    expect(changes[0].old_value).toBe('Local: {"color":"red"}');
    expect(changes[0].new_value).toBe('Remote: {"color":"blue"}');
  });

  it("returns empty array for no differences", () => {
    const changes = build_conflict_changes([]);

    expect(changes).toEqual([]);
  });
});
