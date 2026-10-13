export const BRANDING_CONTEXT_STATUS = {
  PLATFORM: "platform",
  SCOPED: "scoped",
} as const;

export const BRANDING_LOG_EVENTS = {
  REFRESHED_REALTIME: "branding_refreshed_realtime",
  AUTO_MIGRATED: "branding_auto_migrated",
  AUTO_MIGRATION_FAILED: "branding_auto_migration_failed",
  LOADED_FROM_SETTINGS: "branding_loaded_from_settings",
  SETTINGS_LOAD_FAILED: "branding_settings_load_failed",
  SETTINGS_SAVE_FAILED: "branding_settings_save_failed",
  STORED_PLATFORM_BRANDING_PARSE_FAILED:
    "branding_stored_platform_branding_parse_failed",
} as const;
