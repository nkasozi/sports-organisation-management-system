import { describe, expect, it } from "vitest";
import {
  validate_player_profile_input,
  create_empty_player_profile_input,
  generate_profile_slug,
} from "./PlayerProfile";

describe("PlayerProfile", () => {
  describe("create_empty_player_profile_input", () => {
    it("returns empty input with default values", () => {
      const input = create_empty_player_profile_input();

      expect(input.player_id).toBe("");
      expect(input.profile_summary).toBe("");
      expect(input.visibility).toBe("private");
      expect(input.profile_slug).toBe("");
      expect(input.featured_image_url).toBe("");
      expect(input.status).toBe("active");
    });

    it("accepts player_id parameter", () => {
      const input = create_empty_player_profile_input("player_123");

      expect(input.player_id).toBe("player_123");
    });
  });

  describe("generate_profile_slug", () => {
    it("generates slug from player name and id", () => {
      const slug = generate_profile_slug("John", "Doe", "player_default_1");

      expect(slug).toBe("john-doe-ault_1");
    });

    it("handles special characters in names", () => {
      const slug = generate_profile_slug(
        "O'Neil",
        "Smith-Jones",
        "player_default_2",
      );

      expect(slug).toBe("o-neil-smith-jones-ault_2");
    });

    it("removes consecutive hyphens", () => {
      const slug = generate_profile_slug(
        "  John  ",
        "  Doe  ",
        "player_default_3",
      );

      expect(slug).toBe("john-doe-ault_3");
    });

    it("removes leading and trailing hyphens", () => {
      const slug = generate_profile_slug("!John!", "!Doe!", "player_default_4");

      expect(slug).toBe("john-doe-ault_4");
    });

    it("uses last 6 characters of player_id", () => {
      const slug = generate_profile_slug(
        "Jane",
        "Smith",
        "player_verylongid_123",
      );

      expect(slug).toBe("jane-smith-id_123");
    });

    it("handles empty names", () => {
      const slug = generate_profile_slug("", "", "player_default_5");

      expect(slug).toBe("-ault_5");
    });

    it("converts to lowercase", () => {
      const slug = generate_profile_slug("JOHN", "DOE", "player_default_6");

      expect(slug).toBe("john-doe-ault_6");
    });
  });

  describe("validate_player_profile_input", () => {
    it("requires player_id for create input", () => {
      const input = create_empty_player_profile_input("");
      const result = validate_player_profile_input(input);

      expect(result.is_valid).toBe(false);
      expect(result.errors.player_id).toBe("Player is required");
    });

    it("accepts valid player_id", () => {
      const input = create_empty_player_profile_input("player_123");
      const result = validate_player_profile_input(input);

      expect(result.is_valid).toBe(true);
      expect(Object.keys(result.errors).length).toBe(0);
    });

    it("rejects empty player_id with whitespace", () => {
      const input = create_empty_player_profile_input("   ");
      const result = validate_player_profile_input(input);

      expect(result.is_valid).toBe(false);
      expect(result.errors.player_id).toBe("Player is required");
    });

    it("validates visibility values", () => {
      const input = {
        ...create_empty_player_profile_input("player_123"),
        visibility: "invalid" as any,
      };
      const result = validate_player_profile_input(input);

      expect(result.is_valid).toBe(false);
      expect(result.errors.visibility).toBe(
        "Visibility must be public or private",
      );
    });

    it("accepts public visibility", () => {
      const input = {
        ...create_empty_player_profile_input("player_123"),
        visibility: "public" as const,
      };
      const result = validate_player_profile_input(input);

      expect(result.is_valid).toBe(true);
    });

    it("accepts private visibility", () => {
      const input = {
        ...create_empty_player_profile_input("player_123"),
        visibility: "private" as const,
      };
      const result = validate_player_profile_input(input);

      expect(result.is_valid).toBe(true);
    });

    it("validates update input without player_id requirement", () => {
      const update_input = {
        profile_summary: "Updated summary",
        visibility: "public" as const,
      };
      const result = validate_player_profile_input(update_input);

      expect(result.is_valid).toBe(true);
      expect(Object.keys(result.errors).length).toBe(0);
    });

    it("allows empty profile_summary", () => {
      const input = {
        ...create_empty_player_profile_input("player_123"),
        profile_summary: "",
      };
      const result = validate_player_profile_input(input);

      expect(result.is_valid).toBe(true);
    });

    it("allows empty profile_slug", () => {
      const input = {
        ...create_empty_player_profile_input("player_123"),
        profile_slug: "",
      };
      const result = validate_player_profile_input(input);

      expect(result.is_valid).toBe(true);
    });

    it("allows empty featured_image_url", () => {
      const input = {
        ...create_empty_player_profile_input("player_123"),
        featured_image_url: "",
      };
      const result = validate_player_profile_input(input);

      expect(result.is_valid).toBe(true);
    });
  });
});
