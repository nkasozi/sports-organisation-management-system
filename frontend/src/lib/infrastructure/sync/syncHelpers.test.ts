import { describe, expect, it } from "vitest";

function has_meaningful_changes(
  local_data: Record<string, unknown>,
  remote_data: Record<string, unknown>,
): boolean {
  const excluded_fields = new Set([
    "id",
    "local_id",
    "_id",
    "_creationTime",
    "created_at",
    "updated_at",
    "synced_at",
    "version",
  ]);

  for (const key of Object.keys(local_data)) {
    if (excluded_fields.has(key)) continue;

    const local_value = local_data[key];
    const remote_value = remote_data[key];

    if (!values_equal(local_value, remote_value)) {
      return true;
    }
  }
  return false;
}

function values_equal(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null && b === undefined) return true;
  if (a === undefined && b === null) return true;
  if (typeof a !== typeof b) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((val, idx) => values_equal(val, b[idx]));
  }

  if (typeof a === "object" && a !== null && b !== null) {
    const a_obj = a as Record<string, unknown>;
    const b_obj = b as Record<string, unknown>;
    const a_keys = Object.keys(a_obj);
    const b_keys = Object.keys(b_obj);
    if (a_keys.length !== b_keys.length) return false;
    return a_keys.every((key) => values_equal(a_obj[key], b_obj[key]));
  }

  return false;
}

function strip_convex_fields(
  record: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    if (key !== "_id" && key !== "_creationTime") {
      result[key] = value;
    }
  }
  return result;
}

