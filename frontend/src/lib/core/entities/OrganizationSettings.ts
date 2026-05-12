import type {
  EmailAddress,
  EntityId,
  HttpUrlValue,
  Name,
  OptionalMediaUrlValue,
  ScalarInput,
} from "../types/DomainScalars";
import {
  parse_http_url_value,
  parse_optional_media_url_value,
} from "../types/DomainScalars";
import type { BaseEntity } from "./BaseEntity";

export interface SocialMediaLink {
  platform: string;
  url: HttpUrlValue;
}

export type HeaderFooterPattern = "solid_color" | "pattern";

export const DEFAULT_SYNC_INTERVAL_MS = 3_600_000;

export const ALLOWED_SYNC_INTERVALS_MS = [
  600_000, 900_000, 1_800_000, 3_600_000,
] as const;

export interface OrganizationSettings extends BaseEntity {
  organization_id: EntityId;
  display_name: Name;
  logo_url: OptionalMediaUrlValue;
  tagline: string;
  contact_email: EmailAddress;
  contact_address: string;
  social_media_links: SocialMediaLink[];
  header_pattern: HeaderFooterPattern;
  footer_pattern: HeaderFooterPattern;
  background_pattern_url: OptionalMediaUrlValue;
  show_panel_borders: boolean;
  primary_color: string;
  secondary_color: string;
  sync_interval_ms: number;
}

export type CreateOrganizationSettingsInput = Omit<
  ScalarInput<OrganizationSettings>,
  "id" | "created_at" | "updated_at"
>;

export type UpdateOrganizationSettingsInput =
  Partial<CreateOrganizationSettingsInput>;

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

  const logo_url_result = parse_optional_media_url_value(
    input.logo_url,
    "Logo URL is invalid",
  );
  if (!logo_url_result.success) {
    validation_errors.push(logo_url_result.error);
  }

  const background_pattern_url_result = parse_optional_media_url_value(
    input.background_pattern_url,
    "Background pattern URL is invalid",
  );
  if (!background_pattern_url_result.success) {
    validation_errors.push(background_pattern_url_result.error);
  }

  for (const social_media_link of input.social_media_links) {
    const social_media_link_url_result = parse_http_url_value(
      social_media_link.url,
      "Social media link URL is invalid",
    );
    if (!social_media_link_url_result.success) {
      validation_errors.push(social_media_link_url_result.error);
    }
  }

  return validation_errors;
}
