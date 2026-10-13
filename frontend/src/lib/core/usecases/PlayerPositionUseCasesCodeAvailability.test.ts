import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { PlayerPositionRepository } from "../interfaces/ports";
import { build_player_position_not_found_by_code_error } from "../interfaces/ports";
import { create_failure_result } from "../types/Result";
import {
  USE_CASE_ERROR_MESSAGES,
  UseCaseErrorCode,
} from "../types/UseCaseFailure";
import { create_player_position_use_cases } from "./PlayerPositionUseCases";
import {
  create_mock_repository,
  create_test_position,
  create_valid_input,
} from "./PlayerPositionUseCases.test_support";

describe("PlayerPositionUseCases code availability", () => {
  let mock_repository: PlayerPositionRepository;
  let use_cases: ReturnType<typeof create_player_position_use_cases>;

  beforeEach(() => {
    mock_repository = create_mock_repository();
    use_cases = create_player_position_use_cases(mock_repository);
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects create when the code already exists", async () => {
    vi.mocked(mock_repository.find_by_code).mockResolvedValue({
      success: true,
      data: create_test_position({ code: "ST" }),
    });
    const result = await use_cases.create(create_valid_input());
    expect(result).toEqual({
      success: false,
      error: "Position with code 'ST' already exists",
    });
    expect(mock_repository.create).not.toHaveBeenCalled();
  });

  it("returns a user-safe message and logs when the code lookup fails", async () => {
    vi.mocked(mock_repository.find_by_code).mockResolvedValue(
      create_failure_result("IndexedDB transaction aborted"),
    );
    const result = await use_cases.create(create_valid_input());
    expect(result).toEqual({
      success: false,
      error: USE_CASE_ERROR_MESSAGES[UseCaseErrorCode.DEPENDENCY_FAILED],
    });
    expect(console.error).toHaveBeenCalledWith("[PlayerPositionUseCases]", {
      event: "player_position_create_code_lookup_failed",
      error_code: UseCaseErrorCode.DEPENDENCY_FAILED,
      technical_detail: "IndexedDB transaction aborted",
    });
  });

  it("allows update when the code belongs to the same position", async () => {
    vi.mocked(mock_repository.find_by_id).mockResolvedValue({
      success: true,
      data: create_test_position(),
    });
    vi.mocked(mock_repository.find_by_code).mockResolvedValue({
      success: true,
      data: create_test_position(),
    });
    vi.mocked(mock_repository.update).mockResolvedValue({
      success: true,
      data: create_test_position(),
    });
    const result = await use_cases.update("position-123", { code: "GK" });
    expect(result.success).toBe(true);
  });

  it("rejects update when another position owns the code", async () => {
    vi.mocked(mock_repository.find_by_id).mockResolvedValue({
      success: true,
      data: create_test_position(),
    });
    vi.mocked(mock_repository.find_by_code).mockResolvedValue({
      success: true,
      data: create_test_position({ id: "position-999" }),
    });
    const result = await use_cases.update("position-123", { code: "GK" });
    expect(result).toEqual({
      success: false,
      error: "Position with code 'GK' already exists",
    });
    expect(mock_repository.update).not.toHaveBeenCalled();
  });

  it("updates when the new code is unused", async () => {
    vi.mocked(mock_repository.find_by_id).mockResolvedValue({
      success: true,
      data: create_test_position(),
    });
    vi.mocked(mock_repository.find_by_code).mockResolvedValue(
      create_failure_result(
        build_player_position_not_found_by_code_error("CB"),
      ),
    );
    vi.mocked(mock_repository.update).mockResolvedValue({
      success: true,
      data: create_test_position({ code: "CB" }),
    });
    const result = await use_cases.update("position-123", { code: "CB" });
    expect(result.success).toBe(true);
  });

  it("returns the not-found message when the update target is missing", async () => {
    vi.mocked(mock_repository.find_by_id).mockResolvedValue(
      create_failure_result("Entity with id 'position-404' not found"),
    );
    const result = await use_cases.update("position-404", { name: "X" });
    expect(result).toEqual({ success: false, error: "Position not found" });
  });
});