describe("values_equal", () => {
  it("returns true for identical primitives", () => {
    expect(values_equal("hello", "hello")).toBe(true);
    expect(values_equal(42, 42)).toBe(true);
    expect(values_equal(true, true)).toBe(true);
  });

  it("returns false for different primitives", () => {
    expect(values_equal("hello", "world")).toBe(false);
    expect(values_equal(42, 43)).toBe(false);
    expect(values_equal(true, false)).toBe(false);
  });

  it("treats null and undefined as equal", () => {
    expect(values_equal(null, undefined)).toBe(true);
    expect(values_equal(undefined, null)).toBe(true);
  });

  it("returns true for identical null values", () => {
    expect(values_equal(null, null)).toBe(true);
  });

  it("returns true for identical undefined values", () => {
    expect(values_equal(undefined, undefined)).toBe(true);
  });

  it("returns false for different primitive types", () => {
    expect(values_equal("42", 42)).toBe(false);
    expect(values_equal(true, "true")).toBe(false);
  });

  it("treats empty array and empty object as equal in current implementation", () => {
    expect(values_equal([], {})).toBe(true);
  });

  it("returns true for identical arrays", () => {
    expect(values_equal([1, 2, 3], [1, 2, 3])).toBe(true);
    expect(values_equal(["a", "b"], ["a", "b"])).toBe(true);
    expect(values_equal([], [])).toBe(true);
  });

  it("returns false for arrays with different elements", () => {
    expect(values_equal([1, 2, 3], [1, 2, 4])).toBe(false);
    expect(values_equal(["a", "b"], ["a", "c"])).toBe(false);
  });

  it("returns false for arrays with different lengths", () => {
    expect(values_equal([1, 2], [1, 2, 3])).toBe(false);
    expect(values_equal([1, 2, 3], [1, 2])).toBe(false);
  });

  it("returns true for identical nested arrays", () => {
    expect(values_equal([[1, 2], [3, 4]], [[1, 2], [3, 4]])).toBe(true);
  });

  it("returns false for different nested arrays", () => {
    expect(values_equal([[1, 2], [3, 4]], [[1, 2], [3, 5]])).toBe(false);
  });

  it("returns true for identical objects", () => {
    expect(values_equal({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
    expect(values_equal({}, {})).toBe(true);
  });

  it("returns false for objects with different values", () => {
    expect(values_equal({ a: 1 }, { a: 2 })).toBe(false);
  });

  it("returns false for objects with different keys", () => {
    expect(values_equal({ a: 1 }, { b: 1 })).toBe(false);
    expect(values_equal({ a: 1, b: 2 }, { a: 1 })).toBe(false);
  });

  it("returns true for identical nested objects", () => {
    expect(
      values_equal(
        { outer: { inner: "value" } },
        { outer: { inner: "value" } },
      ),
    ).toBe(true);
  });

  it("returns false for different nested objects", () => {
    expect(
      values_equal(
        { outer: { inner: "value1" } },
        { outer: { inner: "value2" } },
      ),
    ).toBe(false);
  });

  it("handles mixed nested structures", () => {
    const obj1 = { arr: [1, 2], nested: { key: "val" } };
    const obj2 = { arr: [1, 2], nested: { key: "val" } };
    const obj3 = { arr: [1, 3], nested: { key: "val" } };

    expect(values_equal(obj1, obj2)).toBe(true);
    expect(values_equal(obj1, obj3)).toBe(false);
  });
});

describe("has_meaningful_changes", () => {
  it("returns false when data is identical", () => {
    const local = { name: "Team A", city: "Kampala" };
    const remote = { name: "Team A", city: "Kampala" };

    expect(has_meaningful_changes(local, remote)).toBe(false);
  });

  it("returns true when non-excluded field differs", () => {
    const local = { name: "Team A", city: "Kampala" };
    const remote = { name: "Team B", city: "Kampala" };

    expect(has_meaningful_changes(local, remote)).toBe(true);
  });

  it("ignores id field differences", () => {
    const local = { id: "123", name: "Team" };
    const remote = { id: "456", name: "Team" };

    expect(has_meaningful_changes(local, remote)).toBe(false);
  });

  it("ignores local_id field differences", () => {
    const local = { local_id: "local_123", name: "Team" };
    const remote = { local_id: "local_456", name: "Team" };

    expect(has_meaningful_changes(local, remote)).toBe(false);
  });

  it("ignores _id field differences", () => {
    const local = { _id: "convex_123", name: "Team" };
    const remote = { _id: "convex_456", name: "Team" };

    expect(has_meaningful_changes(local, remote)).toBe(false);
  });

  it("ignores _creationTime field differences", () => {
    const local = { _creationTime: 1000, name: "Team" };
    const remote = { _creationTime: 2000, name: "Team" };

    expect(has_meaningful_changes(local, remote)).toBe(false);
  });

  it("ignores created_at field differences", () => {
    const local = { created_at: "2024-01-01", name: "Team" };
    const remote = { created_at: "2024-02-01", name: "Team" };

    expect(has_meaningful_changes(local, remote)).toBe(false);
  });

  it("ignores updated_at field differences", () => {
    const local = { updated_at: "2024-01-01", name: "Team" };
    const remote = { updated_at: "2024-02-01", name: "Team" };

    expect(has_meaningful_changes(local, remote)).toBe(false);
  });

  it("ignores synced_at field differences", () => {
    const local = { synced_at: "2024-01-01", name: "Team" };
    const remote = { synced_at: "2024-02-01", name: "Team" };

    expect(has_meaningful_changes(local, remote)).toBe(false);
  });

  it("ignores version field differences", () => {
    const local = { version: 1, name: "Team" };
    const remote = { version: 5, name: "Team" };

    expect(has_meaningful_changes(local, remote)).toBe(false);
  });

  it("detects changes in nested objects", () => {
    const local = { metadata: { color: "red" } };
    const remote = { metadata: { color: "blue" } };

    expect(has_meaningful_changes(local, remote)).toBe(true);
  });

  it("detects changes in arrays", () => {
    const local = { tags: ["a", "b"] };
    const remote = { tags: ["a", "c"] };

    expect(has_meaningful_changes(local, remote)).toBe(true);
  });

  it("returns false for identical arrays", () => {
    const local = { tags: ["a", "b", "c"] };
    const remote = { tags: ["a", "b", "c"] };

    expect(has_meaningful_changes(local, remote)).toBe(false);
  });

  it("only checks fields present in local data", () => {
    const local = { name: "Team" };
    const remote = { name: "Team", extra_field: "value" };

    expect(has_meaningful_changes(local, remote)).toBe(false);
  });

  it("detects when local has field not in remote", () => {
    const local = { name: "Team", description: "A team" };
    const remote = { name: "Team" };

    expect(has_meaningful_changes(local, remote)).toBe(true);
  });

  it("handles null and undefined as equal", () => {
    const local = { optional_field: null };
    const remote = { optional_field: undefined };

    expect(has_meaningful_changes(local, remote)).toBe(false);
  });

  it("handles multiple excluded fields at once", () => {
    const local = {
      id: "1",
      local_id: "local_1",
      _id: "convex_1",
      created_at: "2024-01-01",
      updated_at: "2024-01-02",
      synced_at: "2024-01-03",
      version: 1,
      name: "Team",
    };
    const remote = {
      id: "2",
      local_id: "local_2",
      _id: "convex_2",
      created_at: "2024-02-01",
      updated_at: "2024-02-02",
      synced_at: "2024-02-03",
      version: 10,
      name: "Team",
    };

    expect(has_meaningful_changes(local, remote)).toBe(false);
  });
});

describe("strip_convex_fields", () => {
  it("removes _id field", () => {
    const record = { _id: "convex_123", name: "Team", city: "Kampala" };

    const result = strip_convex_fields(record);

    expect(result).not.toHaveProperty("_id");
    expect(result.name).toBe("Team");
    expect(result.city).toBe("Kampala");
  });

  it("removes _creationTime field", () => {
    const record = { _creationTime: 1234567890, name: "Team" };

    const result = strip_convex_fields(record);

    expect(result).not.toHaveProperty("_creationTime");
    expect(result.name).toBe("Team");
  });

  it("removes both _id and _creationTime", () => {
    const record = {
      _id: "convex_123",
      _creationTime: 1234567890,
      name: "Team",
    };

    const result = strip_convex_fields(record);

    expect(result).not.toHaveProperty("_id");
    expect(result).not.toHaveProperty("_creationTime");
    expect(result.name).toBe("Team");
  });

  it("preserves all other fields", () => {
    const record = {
      _id: "convex_123",
      id: "local_123",
      name: "Team",
      city: "Kampala",
      created_at: "2024-01-01",
      metadata: { color: "red" },
    };

    const result = strip_convex_fields(record);

    expect(result.id).toBe("local_123");
    expect(result.name).toBe("Team");
    expect(result.city).toBe("Kampala");
    expect(result.created_at).toBe("2024-01-01");
    expect(result.metadata).toEqual({ color: "red" });
  });

  it("handles empty object", () => {
    const result = strip_convex_fields({});

    expect(result).toEqual({});
  });

  it("handles object with only convex fields", () => {
    const record = { _id: "123", _creationTime: 456 };

    const result = strip_convex_fields(record);

    expect(result).toEqual({});
  });

  it("does not modify the original record", () => {
    const record = { _id: "123", name: "Team" };

    strip_convex_fields(record);

    expect(record._id).toBe("123");
    expect(record.name).toBe("Team");
  });
});

describe("Conflict detection scenarios", () => {
  it("scenario: same data different metadata - no conflict", () => {
    const local_record = {
      id: "team_1",
      local_id: "team_1",
      name: "Arsenal FC",
      city: "London",
      version: 5,
      updated_at: "2024-01-01T10:00:00Z",
    };
    const server_record = {
      _id: "convex_abc123",
      _creationTime: 1704067200000,
      id: "team_1",
      local_id: "team_1",
      name: "Arsenal FC",
      city: "London",
      version: 10,
      synced_at: "2024-01-01T12:00:00Z",
    };

    const stripped_server = strip_convex_fields(server_record);
    const has_changes = has_meaningful_changes(local_record, stripped_server);

    expect(has_changes).toBe(false);
  });

  it("scenario: different business data - conflict", () => {
    const local_record = {
      id: "team_1",
      name: "Arsenal FC",
      city: "North London",
    };
    const server_record = {
      _id: "convex_abc123",
      id: "team_1",
      name: "Arsenal FC",
      city: "London",
    };

    const stripped_server = strip_convex_fields(server_record);
    const has_changes = has_meaningful_changes(local_record, stripped_server);

    expect(has_changes).toBe(true);
  });

  it("scenario: local added new field - conflict", () => {
    const local_record = {
      id: "player_1",
      first_name: "John",
      last_name: "Doe",
      nickname: "Johnny",
    };
    const server_record = {
      _id: "convex_xyz",
      id: "player_1",
      first_name: "John",
      last_name: "Doe",
    };

    const stripped_server = strip_convex_fields(server_record);
    const has_changes = has_meaningful_changes(local_record, stripped_server);

    expect(has_changes).toBe(true);
  });

  it("scenario: complex nested structure identical - no conflict", () => {
    const local_record = {
      id: "comp_1",
      name: "Premier League",
      rules: {
        points_for_win: 3,
        points_for_draw: 1,
        tiebreakers: ["goal_difference", "goals_scored"],
      },
    };
    const server_record = {
      _id: "convex_comp",
      id: "comp_1",
      name: "Premier League",
      rules: {
        points_for_win: 3,
        points_for_draw: 1,
        tiebreakers: ["goal_difference", "goals_scored"],
      },
    };

    const stripped_server = strip_convex_fields(server_record);
    const has_changes = has_meaningful_changes(local_record, stripped_server);

    expect(has_changes).toBe(false);
  });

  it("scenario: nested array order different - conflict", () => {
    const local_record = {
      id: "comp_1",
      tiebreakers: ["goals_scored", "goal_difference"],
    };
    const server_record = {
      _id: "convex_comp",
      id: "comp_1",
      tiebreakers: ["goal_difference", "goals_scored"],
    };

    const stripped_server = strip_convex_fields(server_record);
    const has_changes = has_meaningful_changes(local_record, stripped_server);

    expect(has_changes).toBe(true);
  });
});
