import { describe, expect, it } from "vitest";

import {
  convert_name_column_to_id_column,
  extract_entity_type_from_id_column,
  extract_entity_type_from_name_column,
  is_id_column,
  is_name_column,
  looks_like_entity_id,
  looks_like_entity_name,
} from "./nameResolutionService";

describe("column name utilities", () => {
  describe("convert_name_column_to_id_column", () => {
    it("should convert _name suffix to _id suffix", () => {
      expect(convert_name_column_to_id_column("organization_name")).toBe(
        "organization_id",
      );
      expect(convert_name_column_to_id_column("team_name")).toBe("team_id");
      expect(convert_name_column_to_id_column("competition_name")).toBe(
        "competition_id",
      );
    });

    it("should return unchanged if not a name column", () => {
      expect(convert_name_column_to_id_column("organization_id")).toBe(
        "organization_id",
      );
      expect(convert_name_column_to_id_column("name")).toBe("name");
      expect(convert_name_column_to_id_column("player_count")).toBe(
        "player_count",
      );
    });
  });

  describe("is_name_column", () => {
    it("should return true for _name columns", () => {
      expect(is_name_column("organization_name")).toBe(true);
      expect(is_name_column("team_name")).toBe(true);
      expect(is_name_column("home_team_name")).toBe(true);
    });

    it("should return false for non-name columns", () => {
      expect(is_name_column("organization_id")).toBe(false);
      expect(is_name_column("name")).toBe(false);
      expect(is_name_column("team_id")).toBe(false);
    });
  });

  describe("extract_entity_type_from_name_column", () => {
    it("should extract entity type from name column", () => {
      expect(extract_entity_type_from_name_column("organization_name")).toBe(
        "organization",
      );
      expect(extract_entity_type_from_name_column("team_name")).toBe("team");
      expect(extract_entity_type_from_name_column("competition_name")).toBe(
        "competition",
      );
    });

    it("should return unchanged if not a name column", () => {
      expect(extract_entity_type_from_name_column("organization_id")).toBe(
        "organization_id",
      );
      expect(extract_entity_type_from_name_column("name")).toBe("name");
    });
  });

  describe("is_id_column", () => {
    it("should return true for _id columns", () => {
      expect(is_id_column("organization_id")).toBe(true);
      expect(is_id_column("team_id")).toBe(true);
      expect(is_id_column("competition_id")).toBe(true);
      expect(is_id_column("home_team_id")).toBe(true);
    });

    it("should return false for non-id columns", () => {
      expect(is_id_column("organization_name")).toBe(false);
      expect(is_id_column("name")).toBe(false);
      expect(is_id_column("id")).toBe(false);
    });
  });

  describe("extract_entity_type_from_id_column", () => {
    it("should extract entity type from id column", () => {
      expect(extract_entity_type_from_id_column("organization_id")).toBe(
        "organization",
      );
      expect(extract_entity_type_from_id_column("team_id")).toBe("team");
      expect(extract_entity_type_from_id_column("competition_id")).toBe(
        "competition",
      );
    });

    it("should return unchanged if not an id column", () => {
      expect(extract_entity_type_from_id_column("organization_name")).toBe(
        "organization_name",
      );
      expect(extract_entity_type_from_id_column("name")).toBe("name");
    });
  });

  describe("looks_like_entity_id", () => {
    it("should return true for timestamp-based IDs", () => {
      expect(
        looks_like_entity_id("competition-1737942651234-abc123def45"),
      ).toBe(true);
      expect(looks_like_entity_id("team-1234567890123-xyz789abc12")).toBe(true);
      expect(looks_like_entity_id("fixture-9876543210123-def456ghi78")).toBe(
        true,
      );
    });

    it("should return true for legacy default IDs", () => {
      expect(looks_like_entity_id("org_default_1")).toBe(true);
      expect(looks_like_entity_id("team_default_123")).toBe(true);
      expect(looks_like_entity_id("competition_default_5")).toBe(true);
    });

    it("should return false for names", () => {
      expect(
        looks_like_entity_id("International Field Hockey Championship 2026"),
      ).toBe(false);
      expect(looks_like_entity_id("Manchester United")).toBe(false);
      expect(looks_like_entity_id("Green Dragons")).toBe(false);
      expect(looks_like_entity_id("Test Team")).toBe(false);
    });

    it("should return false for empty or whitespace values", () => {
      expect(looks_like_entity_id("")).toBe(false);
      expect(looks_like_entity_id("   ")).toBe(false);
    });
  });

  describe("looks_like_entity_name", () => {
    it("should return true for names", () => {
      expect(
        looks_like_entity_name("International Field Hockey Championship 2026"),
      ).toBe(true);
      expect(looks_like_entity_name("Manchester United")).toBe(true);
      expect(looks_like_entity_name("Green Dragons")).toBe(true);
    });

    it("should return false for IDs", () => {
      expect(
        looks_like_entity_name("competition-1737942651234-abc123def45"),
      ).toBe(false);
      expect(looks_like_entity_name("org_default_1")).toBe(false);
    });

    it("should return false for empty values", () => {
      expect(looks_like_entity_name("")).toBe(false);
      expect(looks_like_entity_name("   ")).toBe(false);
    });
  });
});
