import { beforeEach, describe, expect, it } from "vitest";

import type { AppSettingsPort } from "$lib/core/interfaces/ports";

import { load_column_preferences } from "./columnPreferences";
import { create_mock_storage } from "./columnPreferences.test_support";

describe("load_column_preferences", () => {
  let storage: AppSettingsPort;

  beforeEach(() => {
    storage = create_mock_storage();
  });

  it("returns restored columns when cached data exists", async () => {
    await storage.set_setting(
      "col_prefs_Team",
      JSON.stringify(["name", "status"]),
    );

    const result = await load_column_preferences({
      entity_type: "Team",
      available_field_names: ["name", "status", "city"],
      storage,
    });

    expect(result.restored).toBe(true);
    expect(result.columns).toEqual(new Set(["name", "status"]));
  });

  it("filters out columns that no longer exist in available fields", async () => {
    await storage.set_setting(
      "col_prefs_Team",
      JSON.stringify(["name", "deleted_field", "status"]),
    );

    const result = await load_column_preferences({
      entity_type: "Team",
      available_field_names: ["name", "status", "city"],
      storage,
    });

    expect(result.restored).toBe(true);
    expect(result.columns).toEqual(new Set(["name", "status"]));
  });

  it("returns not-restored when no cached data exists", async () => {
    const result = await load_column_preferences({
      entity_type: "Team",
      available_field_names: ["name", "status"],
      storage,
    });

    expect(result.restored).toBe(false);
    expect(result.columns).toEqual(new Set());
  });

  it("returns not-restored when cached data is invalid JSON", async () => {
    await storage.set_setting("col_prefs_Team", "not-valid-json");

    const result = await load_column_preferences({
      entity_type: "Team",
      available_field_names: ["name", "status"],
      storage,
    });

    expect(result.restored).toBe(false);
    expect(result.columns).toEqual(new Set());
  });

  it("returns not-restored when all cached columns are gone from available fields", async () => {
    await storage.set_setting(
      "col_prefs_Team",
      JSON.stringify(["old_field_1", "old_field_2"]),
    );

    const result = await load_column_preferences({
      entity_type: "Team",
      available_field_names: ["name", "status"],
      storage,
    });

    expect(result.restored).toBe(false);
    expect(result.columns).toEqual(new Set());
  });

  it("loads with sub_entity_filter context", async () => {
    const filter = {
      foreign_key_field: "team_id",
      foreign_key_value: "t-1",
    };

    await storage.set_setting(
      "col_prefs_PlayerTeamMembership_team_id",
      JSON.stringify(["player_id"]),
    );

    const result = await load_column_preferences({
      entity_type: "PlayerTeamMembership",
      sub_entity_filter: filter,
      available_field_names: ["player_id", "team_id", "status"],
      storage,
    });

    expect(result.restored).toBe(true);
    expect(result.columns).toEqual(new Set(["player_id"]));
  });
});
