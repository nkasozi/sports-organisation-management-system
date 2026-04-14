import { describe, expect, it } from "vitest";

import type {
  EntityMetadata,
  FieldMetadata,
} from "../../core/entities/BaseEntity";
import type { SubEntityFilter } from "../../core/types/SubEntityFilter";
import {
  build_dynamic_form_enum_select_options,
  get_dynamic_form_sorted_fields_for_display,
  update_dynamic_form_field_value,
} from "./dynamicEntityFormFieldState";

function create_field_metadata(
  overrides: Partial<FieldMetadata> = {},
): FieldMetadata {
  return {
    field_name: "test_field",
    display_name: "Test Field",
    field_type: "string",
    is_required: false,
    is_read_only: false,
    ...overrides,
  } as FieldMetadata;
}

function create_entity_metadata(fields: FieldMetadata[]): EntityMetadata {
  return {
    entity_name: "test_entity",
    display_name: "Test Entity",
    fields,
  } as EntityMetadata;
}

describe("dynamicEntityFormFieldState", () => {
  it("filters hidden and sub-entity controlled fields before display", () => {
    const fields = [
      create_field_metadata({ field_name: "logo", field_type: "file" }),
      create_field_metadata({ field_name: "hidden", hide_on_create: true }),
      create_field_metadata({
        field_name: "organization_id",
        field_type: "foreign_key",
      }),
      create_field_metadata({
        field_name: "role_details",
        visible_when: {
          depends_on_field: "role",
          visible_when_values: ["admin"],
        },
      }),
    ];
    const sub_entity_filter =  {
      foreign_key_field: "organization_id",
      foreign_key_value: "org_1",
    } as SubEntityFilter;

    const result = get_dynamic_form_sorted_fields_for_display(
      fields,
      false,
      { role: "admin" },
      sub_entity_filter,
    );

    expect(result.map((field) => field.field_name)).toEqual([
      "logo",
      "role_details",
    ]);
  });

  it("clears dependent enum and hidden fields when a managed field changes", () => {
    const metadata = create_entity_metadata([
      create_field_metadata({
        field_name: "format_type",
        field_type: "enum",
        enum_values: ["league", "knockout"],
      }),
      create_field_metadata({
        field_name: "stage_type",
        field_type: "enum",
        enum_dependency: {
          depends_on_field: "format_type",
          options_map: {
            league: [{ value: "round_robin", label: "Round Robin" }],
            knockout: [{ value: "cup", label: "Cup" }],
          },
        },
      }),
      create_field_metadata({
        field_name: "extra_notes",
        visible_when: {
          depends_on_field: "format_type",
          visible_when_values: ["league"],
        },
      }),
      create_field_metadata({
        field_name: "stage_templates",
        field_type: "stage_template_array",
      }),
    ]);

    const result = update_dynamic_form_field_value(
      metadata,
      {
        format_type: "league",
        stage_type: "round_robin",
        extra_notes: "Visible now",
        stage_templates: [],
      },
      "competition_format",
      "format_type",
      "knockout",
    );

    expect(result["format_type"]).toBe("knockout");
    expect(result["stage_type"]).toBe("");
    expect(result["extra_notes"]).toBe("");
    expect(Array.isArray(result["stage_templates"])).toBe(true);
    expect(result["stage_templates"].length).toBeGreaterThan(0);
  });

  it("builds enum options from dependency maps before static enum values", () => {
    const field = create_field_metadata({
      field_name: "stage_type",
      field_type: "enum",
      enum_dependency: {
        depends_on_field: "format_type",
        options_map: {
          league: [{ value: "round_robin", label: "Round Robin" }],
        },
      },
      enum_values: ["ignored"],
    });

    const result = build_dynamic_form_enum_select_options(
      field,
      { format_type: "league" },
      "competition_format",
      null,
    );

    expect(result).toEqual([{ value: "round_robin", label: "Round Robin" }]);
  });
});
