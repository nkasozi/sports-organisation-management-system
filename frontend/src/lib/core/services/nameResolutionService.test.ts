import { describe, it, expect, vi } from "vitest";
import {
  resolve_entity_name_to_id,
  resolve_multiple_names_to_ids,
  convert_name_column_to_id_column,
  is_name_column,
  extract_entity_type_from_name_column,
  is_id_column,
  extract_entity_type_from_id_column,
  looks_like_entity_id,
  looks_like_entity_name,
  type NameResolutionInput,
} from "./nameResolutionService";
import type { GenericEntityUseCases } from "$lib/infrastructure/registry/entityUseCasesRegistry";
import type { BaseEntity } from "$lib/core/entities/BaseEntity";

function create_mock_use_cases(list_response: {
  success: boolean;
  data?: BaseEntity[];
  error_message?: string;
}): GenericEntityUseCases<BaseEntity> {
  return {
    create: vi.fn(),
    get_by_id: vi.fn(),
    list: vi.fn().mockResolvedValue(list_response),
    update: vi.fn(),
    delete: vi.fn(),
  } as unknown as GenericEntityUseCases<BaseEntity>;
}

function create_mock_entity(id: string, name: string): BaseEntity {
  return {
    id,
    name,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: 1,
  } as BaseEntity;
}

describe("resolve_entity_name_to_id", () => {
  describe("successful resolution", () => {
    it("should return resolved ID when exact match found", async () => {
      const mock_entity = create_mock_entity("org_123", "Acme Sports Club");
      const use_cases = create_mock_use_cases({
        success: true,
        data: [mock_entity],
      });

      const input: NameResolutionInput = {
        entity_name: "Acme Sports Club",
        entity_type: "organization",
        use_cases,
      };

      const result = await resolve_entity_name_to_id(input);

      expect(result.success).toBe(true);
      expect(result.resolved_id).toBe("org_123");
      expect(result.error_message).toBeNull();
    });

    it("should match names case-insensitively", async () => {
      const mock_entity = create_mock_entity("org_456", "Manchester United");
      const use_cases = create_mock_use_cases({
        success: true,
        data: [mock_entity],
      });

      const input: NameResolutionInput = {
        entity_name: "manchester united",
        entity_type: "organization",
        use_cases,
      };

      const result = await resolve_entity_name_to_id(input);

      expect(result.success).toBe(true);
      expect(result.resolved_id).toBe("org_456");
    });

    it("should trim whitespace from name before matching", async () => {
      const mock_entity = create_mock_entity("team_789", "FC Barcelona");
      const use_cases = create_mock_use_cases({
        success: true,
        data: [mock_entity],
      });

      const input: NameResolutionInput = {
        entity_name: "  FC Barcelona  ",
        entity_type: "team",
        use_cases,
      };

      const result = await resolve_entity_name_to_id(input);

      expect(result.success).toBe(true);
      expect(result.resolved_id).toBe("team_789");
    });

    it("should filter to exact match when partial matches exist", async () => {
      const exact_match = create_mock_entity("team_1", "Eagles");
      const partial_match = create_mock_entity("team_2", "Golden Eagles");
      const use_cases = create_mock_use_cases({
        success: true,
        data: [exact_match, partial_match],
      });

      const input: NameResolutionInput = {
        entity_name: "Eagles",
        entity_type: "team",
        use_cases,
      };

      const result = await resolve_entity_name_to_id(input);

      expect(result.success).toBe(true);
      expect(result.resolved_id).toBe("team_1");
    });
  });

  describe("no match found", () => {
    it("should return clear error when no entity matches", async () => {
      const use_cases = create_mock_use_cases({
        success: true,
        data: [],
      });

      const input: NameResolutionInput = {
        entity_name: "Nonexistent Team",
        entity_type: "team",
        use_cases,
      };

      const result = await resolve_entity_name_to_id(input);

      expect(result.success).toBe(false);
      expect(result.resolved_id).toBeNull();
      expect(result.error_message).toContain(
        'Error: No team found with name "Nonexistent Team"',
      );
      expect(result.error_message).toContain(
        "Solution: Verify the name spelling",
      );
      expect(result.error_message).toContain("team_id");
    });

    it("should return no match when only partial matches exist", async () => {
      const partial_match = create_mock_entity("team_2", "Golden Eagles FC");
      const use_cases = create_mock_use_cases({
        success: true,
        data: [partial_match],
      });

      const input: NameResolutionInput = {
        entity_name: "Eagles",
        entity_type: "team",
        use_cases,
      };

      const result = await resolve_entity_name_to_id(input);

      expect(result.success).toBe(false);
      expect(result.error_message).toContain(
        'No team found with name "Eagles"',
      );
    });
  });

  describe("multiple matches found", () => {
    it("should return error with match count when multiple exact matches exist", async () => {
      const match_1 = create_mock_entity("team_1", "United FC");
      const match_2 = create_mock_entity("team_2", "United FC");
      const use_cases = create_mock_use_cases({
        success: true,
        data: [match_1, match_2],
      });

      const input: NameResolutionInput = {
        entity_name: "United FC",
        entity_type: "team",
        use_cases,
      };

      const result = await resolve_entity_name_to_id(input);

      expect(result.success).toBe(false);
      expect(result.resolved_id).toBeNull();
      expect(result.error_message).toContain(
        'Multiple teams found with name "United FC"',
      );
      expect(result.error_message).toContain("2 matches");
      expect(result.error_message).toContain("team_1");
      expect(result.error_message).toContain("team_2");
      expect(result.error_message).toContain(
        "Solution: Use the ID column (team_id)",
      );
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

      const input: NameResolutionInput = {
        entity_name: "Sports Club",
        entity_type: "organization",
        use_cases,
      };

      const result = await resolve_entity_name_to_id(input);

      expect(result.success).toBe(false);
      expect(result.error_message).toContain("4 matches");
      expect(result.error_message).toContain("org_1, org_2, org_3...");
      expect(result.error_message).not.toContain("org_4");
    });
  });

  describe("empty or invalid input", () => {
    it("should return error for empty name", async () => {
      const use_cases = create_mock_use_cases({ success: true, data: [] });

      const input: NameResolutionInput = {
        entity_name: "",
        entity_type: "organization",
        use_cases,
      };

      const result = await resolve_entity_name_to_id(input);

      expect(result.success).toBe(false);
      expect(result.error_message).toContain(
        "Error: Empty name provided for organization",
      );
      expect(result.error_message).toContain("organization_id");
    });

    it("should return error for whitespace-only name", async () => {
      const use_cases = create_mock_use_cases({ success: true, data: [] });

      const input: NameResolutionInput = {
        entity_name: "   ",
        entity_type: "team",
        use_cases,
      };

      const result = await resolve_entity_name_to_id(input);

      expect(result.success).toBe(false);
      expect(result.error_message).toContain("Empty name provided for team");
    });
  });

  describe("API error handling", () => {
    it("should return error when list API fails", async () => {
      const use_cases = create_mock_use_cases({
        success: false,
        error_message: "Database connection failed",
      });

      const input: NameResolutionInput = {
        entity_name: "Test Team",
        entity_type: "team",
        use_cases,
      };

      const result = await resolve_entity_name_to_id(input);

      expect(result.success).toBe(false);
      expect(result.error_message).toContain("Failed to search for team");
      expect(result.error_message).toContain("Database connection failed");
    });
  });
});

