import { describe, expect, it } from "vitest";

import { entityMetadataRegistry } from "./EntityMetadataRegistry";
import { get_present_metadata } from "./EntityMetadataRegistry.test_support";

describe("EntityMetadataRegistry", () => {
  describe("get_entity_metadata", () => {
    it("returns metadata for organization entity", () => {
      const metadata = get_present_metadata("organization");

      expect(metadata.entity_name).toBe("organization");
      expect(metadata.display_name).toBe("Organization");
      expect(metadata.fields.length).toBeGreaterThan(0);
    });

    it("returns metadata for player entity", () => {
      const metadata = get_present_metadata("player");

      expect(metadata.entity_name).toBe("player");
      expect(metadata.display_name).toBe("Player");
    });

    it("returns metadata for team entity", () => {
      const metadata = get_present_metadata("team");

      expect(metadata.entity_name).toBe("team");
      expect(metadata.display_name).toBe("Team");
    });

    it("returns metadata for fixture entity", () => {
      const metadata = get_present_metadata("fixture");

      expect(metadata.entity_name).toBe("fixture");
    });

    it("fixture metadata includes a required stage field filtered by competition", () => {
      const metadata = get_present_metadata("fixture");
      const stage_field = metadata.fields.find(
        (f) => f.field_name === "stage_id",
      );

      expect(stage_field).toBeDefined();
      expect(stage_field?.is_required).toBe(true);
      expect(stage_field?.foreign_key_filter?.filter_type).toBe(
        "stages_from_competition",
      );
      expect(stage_field?.foreign_key_filter?.depends_on_field).toBe(
        "competition_id",
      );
    });

    it("returns metadata for competition entity", () => {
      const metadata = get_present_metadata("competition");

      expect(metadata.entity_name).toBe("competition");
    });

    it("returns false for non-existent entity type", () => {
      const metadata =
        entityMetadataRegistry.get_entity_metadata("nonexistent_entity");

      expect(metadata).toBe(false);
    });

    it("returns false for empty string entity type", () => {
      const metadata = entityMetadataRegistry.get_entity_metadata("");

      expect(metadata).toBe(false);
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
});
