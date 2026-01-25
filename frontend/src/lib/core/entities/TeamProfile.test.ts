import { describe, expect, it } from "vitest";
import {
  validate_team_profile_input,
  create_empty_team_profile_input,
  generate_team_profile_slug,
} from "./TeamProfile";

describe("TeamProfile", () => {
  describe("create_empty_team_profile_input", () => {
    it("returns empty input with default values", () => {
      const input = create_empty_team_profile_input();

      expect(input.team_id).toBe("");
      expect(input.profile_summary).toBe("");
      expect(input.visibility).toBe("private");
      expect(input.profile_slug).toBe("");
      expect(input.featured_image_url).toBe("");
      expect(input.status).toBe("active");
    });

    it("accepts team_id parameter", () => {
      const input = create_empty_team_profile_input("team_123");

      expect(input.team_id).toBe("team_123");
    });
  });

  describe("generate_team_profile_slug", () => {
    it("generates slug from team name and id", () => {
      const slug = generate_team_profile_slug(
        "Red Dragons FC",
        "team_default_1",
      );

      expect(slug).toBe("red-dragons-fc-ault_1");
    });

    it("handles special characters in team name", () => {
      const slug = generate_team_profile_slug(
        "Team's & Name!",
        "team_default_2",
      );

      expect(slug).toBe("team-s-name-ault_2");
    });

    it("removes consecutive hyphens", () => {
      const slug = generate_team_profile_slug(
        "Team   Name   FC",
        "team_default_3",
      );

      expect(slug).toBe("team-name-fc-ault_3");
    });

    it("removes leading and trailing hyphens", () => {
      const slug = generate_team_profile_slug("  Team FC  ", "team_default_4");

      expect(slug).toBe("team-fc-ault_4");
    });

    it("uses last 6 characters of team_id", () => {
      const slug = generate_team_profile_slug(
        "Test Team",
        "team_verylongid_123",
      );

      expect(slug).toBe("test-team-id_123");
    });

    it("handles empty team name", () => {
      const slug = generate_team_profile_slug("", "team_default_5");

      expect(slug).toBe("-ault_5");
    });
  });

  describe("validate_team_profile_input", () => {
    it("requires team_id for create input", () => {
      const input = create_empty_team_profile_input("");
      const result = validate_team_profile_input(input);

      expect(result.is_valid).toBe(false);
      expect(result.errors.team_id).toBe("Team is required");
    });

    it("accepts valid team_id", () => {
      const input = create_empty_team_profile_input("team_123");
      const result = validate_team_profile_input(input);

      expect(result.is_valid).toBe(true);
      expect(Object.keys(result.errors).length).toBe(0);
    });

    it("rejects empty team_id with whitespace", () => {
      const input = create_empty_team_profile_input("   ");
      const result = validate_team_profile_input(input);

      expect(result.is_valid).toBe(false);
      expect(result.errors.team_id).toBe("Team is required");
    });

    it("validates visibility values", () => {
      const input = {
        ...create_empty_team_profile_input("team_123"),
        visibility: "invalid" as any,
      };
      const result = validate_team_profile_input(input);

      expect(result.is_valid).toBe(false);
      expect(result.errors.visibility).toBe(
        "Visibility must be public or private",
      );
    });

    it("accepts public visibility", () => {
      const input = {
        ...create_empty_team_profile_input("team_123"),
        visibility: "public" as const,
      };
      const result = validate_team_profile_input(input);

      expect(result.is_valid).toBe(true);
    });

    it("accepts private visibility", () => {
      const input = {
        ...create_empty_team_profile_input("team_123"),
        visibility: "private" as const,
      };
      const result = validate_team_profile_input(input);

      expect(result.is_valid).toBe(true);
    });

    it("validates update input without team_id requirement", () => {
      const update_input = {
        profile_summary: "Updated summary",
        visibility: "public" as const,
      };
      const result = validate_team_profile_input(update_input);

      expect(result.is_valid).toBe(true);
      expect(Object.keys(result.errors).length).toBe(0);
    });

    it("allows empty profile_summary", () => {
      const input = {
        ...create_empty_team_profile_input("team_123"),
        profile_summary: "",
      };
      const result = validate_team_profile_input(input);

      expect(result.is_valid).toBe(true);
    });

    it("allows empty profile_slug", () => {
      const input = {
        ...create_empty_team_profile_input("team_123"),
        profile_slug: "",
      };
      const result = validate_team_profile_input(input);

      expect(result.is_valid).toBe(true);
    });

    it("allows empty featured_image_url", () => {
      const input = {
        ...create_empty_team_profile_input("team_123"),
        featured_image_url: "",
      };
      const result = validate_team_profile_input(input);

      expect(result.is_valid).toBe(true);
    });
  });
});
