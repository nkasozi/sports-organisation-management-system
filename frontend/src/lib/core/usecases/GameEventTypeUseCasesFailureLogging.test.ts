import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { GameEventTypeRepository } from "../interfaces/ports";
import {
  USE_CASE_ERROR_MESSAGES,
  UseCaseErrorCode,
} from "../types/UseCaseFailure";
import {
  create_game_event_type_use_cases,
  type GameEventTypeUseCases,
} from "./GameEventTypeUseCases";
import {
  create_mock_repository,
  create_test_event_type,
  create_valid_input,
} from "./GameEventTypeUseCases.test_support";

describe("GameEventTypeUseCases failure logging", () => {
  let mock_repository: GameEventTypeRepository;
  let use_cases: GameEventTypeUseCases;

  beforeEach(() => {
    mock_repository = create_mock_repository();
    use_cases = create_game_event_type_use_cases(mock_repository);
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns a user-safe message and logs the repository error", async () => {
    vi.mocked(mock_repository.delete_by_id).mockResolvedValue({
      success: false,
      error: "IndexedDB transaction aborted",
    });
    const result = await use_cases.delete("event-type-123");
    expect(result).toEqual({
      success: false,
      error: USE_CASE_ERROR_MESSAGES[UseCaseErrorCode.DEPENDENCY_FAILED],
    });
    expect(console.error).toHaveBeenCalledWith("[GameEventTypeUseCases]", {
      event: "game_event_type_delete_failed",
      error_code: UseCaseErrorCode.DEPENDENCY_FAILED,
      technical_detail: "IndexedDB transaction aborted",
      game_event_type_id: "event-type-123",
    });
  });

  it("rejects a duplicate code on create with a conflict", async () => {
    vi.mocked(mock_repository.find_by_code).mockResolvedValue({
      success: true,
      data: create_test_event_type({ code: "YELLOW" }),
    });
    const result = await use_cases.create(create_valid_input());
    expect(result).toEqual({
      success: false,
      error: "Event type with code 'YELLOW' already exists",
    });
    expect(mock_repository.create).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith("[GameEventTypeUseCases]", {
      event: "game_event_type_create_code_conflict",
      error_code: UseCaseErrorCode.CONFLICT,
      organization_id: "test-org-1",
      existing_id: "event-type-123",
    });
  });

  it("allows updating a record to keep its own code", async () => {
    const existing = create_test_event_type();
    vi.mocked(mock_repository.find_by_id).mockResolvedValue({
      success: true,
      data: existing,
    });
    vi.mocked(mock_repository.find_by_code).mockResolvedValue({
      success: true,
      data: existing,
    });
    vi.mocked(mock_repository.update).mockResolvedValue({
      success: true,
      data: existing,
    });
    const result = await use_cases.update("event-type-123", { code: "GOAL" });
    expect(result.success).toBe(true);
  });

  it("logs a code lookup failure without leaking it", async () => {
    vi.mocked(mock_repository.find_by_code).mockResolvedValue({
      success: false,
      error: "Database offline",
    });
    const result = await use_cases.create(create_valid_input());
    expect(result).toEqual({
      success: false,
      error: USE_CASE_ERROR_MESSAGES[UseCaseErrorCode.DEPENDENCY_FAILED],
    });
    expect(console.error).toHaveBeenCalledWith("[GameEventTypeUseCases]", {
      event: "game_event_type_create_code_lookup_failed",
      error_code: UseCaseErrorCode.DEPENDENCY_FAILED,
      technical_detail: "Database offline",
      organization_id: "test-org-1",
    });
  });

  it("keeps the specific message when the update target is missing", async () => {
    vi.mocked(mock_repository.find_by_id).mockResolvedValue({
      success: false,
      error: "Entity with id 'event-type-404' not found",
    });
    const result = await use_cases.update("event-type-404", { name: "Goal" });
    expect(result).toEqual({ success: false, error: "Event type not found" });
  });
});
