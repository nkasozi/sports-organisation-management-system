import { get } from "svelte/store";

import type { OrganizationSettings } from "$lib/core/entities/OrganizationSettings";
import {
  type AsyncResult,
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";
import {
  get_app_settings_storage,
  get_use_cases_container,
} from "$lib/infrastructure/container";
import { PRESENCE_STATUS } from "$lib/presentation/logic/presenceStatus";
import { auth_store } from "$lib/presentation/stores/auth";
import { normalize_auth_profile_state } from "$lib/presentation/stores/authTypes";
import { update_theme_colors } from "$lib/presentation/stores/theme";

import { PUBLIC_VIEWER_ROLE } from "./authStoreConstants";
import {
  BRANDING_CONTEXT_STATUS,
  BRANDING_LOG_EVENTS,
} from "./brandingConstants";
import {
  BRANDING_MIGRATION_DECISION,
  decide_branding_migration,
  keep_usable_social_media_links,
} from "./brandingMigrationPolicy";
import type {
  BrandingConfig,
  BrandingOrganizationContext,
} from "./brandingTypes";
import {
  map_branding_to_settings_input,
  map_settings_to_branding,
  PLATFORM_STORAGE_KEY,
} from "./brandingTypes";

type ScopedBrandingOrganizationContext = Extract<
  BrandingOrganizationContext,
  { status: typeof BRANDING_CONTEXT_STATUS.SCOPED }
>;

export interface BrandingStoreContext {
  read_config: () => BrandingConfig;
  set_config: (config: BrandingConfig) => void;
  organization_context: { state: BrandingOrganizationContext };
}

function get_caller_role(): string {
  const current_profile_state = normalize_auth_profile_state(
    get(auth_store).current_profile,
  );

  return current_profile_state.status === PRESENCE_STATUS.PRESENT
    ? current_profile_state.profile.role
    : PUBLIC_VIEWER_ROLE;
}

export function apply_organization_settings_branding(
  context: BrandingStoreContext,
  settings: OrganizationSettings,
): void {
  context.set_config(map_settings_to_branding(settings));
  update_theme_colors({
    primaryColor: settings.primary_color,
    secondaryColor: settings.secondary_color,
  });
}

function build_migration_settings_input(
  current: BrandingConfig,
  scoped_context: ScopedBrandingOrganizationContext,
): Parameters<
  ReturnType<
    typeof get_use_cases_container
  >["organization_settings_use_cases"]["save_or_update"]
>[2] {
  return {
    display_name: scoped_context.organization_name ?? current.organization_name,
    logo_url: current.organization_logo_url,
    tagline: current.organization_tagline,
    contact_email:
      scoped_context.organization_email ?? current.organization_email,
    contact_address:
      scoped_context.organization_address ?? current.organization_address,
    social_media_links: keep_usable_social_media_links(
      current.social_media_links,
    ),
    header_pattern: current.header_pattern,
    footer_pattern: current.footer_pattern,
    background_pattern_url: current.background_pattern_url,
    show_panel_borders: current.show_panel_borders,
  };
}

async function migrate_current_branding_to_org_settings(
  context: BrandingStoreContext,
  scoped_context: ScopedBrandingOrganizationContext,
): AsyncResult<boolean> {
  const org_id = scoped_context.organization_id;
  const use_cases = get_use_cases_container().organization_settings_use_cases;
  const current = context.read_config();
  const save_result = await use_cases.save_or_update(
    get_caller_role(),
    org_id,
    build_migration_settings_input(current, scoped_context),
  );
  if (!save_result.success) {
    console.error("[BrandingStore] Branding auto-migration failed", {
      event: BRANDING_LOG_EVENTS.AUTO_MIGRATION_FAILED,
      organization_id: org_id,
      error: save_result.error,
    });
    return create_failure_result(save_result.error);
  }
  console.log("[BrandingStore] Auto-migrated local branding", {
    event: BRANDING_LOG_EVENTS.AUTO_MIGRATED,
    organization_id: org_id,
  });
  return create_success_result(true);
}

async function migrate_branding_when_permitted(
  context: BrandingStoreContext,
  scoped_context: ScopedBrandingOrganizationContext,
): AsyncResult<boolean> {
  const caller_role = get_caller_role();
  switch (decide_branding_migration(caller_role)) {
    case BRANDING_MIGRATION_DECISION.SKIP_NOT_PERMITTED:
      console.debug("[BrandingStore] Keeping current branding", {
        event: BRANDING_LOG_EVENTS.AUTO_MIGRATION_SKIPPED_NOT_PERMITTED,
        organization_id: scoped_context.organization_id,
        caller_role,
      });
      return create_success_result(true);
    case BRANDING_MIGRATION_DECISION.MIGRATE:
      return migrate_current_branding_to_org_settings(context, scoped_context);
  }
}

export async function load_branding_from_org_settings(
  context: BrandingStoreContext,
  scoped_context: ScopedBrandingOrganizationContext,
): AsyncResult<boolean> {
  const org_id = scoped_context.organization_id;
  const use_cases = get_use_cases_container().organization_settings_use_cases;
  const result = await use_cases.get_by_organization_id(org_id);

  if (!result.success) {
    console.warn("[BrandingStore] Organization settings unavailable", {
      event: BRANDING_LOG_EVENTS.SETTINGS_LOAD_FAILED,
      organization_id: org_id,
      error: result.error,
    });
    return migrate_branding_when_permitted(context, scoped_context);
  }

  apply_organization_settings_branding(context, result.data);
  console.log("[BrandingStore] Loaded org settings", {
    event: BRANDING_LOG_EVENTS.LOADED_FROM_SETTINGS,
    organization_id: org_id,
  });
  return create_success_result(true);
}

export async function persist_branding_config(
  context: BrandingStoreContext,
  config: BrandingConfig,
): AsyncResult<boolean> {
  const organization_context_state = context.organization_context.state;
  if (organization_context_state.status !== BRANDING_CONTEXT_STATUS.SCOPED) {
    await get_app_settings_storage().set_setting(
      PLATFORM_STORAGE_KEY,
      JSON.stringify(config),
    );
    return create_success_result(true);
  }

  const use_cases = get_use_cases_container().organization_settings_use_cases;
  const save_result = await use_cases.save_or_update(
    get_caller_role(),
    organization_context_state.organization_id,
    map_branding_to_settings_input(config),
  );
  if (save_result.success) return create_success_result(true);
  console.error("[BrandingStore] Failed to save organization branding", {
    event: BRANDING_LOG_EVENTS.SETTINGS_SAVE_FAILED,
    organization_id: organization_context_state.organization_id,
    error: save_result.error,
  });
  return create_failure_result(save_result.error);
}
