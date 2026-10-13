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

  describe("get_by_team_id", () => {
    it("returns team profile by team_id", async () => {
      const mock_profile = create_mock_team_profile({ team_id: "team_abc" });
      vi.mocked(mock_repository.find_by_team_id).mockResolvedValue(
        create_success_result(mock_profile),
      );

      const result = await use_cases.get_by_team_id("team_abc");

      expect(result.success).toBe(true);
      expect(expect_success(result).team_id).toBe("team_abc");
      expect(mock_repository.find_by_team_id).toHaveBeenCalledWith("team_abc");
    });

    it("returns failure when team_id is empty", async () => {
      const result = await use_cases.get_by_team_id("");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Team ID is required");
      }
      expect(mock_repository.find_by_team_id).not.toHaveBeenCalled();
    });

    it("handles repository failure", async () => {
      vi.mocked(mock_repository.find_by_team_id).mockResolvedValue(
        create_failure_result("No profile found for team"),
      );

      const result = await use_cases.get_by_team_id("team_abc");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(
          USE_CASE_ERROR_MESSAGES[UseCaseErrorCode.NOT_FOUND],
        );
      }
    });
  });

  describe("get_by_slug", () => {
    it("returns team profile by slug", async () => {
      const mock_profile = create_mock_team_profile({
        profile_slug: "unique-slug",
      });
      vi.mocked(mock_repository.find_by_slug).mockResolvedValue(
        create_success_result(mock_profile),
      );

      const result = await use_cases.get_by_slug("unique-slug");

      expect(result.success).toBe(true);
      expect(expect_success(result).profile_slug).toBe("unique-slug");
      expect(mock_repository.find_by_slug).toHaveBeenCalledWith("unique-slug");
    });

    it("returns failure when slug is empty", async () => {
      const result = await use_cases.get_by_slug("");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Profile slug is required");
      }
      expect(mock_repository.find_by_slug).not.toHaveBeenCalled();
    });

    it("handles repository failure", async () => {
      vi.mocked(mock_repository.find_by_slug).mockResolvedValue(
        create_failure_result("No profile found with slug"),
      );

      const result = await use_cases.get_by_slug("nonexistent");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(
          USE_CASE_ERROR_MESSAGES[UseCaseErrorCode.NOT_FOUND],
        );
      }
    });
  });

  describe("list_public_profiles", () => {
    it("returns only public profiles", async () => {
      const mock_profiles = [
        create_mock_team_profile({ visibility: "public" }),
      ];
      vi.mocked(mock_repository.find_public_profiles).mockResolvedValue(
        create_paginated_result(mock_profiles),
      );

      const result = await use_cases.list_public_profiles();

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.items).toHaveLength(1);
      expect(mock_repository.find_public_profiles).toHaveBeenCalledOnce();
    });

    it("passes query options to repository", async () => {
      vi.mocked(mock_repository.find_public_profiles).mockResolvedValue(
        create_paginated_result([]),
      );

      const options = { page_number: 2, page_size: 20 } as QueryOptions;
      const call_result = await use_cases.list_public_profiles(options);
      expect(call_result.success).toBe(true);

      expect(mock_repository.find_public_profiles).toHaveBeenCalledWith(
        options,
      );
    });

    it("handles repository failure", async () => {
      vi.mocked(mock_repository.find_public_profiles).mockResolvedValue(
        create_failure_result("Database error"),
      );

      const result = await use_cases.list_public_profiles();

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toBe(
        USE_CASE_ERROR_MESSAGES[UseCaseErrorCode.DEPENDENCY_FAILED],
      );
    });
  });
});
