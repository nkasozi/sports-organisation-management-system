import { describe, expect, it } from "vitest";

import { has_meaningful_changes } from "./syncHelpers.test_support";

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

  it("handles missing and undefined as equal", () => {
    const local = { optional_field: JSON.parse("null") };
    const remote = {};

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
