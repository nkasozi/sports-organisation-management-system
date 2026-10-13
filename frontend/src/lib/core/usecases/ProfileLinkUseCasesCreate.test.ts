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
  create_paginated_result,
  create_valid_profile_link_input,
  expect_success,
} from "./ProfileLinkUseCases.test_support";

describe("ProfileLinkUseCases", () => {
  let mock_repository: ProfileLinkRepository;
  let use_cases: ReturnType<typeof create_profile_link_use_cases>;

  beforeEach(() => {
    mock_repository = create_mock_repository();
    use_cases = create_profile_link_use_cases(mock_repository);
  });

  describe("list_by_profile", () => {
    it("returns all links for profile", async () => {
      const mock_links = [
        create_mock_profile_link({ platform: "twitter" }),
        create_mock_profile_link({ platform: "instagram" }),
      ];
      vi.mocked(mock_repository.find_by_profile_id).mockResolvedValue(
        create_paginated_result(mock_links),
      );

      const result = await use_cases.list_by_profile("profile_1");

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.items).toHaveLength(2);
      expect(mock_repository.find_by_profile_id).toHaveBeenCalledWith(
        "profile_1",
        {},
      );
    });

    it("handles repository failure", async () => {
      vi.mocked(mock_repository.find_by_profile_id).mockResolvedValue(
        create_failure_result("Database error"),
      );

      const result = await use_cases.list_by_profile("profile_1");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(
          USE_CASE_ERROR_MESSAGES[UseCaseErrorCode.DEPENDENCY_FAILED],
        );
      }
    });
  });

  describe("create", () => {
    it("creates profile link successfully", async () => {
      const input = create_valid_profile_link_input();
      const mock_link = create_mock_profile_link(input);
      vi.mocked(mock_repository.create).mockResolvedValue(
        create_success_result(mock_link),
      );

      const result = await use_cases.create(input);

      expect(result.success).toBe(true);
      expect(expect_success(result).profile_id).toBe("profile_1");
      expect(mock_repository.create).toHaveBeenCalledWith(input);
    });

    it("validates profile_id is required", async () => {
      const input = create_valid_profile_link_input({ profile_id: "" });

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Profile is required");
      }
      expect(mock_repository.create).not.toHaveBeenCalled();
    });

    it("validates platform is required", async () => {
      const input = create_valid_profile_link_input({ platform: "" });

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Platform is required");
      }
      expect(mock_repository.create).not.toHaveBeenCalled();
    });

    it("validates url is required", async () => {
      const input = create_valid_profile_link_input({ url: "" });

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("URL is required");
      }
      expect(mock_repository.create).not.toHaveBeenCalled();
    });

    it("validates url format", async () => {
      const input = create_valid_profile_link_input({ url: "not-a-url" });

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("valid URL");
      }
      expect(mock_repository.create).not.toHaveBeenCalled();
    });

    it("rejects disallowed url protocols", async () => {
      const input = create_valid_profile_link_input({
        url: "javascript:alert(1)",
      });

      const result = await use_cases.create(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("valid URL");
      }
      expect(mock_repository.create).not.toHaveBeenCalled();
    });

    it("handles repository failure", async () => {
      const input = create_valid_profile_link_input();
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
});
