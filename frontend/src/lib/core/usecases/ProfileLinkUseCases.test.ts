import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ProfileLinkRepository } from "../interfaces/ports";
import type { QueryOptions } from "../interfaces/ports";
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
  expect_success,
} from "./ProfileLinkUseCases.test_support";

describe("ProfileLinkUseCases", () => {
  let mock_repository: ProfileLinkRepository;
  let use_cases: ReturnType<typeof create_profile_link_use_cases>;

  beforeEach(() => {
    mock_repository = create_mock_repository();
    use_cases = create_profile_link_use_cases(mock_repository);
  });

  describe("list", () => {
    it("returns all profile links when no filter provided", async () => {
      const mock_links = [
        create_mock_profile_link({ id: "pl1" }),
        create_mock_profile_link({ id: "pl2" }),
      ];
      vi.mocked(mock_repository.find_all).mockResolvedValue(
        create_paginated_result(mock_links),
      );

      const result = await use_cases.list();

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.items).toHaveLength(2);
      expect(result.data.total_count).toBe(2);
      expect(mock_repository.find_all).toHaveBeenCalledOnce();
    });

    it("filters by profile_id", async () => {
      const mock_links = [
        create_mock_profile_link({ profile_id: "profile_1" }),
      ];
      vi.mocked(mock_repository.find_all).mockResolvedValue(
        create_paginated_result(mock_links),
      );

      const result = await use_cases.list({ profile_id: "profile_1" });

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.items).toHaveLength(1);
      expect(mock_repository.find_all).toHaveBeenCalledWith(
        expect.objectContaining({ profile_id: "profile_1" }),
        {},
      );
    });

    it("filters by platform", async () => {
      const mock_links = [create_mock_profile_link({ platform: "twitter" })];
      vi.mocked(mock_repository.find_all).mockResolvedValue(
        create_paginated_result(mock_links),
      );

      const result = await use_cases.list({ platform: "twitter" });

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.items).toHaveLength(1);
      expect(mock_repository.find_all).toHaveBeenCalledWith(
        expect.objectContaining({ platform: "twitter" }),
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
    it("returns profile link by id", async () => {
      const mock_link = create_mock_profile_link({ id: "pl_123" });
      vi.mocked(mock_repository.find_by_id).mockResolvedValue(
        create_success_result(mock_link),
      );

      const result = await use_cases.get_by_id("pl_123");

      expect(result.success).toBe(true);
      expect(expect_success(result).id).toBe("pl_123");
      expect(mock_repository.find_by_id).toHaveBeenCalledWith("pl_123");
    });

    it("returns failure when id is empty", async () => {
      const result = await use_cases.get_by_id("");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Link ID is required");
      }
      expect(mock_repository.find_by_id).not.toHaveBeenCalled();
    });

    it("handles repository failure", async () => {
      vi.mocked(mock_repository.find_by_id).mockResolvedValue(
        create_failure_result("Link not found"),
      );

      const result = await use_cases.get_by_id("pl_123");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(
          USE_CASE_ERROR_MESSAGES[UseCaseErrorCode.NOT_FOUND],
        );
      }
    });
  });
});
