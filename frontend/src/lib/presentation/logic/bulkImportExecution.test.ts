import { beforeEach, describe, expect, it, vi } from "vitest";

import { execute_bulk_import } from "./bulkImportExecution";

const {
  convert_bulk_import_record_to_entity_input_mock,
  convert_bulk_import_record_with_name_resolution_mock,
  find_bulk_import_name_columns_mock,
  get_use_cases_for_entity_type_mock,
  parse_bulk_import_csv_content_mock,
  validate_bulk_import_required_fields_mock,
} = vi.hoisted(() => ({
  convert_bulk_import_record_to_entity_input_mock: vi.fn(),
  convert_bulk_import_record_with_name_resolution_mock: vi.fn(),
  find_bulk_import_name_columns_mock: vi.fn(),
  get_use_cases_for_entity_type_mock: vi.fn(),
  parse_bulk_import_csv_content_mock: vi.fn(),
  validate_bulk_import_required_fields_mock: vi.fn(),
}));

vi.mock("$lib/infrastructure/registry/entityUseCasesRegistry", () => ({
  get_use_cases_for_entity_type: get_use_cases_for_entity_type_mock,
}));

vi.mock("$lib/presentation/logic/bulkImportCsv", () => ({
  convert_bulk_import_record_to_entity_input:
    convert_bulk_import_record_to_entity_input_mock,
  parse_bulk_import_csv_content: parse_bulk_import_csv_content_mock,
}));

vi.mock("$lib/presentation/logic/bulkImportNameResolution", () => ({
  convert_bulk_import_record_with_name_resolution:
    convert_bulk_import_record_with_name_resolution_mock,
  find_bulk_import_name_columns: find_bulk_import_name_columns_mock,
  validate_bulk_import_required_fields:
    validate_bulk_import_required_fields_mock,
}));

describe("bulkImportExecution", () => {
  beforeEach(() => {
    convert_bulk_import_record_to_entity_input_mock.mockReset();
    convert_bulk_import_record_with_name_resolution_mock.mockReset();
    find_bulk_import_name_columns_mock.mockReset();
    get_use_cases_for_entity_type_mock.mockReset();
    parse_bulk_import_csv_content_mock.mockReset();
    validate_bulk_import_required_fields_mock.mockReset();
  });

  it("returns a single failure result when no use cases exist for the entity type", async () => {
    parse_bulk_import_csv_content_mock.mockReturnValue([{ name: "Ada" }]);
    get_use_cases_for_entity_type_mock.mockReturnValue({ success: false });

    await expect(
      execute_bulk_import({
        entity_type: "Player",
        file_content: "name\nAda",
        foreign_key_fields: [],
        importable_fields: [],
      } as never),
    ).resolves.toEqual({
      failure_count: 1,
      success_count: 0,
      import_results: [
        {
          error_message: "No use cases found for entity type: Player",
          original_data: {},
          row_number: 0,
          success: false,
        },
      ],
    });
  });

  it("tracks conversion, validation, create failures, and successes across import rows", async () => {
    const create_mock = vi
      .fn()
      .mockResolvedValueOnce({ success: false, error: "Duplicate record" })
      .mockResolvedValueOnce({ success: true, data: { id: "player-2" } });
    parse_bulk_import_csv_content_mock.mockReturnValue([
      { name: "Ada" },
      { name: "Bo" },
      { name: "Cy" },
      { name: "Di" },
    ]);
    get_use_cases_for_entity_type_mock.mockReturnValue({
      success: true,
      data: { create: create_mock },
    });
    find_bulk_import_name_columns_mock.mockReturnValue([
      { id_column: "team_id", name_column: "team_name" },
    ]);
    convert_bulk_import_record_with_name_resolution_mock
      .mockResolvedValueOnce({
        entity_input: {},
        errors: [{ column_name: "team_name", error_message: "No team found" }],
        name_columns: [{ id_column: "team_id", name_column: "team_name" }],
      })
      .mockResolvedValueOnce({
        entity_input: { name: "Bo" },
        errors: [],
        name_columns: [{ id_column: "team_id", name_column: "team_name" }],
      })
      .mockResolvedValueOnce({
        entity_input: { name: "Cy" },
        errors: [],
        name_columns: [{ id_column: "team_id", name_column: "team_name" }],
      })
      .mockResolvedValueOnce({
        entity_input: { name: "Di" },
        errors: [],
        name_columns: [{ id_column: "team_id", name_column: "team_name" }],
      });
    validate_bulk_import_required_fields_mock
      .mockReturnValueOnce(["Team"])
      .mockReturnValueOnce([])
      .mockReturnValueOnce([]);

    const result = await execute_bulk_import({
      entity_type: "Player",
      file_content: "ignored",
      foreign_key_fields: [{ field_name: "team_id" }],
      importable_fields: [{ field_name: "name" }],
    } as never);

    expect(result).toEqual({
      failure_count: 3,
      success_count: 1,
      import_results: [
        {
          error_message: "[team_name]: No team found",
          original_data: { name: "Ada" },
          row_number: 2,
          success: false,
        },
        {
          error_message: "Missing required field(s): Team",
          original_data: { name: "Bo" },
          row_number: 3,
          success: false,
        },
        {
          error_message: "Duplicate record",
          original_data: { name: "Cy" },
          row_number: 4,
          success: false,
        },
        {
          error_message: "",
          original_data: { name: "Di" },
          row_number: 5,
          success: true,
        },
      ],
    });
  });
});
