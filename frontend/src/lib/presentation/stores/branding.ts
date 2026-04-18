import { get, writable } from "svelte/store";

import { browser } from "$app/environment";
import type { OrganizationSettings } from "$lib/core/entities/OrganizationSettings";
import {
  get_app_settings_storage,
  get_use_cases_container,
} from "$lib/infrastructure/container";
import { auth_store } from "$lib/presentation/stores/auth";
import { normalize_auth_profile_state } from "$lib/presentation/stores/authTypes";
import { update_theme_colors } from "$lib/presentation/stores/theme";

import type {
  BrandingConfig,
  BrandingOrganizationContext,
  SocialMediaLink,
} from "./brandingTypes";
import {
  CURRENT_ORG_ID_KEY,
  DEFAULT_PLATFORM_BRANDING,
  map_branding_to_settings_input,
  map_settings_to_branding,
  PLATFORM_STORAGE_KEY,
} from "./brandingTypes";

export type {
  BrandingConfig,
  HeaderFooterStyle,
  SocialMediaLink,
} from "./brandingTypes";

function get_caller_role(): string {
  const current_profile_state = normalize_auth_profile_state(
    get(auth_store).current_profile,
  );

  return current_profile_state.status === "present"
    ? current_profile_state.profile.role
    : "public_viewer";
}

function create_branding_store() {
  let organization_context_state: BrandingOrganizationContext = {
    status: "platform",
  };
  const { subscribe, set } = writable<BrandingConfig>(
    DEFAULT_PLATFORM_BRANDING,
  );

  async function load_from_org_settings(
    org_id: string,
    fallback_name?: string,
    fallback_email?: string,
    fallback_address?: string,
  ): Promise<void> {
    const use_cases = get_use_cases_container().organization_settings_use_cases;
    const result = await use_cases.get_by_organization_id(org_id);

    if (result.success && result.data) {
      set(map_settings_to_branding(result.data));
      update_theme_colors({
        primaryColor: result.data.primary_color,
        secondaryColor: result.data.secondary_color,
      });
      console.log("[BrandingStore] Loaded org settings", {
        event: "branding_loaded_from_settings",
        organization_id: org_id,
      });
      return;
    }

    const current = get({ subscribe });
    await use_cases.save_or_update(get_caller_role(), org_id, {
      display_name: fallback_name ?? current.organization_name,
      logo_url: current.organization_logo_url,
      tagline: current.organization_tagline,
      contact_email: fallback_email ?? current.organization_email,
      contact_address: fallback_address ?? current.organization_address,
      social_media_links: current.social_media_links,
      header_pattern: current.header_pattern,
      footer_pattern: current.footer_pattern,
      background_pattern_url: current.background_pattern_url,
      show_panel_borders: current.show_panel_borders,
    });
    console.log(
      "[BrandingStore] Auto-migrated local branding to OrganizationSettings",
      { event: "branding_auto_migrated", organization_id: org_id },
    );
  }

  async function persist_branding(config: BrandingConfig): Promise<void> {
    if (organization_context_state.status !== "scoped") {
      await get_app_settings_storage().set_setting(
        PLATFORM_STORAGE_KEY,
        JSON.stringify(config),
      );
      return;
    }

    const use_cases = get_use_cases_container().organization_settings_use_cases;
    await use_cases.save_or_update(
      get_caller_role(),
      organization_context_state.organization_id,
      map_branding_to_settings_input(config),
    );
  }

  return {
    subscribe,

    initialize: async (): Promise<void> => {
      if (!browser) return;
      const app_settings = get_app_settings_storage();
      const current_org_id = await app_settings.get_setting(CURRENT_ORG_ID_KEY);
      if (current_org_id) {
        organization_context_state = {
          status: "scoped",
          organization_id: current_org_id,
        };
        await load_from_org_settings(current_org_id);
        return;
      }

      organization_context_state = { status: "platform" };
      const stored = await app_settings.get_setting(PLATFORM_STORAGE_KEY);
      set(
        stored
          ? (JSON.parse(stored) as BrandingConfig)
          : DEFAULT_PLATFORM_BRANDING,
      );
    },

    set_organization_context: async (
      context: BrandingOrganizationContext,
    ): Promise<void> => {
      const app_settings = get_app_settings_storage();
      organization_context_state =
        context.status === "scoped"
          ? {
              status: "scoped",
              organization_id: context.organization_id,
            }
          : { status: "platform" };
      if (browser) {
        context.status === "scoped"
          ? await app_settings.set_setting(
              CURRENT_ORG_ID_KEY,
              context.organization_id,
            )
          : await app_settings.remove_setting(CURRENT_ORG_ID_KEY);
      }
      if (context.status !== "scoped") {
        const stored = await app_settings.get_setting(PLATFORM_STORAGE_KEY);
        set(
          stored
            ? (JSON.parse(stored) as BrandingConfig)
            : DEFAULT_PLATFORM_BRANDING,
        );
        return;
      }
      await load_from_org_settings(
        context.organization_id,
        context.organization_name,
        context.organization_email,
        context.organization_address,
      );
    },

    refresh_from_organization_settings: (
      settings: OrganizationSettings,
    ): void => {
      set(map_settings_to_branding(settings));
      update_theme_colors({
        primaryColor: settings.primary_color,
        secondaryColor: settings.secondary_color,
      });
      console.log("[BrandingStore] Refreshed from realtime update", {
        event: "branding_refreshed_realtime",
        organization_id: settings.organization_id,
      });
    },

    get_current_org_id_state: (): BrandingOrganizationContext =>
      organization_context_state.status === "scoped"
        ? {
            status: "scoped",
            organization_id: organization_context_state.organization_id,
          }
        : { status: "platform" },

    set: async (config: BrandingConfig): Promise<void> => {
      await persist_branding(config);
      set(config);
    },

    update: async (
      updater: (config: BrandingConfig) => BrandingConfig,
    ): Promise<void> => {
      const updated = updater(get({ subscribe }));
      await persist_branding(updated);
      set(updated);
    },

    update_organization_name: async (name: string): Promise<void> => {
      const updated = { ...get({ subscribe }), organization_name: name };
      await persist_branding(updated);
      set(updated);
    },

    update_organization_logo: async (logo_url: string): Promise<void> => {
      const updated = {
        ...get({ subscribe }),
        organization_logo_url: logo_url,
      };
      await persist_branding(updated);
      set(updated);
    },

    update_social_media_links: async (
      links: SocialMediaLink[],
    ): Promise<void> => {
      const updated = { ...get({ subscribe }), social_media_links: links };
      await persist_branding(updated);
      set(updated);
    },

    reset_to_default: async (): Promise<void> => {
      set(DEFAULT_PLATFORM_BRANDING);
    },
  };
}

export const branding_store = create_branding_store();
