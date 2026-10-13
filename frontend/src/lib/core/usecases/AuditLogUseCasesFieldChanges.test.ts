import { describe, expect, it } from "vitest";

import { compute_field_changes } from "../entities/AuditLog";

describe("compute_field_changes", () => {
  it("should detect changed fields", () => {
    const old_entity = { name: "John", age: 25, status: "active" };
    const new_entity = { name: "Jane", age: 25, status: "inactive" };

    const changes = compute_field_changes(old_entity, new_entity, [
      "name",
      "age",
      "status",
    ]);

    expect(changes.length).toBe(2);
    expect(changes[0]).toEqual({
      field_name: "name",
      old_value: "John",
      new_value: "Jane",
    });
    expect(changes[1]).toEqual({
      field_name: "status",
      old_value: "active",
      new_value: "inactive",
    });
  });

  it("should return empty array when no changes", () => {
    const old_entity = { name: "John", age: 25 };
    const new_entity = { name: "John", age: 25 };

    const changes = compute_field_changes(old_entity, new_entity, [
      "name",
      "age",
    ]);

    expect(changes.length).toBe(0);
  });

  it("should handle null and undefined values", () => {
    const old_entity = {
      name: JSON.parse("null") as unknown,
    } as Record<string, unknown>;
    const new_entity = {
      name: "John",
      email: "john@example.com",
    } as Record<string, unknown>;

    const changes = compute_field_changes(old_entity, new_entity, [
      "name",
      "email",
    ]);

    expect(changes.length).toBe(2);
    expect(changes[0].old_value).toBe("");
    expect(changes[0].new_value).toBe("John");
  });

  it("should serialize objects to JSON", () => {
    const old_entity = { data: { nested: "value" } };
    const new_entity = { data: { nested: "changed" } };

    const changes = compute_field_changes(old_entity, new_entity, ["data"]);

    expect(changes.length).toBe(1);
    expect(changes[0].old_value).toBe('{"nested":"value"}');
    expect(changes[0].new_value).toBe('{"nested":"changed"}');
  });
});
