import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { VenueRepository } from "../interfaces/ports";
import {
  USE_CASE_ERROR_MESSAGES,
  UseCaseErrorCode,
} from "../types/UseCaseFailure";
import { create_venue_use_cases } from "./VenueUseCases";
import { create_mock_repository } from "./VenueUseCases.test_support";

describe("VenueUseCases failure logging", () => {
  let mock_repository: VenueRepository;
  let use_cases: ReturnType<typeof create_venue_use_cases>;

  beforeEach(() => {
    mock_repository = create_mock_repository();
    use_cases = create_venue_use_cases(mock_repository);
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
    const result = await use_cases.delete("venue-123");
    expect(result).toEqual({
      success: false,
      error: USE_CASE_ERROR_MESSAGES[UseCaseErrorCode.DEPENDENCY_FAILED],
    });
    expect(console.error).toHaveBeenCalledWith("[VenueUseCases]", {
      event: "venue_delete_failed",
      error_code: UseCaseErrorCode.DEPENDENCY_FAILED,
      technical_detail: "IndexedDB transaction aborted",
      venue_id: "venue-123",
    });
  });

  it("keeps the specific message when no ids are given for bulk delete", async () => {
    const result = await use_cases.delete_venues([]);
    expect(result).toEqual({
      success: false,
      error: "At least one venue ID is required",
    });
    expect(console.error).toHaveBeenCalledWith("[VenueUseCases]", {
      event: "venue_bulk_delete_ids_missing",
      error_code: UseCaseErrorCode.MISSING_IDENTIFIER,
    });
  });
});
