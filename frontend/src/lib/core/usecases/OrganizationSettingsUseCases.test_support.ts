import { vi } from "vitest";

import type {
  CreateOrganizationSettingsInput,
  OrganizationSettings,
} from "../entities/OrganizationSettings";
import type { OrganizationSettingsRepository } from "../interfaces/ports/external/repositories/OrganizationSettingsRepository";
import type { ScalarInput } from "../types/DomainScalars";

export function create_mock_repository(): OrganizationSettingsRepository {
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

export function create_test_settings(
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

export function create_valid_create_input(
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
