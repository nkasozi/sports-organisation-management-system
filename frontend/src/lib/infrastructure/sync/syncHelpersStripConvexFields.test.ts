import { describe, expect, it } from "vitest";

import { strip_convex_fields } from "./syncHelpers.test_support";

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
