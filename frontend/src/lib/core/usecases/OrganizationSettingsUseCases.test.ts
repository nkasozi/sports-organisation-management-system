import { beforeEach, describe, expect, it, vi } from "vitest";

import type { OrganizationSettingsRepository } from "../interfaces/ports/external/repositories/OrganizationSettingsRepository";
import { create_organization_settings_use_cases } from "./OrganizationSettingsUseCases";
import {
  create_mock_repository,
  create_test_settings,
  create_valid_create_input,
} from "./OrganizationSettingsUseCases.test_support";

describe("OrganizationSettingsUseCases", () => {
  let mock_repository: OrganizationSettingsRepository;
  let use_cases: ReturnType<typeof create_organization_settings_use_cases>;

  beforeEach(() => {
    mock_repository = create_mock_repository();
    use_cases = create_organization_settings_use_cases(mock_repository);
  });

  describe("get_by_organization_id", () => {
    it("returns settings when found", async () => {
      vi.mocked(mock_repository.find_by_organization_id).mockResolvedValue({
        success: true,
        data: create_test_settings(),
      });

      const result = await use_cases.get_by_organization_id("org-abc");

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data?.organization_id).toBe("org-abc");
    });

    it("returns a failure result when no settings exist for the organization", async () => {
      vi.mocked(mock_repository.find_by_organization_id).mockResolvedValue({
        success: false,
        error: "Organization settings not found: organization_id=org-abc",
      });

      const result = await use_cases.get_by_organization_id("org-abc");

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toBe("Organization settings not found");
    });

    it("fails for empty organization_id", async () => {
      const result = await use_cases.get_by_organization_id("");

      expect(result.success).toBe(false);
      expect(mock_repository.find_by_organization_id).not.toHaveBeenCalled();
    });

    it("fails for whitespace-only organization_id", async () => {
      const result = await use_cases.get_by_organization_id("   ");

      expect(result.success).toBe(false);
    });
  });

  describe("save_settings — role enforcement", () => {
    it("allows super_admin to save settings", async () => {
      vi.mocked(mock_repository.create).mockResolvedValue({
        success: true,
        data: create_test_settings(),
      });

      const result = await use_cases.save_settings(
        "super_admin",
        create_valid_create_input(),
      );

      expect(result.success).toBe(true);
      expect(mock_repository.create).toHaveBeenCalledOnce();
    });

    it("allows org_admin to save settings", async () => {
      vi.mocked(mock_repository.create).mockResolvedValue({
        success: true,
        data: create_test_settings(),
      });

      const result = await use_cases.save_settings(
        "org_admin",
        create_valid_create_input(),
      );

      expect(result.success).toBe(true);
    });

    it("rejects any other role with a failure result", async () => {
      for (const role of [
        "player",
        "team_manager",
        "official",
        "public_viewer",
      ]) {
        const result = await use_cases.save_settings(
          role,
          create_valid_create_input(),
        );

        expect(result.success).toBe(false);
        if (result.success) return;
        expect(result.error).toContain("org_admin or super_admin");
      }

      expect(mock_repository.create).not.toHaveBeenCalled();
    });

    it("rejects invalid sync_interval_ms", async () => {
      const result = await use_cases.save_settings(
        "super_admin",
        create_valid_create_input({ sync_interval_ms: 12345 }),
      );

      expect(result.success).toBe(false);
      expect(mock_repository.create).not.toHaveBeenCalled();
    });

    it("rejects invalid branding asset and social media urls", async () => {
      const result = await use_cases.save_settings(
        "super_admin",
        create_valid_create_input({
          logo_url: "javascript:alert(1)",
          social_media_links: [
            {
              platform: "twitter",
              url: "javascript:alert(1)",
            },
          ],
        }),
      );

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toContain("Logo URL is invalid");
      expect(result.error).toContain("Social media link URL is invalid");
      expect(mock_repository.create).not.toHaveBeenCalled();
    });

    it("rejects missing organization_id", async () => {
      const result = await use_cases.save_settings(
        "super_admin",
        create_valid_create_input({ organization_id: "" }),
      );

      expect(result.success).toBe(false);
      expect(mock_repository.create).not.toHaveBeenCalled();
    });

    it("accepts all allowed sync intervals", async () => {
      const allowed_intervals = [600_000, 900_000, 1_800_000, 3_600_000];

      for (const interval_ms of allowed_intervals) {
        vi.mocked(mock_repository.create).mockResolvedValue({
          success: true,
          data: create_test_settings({ sync_interval_ms: interval_ms }),
        });

        const result = await use_cases.save_settings(
          "super_admin",
          create_valid_create_input({ sync_interval_ms: interval_ms }),
        );

        expect(result.success).toBe(true);
      }
    });
  });
});
