import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  convert_bulk_import_record_to_entity_input,
  download_bulk_import_csv,
  generate_bulk_import_csv_template,
  generate_bulk_import_failure_report,
  parse_bulk_import_csv_content,
  parse_bulk_import_csv_line,
} from "./bulkImportCsv";

describe("bulkImportCsv", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("generates a csv template with field-specific example values", () => {
    expect(
      generate_bulk_import_csv_template([
        { field_name: "full_name", field_type: "string" },
        { field_name: "contact_email", field_type: "string" },
        { field_name: "birth_year", field_type: "number" },
        {
          field_name: "team_id",
          field_type: "foreign_key",
          foreign_key_entity: "Team",
        },
      ] as never),
    ).toBe(
      "full_name,contact_email,birth_year,team_id\nExample Name,example@email.com,2020,team_default_1",
    );
  });

  it("parses quoted csv lines and maps rows by header name", () => {
    expect(parse_bulk_import_csv_line('Ada,"Lions, Senior",true')).toEqual([
      "Ada",
      "Lions, Senior",
      "true",
    ]);
    expect(
      parse_bulk_import_csv_content(
        'name,team_name,active\nAda,"Lions, Senior",true\nBo,Tigers,false',
      ),
    ).toEqual([
      { name: "Ada", team_name: "Lions, Senior", active: "true" },
      { name: "Bo", team_name: "Tigers", active: "false" },
    ]);
  });

  it("converts record values to typed entity input and nulls missing required fields", () => {
    expect(
      convert_bulk_import_record_to_entity_input(
        [
          { field_name: "age", field_type: "number" },
          { field_name: "active", field_type: "boolean" },
          { field_name: "joined_on", field_type: "date" },
          {
            field_name: "team_id",
            field_type: "foreign_key",
            is_required: true,
          },
        ] as never,
        { age: "18", active: "1", joined_on: "2024-01-01", team_id: "" },
      ),
    ).toEqual({
      age: 18,
      active: true,
      joined_on: "2024-01-01",
      team_id: null,
    });
  });

  it("builds a failure report that preserves original values and quotes comma content", () => {
    expect(
      generate_bulk_import_failure_report(
        [
          {
            success: false,
            row_number: 2,
            original_data: { name: "Ada", notes: "Lions, Senior" },
            error_message: "Duplicate, record",
          },
          {
            success: true,
            row_number: 3,
            original_data: { name: "Bo", notes: "Clean" },
            error_message: "",
          },
        ],
        [{ field_name: "name" }, { field_name: "notes" }] as never,
      ),
    ).toBe(
      'name,notes,import_error_reason\nAda,"Lions, Senior","Duplicate, record"',
    );
  });

  it("downloads non-empty csv content through a temporary anchor element", () => {
    const create_object_url_mock = vi.fn(() => "blob:csv");
    const revoke_object_url_mock = vi.fn();
    const append_child_mock = vi.fn();
    const remove_child_mock = vi.fn();
    const click_mock = vi.fn();
    const create_element_mock = vi.fn(() => ({ click: click_mock }));

    vi.stubGlobal("URL", {
      createObjectURL: create_object_url_mock,
      revokeObjectURL: revoke_object_url_mock,
    });
    vi.stubGlobal("document", {
      createElement: create_element_mock,
      body: {
        appendChild: append_child_mock,
        removeChild: remove_child_mock,
      },
    });

    download_bulk_import_csv("name\nAda", "players.csv");
    download_bulk_import_csv("", "ignored.csv");

    expect(create_object_url_mock).toHaveBeenCalledTimes(1);
    expect(create_element_mock).toHaveBeenCalledWith("a");
    expect(click_mock).toHaveBeenCalledTimes(1);
    expect(append_child_mock).toHaveBeenCalledTimes(1);
    expect(remove_child_mock).toHaveBeenCalledTimes(1);
    expect(revoke_object_url_mock).toHaveBeenCalledWith("blob:csv");
  });
});
