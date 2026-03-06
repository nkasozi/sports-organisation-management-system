import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  build_column_cache_key,
  save_column_preferences,
  load_column_preferences,
  clear_column_preferences,
  type ColumnPreferenceResult,
} from "./columnPreferences";

function create_mock_storage(): Storage {
  const store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      for (const key of Object.keys(store)) {
        delete store[key];
      }
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
  };
}

describe("build_column_cache_key", () => {
  it("builds key from entity_type alone", () => {
    const key = build_column_cache_key("Competition", null);

    expect(key).toBe("col_prefs_Competition");
  });

  it("builds key with sub_entity_filter for scoped context", () => {
    const key = build_column_cache_key("CompetitionTeam", {
      foreign_key_field: "competition_id",
      foreign_key_value: "abc-123",
    });

    expect(key).toBe("col_prefs_CompetitionTeam_competition_id");
  });

  it("includes holder_type_field when present in sub_entity_filter", () => {
    const key = build_column_cache_key("Activity", {
      foreign_key_field: "parent_id",
      foreign_key_value: "xyz",
      holder_type_field: "parent_type",
      holder_type_value: "competition",
    });

    expect(key).toBe("col_prefs_Activity_parent_id_parent_type");
  });
});

describe("save_column_preferences", () => {
  let storage: Storage;

  beforeEach(() => {
    storage = create_mock_storage();
  });

  it("saves column names as JSON array", () => {
    const columns = new Set(["name", "status", "created_at"]);

    const saved = save_column_preferences("Team", null, columns, storage);

    expect(saved).toBe(true);
    expect(storage.setItem).toHaveBeenCalledWith(
      "col_prefs_Team",
      JSON.stringify(["name", "status", "created_at"]),
    );
  });

  it("saves with sub_entity_filter context", () => {
    const columns = new Set(["player_id", "team_id"]);
    const filter = {
      foreign_key_field: "team_id",
      foreign_key_value: "t-1",
    };

    const saved = save_column_preferences(
      "PlayerTeamMembership",
      filter,
      columns,
      storage,
    );

    expect(saved).toBe(true);
    expect(storage.setItem).toHaveBeenCalledWith(
      "col_prefs_PlayerTeamMembership_team_id",
      JSON.stringify(["player_id", "team_id"]),
    );
  });

  it("returns false for empty column set", () => {
    const saved = save_column_preferences("Team", null, new Set(), storage);

    expect(saved).toBe(false);
    expect(storage.setItem).not.toHaveBeenCalled();
  });
});

describe("load_column_preferences", () => {
  let storage: Storage;

  beforeEach(() => {
    storage = create_mock_storage();
  });

  it("returns restored columns when cached data exists", () => {
    storage.setItem("col_prefs_Team", JSON.stringify(["name", "status"]));

    const result = load_column_preferences(
      "Team",
      null,
      ["name", "status", "city"],
      storage,
    );

    expect(result.restored).toBe(true);
    expect(result.columns).toEqual(new Set(["name", "status"]));
  });

  it("filters out columns that no longer exist in available fields", () => {
    storage.setItem(
      "col_prefs_Team",
      JSON.stringify(["name", "deleted_field", "status"]),
    );

    const result = load_column_preferences(
      "Team",
      null,
      ["name", "status", "city"],
      storage,
    );

    expect(result.restored).toBe(true);
    expect(result.columns).toEqual(new Set(["name", "status"]));
  });

  it("returns not-restored when no cached data exists", () => {
    const result = load_column_preferences(
      "Team",
      null,
      ["name", "status"],
      storage,
    );

    expect(result.restored).toBe(false);
    expect(result.columns).toBeNull();
  });

  it("returns not-restored when cached data is invalid JSON", () => {
    storage.setItem("col_prefs_Team", "not-valid-json");

    const result = load_column_preferences(
      "Team",
      null,
      ["name", "status"],
      storage,
    );

    expect(result.restored).toBe(false);
    expect(result.columns).toBeNull();
  });

  it("returns not-restored when all cached columns are gone from available fields", () => {
    storage.setItem(
      "col_prefs_Team",
      JSON.stringify(["old_field_1", "old_field_2"]),
    );

    const result = load_column_preferences(
      "Team",
      null,
      ["name", "status"],
      storage,
    );

    expect(result.restored).toBe(false);
    expect(result.columns).toBeNull();
  });

  it("loads with sub_entity_filter context", () => {
    const filter = {
      foreign_key_field: "team_id",
      foreign_key_value: "t-1",
    };

    storage.setItem(
      "col_prefs_PlayerTeamMembership_team_id",
      JSON.stringify(["player_id"]),
    );

    const result = load_column_preferences(
      "PlayerTeamMembership",
      filter,
      ["player_id", "team_id", "status"],
      storage,
    );

    expect(result.restored).toBe(true);
    expect(result.columns).toEqual(new Set(["player_id"]));
  });
});

describe("clear_column_preferences", () => {
  let storage: Storage;

  beforeEach(() => {
    storage = create_mock_storage();
  });

  it("removes cached preferences for entity", () => {
    storage.setItem("col_prefs_Team", JSON.stringify(["name"]));

    const cleared = clear_column_preferences("Team", null, storage);

    expect(cleared).toBe(true);
    expect(storage.removeItem).toHaveBeenCalledWith("col_prefs_Team");
  });

  it("returns false when no preferences existed", () => {
    const cleared = clear_column_preferences("Team", null, storage);

    expect(cleared).toBe(false);
  });
});
