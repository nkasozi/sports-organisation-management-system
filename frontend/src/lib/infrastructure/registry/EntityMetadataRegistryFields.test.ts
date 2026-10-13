import { describe, expect, it } from "vitest";

import { get_present_metadata } from "./EntityMetadataRegistry.test_support";

describe("EntityMetadataRegistry", () => {
  describe("field metadata structure", () => {
    it("organization has required name field", () => {
      const metadata = get_present_metadata("organization");
      const name_field = metadata.fields.find((f) => f.field_name === "name");

      expect(name_field).toBeDefined();
      expect(name_field?.is_required).toBe(true);
      expect(name_field?.field_type).toBe("string");
    });

    it("organization has foreign key to sport", () => {
      const metadata = get_present_metadata("organization");
      const sport_field = metadata.fields.find(
        (f) => f.field_name === "sport_id",
      );

      expect(sport_field).toBeDefined();
      expect(sport_field?.field_type).toBe("foreign_key");
      expect(sport_field?.foreign_key_entity).toBe("sport");
    });

    it("player has enum status field", () => {
      const metadata = get_present_metadata("player");
      const status_field = metadata.fields.find(
        (f) => f.field_name === "status",
      );

      expect(status_field).toBeDefined();
      expect(status_field?.field_type).toBe("enum");
      expect(status_field?.enum_values).toBeDefined();
      expect(status_field?.enum_values?.length).toBeGreaterThan(0);
    });

    it("player has date field for date_of_birth", () => {
      const metadata = get_present_metadata("player");
      const dob_field = metadata.fields.find(
        (f) => f.field_name === "date_of_birth",
      );

      expect(dob_field).toBeDefined();
      expect(dob_field?.field_type).toBe("date");
    });

    it("team has number field for founded_year", () => {
      const metadata = get_present_metadata("team");
      const founded_field = metadata.fields.find(
        (f) => f.field_name === "founded_year",
      );

      expect(founded_field).toBeDefined();
      expect(founded_field?.field_type).toBe("number");
    });

    it("fields marked show_in_list appear correctly", () => {
      const metadata = get_present_metadata("organization");
      const list_fields = metadata.fields.filter(
        (f) => f.show_in_list === true,
      );

      expect(list_fields?.length).toBeGreaterThan(0);

      const name_field = list_fields?.find((f) => f.field_name === "name");
      expect(name_field).toBeDefined();
    });
  });

  describe("validation rules", () => {
    it("organization name has min_length validation rule", () => {
      const metadata = get_present_metadata("organization");
      const name_field = metadata.fields.find((f) => f.field_name === "name");

      expect(name_field?.validation_rules).toBeDefined();
      const min_length_rule = name_field?.validation_rules?.find(
        (r) => r.rule_type === "min_length",
      );
      expect(min_length_rule).toBeDefined();
      expect(min_length_rule?.rule_value).toBeGreaterThan(0);
      expect(min_length_rule?.error_message).toBeDefined();
    });

    it("venue name has validation rules", () => {
      const metadata = get_present_metadata("venue");
      const name_field = metadata.fields.find((f) => f.field_name === "name");

      expect(name_field?.validation_rules).toBeDefined();
    });
  });

  describe("sub_entity fields", () => {
    it("player has identifications sub_entity field", () => {
      const metadata = get_present_metadata("player");
      const identifications_field = metadata.fields.find(
        (f) => f.field_name === "identifications",
      );

      expect(identifications_field).toBeDefined();
      expect(identifications_field?.field_type).toBe("sub_entity");
      expect(identifications_field?.sub_entity_config).toBeDefined();
      expect(identifications_field?.sub_entity_config?.child_entity_type).toBe(
        "identification",
      );
    });

    it("official has identifications sub_entity field", () => {
      const metadata = get_present_metadata("official");
      const identifications_field = metadata.fields.find(
        (f) => f.field_name === "identifications",
      );

      expect(identifications_field).toBeDefined();
      expect(identifications_field?.field_type).toBe("sub_entity");
      expect(identifications_field?.sub_entity_config?.child_entity_type).toBe(
        "identification",
      );
    });

    it("sub_entity config has required properties", () => {
      const metadata = get_present_metadata("player");
      const identifications_field = metadata.fields.find(
        (f) => f.field_name === "identifications",
      );

      const config = identifications_field?.sub_entity_config;
      expect(config?.child_entity_type).toBeDefined();
      expect(config?.foreign_key_field).toBeDefined();
    });
  });
});
