import { beforeEach, describe, expect, it, vi } from "vitest";

import type { TeamRepository } from "../interfaces/ports";
import {
  USE_CASE_ERROR_MESSAGES,
  UseCaseErrorCode,
} from "../types/UseCaseFailure";
import { create_team_use_cases } from "./TeamUseCases";
import {
  create_mock_repository,
  create_mock_team,
  create_valid_team_input,
} from "./TeamUseCases.test_support";

describe("TeamUseCases", () => {
  let mock_repository: TeamRepository;
  let use_cases: ReturnType<typeof create_team_use_cases>;

  beforeEach(() => {
    mock_repository = create_mock_repository();
    use_cases = create_team_use_cases(mock_repository);
  });

  describe("create", () => {
    it("creates team with valid input", async () => {
      const input = create_valid_team_input();
      const created_team = create_mock_team({ ...input, id: "new_team" });
      vi.mocked(mock_repository.create).mockResolvedValue({
        success: true,
        data: created_team,
      });

      const result = await use_cases.create(input);

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data?.id).toBe("new_team");
      expect(mock_repository.create).toHaveBeenCalledWith(input);
    });

    it("returns validation error when name is too short", async () => {
      const input = create_valid_team_input({ name: "A" });

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toContain("Team name must be at least 2 characters");
      expect(mock_repository.create).not.toHaveBeenCalled();
    });

    it("returns validation error when name is missing", async () => {
      const input = create_valid_team_input({ name: "" });

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toContain("Team name must be at least 2 characters");
    });

    it("returns validation error when organization is missing", async () => {
      const input = create_valid_team_input({ organization_id: "" });

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toContain("Organization is required");
    });

    it("returns validation error when max squad size is less than 1", async () => {
      const input = create_valid_team_input({ max_squad_size: 0 });

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toContain("Maximum squad size must be at least 1");
    });

    it("returns validation error when constrained scalar fields are invalid", async () => {
      const input = create_valid_team_input({
        primary_color: "blue",
        website: "javascript:alert(1)",
        founded_year: 999,
      });

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toContain("Primary color must be a valid hex color");
      expect(result.error).toContain("Website URL is invalid");
      expect(result.error).toContain("Founded year is invalid");
    });

    it("returns multiple validation errors when multiple fields are invalid", async () => {
      const input = create_valid_team_input({
        name: "",
        organization_id: "",
        max_squad_size: 0,
      });

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toContain("Team name must be at least 2 characters");
      expect(result.error).toContain("Organization is required");
      expect(result.error).toContain("Maximum squad size must be at least 1");
    });

    it("returns error when repository fails", async () => {
      const input = create_valid_team_input();
      vi.mocked(mock_repository.create).mockResolvedValue({
        success: false,
        error: "Database error",
      });

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toBe(
        USE_CASE_ERROR_MESSAGES[UseCaseErrorCode.DEPENDENCY_FAILED],
      );
    });
  });
});
