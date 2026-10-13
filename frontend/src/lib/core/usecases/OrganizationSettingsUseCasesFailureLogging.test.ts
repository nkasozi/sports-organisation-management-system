import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { OrganizationSettingsRepository } from "../interfaces/ports/external/repositories/OrganizationSettingsRepository";
import {
  USE_CASE_ERROR_MESSAGES,
  UseCaseErrorCode,
} from "../types/UseCaseFailure";
import { create_organization_settings_use_cases } from "./OrganizationSettingsUseCases";
import {
  create_mock_repository,
  create_valid_create_input,
} from "./OrganizationSettingsUseCases.test_support";

describe("OrganizationSettingsUseCases failure logging", () => {
  let mock_repository: OrganizationSettingsRepository;
  let use_cases: ReturnType<typeof create_organization_settings_use_cases>;

  beforeEach(() => {
    mock_repository = create_mock_repository();
    use_cases = create_organization_settings_use_cases(mock_repository);
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns a user-safe message and logs the lookup error", async () => {
    vi.mocked(mock_repository.find_by_organization_id).mockResolvedValue({
      success: false,
      error: "DB connection lost",
    });
    const result = await use_cases.save_or_update("org_admin", "org-abc", {
      display_name: "Test",
    });
    expect(result).toEqual({
      success: false,
      error: USE_CASE_ERROR_MESSAGES[UseCaseErrorCode.DEPENDENCY_FAILED],
    });
    expect(console.error).toHaveBeenCalledWith(
      "[OrganizationSettingsUseCases]",
      {
        event: "org_settings_lookup_failed",
        error_code: UseCaseErrorCode.DEPENDENCY_FAILED,
        technical_detail: "DB connection lost",
        organization_id: "org-abc",
      },
    );
  });

  it("logs the not-found event when no settings exist", async () => {
    vi.mocked(mock_repository.find_by_organization_id).mockResolvedValue({
      success: false,
      error: "Organization settings not found: organization_id=org-abc",
    });
    const result = await use_cases.get_by_organization_id("org-abc");
    expect(result).toEqual({
      success: false,
      error: "Organization settings not found",
    });
    expect(console.error).toHaveBeenCalledWith(
      "[OrganizationSettingsUseCases]",
      {
        event: "org_settings_get_not_found",
        error_code: UseCaseErrorCode.NOT_FOUND,
        organization_id: "org-abc",
      },
    );
  });

  it("keeps the permission message and logs the denied write", async () => {
    const result = await use_cases.save_settings(
      "player",
      create_valid_create_input(),
    );
    expect(result).toEqual({
      success: false,
      error: "Only org_admin or super_admin can modify organization settings",
    });
    expect(console.error).toHaveBeenCalledWith(
      "[OrganizationSettingsUseCases]",
      {
        event: "org_settings_save_permission_denied",
        error_code: UseCaseErrorCode.PERMISSION_DENIED,
      },
    );
  });

  it("returns a user-safe message when the repository create fails", async () => {
    vi.mocked(mock_repository.create).mockResolvedValue({
      success: false,
      error: "IndexedDB transaction aborted",
    });
    const result = await use_cases.save_settings(
      "super_admin",
      create_valid_create_input(),
    );
    expect(result).toEqual({
      success: false,
      error: USE_CASE_ERROR_MESSAGES[UseCaseErrorCode.DEPENDENCY_FAILED],
    });
  });
});
