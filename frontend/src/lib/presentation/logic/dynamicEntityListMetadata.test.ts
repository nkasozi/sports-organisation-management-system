import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  build_default_visible_column_names_mock,
  get_entity_metadata_mock,
  load_column_preferences_mock,
} = vi.hoisted(() => ({
  build_default_visible_column_names_mock: vi.fn(),
  get_entity_metadata_mock: vi.fn(),
  load_column_preferences_mock: vi.fn(),
}));

vi.mock("$lib/infrastructure/registry/EntityMetadataRegistry", () => ({
  entityMetadataRegistry: {
    get_entity_metadata: get_entity_metadata_mock,
  },
}));

vi.mock("$lib/presentation/logic/columnPreferences", () => ({
  load_column_preferences: load_column_preferences_mock,
}));

vi.mock("$lib/presentation/logic/dynamicListLogic", () => ({
  build_default_visible_column_names: build_default_visible_column_names_mock,
}));

import {
  get_dynamic_entity_list_metadata,
  load_dynamic_entity_list_columns,
} from "./dynamicEntityListMetadata";

describe("dynamicEntityListMetadata", () => {
  beforeEach(() => {
    build_default_visible_column_names_mock.mockReset();
    get_entity_metadata_mock.mockReset();
    load_column_preferences_mock.mockReset();
  });

  it("looks up entity metadata using a lowercase entity type", () => {
    const metadata = { display_name: "Teams", fields: [] };

    get_entity_metadata_mock.mockReturnValueOnce(metadata);

    expect(get_dynamic_entity_list_metadata("TEAMS")).toBe(metadata);
    expect(get_entity_metadata_mock).toHaveBeenCalledWith("teams");
  });

  it("restores visible columns from saved preferences when the cache is valid", async () => {
    const visible_columns = new Set(["name", "status"]);

    load_column_preferences_mock.mockResolvedValueOnce({
      restored: true,
      columns: visible_columns,
    });

    await expect(
      load_dynamic_entity_list_columns({
        entity_metadata: {
          fields: [{ field_name: "name" }, { field_name: "status" }],
        } as never,
        entity_type: "team",
        sub_entity_filter: null,
      }),
    ).resolves.toEqual({
      columns_restored_from_cache: true,
      visible_columns,
    });
  });

  it("builds default visible columns when cached preferences are unavailable", async () => {
    load_column_preferences_mock.mockResolvedValueOnce({
      restored: false,
      columns: null,
    });
    build_default_visible_column_names_mock.mockReturnValueOnce([
      "name",
      "status",
    ]);

    await expect(
      load_dynamic_entity_list_columns({
        entity_metadata: {
          fields: [{ field_name: "name" }, { field_name: "status" }],
        } as never,
        entity_type: "team",
        sub_entity_filter: null,
      }),
    ).resolves.toEqual({
      columns_restored_from_cache: false,
      visible_columns: new Set(["name", "status"]),
    });
    expect(load_column_preferences_mock).toHaveBeenCalledWith("team", null, [
      "name",
      "status",
    ]);
  });
});
