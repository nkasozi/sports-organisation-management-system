import { describe, expect, it } from "vitest";

import {
  type NameResolutionInput,
  resolve_entity_name_to_id,
} from "./nameResolutionService";
import {
  create_mock_entity,
  create_mock_use_cases,
  expect_failed_resolution,
} from "./nameResolutionService.test_support";

describe("resolve_entity_name_to_id", () => {
  describe("multiple matches found", () => {
    it("should return error with match count when multiple exact matches exist", async () => {
      const match_1 = create_mock_entity("team_1", "United FC");
      const match_2 = create_mock_entity("team_2", "United FC");
      const use_cases = create_mock_use_cases({
        success: true,
        data: [match_1, match_2],
      });

      const input = {
        entity_name: "United FC",
        entity_type: "team",
        use_cases,
      } as NameResolutionInput;

      const result = await resolve_entity_name_to_id(input);

      const error_message = expect_failed_resolution(result);

      expect(error_message).toContain(
        'Multiple teams found with name "United FC"',
      );
      expect(error_message).toContain("2 matches");
      expect(error_message).toContain("team_1");
      expect(error_message).toContain("team_2");
      expect(error_message).toContain("Solution: Use the ID column (team_id)");
    });

    it("should truncate ID list when more than 3 matches", async () => {
      const matches = [
        create_mock_entity("org_1", "Sports Club"),
        create_mock_entity("org_2", "Sports Club"),
        create_mock_entity("org_3", "Sports Club"),
        create_mock_entity("org_4", "Sports Club"),
      ];
      const use_cases = create_mock_use_cases({
        success: true,
        data: matches,
      });

      const input = {
        entity_name: "Sports Club",
        entity_type: "organization",
        use_cases,
      } as NameResolutionInput;

      const result = await resolve_entity_name_to_id(input);

      const error_message = expect_failed_resolution(result);

      expect(error_message).toContain("4 matches");
      expect(error_message).toContain("org_1, org_2, org_3...");
      expect(error_message).not.toContain("org_4");
    });
  });

  describe("empty or invalid input", () => {
    it("should return error for empty name", async () => {
      const use_cases = create_mock_use_cases({ success: true, data: [] });

      const input = {
        entity_name: "",
        entity_type: "organization",
        use_cases,
      } as NameResolutionInput;

      const result = await resolve_entity_name_to_id(input);

      const error_message = expect_failed_resolution(result);

      expect(error_message).toContain(
        "Error: Empty name provided for organization",
      );
      expect(error_message).toContain("organization_id");
    });

    it("should return error for whitespace-only name", async () => {
      const use_cases = create_mock_use_cases({ success: true, data: [] });

      const input = {
        entity_name: "   ",
        entity_type: "team",
        use_cases,
      } as NameResolutionInput;

      const result = await resolve_entity_name_to_id(input);

      const error_message = expect_failed_resolution(result);

      expect(error_message).toContain("Empty name provided for team");
    });
  });

  describe("API error handling", () => {
    it("should return error when list API fails", async () => {
      const use_cases = create_mock_use_cases({
        success: false,
        error_message: "Database connection failed",
      });

      const input = {
        entity_name: "Test Team",
        entity_type: "team",
        use_cases,
      } as NameResolutionInput;

      const result = await resolve_entity_name_to_id(input);

      const error_message = expect_failed_resolution(result);

      expect(error_message).toContain("Failed to search for team");
      expect(error_message).toContain("Database connection failed");
    });
  });
});
