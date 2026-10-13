export const SETTINGS_PAGE_EVENT = {
  ORGANIZATIONS_LOAD_FAILED: "settings_organizations_load_failed",
  ORGANIZATION_SETTINGS_UNAVAILABLE:
    "settings_organization_settings_unavailable",
} as const;

export const SETTINGS_PAGE_MESSAGE = {
  SAVE_SUCCEEDED: "Organization settings saved",
  ORGANIZATIONS_LOAD_FAILED:
    "We could not load your organizations. Please refresh the page to try again.",
} as const;

export const SETTINGS_HEADER_FOOTER_STYLE = "pattern";
