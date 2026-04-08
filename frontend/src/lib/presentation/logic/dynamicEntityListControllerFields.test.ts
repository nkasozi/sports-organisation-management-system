import { describe, expect, it } from "vitest";

import {
  get_dynamic_entity_list_available_fields,
  get_dynamic_entity_list_field_metadata_by_name,
} from "./dynamicEntityListControllerFields";

describe("dynamicEntityListControllerFields", () => {
  it("adds the synthetic id field and excludes read-only and sub-entity-controlled fields", () => {
    const entity_metadata = {
      fields: [
        {
          display_name: "Name",
          field_name: "name",
          field_type: "string",
          is_read_only: false,
          is_required: true,
          show_in_list: true,
        },
        {
          display_name: "Status",
          field_name: "status",
          field_type: "string",
          is_read_only: true,
          is_required: false,
          show_in_list: true,
        },
        {
          display_name: "Created At",
          field_name: "created_at",
          field_type: "string",
          is_read_only: true,
          is_required: false,
          show_in_list: true,
        },
        {
          display_name: "Team",
          field_name: "team_id",
          field_type: "foreign_key",
          is_read_only: false,
          is_required: false,
          show_in_list: true,
        },
      ],
    };

    expect(
      get_dynamic_entity_list_available_fields(
        entity_metadata as never,
        {
          foreign_key_field: "team_id",
          foreign_key_value: "team-1",
          holder_type_field: null,
          holder_type_value: null,
        } as never,
      ),
    ).toEqual([
      {
        display_name: "ID",
        field_name: "id",
        field_type: "string",
        is_read_only: true,
        is_required: false,
        show_in_list: false,
      },
      entity_metadata.fields[0],
      entity_metadata.fields[1],
    ]);
  });

  it("returns empty field lists without metadata and looks up fields by name", () => {
    const entity_metadata = {
      fields: [
        {
          display_name: "Code",
          field_name: "code",
          field_type: "string",
          is_read_only: false,
          is_required: true,
          show_in_list: true,
        },
      ],
    };

    expect(get_dynamic_entity_list_available_fields(null, null)).toEqual([]);
    expect(
      get_dynamic_entity_list_field_metadata_by_name(
        entity_metadata as never,
        "code",
      ),
    ).toEqual(entity_metadata.fields[0]);
    expect(
      get_dynamic_entity_list_field_metadata_by_name(
        entity_metadata as never,
        "missing",
      ),
    ).toBeUndefined();
  });
});
