import { describe, expect, it } from "vitest";

import type {
  BaseEntity,
  EntityMetadata,
  FieldMetadata,
} from "../../core/entities/BaseEntity";
import {
  build_dynamic_form_initial_data,
  create_dynamic_form_initialization_key,
  is_competition_format_entity_type,
} from "./dynamicEntityFormInitialization";

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

function create_entity_metadata(
  overrides: Partial<EntityMetadata> = {},
): EntityMetadata {
  return {
    entity_name: "test_entity",
    display_name: "Test Entity",
    fields: [],
    ...overrides,
  } as EntityMetadata;
}

describe("dynamicEntityFormInitialization", () => {
  it("detects competition format entity types after normalization", () => {
    expect(is_competition_format_entity_type("Competition Format")).toBe(true);
    expect(is_competition_format_entity_type("competition-format")).toBe(true);
    expect(is_competition_format_entity_type("fixture")).toBe(false);
  });

  it("prefers existing data over authorization preselect and defaults", () => {
    const metadata = create_entity_metadata({
      fields: [
        create_field_metadata({ field_name: "name" }),
        create_field_metadata({ field_name: "organization_id" }),
        create_field_metadata({ field_name: "age", field_type: "number" }),
      ],
    });
    const existing_data: Partial<BaseEntity> = {
      id: "entity_1",
      name: "Existing Name",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    } as unknown as Partial<BaseEntity>;

    const result = build_dynamic_form_initial_data(
      metadata,
      existing_data,
      { organization_id: "org_1" },
      "team",
    );

    expect(result["name"]).toBe("Existing Name");
    expect(result["organization_id"]).toBe("org_1");
    expect(result["age"]).toBe(0);
  });

  it("hydrates stage templates for empty competition format forms", () => {
    const metadata = create_entity_metadata({
      fields: [
        create_field_metadata({
          field_name: "format_type",
          field_type: "enum",
          enum_values: ["league"],
          is_required: true,
        }),
        create_field_metadata({
          field_name: "stage_templates",
          field_type: "stage_template_array",
        }),
      ],
    });

    const result = build_dynamic_form_initial_data(
      metadata,
      null,
      {},
      "competition_format",
    );

    expect(Array.isArray(result["stage_templates"])).toBe(true);
    expect(result["stage_templates"].length).toBeGreaterThan(0);
  });

  it("builds the same initialization key for equal initialization inputs", () => {
    const metadata = create_entity_metadata({
      fields: [
        create_field_metadata({ field_name: "name" }),
        create_field_metadata({ field_name: "logo_url", field_type: "file" }),
      ],
    });
    const existing_data: Partial<BaseEntity> = {
      id: "team_1",
      name: "Makers HC",
      logo_url: "data:image/png;base64,abc123",
    } as unknown as Partial<BaseEntity>;

    const first_key = create_dynamic_form_initialization_key({
      entity_type: "team",
      metadata,
      existing_data,
      authorization_preselect: { organization_id: "org_1" },
    });
    const second_key = create_dynamic_form_initialization_key({
      entity_type: "team",
      metadata: create_entity_metadata({
        fields: [
          create_field_metadata({ field_name: "name" }),
          create_field_metadata({
            field_name: "logo_url",
            field_type: "file",
          }),
        ],
      }),
      existing_data: {
        id: "team_1",
        name: "Makers HC",
        logo_url: "data:image/png;base64,abc123",
      } as unknown as Partial<BaseEntity>,
      authorization_preselect: { organization_id: "org_1" },
    });

    expect(first_key).toBe(second_key);
  });

  it("changes the initialization key when the initial source data changes", () => {
    const metadata = create_entity_metadata({
      fields: [
        create_field_metadata({ field_name: "name" }),
        create_field_metadata({ field_name: "organization_id" }),
      ],
    });

    const first_key = create_dynamic_form_initialization_key({
      entity_type: "team",
      metadata,
      existing_data: {
        id: "team_1",
        name: "Original Name",
      } as unknown as Partial<BaseEntity>,
      authorization_preselect: { organization_id: "org_1" },
    });
    const second_key = create_dynamic_form_initialization_key({
      entity_type: "team",
      metadata,
      existing_data: {
        id: "team_1",
        name: "Updated Name",
      } as unknown as Partial<BaseEntity>,
      authorization_preselect: { organization_id: "org_1" },
    });

    expect(first_key).not.toBe(second_key);
  });
});
