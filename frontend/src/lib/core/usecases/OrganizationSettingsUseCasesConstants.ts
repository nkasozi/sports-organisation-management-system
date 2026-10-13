import type { CreateOrganizationSettingsInput } from "../entities/OrganizationSettings";
import { DEFAULT_SYNC_INTERVAL_MS } from "../entities/OrganizationSettings";
import type { UserRole } from "../interfaces/ports";

export const ORGANIZATION_SETTINGS_USE_CASES_LOG_SCOPE =
  "[OrganizationSettingsUseCases]";

export const OrganizationSettingsUseCaseEvent = {
  GET_ID_MISSING: "org_settings_get_id_missing",
  GET_NOT_FOUND: "org_settings_get_not_found",
  LOOKUP_FAILED: "org_settings_lookup_failed",
  SAVE_PERMISSION_DENIED: "org_settings_save_permission_denied",
  SAVE_VALIDATION_FAILED: "org_settings_save_validation_failed",
  SAVE_REQUESTED: "org_settings_save",
  SAVE_FAILED: "org_settings_save_failed",
  UPDATE_PERMISSION_DENIED: "org_settings_update_permission_denied",
  UPDATE_ID_MISSING: "org_settings_update_id_missing",
  UPDATE_REQUESTED: "org_settings_update",
  UPDATE_FAILED: "org_settings_update_failed",
  SAVE_OR_UPDATE_PERMISSION_DENIED:
    "org_settings_save_or_update_permission_denied",
  SAVE_OR_UPDATE_ID_MISSING: "org_settings_save_or_update_id_missing",
} as const;

export const OrganizationSettingsUseCaseMessage = {
  ORGANIZATION_ID_REQUIRED: "Organization ID is required",
  SETTINGS_ID_REQUIRED: "Settings ID is required",
  NOT_FOUND: "Organization settings not found",
  WRITE_NOT_PERMITTED:
    "Only org_admin or super_admin can modify organization settings",
} as const;

export const ORGANIZATION_SETTINGS_WRITE_PERMITTED_ROLES: readonly UserRole[] =
  ["super_admin", "org_admin"];

export const OrganizationSettingsLookupStatus = {
  FOUND: "found",
  MISSING: "missing",
} as const;

export const ORGANIZATION_SETTINGS_CREATE_DEFAULTS: Omit<
  CreateOrganizationSettingsInput,
  "organization_id"
> = {
  display_name: "",
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
