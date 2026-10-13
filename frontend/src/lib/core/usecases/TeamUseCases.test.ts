import { beforeEach, describe, expect, it, vi } from "vitest";

import type { TeamFilter, TeamRepository } from "../interfaces/ports";
import {
  USE_CASE_ERROR_MESSAGES,
  UseCaseErrorCode,
} from "../types/UseCaseFailure";
import { create_team_use_cases } from "./TeamUseCases";
import {
  create_mock_repository,
  create_mock_team,
  create_paginated_result,
} from "./TeamUseCases.test_support";

describe("TeamUseCases", () => {
  let mock_repository: TeamRepository;
  let use_cases: ReturnType<typeof create_team_use_cases>;

  beforeEach(() => {
    mock_repository = create_mock_repository();
    use_cases = create_team_use_cases(mock_repository);
  });

  describe("list", () => {
    it("returns all teams when no filter provided", async () => {
      const mock_teams = [
        create_mock_team({ id: "t1" }),
        create_mock_team({ id: "t2" }),
      ];
      vi.mocked(mock_repository.find_all).mockResolvedValue(
        create_paginated_result(mock_teams),
      );

      const result = await use_cases.list();

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.items).toHaveLength(2);
      expect(result.data.total_count).toBe(2);
      expect(mock_repository.find_all).toHaveBeenCalledOnce();
    });

    it("returns filtered teams when filter provided", async () => {
      const mock_teams = [
        create_mock_team({ id: "t1", organization_id: "org_1" }),
      ];
      const filter = { organization_id: "org_1" } as TeamFilter;
      vi.mocked(mock_repository.find_all).mockResolvedValue(
        create_paginated_result(mock_teams),
      );

      const result = await use_cases.list(filter);

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.items).toHaveLength(1);
      expect(mock_repository.find_all).toHaveBeenCalledWith(filter, {});
    });

    it("returns empty array with error message when repository fails", async () => {
      vi.mocked(mock_repository.find_all).mockResolvedValue({
        success: false,
        error: "Database connection failed",
      });

      const result = await use_cases.list();

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toBe(
        USE_CASE_ERROR_MESSAGES[UseCaseErrorCode.DEPENDENCY_FAILED],
      );
    });
  });

  describe("get_by_id", () => {
    it("returns team when found", async () => {
      const mock_team = create_mock_team({ id: "t1" });
      vi.mocked(mock_repository.find_by_id).mockResolvedValue({
        success: true,
        data: mock_team,
      });

      const result = await use_cases.get_by_id("t1");

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data?.id).toBe("t1");
      expect(mock_repository.find_by_id).toHaveBeenCalledWith("t1");
    });

    it("returns error when id is empty", async () => {
      const result = await use_cases.get_by_id("");

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toBe("Team ID is required");
      expect(mock_repository.find_by_id).not.toHaveBeenCalled();
    });

    it("returns error when id is whitespace only", async () => {
      const result = await use_cases.get_by_id("   ");

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toBe("Team ID is required");
    });
  });
});
