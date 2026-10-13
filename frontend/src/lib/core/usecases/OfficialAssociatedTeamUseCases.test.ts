import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { OfficialAssociatedTeamRepository } from "../interfaces/ports";
import {
  USE_CASE_ERROR_MESSAGES,
  UseCaseErrorCode,
} from "../types/UseCaseFailure";
import { create_official_associated_team_use_cases } from "./OfficialAssociatedTeamUseCases";
import {
  create_empty_page,
  create_mock_repository,
  create_test_association,
  create_valid_input,
  expect_failure_message,
} from "./OfficialAssociatedTeamUseCases.test_support";

describe("OfficialAssociatedTeamUseCases", () => {
  let mock_repository: OfficialAssociatedTeamRepository;
  let use_cases: ReturnType<typeof create_official_associated_team_use_cases>;

  beforeEach(() => {
    mock_repository = create_mock_repository();
    use_cases = create_official_associated_team_use_cases(mock_repository);
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("creates when input is valid", async () => {
    vi.mocked(mock_repository.create).mockResolvedValue({
      success: true,
      data: create_test_association(),
    });
    const result = await use_cases.create(create_valid_input());
    expect(result.success).toBe(true);
  });

  it("rejects invalid input with the joined validation messages", async () => {
    const result = await use_cases.create(
      create_valid_input({ official_id: "", team_id: "" }),
    );
    expect(expect_failure_message(result)).toBe(
      "Official is required, Team is required",
    );
    expect(mock_repository.create).not.toHaveBeenCalled();
  });

  it("returns the not-found message when the update target is missing", async () => {
    vi.mocked(mock_repository.find_by_id).mockResolvedValue({
      success: false,
      error: "Entity with id 'assoc-404' not found",
    });
    const result = await use_cases.update("assoc-404", { notes: "x" });
    expect(expect_failure_message(result)).toBe(
      "Official associated team not found",
    );
    expect(mock_repository.update).not.toHaveBeenCalled();
  });

  it("updates with the merged input when the target exists", async () => {
    vi.mocked(mock_repository.find_by_id).mockResolvedValue({
      success: true,
      data: create_test_association(),
    });
    vi.mocked(mock_repository.update).mockResolvedValue({
      success: true,
      data: create_test_association({ notes: "x" }),
    });
    const result = await use_cases.update("assoc-123", { notes: "x" });
    expect(result.success).toBe(true);
    expect(mock_repository.update).toHaveBeenCalledWith("assoc-123", {
      notes: "x",
    });
  });

  it("builds a typed filter and default paging for list", async () => {
    vi.mocked(mock_repository.find_all).mockResolvedValue(create_empty_page());
    const result = await use_cases.list({ team_id: "team-1", status: "" });
    expect(result.success).toBe(true);
    expect(mock_repository.find_all).toHaveBeenCalledWith(
      { team_id: "team-1" },
      { page_number: 1, page_size: 100 },
    );
  });

  it("delegates list_by_official and list_by_team with default paging", async () => {
    vi.mocked(mock_repository.find_by_official).mockResolvedValue(
      create_empty_page(),
    );
    vi.mocked(mock_repository.find_by_team).mockResolvedValue(
      create_empty_page(),
    );
    const by_official = await use_cases.list_by_official("official-1");
    const by_team = await use_cases.list_by_team("team-1");
    expect(by_official.success).toBe(true);
    expect(by_team.success).toBe(true);
    expect(mock_repository.find_by_team).toHaveBeenCalledWith("team-1", {
      page_number: 1,
      page_size: 100,
    });
  });

  describe("failure logging", () => {
    it("returns a user-safe message and logs the repository error", async () => {
      vi.mocked(mock_repository.delete_by_id).mockResolvedValue({
        success: false,
        error: "IndexedDB transaction aborted",
      });
      const result = await use_cases.delete("assoc-123");
      expect(expect_failure_message(result)).toBe(
        USE_CASE_ERROR_MESSAGES[UseCaseErrorCode.DEPENDENCY_FAILED],
      );
      expect(console.error).toHaveBeenCalledWith(
        "[OfficialAssociatedTeamUseCases]",
        {
          event: "official_associated_team_delete_failed",
          error_code: UseCaseErrorCode.DEPENDENCY_FAILED,
          technical_detail: "IndexedDB transaction aborted",
          official_associated_team_id: "assoc-123",
        },
      );
    });
  });
});
