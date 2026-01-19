import { describe, it, expect } from "vitest";
import type {
  FieldMetadata,
  EntityMetadata,
  ValidationRule,
  BaseEntity,
} from "../../core/entities/BaseEntity";
import {
  determine_if_edit_mode,
  build_form_title,
  get_sub_entity_fields,
  build_sub_entity_filter,
  get_default_value_for_field_type,
  get_sorted_fields_for_display,
  get_input_type_for_field,
  validate_form_data_against_metadata,
  validate_field_against_rules,
  build_entity_display_label,
  get_display_value_for_foreign_key,
  initialize_form_data_from_metadata,
} from "./dynamicFormLogic";

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
  };
}

function create_entity_metadata(
  overrides: Partial<EntityMetadata> = {},
): EntityMetadata {
  return {
    entity_name: "test_entity",
    display_name: "Test Entity",
    fields: [],
    ...overrides,
  };
}

function create_base_entity(overrides: Partial<BaseEntity> = {}): BaseEntity {
  return {
    id: "entity_1",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("dynamicFormLogic", () => {
  describe("determine_if_edit_mode", () => {
    it("returns true when entity has id", () => {
      const result = determine_if_edit_mode({ id: "123" });
      expect(result).toBe(true);
    });

    it("returns false when entity is null", () => {
      const result = determine_if_edit_mode(null);
      expect(result).toBe(false);
    });

    it("returns false when entity has no id", () => {
      const result = determine_if_edit_mode({});
      expect(result).toBe(false);
    });

    it("returns false when id is undefined", () => {
      const result = determine_if_edit_mode({ id: undefined } as any);
      expect(result).toBe(false);
    });
  });

  describe("build_form_title", () => {
    it("returns Edit prefix when in edit mode", () => {
      const result = build_form_title("Player", true);
      expect(result).toBe("Edit Player");
    });

    it("returns Create prefix when not in edit mode", () => {
      const result = build_form_title("Player", false);
      expect(result).toBe("Create Player");
    });

    it("handles empty display name", () => {
      const result = build_form_title("", false);
      expect(result).toBe("Create ");
    });
  });

  describe("get_sub_entity_fields", () => {
    it("returns empty array when metadata is null", () => {
      const result = get_sub_entity_fields(null);
      expect(result).toEqual([]);
    });

    it("returns only sub_entity fields", () => {
      const metadata = create_entity_metadata({
        fields: [
          create_field_metadata({ field_name: "name", field_type: "string" }),
          create_field_metadata({
            field_name: "qualifications",
            field_type: "sub_entity",
          }),
          create_field_metadata({ field_name: "status", field_type: "enum" }),
          create_field_metadata({
            field_name: "identifications",
            field_type: "sub_entity",
          }),
        ],
      });

      const result = get_sub_entity_fields(metadata);

      expect(result).toHaveLength(2);
      expect(result.map((f) => f.field_name)).toEqual([
        "qualifications",
        "identifications",
      ]);
    });

    it("returns empty array when no sub_entity fields exist", () => {
      const metadata = create_entity_metadata({
        fields: [
          create_field_metadata({ field_name: "name", field_type: "string" }),
          create_field_metadata({ field_name: "status", field_type: "enum" }),
        ],
      });

      const result = get_sub_entity_fields(metadata);

      expect(result).toEqual([]);
    });
  });

  describe("build_sub_entity_filter", () => {
    it("returns null when field has no sub_entity_config", () => {
      const field = create_field_metadata({ field_type: "sub_entity" });
      const result = build_sub_entity_filter(field, { id: "123" });
      expect(result).toBeNull();
    });

    it("returns null when parent entity has no id", () => {
      const field = create_field_metadata({
        field_type: "sub_entity",
        sub_entity_config: {
          child_entity_type: "qualification",
          foreign_key_field: "holder_id",
        },
      });
      const result = build_sub_entity_filter(field, {});
      expect(result).toBeNull();
    });

    it("returns null when parent entity is null", () => {
      const field = create_field_metadata({
        field_type: "sub_entity",
        sub_entity_config: {
          child_entity_type: "qualification",
          foreign_key_field: "holder_id",
        },
      });
      const result = build_sub_entity_filter(field, null);
      expect(result).toBeNull();
    });

    it("builds filter with required fields", () => {
      const field = create_field_metadata({
        field_type: "sub_entity",
        sub_entity_config: {
          child_entity_type: "qualification",
          foreign_key_field: "holder_id",
          holder_type_field: "holder_type",
          holder_type_value: "player",
        },
      });

      const result = build_sub_entity_filter(field, { id: "player_123" });

      expect(result).not.toBeNull();
      expect(result?.foreign_key_field).toBe("holder_id");
      expect(result?.foreign_key_value).toBe("player_123");
      expect(result?.holder_type_field).toBe("holder_type");
      expect(result?.holder_type_value).toBe("player");
    });
  });

  describe("get_default_value_for_field_type", () => {
    it("returns empty string for string fields", () => {
      const field = create_field_metadata({ field_type: "string" });
      expect(get_default_value_for_field_type(field)).toBe("");
    });

    it("returns 0 for number fields", () => {
      const field = create_field_metadata({ field_type: "number" });
      expect(get_default_value_for_field_type(field)).toBe(0);
    });

    it("returns false for boolean fields", () => {
      const field = create_field_metadata({ field_type: "boolean" });
      expect(get_default_value_for_field_type(field)).toBe(false);
    });

    it("returns empty string for date fields", () => {
      const field = create_field_metadata({ field_type: "date" });
      expect(get_default_value_for_field_type(field)).toBe("");
    });

    it("returns empty string for file fields", () => {
      const field = create_field_metadata({ field_type: "file" });
      expect(get_default_value_for_field_type(field)).toBe("");
    });

    it("returns first enum value for required enum fields", () => {
      const field = create_field_metadata({
        field_type: "enum",
        is_required: true,
        enum_values: ["active", "inactive"],
      });
      expect(get_default_value_for_field_type(field)).toBe("active");
    });

    it("returns empty string for non-required enum fields", () => {
      const field = create_field_metadata({
        field_type: "enum",
        is_required: false,
        enum_values: ["active", "inactive"],
      });
      expect(get_default_value_for_field_type(field)).toBe("");
    });

    it("returns empty string for enum fields with no values", () => {
      const field = create_field_metadata({
        field_type: "enum",
        is_required: true,
        enum_values: [],
      });
      expect(get_default_value_for_field_type(field)).toBe("");
    });

    it("returns empty string for foreign_key fields", () => {
      const field = create_field_metadata({ field_type: "foreign_key" });
      expect(get_default_value_for_field_type(field)).toBe("");
    });
  });

  describe("get_sorted_fields_for_display", () => {
    it("excludes sub_entity fields", () => {
      const fields = [
        create_field_metadata({ field_name: "name", field_type: "string" }),
        create_field_metadata({
          field_name: "qualifications",
          field_type: "sub_entity",
        }),
      ];

      const result = get_sorted_fields_for_display(fields, false);

      expect(result).toHaveLength(1);
      expect(result[0].field_name).toBe("name");
    });

    it("excludes hide_on_create fields in create mode", () => {
      const fields = [
        create_field_metadata({ field_name: "name", field_type: "string" }),
        create_field_metadata({
          field_name: "hidden",
          field_type: "string",
          hide_on_create: true,
        }),
      ];

      const result = get_sorted_fields_for_display(fields, false);

      expect(result).toHaveLength(1);
      expect(result[0].field_name).toBe("name");
    });

    it("includes hide_on_create fields in edit mode", () => {
      const fields = [
        create_field_metadata({ field_name: "name", field_type: "string" }),
        create_field_metadata({
          field_name: "hidden",
          field_type: "string",
          hide_on_create: true,
        }),
      ];

      const result = get_sorted_fields_for_display(fields, true);

      expect(result).toHaveLength(2);
    });

    it("puts file fields first", () => {
      const fields = [
        create_field_metadata({ field_name: "name", field_type: "string" }),
        create_field_metadata({ field_name: "avatar", field_type: "file" }),
        create_field_metadata({ field_name: "email", field_type: "string" }),
      ];

      const result = get_sorted_fields_for_display(fields, false);

      expect(result[0].field_name).toBe("avatar");
      expect(result[0].field_type).toBe("file");
    });
  });

  describe("get_input_type_for_field", () => {
    it("returns number for number fields", () => {
      const field = create_field_metadata({ field_type: "number" });
      expect(get_input_type_for_field(field)).toBe("number");
    });

    it("returns date for date fields", () => {
      const field = create_field_metadata({ field_type: "date" });
      expect(get_input_type_for_field(field)).toBe("date");
    });

    it("returns file for file fields", () => {
      const field = create_field_metadata({ field_type: "file" });
      expect(get_input_type_for_field(field)).toBe("file");
    });

    it("returns email for email field names", () => {
      const field = create_field_metadata({
        field_name: "email",
        field_type: "string",
      });
      expect(get_input_type_for_field(field)).toBe("email");
    });

    it("returns tel for phone field names", () => {
      const field = create_field_metadata({
        field_name: "phone",
        field_type: "string",
      });
      expect(get_input_type_for_field(field)).toBe("tel");
    });

    it("returns url for website field names", () => {
      const field = create_field_metadata({
        field_name: "website",
        field_type: "string",
      });
      expect(get_input_type_for_field(field)).toBe("url");
    });

    it("returns text for other string fields", () => {
      const field = create_field_metadata({
        field_name: "name",
        field_type: "string",
      });
      expect(get_input_type_for_field(field)).toBe("text");
    });
  });

  describe("validate_field_against_rules", () => {
    it("validates min_length rule", () => {
      const rules: ValidationRule[] = [
        { rule_type: "min_length", rule_value: 3, error_message: "Too short" },
      ];

      expect(validate_field_against_rules("ab", rules).is_valid).toBe(false);
      expect(validate_field_against_rules("abc", rules).is_valid).toBe(true);
      expect(validate_field_against_rules("abcd", rules).is_valid).toBe(true);
    });

    it("validates max_length rule", () => {
      const rules: ValidationRule[] = [
        { rule_type: "max_length", rule_value: 5, error_message: "Too long" },
      ];

      expect(validate_field_against_rules("abcdef", rules).is_valid).toBe(
        false,
      );
      expect(validate_field_against_rules("abcde", rules).is_valid).toBe(true);
      expect(validate_field_against_rules("abc", rules).is_valid).toBe(true);
    });

    it("validates min_value rule", () => {
      const rules: ValidationRule[] = [
        { rule_type: "min_value", rule_value: 10, error_message: "Too small" },
      ];

      expect(validate_field_against_rules(5, rules).is_valid).toBe(false);
      expect(validate_field_against_rules(10, rules).is_valid).toBe(true);
      expect(validate_field_against_rules(15, rules).is_valid).toBe(true);
    });

    it("validates max_value rule", () => {
      const rules: ValidationRule[] = [
        { rule_type: "max_value", rule_value: 100, error_message: "Too large" },
      ];

      expect(validate_field_against_rules(150, rules).is_valid).toBe(false);
      expect(validate_field_against_rules(100, rules).is_valid).toBe(true);
      expect(validate_field_against_rules(50, rules).is_valid).toBe(true);
    });

    it("validates pattern rule", () => {
      const rules: ValidationRule[] = [
        {
          rule_type: "pattern",
          rule_value: "^[A-Z]+$",
          error_message: "Must be uppercase",
        },
      ];

      expect(validate_field_against_rules("abc", rules).is_valid).toBe(false);
      expect(validate_field_against_rules("ABC", rules).is_valid).toBe(true);
    });

    it("returns valid when no rules fail", () => {
      const rules: ValidationRule[] = [];
      expect(validate_field_against_rules("anything", rules).is_valid).toBe(
        true,
      );
    });

    it("returns error message from failed rule", () => {
      const rules: ValidationRule[] = [
        {
          rule_type: "min_length",
          rule_value: 10,
          error_message: "Custom error message",
        },
      ];

      const result = validate_field_against_rules("short", rules);
      expect(result.is_valid).toBe(false);
      expect(result.error_message).toBe("Custom error message");
    });
  });

  describe("validate_form_data_against_metadata", () => {
    it("validates required fields", () => {
      const metadata = create_entity_metadata({
        fields: [
          create_field_metadata({
            field_name: "name",
            is_required: true,
            display_name: "Name",
          }),
        ],
      });

      const result = validate_form_data_against_metadata(
        { name: "" },
        metadata,
      );

      expect(result.is_valid).toBe(false);
      expect(result.errors["name"]).toBe("Name is required");
    });

    it("passes when required field has value", () => {
      const metadata = create_entity_metadata({
        fields: [
          create_field_metadata({ field_name: "name", is_required: true }),
        ],
      });

      const result = validate_form_data_against_metadata(
        { name: "Test" },
        metadata,
      );

      expect(result.is_valid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it("validates fields with validation rules", () => {
      const metadata = create_entity_metadata({
        fields: [
          create_field_metadata({
            field_name: "name",
            is_required: false,
            validation_rules: [
              {
                rule_type: "min_length",
                rule_value: 5,
                error_message: "Too short",
              },
            ],
          }),
        ],
      });

      const result = validate_form_data_against_metadata(
        { name: "ab" },
        metadata,
      );

      expect(result.is_valid).toBe(false);
      expect(result.errors["name"]).toBe("Too short");
    });

    it("skips validation rules for empty optional fields", () => {
      const metadata = create_entity_metadata({
        fields: [
          create_field_metadata({
            field_name: "name",
            is_required: false,
            validation_rules: [
              {
                rule_type: "min_length",
                rule_value: 5,
                error_message: "Too short",
              },
            ],
          }),
        ],
      });

      const result = validate_form_data_against_metadata(
        { name: "" },
        metadata,
      );

      expect(result.is_valid).toBe(true);
    });

    it("collects multiple errors", () => {
      const metadata = create_entity_metadata({
        fields: [
          create_field_metadata({
            field_name: "name",
            is_required: true,
            display_name: "Name",
          }),
          create_field_metadata({
            field_name: "email",
            is_required: true,
            display_name: "Email",
          }),
        ],
      });

      const result = validate_form_data_against_metadata(
        { name: "", email: "" },
        metadata,
      );

      expect(result.is_valid).toBe(false);
      expect(Object.keys(result.errors)).toHaveLength(2);
    });
  });

  describe("build_entity_display_label", () => {
    it("returns name when present", () => {
      const entity = {
        ...create_base_entity(),
        name: "Test Organization",
      } as any;
      expect(build_entity_display_label(entity)).toBe("Test Organization");
    });

    it("returns full name when first_name and last_name present", () => {
      const entity = {
        ...create_base_entity(),
        first_name: "John",
        last_name: "Doe",
      } as any;
      expect(build_entity_display_label(entity)).toBe("John Doe");
    });

    it("returns title when name not present", () => {
      const entity = { ...create_base_entity(), title: "Test Title" } as any;
      expect(build_entity_display_label(entity)).toBe("Test Title");
    });

    it("returns id when no display fields present", () => {
      const entity = create_base_entity({ id: "entity_123" });
      expect(build_entity_display_label(entity)).toBe("entity_123");
    });

    it("trims whitespace from name", () => {
      const entity = { ...create_base_entity(), name: "  Test  " } as any;
      expect(build_entity_display_label(entity)).toBe("  Test  ");
    });

    it("returns team names for fixtures when available", () => {
      const entity = {
        ...create_base_entity(),
        home_team_id: "team_1",
        away_team_id: "team_2",
        home_team_name: "Manchester United",
        away_team_name: "Liverpool",
      } as any;
      expect(build_entity_display_label(entity)).toBe(
        "Manchester United vs Liverpool",
      );
    });

    it("returns scheduled date for fixtures without team names", () => {
      const entity = {
        ...create_base_entity(),
        home_team_id: "team_1",
        away_team_id: "team_2",
        scheduled_date: "2024-03-15",
      } as any;
      expect(build_entity_display_label(entity)).toBe("Fixture (2024-03-15)");
    });

    it("returns round name for fixtures without team names or date", () => {
      const entity = {
        ...create_base_entity(),
        home_team_id: "team_1",
        away_team_id: "team_2",
        scheduled_date: "",
        round_name: "Quarter Finals",
      } as any;
      expect(build_entity_display_label(entity)).toBe(
        "Fixture (Quarter Finals)",
      );
    });

    it("returns shortened id for fixtures without any display data", () => {
      const entity = {
        ...create_base_entity({ id: "fixture_12345678_extra" }),
        home_team_id: "team_1",
        away_team_id: "team_2",
        scheduled_date: "",
        round_name: "",
      } as any;
      expect(build_entity_display_label(entity)).toBe("Fixture: fixture_");
    });
  });

  describe("get_display_value_for_foreign_key", () => {
    it("returns display label for found option", () => {
      const options = [
        { ...create_base_entity(), id: "opt_1", name: "Option 1" } as any,
        { ...create_base_entity(), id: "opt_2", name: "Option 2" } as any,
      ];

      const result = get_display_value_for_foreign_key(options, "opt_1");
      expect(result).toBe("Option 1");
    });

    it("returns value when option not found", () => {
      const options = [
        { ...create_base_entity(), id: "opt_1", name: "Option 1" } as any,
      ];

      const result = get_display_value_for_foreign_key(options, "not_found");
      expect(result).toBe("not_found");
    });

    it("handles empty value", () => {
      const options: BaseEntity[] = [];
      const result = get_display_value_for_foreign_key(options, "");
      expect(result).toBe("");
    });

    it("handles null value", () => {
      const options: BaseEntity[] = [];
      const result = get_display_value_for_foreign_key(options, null as any);
      expect(result).toBe("");
    });
  });

  describe("initialize_form_data_from_metadata", () => {
    it("initializes with default values for create mode", () => {
      const metadata = create_entity_metadata({
        fields: [
          create_field_metadata({ field_name: "name", field_type: "string" }),
          create_field_metadata({ field_name: "count", field_type: "number" }),
          create_field_metadata({
            field_name: "active",
            field_type: "boolean",
          }),
        ],
      });

      const result = initialize_form_data_from_metadata(metadata, null);

      expect(result.name).toBe("");
      expect(result.count).toBe(0);
      expect(result.active).toBe(false);
    });

    it("uses existing data for edit mode", () => {
      const metadata = create_entity_metadata({
        fields: [
          create_field_metadata({ field_name: "name", field_type: "string" }),
          create_field_metadata({ field_name: "count", field_type: "number" }),
        ],
      });
      const existing_data = { id: "123", name: "Existing", count: 42 } as any;

      const result = initialize_form_data_from_metadata(
        metadata,
        existing_data,
      );

      expect(result.name).toBe("Existing");
      expect(result.count).toBe(42);
    });

    it("uses default for missing fields in existing data", () => {
      const metadata = create_entity_metadata({
        fields: [
          create_field_metadata({ field_name: "name", field_type: "string" }),
          create_field_metadata({
            field_name: "new_field",
            field_type: "string",
          }),
        ],
      });
      const existing_data = { id: "123", name: "Existing" } as any;

      const result = initialize_form_data_from_metadata(
        metadata,
        existing_data,
      );

      expect(result.name).toBe("Existing");
      expect(result.new_field).toBe("");
    });
  });
});
