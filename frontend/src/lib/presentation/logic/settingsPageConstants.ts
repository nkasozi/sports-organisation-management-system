import type { Organization } from "$lib/core/entities/Organization";
import {
  DEFAULT_SYNC_INTERVAL_MS,
  type OrganizationSettings,
} from "$lib/core/entities/OrganizationSettings";
import type {
  BrandingConfig,
  HeaderFooterStyle,
  SocialMediaLink,
} from "$lib/presentation/stores/branding";
import type { ThemeConfig } from "$lib/presentation/stores/theme";

export const DEFAULT_LOGO_SVG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%23ffffff'%3E%3Cpath fill-rule='evenodd' d='M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z' clip-rule='evenodd'/%3E%3C/svg%3E";
export const DEFAULT_BACKGROUND_PATTERN_URL = "/african-mosaic-bg.svg";
export const DEFAULT_HEADER_PATTERN: HeaderFooterStyle = "pattern";
export const DEFAULT_FOOTER_PATTERN: HeaderFooterStyle = "solid_color";
export const DEFAULT_PRIMARY_COLOR_OPTION = "red";
export const DEFAULT_SECONDARY_COLOR_OPTION = "blue";

export interface SettingsOption {
  value: string;
  label: string;
}

export interface SyncIntervalOption {
  value: number;
  label: string;
}

export interface SettingsColorOption extends SettingsOption {
  hex: string;
  class_name: string;
}

export interface SettingsFormValues {
  organization_name: string;
  organization_logo_url: string;
  organization_tagline: string;
  organization_email: string;
  organization_address: string;
  selected_primary_color: string;
  selected_secondary_color: string;
  header_pattern: HeaderFooterStyle;
  footer_pattern: HeaderFooterStyle;
  background_pattern_url: string;
  show_panel_borders: boolean;
  social_media_links: SocialMediaLink[];
  selected_sync_interval_ms: number;
}

export type SettingsActionResult<T> =
  | { success: true; data: T }
  | { success: false; error_message: string };

export const SYNC_INTERVAL_OPTIONS: ReadonlyArray<SyncIntervalOption> = [
  { value: 600_000, label: "Every 10 minutes" },
  { value: 900_000, label: "Every 15 minutes" },
  { value: 1_800_000, label: "Every 30 minutes" },
  { value: 3_600_000, label: "Every 1 hour (default)" },
];

export const SOCIAL_MEDIA_OPTIONS: ReadonlyArray<SettingsOption> = [
  { value: "twitter", label: "Twitter" },
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "github", label: "GitHub" },
  { value: "youtube", label: "YouTube" },
  { value: "tiktok", label: "TikTok" },
  { value: "discord", label: "Discord" },
];

export const COLOR_OPTIONS: ReadonlyArray<SettingsColorOption> = [
  { value: "sky", label: "Sky", hex: "#0284C7", class_name: "bg-sky-600" },
  { value: "blue", label: "Blue", hex: "#2563EB", class_name: "bg-blue-600" },
  {
    value: "green",
    label: "Emerald",
    hex: "#059669",
    class_name: "bg-emerald-600",
  },
  { value: "red", label: "Red", hex: "#DC2626", class_name: "bg-red-600" },
  {
    value: "purple",
    label: "Purple",
    hex: "#9333EA",
    class_name: "bg-purple-600",
  },
  { value: "cyan", label: "Cyan", hex: "#0891B2", class_name: "bg-cyan-600" },
  { value: "pink", label: "Pink", hex: "#DB2777", class_name: "bg-pink-600" },
  { value: "teal", label: "Teal", hex: "#0D9488", class_name: "bg-teal-600" },
  {
    value: "indigo",
    label: "Indigo",
    hex: "#4F46E5",
    class_name: "bg-indigo-600",
  },
  { value: "cyan", label: "Cyan", hex: "#0891B2", class_name: "bg-cyan-600" },
  { value: "rose", label: "Rose", hex: "#E11D48", class_name: "bg-rose-600" },
  {
    value: "violet",
    label: "Violet",
    hex: "#7C3AED",
    class_name: "bg-violet-600",
  },
  {
    value: "fuchsia",
    label: "Fuchsia",
    hex: "#C026D3",
    class_name: "bg-fuchsia-600",
  },
  { value: "lime", label: "Lime", hex: "#65A30D", class_name: "bg-lime-600" },
  { value: "sky", label: "Sky", hex: "#0284C7", class_name: "bg-sky-600" },
  {
    value: "slate",
    label: "Slate",
    hex: "#475569",
    class_name: "bg-slate-600",
  },
];

const COLOR_MAPPING: Record<string, string> = {
  amber: "yellow",
  emerald: "green",
};

export function map_theme_color_to_option(theme_color: string): string {
  return COLOR_MAPPING[theme_color] ?? theme_color;
}

export function create_settings_form_values(
  branding_config: BrandingConfig,
  theme_config: ThemeConfig,
  sync_interval_ms: number = DEFAULT_SYNC_INTERVAL_MS,
): SettingsFormValues {
  return {
    organization_name: branding_config.organization_name,
    organization_logo_url: branding_config.organization_logo_url,
    organization_tagline: branding_config.organization_tagline ?? "",
    organization_email: branding_config.organization_email ?? "",
    organization_address: branding_config.organization_address ?? "",
    selected_primary_color: map_theme_color_to_option(
      theme_config.primary_color,
    ),
    selected_secondary_color: map_theme_color_to_option(
      theme_config.secondary_color,
    ),
    header_pattern: branding_config.header_pattern ?? DEFAULT_HEADER_PATTERN,
    footer_pattern: branding_config.footer_pattern ?? DEFAULT_FOOTER_PATTERN,
    background_pattern_url:
      branding_config.background_pattern_url || DEFAULT_BACKGROUND_PATTERN_URL,
    show_panel_borders: branding_config.show_panel_borders ?? false,
    social_media_links: [...(branding_config.social_media_links ?? [])],
    selected_sync_interval_ms: sync_interval_ms,
  };
}

export function apply_organization_settings_form_values(
  current_values: SettingsFormValues,
  selected_organization: Organization | undefined,
  organization_settings: OrganizationSettings | null,
): SettingsFormValues {
  if (!organization_settings) {
    return {
      ...current_values,
      organization_name: selected_organization?.name ?? "",
    };
  }
  return {
    ...current_values,
    organization_name:
      organization_settings.display_name || selected_organization?.name || "",
    organization_logo_url: organization_settings.logo_url ?? "",
    organization_tagline: organization_settings.tagline ?? "",
    organization_email: organization_settings.contact_email ?? "",
    organization_address: organization_settings.contact_address ?? "",
    header_pattern:
      organization_settings.header_pattern ?? DEFAULT_HEADER_PATTERN,
    footer_pattern:
      organization_settings.footer_pattern ?? DEFAULT_FOOTER_PATTERN,
    background_pattern_url:
      organization_settings.background_pattern_url ||
      DEFAULT_BACKGROUND_PATTERN_URL,
    show_panel_borders: organization_settings.show_panel_borders ?? false,
    social_media_links: [...(organization_settings.social_media_links ?? [])],
    selected_sync_interval_ms:
      organization_settings.sync_interval_ms || DEFAULT_SYNC_INTERVAL_MS,
  };
}
