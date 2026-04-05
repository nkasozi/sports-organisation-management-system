import type {
  OrganizationSettings,
  UpdateOrganizationSettingsInput,
} from "$lib/core/entities/OrganizationSettings";

export interface SocialMediaLink {
  platform: string;
  url: string;
}

export type HeaderFooterStyle = "solid_color" | "pattern";

export interface BrandingConfig {
  organization_name: string;
  organization_logo_url: string;
  organization_tagline: string;
  organization_email: string;
  organization_address: string;
  social_media_links: SocialMediaLink[];
  header_footer_style: HeaderFooterStyle;
  header_pattern: HeaderFooterStyle;
  footer_pattern: HeaderFooterStyle;
  background_pattern_url: string;
  show_panel_borders: boolean;
}

export const DEFAULT_PLATFORM_BRANDING: BrandingConfig = {
  organization_name: "Sport-Sync",
  organization_logo_url: "",
  organization_tagline:
    "Professional sports management platform for competitions, teams, players and officials.",
  organization_email: "info@sport-sync.local",
  organization_address: "Sports Management HQ",
  social_media_links: [
    { platform: "twitter", url: "" },
    { platform: "github", url: "" },
    { platform: "linkedin", url: "" },
  ],
  header_footer_style: "pattern",
  header_pattern: "pattern",
  footer_pattern: "solid_color",
  background_pattern_url: "/african-mosaic-bg.svg",
  show_panel_borders: false,
};

export const PLATFORM_STORAGE_KEY = "sports-org-branding-platform";
export const CURRENT_ORG_ID_KEY = "sports-org-branding-current-org-id";

export function map_settings_to_branding(
  settings: OrganizationSettings,
): BrandingConfig {
  return {
    organization_name: settings.display_name,
    organization_logo_url: settings.logo_url,
    organization_tagline: settings.tagline,
    organization_email: settings.contact_email,
    organization_address: settings.contact_address,
    social_media_links: settings.social_media_links,
    header_footer_style: settings.header_pattern,
    header_pattern: settings.header_pattern,
    footer_pattern: settings.footer_pattern,
    background_pattern_url: settings.background_pattern_url,
    show_panel_borders: settings.show_panel_borders,
  };
}

export function map_branding_to_settings_input(
  config: BrandingConfig,
): UpdateOrganizationSettingsInput {
  return {
    display_name: config.organization_name,
    logo_url: config.organization_logo_url,
    tagline: config.organization_tagline,
    contact_email: config.organization_email,
    contact_address: config.organization_address,
    social_media_links: config.social_media_links,
    header_pattern: config.header_pattern,
    footer_pattern: config.footer_pattern,
    background_pattern_url: config.background_pattern_url,
    show_panel_borders: config.show_panel_borders,
  };
}
