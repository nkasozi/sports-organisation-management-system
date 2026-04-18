import { beforeEach, describe, expect, it, vi } from "vitest";

import type {
  CreateOrganizationSettingsInput,
  OrganizationSettings,
} from "../entities/OrganizationSettings";
import type { OrganizationSettingsRepository } from "../interfaces/ports/external/repositories/OrganizationSettingsRepository";
import type { ScalarInput } from "../types/DomainScalars";
import { create_organization_settings_use_cases } from "./OrganizationSettingsUseCases";

function create_mock_repository(): OrganizationSettingsRepository {
  return {
    find_all: vi.fn(),
    find_by_id: vi.fn(),
    find_by_ids: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete_by_id: vi.fn(),
    delete_by_ids: vi.fn(),
    count: vi.fn(),
    find_by_organization_id: vi.fn(),
  } as OrganizationSettingsRepository;
}

function create_test_settings(
  overrides: Partial<ScalarInput<OrganizationSettings>> = {},
): OrganizationSettings {
  return {
    id: "settings-123",
    organization_id: "org-abc",
    display_name: "Test FC",
    logo_url: "https://example.com/logo.png",
    tagline: "Play hard",
    contact_email: "info@testfc.com",
    contact_address: "123 Main St",
    social_media_links: [],
    header_pattern: "pattern",
    footer_pattern: "solid_color",
    background_pattern_url: "/african-mosaic-bg.svg",
    show_panel_borders: false,
    primary_color: "red",
    secondary_color: "blue",
    sync_interval_ms: 3_600_000,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  } as unknown as OrganizationSettings;
}

function create_valid_create_input(
  overrides: Partial<CreateOrganizationSettingsInput> = {},
): CreateOrganizationSettingsInput {
  return {
    organization_id: "org-abc",
    display_name: "Test FC",
    logo_url: "",
    tagline: "",
    contact_email: "",
    contact_address: "",
    social_media_links: [],
    header_pattern: "pattern",
    footer_pattern: "solid_color",
    background_pattern_url: "/african-mosaic-bg.svg",
    show_panel_borders: false,
    primary_color: "red",
    secondary_color: "blue",
    sync_interval_ms: 3_600_000,
    ...overrides,
  } as CreateOrganizationSettingsInput;
}

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
      expect(result.error).toContain("organization_id=org-abc");
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

      await use_cases.save_or_update("org_admin", "org-abc", {
        sync_interval_ms: 900_000,
      });

      const call_arg = vi.mocked(mock_repository.create).mock.calls[0][0];
      expect(call_arg.sync_interval_ms).toBe(900_000);
      expect(call_arg.header_pattern).toBe("pattern");
      expect(call_arg.footer_pattern).toBe("solid_color");
      expect(call_arg.background_pattern_url).toBe("/african-mosaic-bg.svg");
    });
  });
});
