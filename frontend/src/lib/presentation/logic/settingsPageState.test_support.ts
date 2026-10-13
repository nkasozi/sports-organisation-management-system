import type { Organization } from "$lib/core/entities/Organization";
import type { OrganizationSettings } from "$lib/core/entities/OrganizationSettings";
import type { ScalarInput } from "$lib/core/types/DomainScalars";
import type { BrandingConfig } from "$lib/presentation/stores/branding";
import type { ThemeConfig } from "$lib/presentation/stores/theme";

export function create_test_branding_config(
  overrides: Partial<BrandingConfig>,
): BrandingConfig {
  return {
    organization_name: overrides.organization_name ?? "Platform Name",
    organization_logo_url: overrides.organization_logo_url ?? "",
    organization_tagline: overrides.organization_tagline ?? "Welcome",
    organization_email: overrides.organization_email ?? "info@example.com",
    organization_address: overrides.organization_address ?? "123 Arena Street",
    social_media_links: overrides.social_media_links ?? [],
    header_footer_style: overrides.header_footer_style ?? "pattern",
    header_pattern: overrides.header_pattern ?? "pattern",
    footer_pattern: overrides.footer_pattern ?? "solid_color",
    background_pattern_url:
      overrides.background_pattern_url ?? "/african-mosaic-bg.svg",
    show_panel_borders: overrides.show_panel_borders ?? false,
  } as BrandingConfig;
}

export function create_test_theme_config(
  overrides: Partial<ThemeConfig>,
): ThemeConfig {
  return {
    mode: overrides.mode ?? "dark",
    primary_color: overrides.primary_color ?? "red",
    secondary_color: overrides.secondary_color ?? "blue",
  } as ThemeConfig;
}

export function create_test_organization(
  overrides: Partial<ScalarInput<Organization>>,
): Organization {
  return {
    id: overrides.id ?? "organization_1",
    created_at: overrides.created_at ?? "2024-01-01T00:00:00.000Z",
    updated_at: overrides.updated_at ?? "2024-01-01T00:00:00.000Z",
    name: overrides.name ?? "Premier League",
    description: overrides.description ?? "",
    sport_id: overrides.sport_id ?? "sport_1",
    founded_date: overrides.founded_date ?? "",
    contact_email: overrides.contact_email ?? "info@example.com",
    contact_phone: overrides.contact_phone ?? "",
    address: overrides.address ?? "Arena Road",
    website: overrides.website ?? "",
    status: overrides.status ?? "active",
  } as Organization;
}

export function create_test_organization_settings(
  overrides: Partial<ScalarInput<OrganizationSettings>>,
): OrganizationSettings {
  return {
    id: overrides.id ?? "settings_1",
    created_at: overrides.created_at ?? "2024-01-01T00:00:00.000Z",
    updated_at: overrides.updated_at ?? "2024-01-01T00:00:00.000Z",
    organization_id: overrides.organization_id ?? "organization_1",
    display_name: overrides.display_name ?? "League Office",
    logo_url: overrides.logo_url ?? "https://example.com/logo.png",
    tagline: overrides.tagline ?? "Competition first",
    contact_email: overrides.contact_email ?? "office@example.com",
    contact_address: overrides.contact_address ?? "1 Stadium Way",
    social_media_links: overrides.social_media_links ?? [
      { platform: "twitter", url: "https://x.com/league" },
    ],
    header_pattern: overrides.header_pattern ?? "pattern",
    footer_pattern: overrides.footer_pattern ?? "solid_color",
    background_pattern_url:
      overrides.background_pattern_url ?? "/custom-pattern.svg",
    show_panel_borders: overrides.show_panel_borders ?? true,
    primary_color: overrides.primary_color ?? "emerald",
    secondary_color: overrides.secondary_color ?? "purple",
    sync_interval_ms: overrides.sync_interval_ms ?? 900_000,
  } as OrganizationSettings;
}
