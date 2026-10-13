import { describe, expect, it } from "vitest";

import { compute_field_differences } from "./conflictTypes";

describe("compute_field_differences", () => {
  it("returns empty array when local and remote data are identical", () => {
    const local_data = { name: "Team A", city: "Kampala" };
    const remote_data = { name: "Team A", city: "Kampala" };

    const differences = compute_field_differences(local_data, remote_data);

    expect(differences).toEqual([]);
  });

  it("detects string value differences", () => {
    const local_data = { name: "Team A", city: "Kampala" };
    const remote_data = { name: "Team B", city: "Kampala" };

    const differences = compute_field_differences(local_data, remote_data);

    expect(differences).toHaveLength(1);
    expect(differences[0].field_name).toBe("name");
    expect(differences[0].local_value).toBe("Team A");
    expect(differences[0].remote_value).toBe("Team B");
    expect(differences[0].display_name).toBe("Name");
  });

  it("detects number value differences", () => {
    const local_data = { score: 10, name: "Team" };
    const remote_data = { score: 20, name: "Team" };

    const differences = compute_field_differences(local_data, remote_data);

    expect(differences).toHaveLength(1);
    expect(differences[0].field_name).toBe("score");
    expect(differences[0].local_value).toBe(10);
    expect(differences[0].remote_value).toBe(20);
  });

  it("detects boolean value differences", () => {
    const local_data = { is_active: true };
    const remote_data = { is_active: false };

    const differences = compute_field_differences(local_data, remote_data);

    expect(differences).toHaveLength(1);
    expect(differences[0].field_name).toBe("is_active");
    expect(differences[0].local_value).toBe(true);
    expect(differences[0].remote_value).toBe(false);
    expect(differences[0].display_name).toBe("Is Active");
  });

  it("excludes default fields like id, created_at, updated_at, version", () => {
    const local_data = {
      id: "123",
      local_id: "local_123",
      created_at: "2024-01-01",
      updated_at: "2024-01-02",
      synced_at: "2024-01-03",
      version: 1,
      _id: "convex_id",
      name: "Team A",
    };
    const remote_data = {
      id: "456",
      local_id: "local_456",
      created_at: "2024-02-01",
      updated_at: "2024-02-02",
      synced_at: "2024-02-03",
      version: 2,
      _id: "different_convex_id",
      name: "Team A",
    };

    const differences = compute_field_differences(local_data, remote_data);

    expect(differences).toEqual([]);
  });

  it("allows custom excluded fields", () => {
    const local_data = { name: "Team A", secret_field: "local_secret" };
    const remote_data = { name: "Team A", secret_field: "remote_secret" };

    const differences = compute_field_differences(local_data, remote_data, [
      "secret_field",
    ]);

    expect(differences).toEqual([]);
  });

  it("detects fields present only in local data", () => {
    const local_data = { name: "Team A", extra_field: "value" };
    const remote_data = { name: "Team A" };

    const differences = compute_field_differences(local_data, remote_data);

    expect(differences).toHaveLength(1);
    expect(differences[0].field_name).toBe("extra_field");
    expect(differences[0].local_value).toBe("value");
    expect(differences[0].remote_value).toBe(void 0);
  });

  it("detects fields present only in remote data", () => {
    const local_data = { name: "Team A" };
    const remote_data = { name: "Team A", extra_field: "value" };

    const differences = compute_field_differences(local_data, remote_data);

    expect(differences).toHaveLength(1);
    expect(differences[0].field_name).toBe("extra_field");
    expect(differences[0].local_value).toBe(void 0);
    expect(differences[0].remote_value).toBe("value");
  });

  it("treats missing values and undefined as equal", () => {
    const local_data = { optional_field: JSON.parse("null") };
    const remote_data = {};

    const differences = compute_field_differences(local_data, remote_data);

    expect(differences).toEqual([]);
  });

  it("detects array differences", () => {
    const local_data = { tags: ["a", "b", "c"] };
    const remote_data = { tags: ["a", "b", "d"] };

    const differences = compute_field_differences(local_data, remote_data);

    expect(differences).toHaveLength(1);
    expect(differences[0].field_name).toBe("tags");
  });

  it("treats identical arrays as equal", () => {
    const local_data = { tags: ["a", "b", "c"] };
    const remote_data = { tags: ["a", "b", "c"] };

    const differences = compute_field_differences(local_data, remote_data);

    expect(differences).toEqual([]);
  });

  it("detects array length differences", () => {
    const local_data = { items: [1, 2] };
    const remote_data = { items: [1, 2, 3] };

    const differences = compute_field_differences(local_data, remote_data);

    expect(differences).toHaveLength(1);
    expect(differences[0].field_name).toBe("items");
  });

  it("detects nested object differences", () => {
    const local_data = { metadata: { color: "red", size: "large" } };
    const remote_data = { metadata: { color: "blue", size: "large" } };

    const differences = compute_field_differences(local_data, remote_data);

    expect(differences).toHaveLength(1);
    expect(differences[0].field_name).toBe("metadata");
  });

  it("treats identical nested objects as equal", () => {
    const local_data = { metadata: { color: "red", size: "large" } };
    const remote_data = { metadata: { color: "red", size: "large" } };

    const differences = compute_field_differences(local_data, remote_data);

    expect(differences).toEqual([]);
  });

  it("formats snake_case field names to Title Case", () => {
    const local_data = { first_name: "John" };
    const remote_data = { first_name: "Jane" };

    const differences = compute_field_differences(local_data, remote_data);

    expect(differences[0].display_name).toBe("First Name");
  });

  it("handles multiple differences", () => {
    const local_data = { name: "A", city: "X", score: 1 };
    const remote_data = { name: "B", city: "Y", score: 2 };

    const differences = compute_field_differences(local_data, remote_data);

    expect(differences).toHaveLength(3);
    const field_names = differences.map((d) => d.field_name);
    expect(field_names).toContain("name");
    expect(field_names).toContain("city");
    expect(field_names).toContain("score");
  });
});
