import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ProfileLinkRepository } from "../interfaces/ports";
import { create_failure_result } from "../types/Result";
import {
  USE_CASE_ERROR_MESSAGES,
  UseCaseErrorCode,
} from "../types/UseCaseFailure";
import { create_profile_link_use_cases } from "./ProfileLinkUseCases";
import {
  create_mock_repository,
  create_valid_profile_link_input,
} from "./ProfileLinkUseCases.test_support";

describe("ProfileLinkUseCases failure logging", () => {
  let mock_repository: ProfileLinkRepository;
  let use_cases: ReturnType<typeof create_profile_link_use_cases>;

  beforeEach(() => {
    mock_repository = create_mock_repository();
    use_cases = create_profile_link_use_cases(mock_repository);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns a user-safe message and logs the repository error", async () => {
    const error_spy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(mock_repository.find_by_profile_id).mockResolvedValue(
      create_failure_result("IndexedDB transaction aborted"),
    );
    const result = await use_cases.list_by_profile("profile_1");
    expect(result).toEqual({
      success: false,
      error: USE_CASE_ERROR_MESSAGES[UseCaseErrorCode.DEPENDENCY_FAILED],
    });
    expect(error_spy).toHaveBeenCalledWith("[ProfileLinkUseCases]", {
      event: "profile_link_list_by_profile_failed",
      error_code: UseCaseErrorCode.DEPENDENCY_FAILED,
      technical_detail: "IndexedDB transaction aborted",
      profile_id: "profile_1",
    });
  });

  it("logs validation failures with the joined validation text", async () => {
    const error_spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await use_cases.create(
      create_valid_profile_link_input({ platform: "", url: "" }),
    );
    expect(result.success).toBe(false);
    expect(error_spy).toHaveBeenCalledWith("[ProfileLinkUseCases]", {
      event: "profile_link_create_validation_failed",
      error_code: UseCaseErrorCode.VALIDATION_FAILED,
      profile_id: "profile_1",
    });
    expect(mock_repository.create).not.toHaveBeenCalled();
  });
});
