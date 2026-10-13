import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Qualification } from "../entities/Qualification";
import type { QualificationRepository } from "../interfaces/ports";
import {
  USE_CASE_ERROR_MESSAGES,
  UseCaseErrorCode,
} from "../types/UseCaseFailure";
import {
  create_qualification_use_cases,
  type QualificationUseCases,
} from "./QualificationUseCases";
import {
  create_mock_qualification_repository,
  create_test_qualification,
  create_valid_qualification_input,
} from "./QualificationUseCases.test_support";

function as_qualification_id(value: string): Qualification["id"] {
  return value as Qualification["id"];
}

const EMPTY_PAGE = {
  items: [],
  total_count: 0,
  page_number: 1,
  page_size: 100,
  total_pages: 0,
};

describe("QualificationUseCases", () => {
  let mock_repository: QualificationRepository;
  let use_cases: QualificationUseCases;

  beforeEach(() => {
    mock_repository = create_mock_qualification_repository();
    use_cases = create_qualification_use_cases(mock_repository);
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("creates a qualification with valid input", async () => {
    vi.mocked(mock_repository.create).mockResolvedValue({
      success: true,
      data: create_test_qualification(),
    });
    const result = await use_cases.create(create_valid_qualification_input());
    expect(result.success).toBe(true);
  });

  it("joins validation errors on create", async () => {
    const result = await use_cases.create(
      create_valid_qualification_input({ certification_name: "" }),
    );
    expect(result).toEqual({
      success: false,
      error: "Certification name is required",
    });
  });

  it("validates the merged record on update", async () => {
    vi.mocked(mock_repository.find_by_id).mockResolvedValue({
      success: true,
      data: create_test_qualification(),
    });
    const result = await use_cases.update(
      as_qualification_id("qualification-123"),
      {
        expiry_date: "2020-01-01",
      },
    );
    expect(result).toEqual({
      success: false,
      error: "Expiry date must be after issue date",
    });
  });

  it("lists by holder with the default page options", async () => {
    vi.mocked(mock_repository.find_by_holder).mockResolvedValue({
      success: true,
      data: EMPTY_PAGE,
    });
    const result = await use_cases.list_by_holder(
      "official",
      as_qualification_id("official-123"),
    );
    expect(result.success).toBe(true);
    expect(mock_repository.find_by_holder).toHaveBeenCalledWith(
      "official",
      "official-123",
      { page_number: 1, page_size: 100 },
    );
  });

  describe("failure logging", () => {
    it("returns a user-safe message and logs the repository error", async () => {
      vi.mocked(mock_repository.find_all).mockResolvedValue({
        success: false,
        error: "IndexedDB transaction aborted",
      });
      const result = await use_cases.list_all();
      expect(result).toEqual({
        success: false,
        error: USE_CASE_ERROR_MESSAGES[UseCaseErrorCode.DEPENDENCY_FAILED],
      });
      expect(console.error).toHaveBeenCalledWith("[QualificationUseCases]", {
        event: "qualification_list_failed",
        error_code: UseCaseErrorCode.DEPENDENCY_FAILED,
        technical_detail: "IndexedDB transaction aborted",
      });
    });

    it("keeps the specific message when the update target is missing", async () => {
      vi.mocked(mock_repository.find_by_id).mockResolvedValue({
        success: false,
        error: "Entity with id 'qualification-404' not found",
      });
      const result = await use_cases.update(
        as_qualification_id("qualification-404"),
        {
          notes: "x",
        },
      );
      expect(result).toEqual({
        success: false,
        error: "Qualification not found",
      });
    });
  });
});
