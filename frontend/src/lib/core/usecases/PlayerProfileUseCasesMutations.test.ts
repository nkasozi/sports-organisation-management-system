import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PlayerProfileRepository } from "../interfaces/ports";
import { create_failure_result, create_success_result } from "../types/Result";
import {
  USE_CASE_ERROR_MESSAGES,
  UseCaseErrorCode,
} from "../types/UseCaseFailure";
import { create_player_profile_use_cases } from "./PlayerProfileUseCases";
import {
  create_mock_player_profile,
  create_mock_repository,
  create_valid_player_profile_input,
  expect_success,
  INVALID_PROFILE_VISIBILITY,
} from "./PlayerProfileUseCases.test_support";

describe("PlayerProfileUseCases", () => {
  let mock_repository: PlayerProfileRepository;
  let use_cases: ReturnType<typeof create_player_profile_use_cases>;

  beforeEach(() => {
    mock_repository = create_mock_repository();
    use_cases = create_player_profile_use_cases(mock_repository);
  });

  describe("create", () => {
    it("creates player profile successfully", async () => {
      const input = create_valid_player_profile_input();
      const mock_profile = create_mock_player_profile(input);
      vi.mocked(mock_repository.find_by_player_id).mockResolvedValue(
        create_failure_result("No profile found"),
      );
      vi.mocked(mock_repository.create).mockResolvedValue(
        create_success_result(mock_profile),
      );

      const result = await use_cases.create(input);

      expect(result.success).toBe(true);
      expect(expect_success(result).player_id).toBe("player_1");
      expect(mock_repository.create).toHaveBeenCalledWith(input);
    });

    it("validates player_id is required", async () => {
      const input = create_valid_player_profile_input({ player_id: "" });

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Player is required");
      }
      expect(mock_repository.create).not.toHaveBeenCalled();
    });

    it("validates visibility values", async () => {
      const input = {
        ...create_valid_player_profile_input(),
        visibility: INVALID_PROFILE_VISIBILITY,
      };

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Visibility must be");
      }
      expect(mock_repository.create).not.toHaveBeenCalled();
    });

    it("handles repository failure", async () => {
      const input = create_valid_player_profile_input();
      vi.mocked(mock_repository.find_by_player_id).mockResolvedValue(
        create_failure_result("No profile found"),
      );
      vi.mocked(mock_repository.create).mockResolvedValue(
        create_failure_result("Database error"),
      );

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(
          USE_CASE_ERROR_MESSAGES[UseCaseErrorCode.DEPENDENCY_FAILED],
        );
      }
    });
  });

  describe("update", () => {
    it("updates player profile successfully", async () => {
      const updates = { profile_summary: "Updated summary" };
      const mock_profile = create_mock_player_profile(updates);
      vi.mocked(mock_repository.update).mockResolvedValue(
        create_success_result(mock_profile),
      );

      const result = await use_cases.update("p_123", updates);

      expect(result.success).toBe(true);
      expect(expect_success(result).profile_summary).toBe("Updated summary");
      expect(mock_repository.update).toHaveBeenCalledWith("p_123", updates);
    });

    it("validates visibility on update", async () => {
      const updates = { visibility: INVALID_PROFILE_VISIBILITY };

      const result = await use_cases.update("p_123", updates);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Visibility must be");
      }
      expect(mock_repository.update).not.toHaveBeenCalled();
    });

    it("handles repository failure", async () => {
      vi.mocked(mock_repository.update).mockResolvedValue(
        create_failure_result("Profile not found"),
      );

      const result = await use_cases.update("p_123", {
        profile_summary: "New",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(
          USE_CASE_ERROR_MESSAGES[UseCaseErrorCode.DEPENDENCY_FAILED],
        );
      }
    });
  });

  describe("delete", () => {
    it("deletes player profile successfully", async () => {
      vi.mocked(mock_repository.delete_by_id).mockResolvedValue(
        create_success_result(true),
      );

      const result = await use_cases.delete("p_123");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(true);
      }
      expect(mock_repository.delete_by_id).toHaveBeenCalledWith("p_123");
    });

    it("handles repository failure", async () => {
      vi.mocked(mock_repository.delete_by_id).mockResolvedValue(
        create_failure_result("Profile not found"),
      );

      const result = await use_cases.delete("p_123");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(
          USE_CASE_ERROR_MESSAGES[UseCaseErrorCode.DEPENDENCY_FAILED],
        );
      }
    });
  });
});
