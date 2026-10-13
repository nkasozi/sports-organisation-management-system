import { describe, expect, it } from "vitest";

import {
  type NameResolutionInput,
  resolve_entity_name_to_id,
} from "./nameResolutionService";
import {
  create_mock_entity,
  create_mock_use_cases,
  expect_failed_resolution,
  expect_successful_resolution,
} from "./nameResolutionService.test_support";

describe("resolve_entity_name_to_id", () => {
  describe("successful resolution", () => {
    it("should return resolved ID when exact match found", async () => {
      const mock_entity = create_mock_entity("org_123", "Acme Sports Club");
      const use_cases = create_mock_use_cases({
        success: true,
        data: [mock_entity],
      });

      const input = {
        entity_name: "Acme Sports Club",
        entity_type: "organization",
        use_cases,
      } as NameResolutionInput;

      const result = await resolve_entity_name_to_id(input);

      expect_successful_resolution(result, "org_123");
    });

    it("should match names case-insensitively", async () => {
      const mock_entity = create_mock_entity("org_456", "Manchester United");
      const use_cases = create_mock_use_cases({
        success: true,
        data: [mock_entity],
      });

      const input = {
        entity_name: "manchester united",
        entity_type: "organization",
        use_cases,
      } as NameResolutionInput;

      const result = await resolve_entity_name_to_id(input);

      expect_successful_resolution(result, "org_456");
    });

    it("should trim whitespace from name before matching", async () => {
      const mock_entity = create_mock_entity("team_789", "FC Barcelona");
      const use_cases = create_mock_use_cases({
        success: true,
        data: [mock_entity],
      });

      const input = {
        entity_name: "  FC Barcelona  ",
        entity_type: "team",
        use_cases,
      } as NameResolutionInput;

      const result = await resolve_entity_name_to_id(input);

      expect_successful_resolution(result, "team_789");
    });

    it("should filter to exact match when partial matches exist", async () => {
      const exact_match = create_mock_entity("team_1", "Eagles");
      const partial_match = create_mock_entity("team_2", "Golden Eagles");
      const use_cases = create_mock_use_cases({
        success: true,
        data: [exact_match, partial_match],
      });

      const input = {
        entity_name: "Eagles",
        entity_type: "team",
        use_cases,
      } as NameResolutionInput;

      const result = await resolve_entity_name_to_id(input);

      expect_successful_resolution(result, "team_1");
    });
  });

  describe("no match found", () => {
    it("should return clear error when no entity matches", async () => {
      const use_cases = create_mock_use_cases({
        success: true,
        data: [],
      });

      const input = {
        entity_name: "Nonexistent Team",
        entity_type: "team",
        use_cases,
      } as NameResolutionInput;

      const result = await resolve_entity_name_to_id(input);

      const error_message = expect_failed_resolution(result);

      expect(error_message).toContain(
        'Error: No team found with name "Nonexistent Team"',
      );
      expect(error_message).toContain("Solution: Verify the name spelling");
      expect(error_message).toContain("team_id");
    });

    it("should return no match when only partial matches exist", async () => {
      const partial_match = create_mock_entity("team_2", "Golden Eagles FC");
      const use_cases = create_mock_use_cases({
        success: true,
        data: [partial_match],
      });

      const input = {
        entity_name: "Eagles",
        entity_type: "team",
        use_cases,
      } as NameResolutionInput;

      const result = await resolve_entity_name_to_id(input);

      const error_message = expect_failed_resolution(result);

      expect(error_message).toContain('No team found with name "Eagles"');
    });
  });
});
