import { describe, expect, it } from "vitest";

import { entityMetadataRegistry } from "./EntityMetadataRegistry";
import { get_present_metadata } from "./EntityMetadataRegistry.test_support";

describe("EntityMetadataRegistry", () => {
  describe("consistency checks", () => {
    it("all entities have at least one field", () => {
      const entity_types = entityMetadataRegistry.get_all_entity_types();

      for (const entity_type of entity_types) {
        const metadata = get_present_metadata(entity_type);
        expect(metadata.fields.length).toBeGreaterThan(0);
      }
    });

    it("all foreign_key fields have foreign_key_entity defined", () => {
      const entity_types = entityMetadataRegistry.get_all_entity_types();

      for (const entity_type of entity_types) {
        const metadata = get_present_metadata(entity_type);
        const foreign_key_fields = metadata.fields.filter(
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
        const metadata = get_present_metadata(entity_type);
        const enum_fields = metadata.fields.filter(
          (f) => f.field_type === "enum",
        );

        for (const field of enum_fields || []) {
          const has_enum_values =
            field.enum_values && field.enum_values.length > 0;
          const has_enum_options =
            field.enum_options && field.enum_options.length > 0;
          const has_enum_dependency = field.enum_dependency != void 0;

          expect(
            has_enum_values || has_enum_options || has_enum_dependency,
          ).toBe(true);
        }
      }
    });

    it("all sub_entity fields have sub_entity_config defined", () => {
      const entity_types = entityMetadataRegistry.get_all_entity_types();

      for (const entity_type of entity_types) {
        const metadata = get_present_metadata(entity_type);
        const sub_entity_fields = metadata.fields.filter(
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
        const metadata = get_present_metadata(entity_type);
        expect(metadata.entity_name).toBe(entity_type);
      }
    });

    it("all required fields have is_required set to true", () => {
      const entity_types = entityMetadataRegistry.get_all_entity_types();

      for (const entity_type of entity_types) {
        const metadata = get_present_metadata(entity_type);
        const required_fields = metadata.fields.filter((f) => f.is_required);

        for (const field of required_fields || []) {
          expect(field.is_required).toBe(true);
        }
      }
    });
  });
});
