import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  convert_bulk_import_record_with_name_resolution,
  find_bulk_import_name_columns,
  validate_bulk_import_required_fields,
} from "./bulkImportNameResolution";

const { get_use_cases_for_entity_type_mock, resolve_entity_name_to_id_mock } =
  vi.hoisted(() => ({
    get_use_cases_for_entity_type_mock: vi.fn(),
    resolve_entity_name_to_id_mock: vi.fn(),
  }));

vi.mock("$lib/infrastructure/registry/entityUseCasesRegistry", () => ({
  get_use_cases_for_entity_type: get_use_cases_for_entity_type_mock,
}));

vi.mock("$lib/core/services/nameResolutionService", async () => {
  const actual = await vi.importActual<
    typeof import("$lib/core/services/nameResolutionService")
  >("$lib/core/services/nameResolutionService");
  return {
    ...actual,
    resolve_entity_name_to_id: resolve_entity_name_to_id_mock,
  };
});

describe("bulkImportNameResolution", () => {
  beforeEach(() => {
    get_use_cases_for_entity_type_mock.mockReset();
    resolve_entity_name_to_id_mock.mockReset();
  });

  it("detects both *_name columns and id columns holding unresolved names", () => {
    expect(
      find_bulk_import_name_columns(
        [
          {
            field_name: "team_id",
            field_type: "foreign_key",
            foreign_key_entity: "team",
          },
          {
            field_name: "organization_id",
            field_type: "foreign_key",
            foreign_key_entity: "organization",
          },
        ] as never,
        { team_name: "Lions", organization_id: "Premier League" },
      ),
    ).toEqual([
      { entity_type: "team", id_column: "team_id", name_column: "team_name" },
      {
        entity_type: "organization",
        id_column: "organization_id",
        name_column: "organization_id",
      },
    ]);
  });

  it("resolves name columns into foreign-key ids before converting the entity input", async () => {
    get_use_cases_for_entity_type_mock.mockReturnValue({
      success: true,
      data: { list: vi.fn() },
    });
    resolve_entity_name_to_id_mock.mockResolvedValue({
      success: true,
      resolved_id: "team_default_1",
    });

    await expect(
      convert_bulk_import_record_with_name_resolution(
        [
          {
            field_name: "team_id",
            field_type: "foreign_key",
            foreign_key_entity: "team",
          },
        ] as never,
        [
          { field_name: "name", field_type: "string" },
          {
            field_name: "team_id",
            field_type: "foreign_key",
            foreign_key_entity: "team",
          },
        ] as never,
        { name: "Ada", team_name: "Lions" },
      ),
    ).resolves.toEqual({
      entity_input: { name: "Ada", team_id: "team_default_1" },
      errors: [],
      name_columns: [
        { entity_type: "team", id_column: "team_id", name_column: "team_name" },
      ],
    });
  });

  it("returns resolution errors and validates required fields using resolved id values", async () => {
    get_use_cases_for_entity_type_mock.mockReturnValue({ success: false });

    await expect(
      convert_bulk_import_record_with_name_resolution(
        [
          {
            field_name: "team_id",
            field_type: "foreign_key",
            foreign_key_entity: "team",
          },
        ] as never,
        [
          {
            field_name: "team_id",
            field_type: "foreign_key",
            foreign_key_entity: "team",
          },
        ] as never,
        { team_name: "Lions" },
      ),
    ).resolves.toEqual({
      entity_input: {},
      errors: [
        {
          column_name: "team_name",
          error_message:
            'Error: Unknown entity type "team". Cause: Cannot resolve name for this entity type. Solution: Use the ID column (team_id) instead.',
        },
      ],
      name_columns: [
        { entity_type: "team", id_column: "team_id", name_column: "team_name" },
      ],
    });

    expect(
      validate_bulk_import_required_fields(
        [
          { field_name: "team_id", display_name: "Team", is_required: true },
        ] as never,
        { team_name: "Lions" },
        { team_id: "team_default_1" },
        [
          {
            entity_type: "team",
            id_column: "team_id",
            name_column: "team_name",
          },
        ],
      ),
    ).toEqual([]);
  });
});
