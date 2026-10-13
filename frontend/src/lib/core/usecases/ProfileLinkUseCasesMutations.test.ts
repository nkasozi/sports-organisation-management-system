import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ProfileLinkRepository } from "../interfaces/ports";
import { create_failure_result, create_success_result } from "../types/Result";
import {
  USE_CASE_ERROR_MESSAGES,
  UseCaseErrorCode,
} from "../types/UseCaseFailure";
import { create_profile_link_use_cases } from "./ProfileLinkUseCases";
import {
  create_mock_profile_link,
  create_mock_repository,
  expect_success,
} from "./ProfileLinkUseCases.test_support";

describe("ProfileLinkUseCases", () => {
  let mock_repository: ProfileLinkRepository;
  let use_cases: ReturnType<typeof create_profile_link_use_cases>;

  beforeEach(() => {
    mock_repository = create_mock_repository();
    use_cases = create_profile_link_use_cases(mock_repository);
  });

  describe("update", () => {
    it("updates profile link successfully", async () => {
      const updates = { title: "Updated title" };
      const mock_link = create_mock_profile_link(updates);
      vi.mocked(mock_repository.update).mockResolvedValue(
        create_success_result(mock_link),
      );

      const result = await use_cases.update("pl_123", updates);

      expect(result.success).toBe(true);
      expect(expect_success(result).title).toBe("Updated title");
      expect(mock_repository.update).toHaveBeenCalledWith("pl_123", updates);
    });

    it("handles repository failure", async () => {
      vi.mocked(mock_repository.update).mockResolvedValue(
        create_failure_result("Link not found"),
      );

      const result = await use_cases.update("pl_123", { title: "New" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(
          USE_CASE_ERROR_MESSAGES[UseCaseErrorCode.DEPENDENCY_FAILED],
        );
      }
    });
  });

  describe("delete", () => {
    it("deletes profile link successfully", async () => {
      vi.mocked(mock_repository.delete_by_id).mockResolvedValue(
        create_success_result(true),
      );

      const result = await use_cases.delete("pl_123");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(true);
      }
      expect(mock_repository.delete_by_id).toHaveBeenCalledWith("pl_123");
    });

    it("handles repository failure", async () => {
      vi.mocked(mock_repository.delete_by_id).mockResolvedValue(
        create_failure_result("Link not found"),
      );

      const result = await use_cases.delete("pl_123");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(
          USE_CASE_ERROR_MESSAGES[UseCaseErrorCode.DEPENDENCY_FAILED],
        );
      }
    });
  });
});
