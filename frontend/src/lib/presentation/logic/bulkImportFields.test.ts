import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  get_bulk_import_enum_fields,
  get_bulk_import_fields,
  get_bulk_import_foreign_key_fields,
  get_bulk_import_related_entity_display_name,
} from "./bulkImportFields";

const { get_entity_metadata_mock } = vi.hoisted(() => ({
  get_entity_metadata_mock: vi.fn(),
}));

vi.mock("$lib/infrastructure/registry/EntityMetadataRegistry", () => ({
  entityMetadataRegistry: {
    get_entity_metadata: get_entity_metadata_mock,
  },
}));

describe("bulkImportFields", () => {
  beforeEach(() => {
    get_entity_metadata_mock.mockReset();
  });

  it("filters out non-importable system and unsupported fields", () => {
    const fields = get_bulk_import_fields([
      { field_name: "id", field_type: "string" },
      { field_name: "created_at", field_type: "date" },
      { field_name: "avatar", field_type: "file" },
      { field_name: "children", field_type: "sub_entity" },
      { field_name: "status", field_type: "enum", is_read_only: true },
      { field_name: "name", field_type: "string" },
      { field_name: "team_id", field_type: "foreign_key" },
    ] as never);

    expect(fields).toEqual([
      { field_name: "name", field_type: "string" },
      { field_name: "team_id", field_type: "foreign_key" },
    ]);
  });

  it("returns the foreign-key and enum subsets independently", () => {
    const fields = [
      { field_name: "name", field_type: "string" },
      { field_name: "team_id", field_type: "foreign_key" },
      { field_name: "status", field_type: "enum" },
    ] as never;

    expect(get_bulk_import_foreign_key_fields(fields)).toEqual([
      { field_name: "team_id", field_type: "foreign_key" },
    ]);
    expect(get_bulk_import_enum_fields(fields)).toEqual([
      { field_name: "status", field_type: "enum" },
    ]);
  });

  it("uses registry metadata for related entity labels and falls back safely when missing", () => {
    get_entity_metadata_mock.mockReturnValueOnce({ display_name: "Team" });

    expect(
      get_bulk_import_related_entity_display_name({
        foreign_key_entity: "TEAM",
      } as never),
    ).toBe("Team");
    expect(
      get_bulk_import_related_entity_display_name({
        foreign_key_entity: "Venue",
      } as never),
    ).toBe("Venue");
    expect(get_bulk_import_related_entity_display_name({} as never)).toBe(
      "related record",
    );
  });
});
