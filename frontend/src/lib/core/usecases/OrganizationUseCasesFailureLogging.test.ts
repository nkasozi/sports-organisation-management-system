import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { OrganizationRepository } from "../interfaces/ports";
import {
  USE_CASE_ERROR_MESSAGES,
  UseCaseErrorCode,
} from "../types/UseCaseFailure";
import {
  create_organization_use_cases,
  create_organization_use_cases_with_default_seeder,
} from "./OrganizationUseCases";
import {
  create_mock_repository,
  create_test_organization,
  create_valid_input,
} from "./OrganizationUseCases.test_support";

describe("OrganizationUseCases failure logging", () => {
  let mock_repository: OrganizationRepository;

  beforeEach(() => {
    mock_repository = create_mock_repository();
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
    const use_cases = create_organization_use_cases(mock_repository);
    const result = await use_cases.delete("org-123");
    expect(result).toEqual({
      success: false,
      error: USE_CASE_ERROR_MESSAGES[UseCaseErrorCode.DEPENDENCY_FAILED],
    });
    expect(console.error).toHaveBeenCalledWith("[OrganizationUseCases]", {
      event: "organization_delete_failed",
      error_code: UseCaseErrorCode.DEPENDENCY_FAILED,
      technical_detail: "IndexedDB transaction aborted",
      organization_id: "org-123",
    });
  });

  it("seeds defaults after a successful create", async () => {
    vi.mocked(mock_repository.create).mockResolvedValue({
      success: true,
      data: create_test_organization(),
    });
    const seed_defaults = vi.fn().mockResolvedValue(undefined);
    const use_cases = create_organization_use_cases_with_default_seeder(
      mock_repository,
      seed_defaults,
    );
    const result = await use_cases.create(create_valid_input());
    expect(result.success).toBe(true);
    expect(seed_defaults).toHaveBeenCalledWith(
      expect.objectContaining({ id: "org-123" }),
    );
  });

  it("keeps the created organization and logs when seeding fails", async () => {
    vi.mocked(mock_repository.create).mockResolvedValue({
      success: true,
      data: create_test_organization(),
    });
    const seed_defaults = vi.fn().mockRejectedValue(new Error("seed boom"));
    const use_cases = create_organization_use_cases_with_default_seeder(
      mock_repository,
      seed_defaults,
    );
    const result = await use_cases.create(create_valid_input());
    await vi.waitFor(() => expect(console.error).toHaveBeenCalled());
    expect(result.success).toBe(true);
    expect(console.error).toHaveBeenCalledWith("[OrganizationUseCases]", {
      event: "organization_seed_defaults_failed",
      error_code: UseCaseErrorCode.DEPENDENCY_FAILED,
      technical_detail: "Error: seed boom",
      organization_id: "org-123",
    });
  });

  it("does not seed defaults when create fails", async () => {
    const seed_defaults = vi.fn().mockResolvedValue(undefined);
    const use_cases = create_organization_use_cases_with_default_seeder(
      mock_repository,
      seed_defaults,
    );
    const result = await use_cases.create(create_valid_input({ name: "" }));
    expect(result.success).toBe(false);
    expect(seed_defaults).not.toHaveBeenCalled();
  });
});
