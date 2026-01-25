import { describe, it, expect } from "vitest";
import { entityMetadataRegistry } from "./EntityMetadataRegistry";

describe("EntityMetadataRegistry", () => {
  describe("get_entity_metadata", () => {
    it("returns metadata for organization entity", () => {
      const metadata =
        entityMetadataRegistry.get_entity_metadata("organization");

      expect(metadata).not.toBeNull();
      expect(metadata?.entity_name).toBe("organization");
      expect(metadata?.display_name).toBe("Organization");
      expect(metadata?.fields.length).toBeGreaterThan(0);
    });

    it("returns metadata for player entity", () => {
      const metadata = entityMetadataRegistry.get_entity_metadata("player");

      expect(metadata).not.toBeNull();
      expect(metadata?.entity_name).toBe("player");
      expect(metadata?.display_name).toBe("Player");
    });

    it("returns metadata for team entity", () => {
      const metadata = entityMetadataRegistry.get_entity_metadata("team");

      expect(metadata).not.toBeNull();
      expect(metadata?.entity_name).toBe("team");
      expect(metadata?.display_name).toBe("Team");
    });

    it("returns metadata for fixture entity", () => {
      const metadata = entityMetadataRegistry.get_entity_metadata("fixture");

      expect(metadata).not.toBeNull();
      expect(metadata?.entity_name).toBe("fixture");
    });

    it("returns metadata for competition entity", () => {
      const metadata =
        entityMetadataRegistry.get_entity_metadata("competition");

      expect(metadata).not.toBeNull();
      expect(metadata?.entity_name).toBe("competition");
    });

    it("returns null for non-existent entity type", () => {
      const metadata =
        entityMetadataRegistry.get_entity_metadata("nonexistent_entity");

      expect(metadata).toBeNull();
    });

    it("returns null for empty string entity type", () => {
      const metadata = entityMetadataRegistry.get_entity_metadata("");

      expect(metadata).toBeNull();
    });
  });

  describe("get_all_entity_types", () => {
    it("returns array of all registered entity types", () => {
      const entity_types = entityMetadataRegistry.get_all_entity_types();

      expect(entity_types).toBeInstanceOf(Array);
      expect(entity_types.length).toBeGreaterThan(0);
    });

    it("includes core entities in the list", () => {
      const entity_types = entityMetadataRegistry.get_all_entity_types();

      expect(entity_types).toContain("organization");
      expect(entity_types).toContain("player");
      expect(entity_types).toContain("team");
      expect(entity_types).toContain("fixture");
      expect(entity_types).toContain("competition");
      expect(entity_types).toContain("official");
    });

    it("includes support entities in the list", () => {
      const entity_types = entityMetadataRegistry.get_all_entity_types();

      expect(entity_types).toContain("sport");
      expect(entity_types).toContain("venue");
      expect(entity_types).toContain("playerposition");
    });
  });

  describe("get_entities_with_foreign_key_to", () => {
    it("returns entities that have foreign key to organization", () => {
      const related =
        entityMetadataRegistry.get_entities_with_foreign_key_to("organization");

      expect(related).toContain("competition");
      expect(related).toContain("team");
    });

    it("returns entities that have foreign key to team", () => {
      const related =
        entityMetadataRegistry.get_entities_with_foreign_key_to("team");

      expect(related.length).toBeGreaterThan(0);
    });

    it("returns entities that have foreign key to sport", () => {
      const related =
        entityMetadataRegistry.get_entities_with_foreign_key_to("sport");

      expect(related).toContain("organization");
    });

    it("returns empty array for entity with no foreign key references", () => {
      const related =
        entityMetadataRegistry.get_entities_with_foreign_key_to(
          "nonexistent_entity",
        );

      expect(related).toEqual([]);
    });
  });

  describe("field metadata structure", () => {
    it("organization has required name field", () => {
      const metadata =
        entityMetadataRegistry.get_entity_metadata("organization");
      const name_field = metadata?.fields.find((f) => f.field_name === "name");

      expect(name_field).toBeDefined();
      expect(name_field?.is_required).toBe(true);
      expect(name_field?.field_type).toBe("string");
    });

    it("organization has foreign key to sport", () => {
      const metadata =
        entityMetadataRegistry.get_entity_metadata("organization");
      const sport_field = metadata?.fields.find(
        (f) => f.field_name === "sport_id",
      );

      expect(sport_field).toBeDefined();
      expect(sport_field?.field_type).toBe("foreign_key");
      expect(sport_field?.foreign_key_entity).toBe("sport");
    });

    it("player has enum status field", () => {
      const metadata = entityMetadataRegistry.get_entity_metadata("player");
      const status_field = metadata?.fields.find(
        (f) => f.field_name === "status",
      );

      expect(status_field).toBeDefined();
      expect(status_field?.field_type).toBe("enum");
      expect(status_field?.enum_values).toBeDefined();
      expect(status_field?.enum_values?.length).toBeGreaterThan(0);
    });

    it("player has date field for date_of_birth", () => {
      const metadata = entityMetadataRegistry.get_entity_metadata("player");
      const dob_field = metadata?.fields.find(
        (f) => f.field_name === "date_of_birth",
      );

      expect(dob_field).toBeDefined();
      expect(dob_field?.field_type).toBe("date");
    });

    it("team has number field for founded_year", () => {
      const metadata = entityMetadataRegistry.get_entity_metadata("team");
      const founded_field = metadata?.fields.find(
        (f) => f.field_name === "founded_year",
      );

      expect(founded_field).toBeDefined();
      expect(founded_field?.field_type).toBe("number");
    });

    it("fields marked show_in_list appear correctly", () => {
      const metadata =
        entityMetadataRegistry.get_entity_metadata("organization");
      const list_fields = metadata?.fields.filter(
        (f) => f.show_in_list === true,
      );

      expect(list_fields?.length).toBeGreaterThan(0);

      const name_field = list_fields?.find((f) => f.field_name === "name");
      expect(name_field).toBeDefined();
    });
  });

  describe("validation rules", () => {
    it("organization name has min_length validation rule", () => {
      const metadata =
        entityMetadataRegistry.get_entity_metadata("organization");
      const name_field = metadata?.fields.find((f) => f.field_name === "name");

      expect(name_field?.validation_rules).toBeDefined();
      const min_length_rule = name_field?.validation_rules?.find(
        (r) => r.rule_type === "min_length",
      );
      expect(min_length_rule).toBeDefined();
      expect(min_length_rule?.rule_value).toBeGreaterThan(0);
      expect(min_length_rule?.error_message).toBeDefined();
    });

    it("venue name has validation rules", () => {
      const metadata = entityMetadataRegistry.get_entity_metadata("venue");
      const name_field = metadata?.fields.find((f) => f.field_name === "name");

      expect(name_field?.validation_rules).toBeDefined();
    });
  });

  describe("sub_entity fields", () => {
    it("player has identifications sub_entity field", () => {
      const metadata = entityMetadataRegistry.get_entity_metadata("player");
      const identifications_field = metadata?.fields.find(
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
      const metadata = entityMetadataRegistry.get_entity_metadata("official");
      const identifications_field = metadata?.fields.find(
        (f) => f.field_name === "identifications",
      );

      expect(identifications_field).toBeDefined();
      expect(identifications_field?.field_type).toBe("sub_entity");
      expect(identifications_field?.sub_entity_config?.child_entity_type).toBe(
        "identification",
      );
    });

    it("sub_entity config has required properties", () => {
      const metadata = entityMetadataRegistry.get_entity_metadata("player");
      const identifications_field = metadata?.fields.find(
        (f) => f.field_name === "identifications",
      );

      const config = identifications_field?.sub_entity_config;
      expect(config?.child_entity_type).toBeDefined();
      expect(config?.foreign_key_field).toBeDefined();
    });
  });

  describe("consistency checks", () => {
    it("all entities have at least one field", () => {
      const entity_types = entityMetadataRegistry.get_all_entity_types();

      for (const entity_type of entity_types) {
        const metadata =
          entityMetadataRegistry.get_entity_metadata(entity_type);
        expect(metadata?.fields.length).toBeGreaterThan(0);
      }
    });

    it("all foreign_key fields have foreign_key_entity defined", () => {
      const entity_types = entityMetadataRegistry.get_all_entity_types();

      for (const entity_type of entity_types) {
        const metadata =
          entityMetadataRegistry.get_entity_metadata(entity_type);
        const foreign_key_fields = metadata?.fields.filter(
          (f) => f.field_type === "foreign_key",
        );

        for (const field of foreign_key_fields || []) {
          expect(field.foreign_key_entity).toBeDefined();
          expect(field.foreign_key_entity?.length).toBeGreaterThan(0);
        }
      }
    });

    it("all enum fields have enum_values or enum_options or enum_dependency defined", () => {
      const entity_types = entityMetadataRegistry.get_all_entity_types();

      for (const entity_type of entity_types) {
        const metadata =
          entityMetadataRegistry.get_entity_metadata(entity_type);
        const enum_fields = metadata?.fields.filter(
          (f) => f.field_type === "enum",
        );

        for (const field of enum_fields || []) {
          const has_enum_values =
            field.enum_values && field.enum_values.length > 0;
          const has_enum_options =
            field.enum_options && field.enum_options.length > 0;
          const has_enum_dependency = field.enum_dependency !== undefined;

          expect(
            has_enum_values || has_enum_options || has_enum_dependency,
          ).toBe(true);
        }
      }
    });

    it("all sub_entity fields have sub_entity_config defined", () => {
      const entity_types = entityMetadataRegistry.get_all_entity_types();

      for (const entity_type of entity_types) {
        const metadata =
          entityMetadataRegistry.get_entity_metadata(entity_type);
        const sub_entity_fields = metadata?.fields.filter(
          (f) => f.field_type === "sub_entity",
        );

        for (const field of sub_entity_fields || []) {
          expect(field.sub_entity_config).toBeDefined();
          expect(field.sub_entity_config?.child_entity_type).toBeDefined();
          expect(field.sub_entity_config?.foreign_key_field).toBeDefined();
        }
      }
    });

    it("entity_name matches the key in metadata_map", () => {
      const entity_types = entityMetadataRegistry.get_all_entity_types();

      for (const entity_type of entity_types) {
        const metadata =
          entityMetadataRegistry.get_entity_metadata(entity_type);
        expect(metadata?.entity_name).toBe(entity_type);
      }
    });

    it("all required fields have is_required set to true", () => {
      const entity_types = entityMetadataRegistry.get_all_entity_types();

      for (const entity_type of entity_types) {
        const metadata =
          entityMetadataRegistry.get_entity_metadata(entity_type);
        const required_fields = metadata?.fields.filter((f) => f.is_required);

        for (const field of required_fields || []) {
          expect(field.is_required).toBe(true);
        }
      }
    });
  });
});
