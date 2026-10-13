import { beforeEach, describe, expect, it, vi } from "vitest";

import type { TeamProfileRepository } from "../interfaces/ports";
import type { QueryOptions } from "../interfaces/ports";
import { create_failure_result, create_success_result } from "../types/Result";
import {
  USE_CASE_ERROR_MESSAGES,
  UseCaseErrorCode,
} from "../types/UseCaseFailure";
import { create_team_profile_use_cases } from "./TeamProfileUseCases";
import {
  create_mock_repository,
  create_mock_team_profile,
  create_paginated_result,
  expect_success,
} from "./TeamProfileUseCases.test_support";

describe("TeamProfileUseCases", () => {
  let mock_repository: TeamProfileRepository;
  let use_cases: ReturnType<typeof create_team_profile_use_cases>;

  beforeEach(() => {
    mock_repository = create_mock_repository();
    use_cases = create_team_profile_use_cases(mock_repository);
  });

  describe("list", () => {
    it("returns all team profiles when no filter provided", async () => {
      const mock_profiles = [
        create_mock_team_profile({ id: "tp1" }),
        create_mock_team_profile({ id: "tp2" }),
      ];
      vi.mocked(mock_repository.find_all).mockResolvedValue(
        create_paginated_result(mock_profiles),
      );

      const result = await use_cases.list();

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.items).toHaveLength(2);
      expect(result.data.total_count).toBe(2);
      expect(mock_repository.find_all).toHaveBeenCalledOnce();
    });

    it("filters by team_id", async () => {
      const mock_profiles = [create_mock_team_profile({ team_id: "team_1" })];
      vi.mocked(mock_repository.find_all).mockResolvedValue(
        create_paginated_result(mock_profiles),
      );

      const result = await use_cases.list({ team_id: "team_1" });

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.items).toHaveLength(1);
      expect(mock_repository.find_all).toHaveBeenCalledWith(
        expect.objectContaining({ team_id: "team_1" }),
        {},
      );
    });

    it("filters by visibility", async () => {
      const mock_profiles = [
        create_mock_team_profile({ visibility: "public" }),
      ];
      vi.mocked(mock_repository.find_all).mockResolvedValue(
        create_paginated_result(mock_profiles),
      );

      const result = await use_cases.list({ visibility: "public" });

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.items).toHaveLength(1);
      expect(mock_repository.find_all).toHaveBeenCalledWith(
        expect.objectContaining({ visibility: "public" }),
        {},
      );
    });

    it("passes query options to repository", async () => {
      vi.mocked(mock_repository.find_all).mockResolvedValue(
        create_paginated_result([]),
      );

      const options = { page_number: 2, page_size: 20 } as QueryOptions;
      const call_result = await use_cases.list({}, options);
      expect(call_result.success).toBe(true);

      expect(mock_repository.find_all).toHaveBeenCalledWith({}, options);
    });

    it("handles repository failure", async () => {
      vi.mocked(mock_repository.find_all).mockResolvedValue(
        create_failure_result("Database error"),
      );

      const result = await use_cases.list();

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toBe(
        USE_CASE_ERROR_MESSAGES[UseCaseErrorCode.DEPENDENCY_FAILED],
      );
    });
  });

  describe("get_by_id", () => {
    it("returns team profile by id", async () => {
      const mock_profile = create_mock_team_profile({ id: "tp_123" });
      vi.mocked(mock_repository.find_by_id).mockResolvedValue(
        create_success_result(mock_profile),
      );

      const result = await use_cases.get_by_id("tp_123");

      expect(result.success).toBe(true);
      expect(expect_success(result).id).toBe("tp_123");
      expect(mock_repository.find_by_id).toHaveBeenCalledWith("tp_123");
    });

    it("returns failure when id is empty", async () => {
      const result = await use_cases.get_by_id("");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Profile ID is required");
      }
      expect(mock_repository.find_by_id).not.toHaveBeenCalled();
    });

    it("returns failure when id is whitespace", async () => {
      const result = await use_cases.get_by_id("   ");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Profile ID is required");
      }
    });

    it("handles repository failure", async () => {
      vi.mocked(mock_repository.find_by_id).mockResolvedValue(
        create_failure_result("Profile not found"),
      );

      const result = await use_cases.get_by_id("tp_123");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(
          USE_CASE_ERROR_MESSAGES[UseCaseErrorCode.NOT_FOUND],
        );
      }
    });
  });
});
