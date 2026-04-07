import type { Organization } from "$lib/core/entities/Organization";
import { ALLOWED_SYNC_INTERVALS_MS } from "$lib/core/entities/OrganizationSettings";
import type { SocialMediaLink } from "$lib/presentation/stores/branding";
export {
  apply_organization_settings_form_values,
  COLOR_OPTIONS,
  create_settings_form_values,
  DEFAULT_BACKGROUND_PATTERN_URL,
  DEFAULT_FOOTER_PATTERN,
  DEFAULT_HEADER_PATTERN,
  DEFAULT_LOGO_SVG,
  DEFAULT_PRIMARY_COLOR_OPTION,
  DEFAULT_SECONDARY_COLOR_OPTION,
  type SettingsActionResult,
  type SettingsColorOption,
  type SettingsFormValues,
  type SettingsOption,
  SOCIAL_MEDIA_OPTIONS,
  SYNC_INTERVAL_OPTIONS,
  type SyncIntervalOption,
} from "$lib/presentation/logic/settingsPageConstants";
import {
  type SettingsActionResult,
  SOCIAL_MEDIA_OPTIONS,
} from "$lib/presentation/logic/settingsPageConstants";

export function get_default_selected_organization_id(
  organizations: Organization[],
  profile_organization_id: string | undefined,
): string {
  if (organizations.length === 0) {
    return "";
  }

  if (!profile_organization_id) {
    return organizations[0].id;
  }

  const matched_organization = organizations.find(
    (organization) => organization.id === profile_organization_id,
  );
  return matched_organization?.id ?? organizations[0].id;
}

export function add_social_media_link(
  social_media_links: SocialMediaLink[],
): SettingsActionResult<SocialMediaLink[]> {
  const available_platform = SOCIAL_MEDIA_OPTIONS.find(
    (option) =>
      !social_media_links.some((link) => link.platform === option.value),
  );

  if (!available_platform) {
    return {
      success: false,
      error_message: "All social media platforms are already added",
    };
  }

  return {
    success: true,
    data: [
      ...social_media_links,
      { platform: available_platform.value, url: "" },
    ],
  };
}

export function remove_social_media_link(
  social_media_links: SocialMediaLink[],
  platform: string,
): SocialMediaLink[] {
  return social_media_links.filter((link) => link.platform !== platform);
}

export function update_social_media_url(
  social_media_links: SocialMediaLink[],
  platform: string,
  url: string,
): SocialMediaLink[] {
  return social_media_links.map((link) =>
    link.platform === platform ? { ...link, url } : link,
  );
}

export function update_social_media_platform(
  social_media_links: SocialMediaLink[],
  old_platform: string,
  new_platform: string,
): SettingsActionResult<SocialMediaLink[]> {
  const platform_is_taken = social_media_links.some(
    (link) => link.platform === new_platform,
  );

  if (platform_is_taken && new_platform !== old_platform) {
    return {
      success: false,
      error_message: "This platform is already added",
    };
  }

  return {
    success: true,
    data: social_media_links.map((link) =>
      link.platform === old_platform
        ? { ...link, platform: new_platform }
        : link,
    ),
  };
}

export function is_allowed_sync_interval(sync_interval_ms: number): boolean {
  return (ALLOWED_SYNC_INTERVALS_MS as readonly number[]).includes(
    sync_interval_ms,
  );
}
