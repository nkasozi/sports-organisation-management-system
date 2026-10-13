import { describe, expect, it } from "vitest";

import { type EntityId, parse_entity_id } from "$lib/core/types/DomainScalars";

import { generate_conflict_id, get_entity_display_name } from "./conflictTypes";

function create_entity_id(raw_value: string): EntityId {
  const entity_id_result = parse_entity_id(raw_value, "Invalid test entity ID");

  if (!entity_id_result.success) {
    return expect.unreachable(entity_id_result.error);
  }

  return entity_id_result.data;
}

describe("generate_conflict_id", () => {
  it("generates id with table name and local id", () => {
    const conflict_id = generate_conflict_id(
      "teams",
      create_entity_id("team_123"),
    );

    expect(conflict_id).toMatch(/^conflict_teams_team_123_\d+$/);
  });

  it("generates ids with timestamp component", () => {
    const before = Date.now();
    const id = generate_conflict_id("teams", create_entity_id("team_123"));
    const after = Date.now();

    const timestamp_match = id.match(/conflict_teams_team_123_(\d+)/);
    expect(timestamp_match).not.toBeNull();
    const timestamp = parseInt(timestamp_match?.[1] ?? "");
    expect(timestamp).toBeGreaterThanOrEqual(before);
    expect(timestamp).toBeLessThanOrEqual(after);
  });

  it("handles table names with underscores", () => {
    const conflict_id = generate_conflict_id(
      "team_staff_roles",
      create_entity_id("role_1"),
    );

    expect(conflict_id).toMatch(/^conflict_team_staff_roles_role_1_\d+$/);
  });
});

describe("get_entity_display_name", () => {
  it("returns name field if present", () => {
    const data = { name: "Arsenal FC", id: "team_1" };

    const display_name = get_entity_display_name(data, "teams");

    expect(display_name).toBe("Arsenal FC");
  });

  it("returns combined first_name and last_name if present", () => {
    const data = { first_name: "John", last_name: "Doe", id: "player_1" };

    const display_name = get_entity_display_name(data, "players");

    expect(display_name).toBe("John Doe");
  });

  it("returns title field if present and no name", () => {
    const data = { title: "Championship Finals", id: "comp_1" };

    const display_name = get_entity_display_name(data, "competitions");

    expect(display_name).toBe("Championship Finals");
  });

  it("returns formatted table name with id as fallback", () => {
    const data = { id: "record_123", some_field: "value" };

    const display_name = get_entity_display_name(data, "player_profiles");

    expect(display_name).toBe("Player Profile (record_123)");
  });

  it("returns unknown id when no id present", () => {
    const data = { some_field: "value" };

    const display_name = get_entity_display_name(data, "teams");

    expect(display_name).toBe("Team (unknown)");
  });

  it("prioritizes name over first_name/last_name", () => {
    const data = {
      name: "Official Name",
      first_name: "John",
      last_name: "Doe",
    };

    const display_name = get_entity_display_name(data, "officials");

    expect(display_name).toBe("Official Name");
  });

  it("prioritizes first_name/last_name over title", () => {
    const data = {
      first_name: "Jane",
      last_name: "Smith",
      title: "Some Title",
    };

    const display_name = get_entity_display_name(data, "players");

    expect(display_name).toBe("Jane Smith");
  });

  it("handles table names ending with s correctly", () => {
    const data = { id: "123" };

    const display_name = get_entity_display_name(data, "venues");

    expect(display_name).toBe("Venue (123)");
  });

  it("ignores non-string name values", () => {
    const data = { name: 123, id: "test_1" };

    const display_name = get_entity_display_name(data, "items");

    expect(display_name).toBe("Item (test_1)");
  });

  it("ignores non-string first_name values", () => {
    const data = {
      first_name: JSON.parse("null"),
      last_name: "Doe",
      id: "p1",
    };

    const display_name = get_entity_display_name(data, "players");

    expect(display_name).toBe("Player (p1)");
  });
});
