import { get, writable } from "svelte/store";

import { browser } from "$app/environment";
import type { OrganizationSettings } from "$lib/core/entities/OrganizationSettings";
import {
  get_app_settings_storage,
  get_use_cases_container,
} from "$lib/infrastructure/container";
import { auth_store } from "$lib/presentation/stores/auth";
import { update_theme_colors } from "$lib/presentation/stores/theme";
export type {
  BrandingConfig,
  HeaderFooterStyle,
  SocialMediaLink,
} from "./brandingTypes";
import type { BrandingConfig, SocialMediaLink } from "./brandingTypes";
import {
  CURRENT_ORG_ID_KEY,
  DEFAULT_PLATFORM_BRANDING,
  map_branding_to_settings_input,
  map_settings_to_branding,
  PLATFORM_STORAGE_KEY,
} from "./brandingTypes";

function get_caller_role(): string {
  return get(auth_store).current_profile?.role ?? "public_viewer";
}

function create_branding_store() {
  let current_org_id: string | null = null;
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
    if (!current_org_id) {
      await get_app_settings_storage().set_setting(
        PLATFORM_STORAGE_KEY,
        JSON.stringify(config),
      );
      return;
    }
    const use_cases = get_use_cases_container().organization_settings_use_cases;
    await use_cases.save_or_update(
      get_caller_role(),
      current_org_id,
      map_branding_to_settings_input(config),
    );
  }

  return {
    subscribe,

    initialize: async (): Promise<void> => {
      if (!browser) return;
      const app_settings = get_app_settings_storage();
      current_org_id = await app_settings.get_setting(CURRENT_ORG_ID_KEY);
      if (current_org_id) {
        await load_from_org_settings(current_org_id);
        return;
      }
      const stored = await app_settings.get_setting(PLATFORM_STORAGE_KEY);
      set(
        stored
          ? (JSON.parse(stored) as BrandingConfig)
          : DEFAULT_PLATFORM_BRANDING,
      );
    },

    set_organization_context: async (
      org_id: string | null,
      org_name?: string,
      org_email?: string,
      org_address?: string,
    ): Promise<void> => {
      const app_settings = get_app_settings_storage();
      current_org_id = org_id;
      if (browser) {
        org_id
          ? await app_settings.set_setting(CURRENT_ORG_ID_KEY, org_id)
          : await app_settings.remove_setting(CURRENT_ORG_ID_KEY);
      }
      if (!org_id) {
        const stored = await app_settings.get_setting(PLATFORM_STORAGE_KEY);
        set(
          stored
            ? (JSON.parse(stored) as BrandingConfig)
            : DEFAULT_PLATFORM_BRANDING,
        );
        return;
      }
      await load_from_org_settings(org_id, org_name, org_email, org_address);
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

    get_current_org_id: (): string | null => current_org_id,

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
