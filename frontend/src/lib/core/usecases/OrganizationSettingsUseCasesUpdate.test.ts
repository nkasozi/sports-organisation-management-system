import { beforeEach, describe, expect, it, vi } from "vitest";

import type { OrganizationSettingsRepository } from "../interfaces/ports/external/repositories/OrganizationSettingsRepository";
import { create_organization_settings_use_cases } from "./OrganizationSettingsUseCases";
import {
  create_mock_repository,
  create_test_settings,
} from "./OrganizationSettingsUseCases.test_support";

describe("OrganizationSettingsUseCases", () => {
  let mock_repository: OrganizationSettingsRepository;
  let use_cases: ReturnType<typeof create_organization_settings_use_cases>;

  beforeEach(() => {
    mock_repository = create_mock_repository();
    use_cases = create_organization_settings_use_cases(mock_repository);
  });

  describe("update_settings — role enforcement", () => {
    it("allows super_admin to update settings", async () => {
      vi.mocked(mock_repository.update).mockResolvedValue({
        success: true,
        data: create_test_settings(),
      });

      const result = await use_cases.update_settings(
        "super_admin",
        "settings-123",
        { display_name: "New Name" },
      );

      expect(result.success).toBe(true);
      expect(mock_repository.update).toHaveBeenCalledWith("settings-123", {
        display_name: "New Name",
      });
    });

    it("rejects non-admin role", async () => {
      const result = await use_cases.update_settings("player", "settings-123", {
        display_name: "Hack Attempt",
      });

      expect(result.success).toBe(false);
      expect(mock_repository.update).not.toHaveBeenCalled();
    });

    it("fails for empty settings id", async () => {
      const result = await use_cases.update_settings("super_admin", "", {
        display_name: "New Name",
      });

      expect(result.success).toBe(false);
      expect(mock_repository.update).not.toHaveBeenCalled();
    });
  });

  describe("save_or_update", () => {
    it("creates new settings when none exist for the org", async () => {
      vi.mocked(mock_repository.find_by_organization_id).mockResolvedValue({
        success: false,
        error: "Organization settings not found: organization_id=org-abc",
      });
      vi.mocked(mock_repository.create).mockResolvedValue({
        success: true,
        data: create_test_settings(),
      });

      const result = await use_cases.save_or_update("org_admin", "org-abc", {
        display_name: "Test FC",
      });

      expect(result.success).toBe(true);
      expect(mock_repository.create).toHaveBeenCalledOnce();
      expect(mock_repository.update).not.toHaveBeenCalled();
    });

    it("updates existing settings when they already exist", async () => {
      vi.mocked(mock_repository.find_by_organization_id).mockResolvedValue({
        success: true,
        data: create_test_settings(),
      });
      vi.mocked(mock_repository.update).mockResolvedValue({
        success: true,
        data: create_test_settings({ display_name: "Updated FC" }),
      });

      const result = await use_cases.save_or_update("org_admin", "org-abc", {
        display_name: "Updated FC",
      });

      expect(result.success).toBe(true);
      expect(mock_repository.update).toHaveBeenCalledWith(
        "settings-123",
        expect.objectContaining({ display_name: "Updated FC" }),
      );
      expect(mock_repository.create).not.toHaveBeenCalled();
    });

    it("rejects non-admin role before touching repository", async () => {
      const result = await use_cases.save_or_update("player", "org-abc", {
        display_name: "Hack Attempt",
      });

      expect(result.success).toBe(false);
      expect(mock_repository.find_by_organization_id).not.toHaveBeenCalled();
    });

    it("fails for empty organization_id", async () => {
      const result = await use_cases.save_or_update("org_admin", "", {
        display_name: "Test",
      });

      expect(result.success).toBe(false);
      expect(mock_repository.find_by_organization_id).not.toHaveBeenCalled();
    });

    it("propagates repository failure from find_by_organization_id", async () => {
      vi.mocked(mock_repository.find_by_organization_id).mockResolvedValue({
        success: false,
        error: "DB connection lost",
      });

      const result = await use_cases.save_or_update("org_admin", "org-abc", {
        display_name: "Test",
      });

      expect(result.success).toBe(false);
      expect(mock_repository.create).not.toHaveBeenCalled();
      expect(mock_repository.update).not.toHaveBeenCalled();
    });

    it("uses sensible defaults when creating from a partial input", async () => {
      vi.mocked(mock_repository.find_by_organization_id).mockResolvedValue({
        success: false,
        error: "Organization settings not found: organization_id=org-abc",
      });
      vi.mocked(mock_repository.create).mockResolvedValue({
        success: true,
        data: create_test_settings(),
      });

      const result = await use_cases.save_or_update("org_admin", "org-abc", {
        sync_interval_ms: 900_000,
      });

      expect(result.success).toBe(true);

      const call_arg = vi.mocked(mock_repository.create).mock.calls[0][0];
      expect(call_arg.sync_interval_ms).toBe(900_000);
      expect(call_arg.header_pattern).toBe("pattern");
      expect(call_arg.footer_pattern).toBe("solid_color");
      expect(call_arg.background_pattern_url).toBe("/african-mosaic-bg.svg");
    });
  });
});
