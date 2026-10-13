import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { JerseyColor } from "../entities/JerseyColor";
import type { JerseyColorRepository } from "../interfaces/ports";
import {
  USE_CASE_ERROR_MESSAGES,
  UseCaseErrorCode,
} from "../types/UseCaseFailure";
import {
  create_jersey_color_use_cases,
  type JerseyColorUseCases,
} from "./JerseyColorUseCases";
import {
  create_mock_jersey_color_repository,
  create_test_jersey_color,
  create_valid_jersey_color_input,
} from "./JerseyColorUseCases.test_support";

function as_jersey_color_id(value: string): JerseyColor["id"] {
  return value as JerseyColor["id"];
}

describe("JerseyColorUseCases", () => {
  let mock_repository: JerseyColorRepository;
  let use_cases: JerseyColorUseCases;

  beforeEach(() => {
    mock_repository = create_mock_jersey_color_repository();
    use_cases = create_jersey_color_use_cases(mock_repository);
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("creates a jersey color with valid input", async () => {
    vi.mocked(mock_repository.create).mockResolvedValue({
      success: true,
      data: create_test_jersey_color(),
    });
    const result = await use_cases.create(create_valid_jersey_color_input());
    expect(result.success).toBe(true);
  });

  it("joins validation errors on create", async () => {
    const result = await use_cases.create(
      create_valid_jersey_color_input({ main_color: "" }),
    );
    expect(result).toEqual({
      success: false,
      error: "Main color is required",
    });
  });

  it("rejects a blank id on get_by_id", async () => {
    const result = await use_cases.get_by_id(as_jersey_color_id(""));
    expect(result).toEqual({
      success: false,
      error: "Jersey Color ID is required",
    });
  });

  it("rejects a blank holder id when listing by entity", async () => {
    const result = await use_cases.list_jerseys_by_entity(
      "team",
      as_jersey_color_id(""),
    );
    expect(result).toEqual({ success: false, error: "Holder ID is required" });
  });

  it("passes list options straight to the repository", async () => {
    vi.mocked(mock_repository.find_all).mockResolvedValue({
      success: true,
      data: {
        items: [create_test_jersey_color()],
        total_count: 1,
        page_number: 1,
        page_size: 10,
        total_pages: 1,
      },
    });
    const result = await use_cases.list({ holder_id: "team-123" });
    expect(result.success).toBe(true);
    expect(mock_repository.find_all).toHaveBeenCalledWith(
      { holder_id: "team-123" },
      undefined,
    );
  });

  describe("failure logging", () => {
    it("returns a user-safe message and logs the repository error", async () => {
      vi.mocked(mock_repository.delete_by_id).mockResolvedValue({
        success: false,
        error: "IndexedDB transaction aborted",
      });
      const result = await use_cases.delete(as_jersey_color_id("jersey-123"));
      expect(result).toEqual({
        success: false,
        error: USE_CASE_ERROR_MESSAGES[UseCaseErrorCode.DEPENDENCY_FAILED],
      });
      expect(console.error).toHaveBeenCalledWith("[JerseyColorUseCases]", {
        event: "jersey_color_delete_failed",
        error_code: UseCaseErrorCode.DEPENDENCY_FAILED,
        technical_detail: "IndexedDB transaction aborted",
        jersey_color_id: "jersey-123",
      });
    });

    it("keeps the specific message when the update target is missing", async () => {
      vi.mocked(mock_repository.find_by_id).mockResolvedValue({
        success: false,
        error: "Entity with id 'jersey-404' not found",
      });
      const result = await use_cases.update(as_jersey_color_id("jersey-404"), {
        nickname: "Away",
      });
      expect(result).toEqual({
        success: false,
        error: "Jersey Color not found",
      });
    });
  });
});