describe("resolve_multiple_names_to_ids", () => {
  it("should resolve multiple names in batch", async () => {
    const org_entity = create_mock_entity("org_1", "Main Organization");
    const team_entity = create_mock_entity("team_1", "First Team");

    const org_use_cases = create_mock_use_cases({
      success: true,
      data: [org_entity],
    });
    const team_use_cases = create_mock_use_cases({
      success: true,
      data: [team_entity],
    });

    const requests: NameResolutionInput[] = [
      {
        entity_name: "Main Organization",
        entity_type: "organization",
        use_cases: org_use_cases,
      },
      {
        entity_name: "First Team",
        entity_type: "team",
        use_cases: team_use_cases,
      },
    ];

    const results = await resolve_multiple_names_to_ids(requests);

    expect(results.size).toBe(2);
    expect(results.get("organization:Main Organization")?.success).toBe(true);
    expect(results.get("organization:Main Organization")?.resolved_id).toBe(
      "org_1",
    );
    expect(results.get("team:First Team")?.success).toBe(true);
    expect(results.get("team:First Team")?.resolved_id).toBe("team_1");
  });

  it("should include failures in batch results", async () => {
    const org_entity = create_mock_entity("org_1", "Found Org");
    const org_use_cases = create_mock_use_cases({
      success: true,
      data: [org_entity],
    });
    const team_use_cases = create_mock_use_cases({
      success: true,
      data: [],
    });

    const requests: NameResolutionInput[] = [
      {
        entity_name: "Found Org",
        entity_type: "organization",
        use_cases: org_use_cases,
      },
      {
        entity_name: "Missing Team",
        entity_type: "team",
        use_cases: team_use_cases,
      },
    ];

    const results = await resolve_multiple_names_to_ids(requests);

    expect(results.get("organization:Found Org")?.success).toBe(true);
    expect(results.get("team:Missing Team")?.success).toBe(false);
  });
});

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
