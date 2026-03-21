import type { BaseEntity } from "./BaseEntity";

export interface SocialMediaLink {
  platform: string;
  url: string;
}

export type HeaderFooterPattern = "solid_color" | "pattern";

export const DEFAULT_SYNC_INTERVAL_MS = 3_600_000;

export const ALLOWED_SYNC_INTERVALS_MS = [
  600_000, 900_000, 1_800_000, 3_600_000,
] as const;

export type AllowedSyncIntervalMs = (typeof ALLOWED_SYNC_INTERVALS_MS)[number];

export interface OrganizationSettings extends BaseEntity {
  organization_id: string;
  display_name: string;
  logo_url: string;
  tagline: string;
  contact_email: string;
  contact_address: string;
  social_media_links: SocialMediaLink[];
  header_pattern: HeaderFooterPattern;
  footer_pattern: HeaderFooterPattern;
  background_pattern_url: string;
  show_panel_borders: boolean;
  primary_color: string;
  secondary_color: string;
  sync_interval_ms: number;
}

export type CreateOrganizationSettingsInput = Omit<
  OrganizationSettings,
  "id" | "created_at" | "updated_at"
>;

export type UpdateOrganizationSettingsInput =
  Partial<CreateOrganizationSettingsInput>;

export function create_default_organization_settings(
  organization_id: string,
  display_name: string,
): CreateOrganizationSettingsInput {
  return {
    organization_id,
    display_name,
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
    sync_interval_ms: DEFAULT_SYNC_INTERVAL_MS,
  };
}

export function validate_organization_settings_input(
  input: CreateOrganizationSettingsInput,
): string[] {
  const validation_errors: string[] = [];

  if (!input.organization_id || input.organization_id.trim().length === 0) {
    validation_errors.push("Organization ID is required");
  }

  const is_valid_interval = (
    ALLOWED_SYNC_INTERVALS_MS as readonly number[]
  ).includes(input.sync_interval_ms);

  if (!is_valid_interval) {
    validation_errors.push(
      `sync_interval_ms must be one of: ${ALLOWED_SYNC_INTERVALS_MS.join(", ")}`,
    );
  }

  return validation_errors;
}
