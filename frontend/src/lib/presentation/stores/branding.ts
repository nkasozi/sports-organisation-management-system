import { writable, get } from "svelte/store";
import { browser } from "$app/environment";
import { get_app_settings_storage } from "$lib/infrastructure/container";
import type { AppSettingsPort } from "$lib/core/interfaces/ports";

export interface SocialMediaLink {
  platform: string;
  url: string;
}

export type HeaderFooterStyle = "solid_color" | "pattern";

export interface BrandingConfig {
  organization_name: string;
  organization_logo_url: string;
  organization_tagline: string;
  organization_email: string;
  organization_address: string;
  social_media_links: SocialMediaLink[];
  header_footer_style: HeaderFooterStyle;
  header_pattern: HeaderFooterStyle;
  footer_pattern: HeaderFooterStyle;
  background_pattern_url: string;
  show_panel_borders: boolean;
}

const DEFAULT_PLATFORM_BRANDING: BrandingConfig = {
  organization_name: "Sport-Sync",
  organization_logo_url: "",
  organization_tagline:
    "Professional sports management platform for competitions, teams, players and officials.",
  organization_email: "info@sport-sync.local",
  organization_address: "Sports Management HQ",
  social_media_links: [
    { platform: "twitter", url: "" },
    { platform: "github", url: "" },
    { platform: "linkedin", url: "" },
  ],
  header_footer_style: "pattern",
  header_pattern: "pattern",
  footer_pattern: "solid_color",
  background_pattern_url: "/african-mosaic-bg.svg",
  show_panel_borders: false,
};

const PLATFORM_STORAGE_KEY = "sports-org-branding-platform";
const ORG_STORAGE_KEY_PREFIX = "sports-org-branding-org-";
const CURRENT_ORG_ID_KEY = "sports-org-branding-current-org-id";

function get_org_storage_key(org_id: string): string {
  return `${ORG_STORAGE_KEY_PREFIX}${org_id}`;
}

async function load_branding_from_storage(
  storage_key: string,
  app_settings: AppSettingsPort,
): Promise<BrandingConfig | null> {
  if (!browser) return null;
  const stored = await app_settings.get_setting(storage_key);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as BrandingConfig;
  } catch {
    return null;
  }
}

async function save_branding_to_storage(
  storage_key: string,
  config: BrandingConfig,
  app_settings: AppSettingsPort,
): Promise<void> {
  if (!browser) return;
  await app_settings.set_setting(storage_key, JSON.stringify(config));
}

function create_branding_store() {
  let current_org_id: string | null = null;

  const { subscribe, set, update } = writable<BrandingConfig>(
    DEFAULT_PLATFORM_BRANDING,
  );

  function get_current_storage_key(): string {
    return current_org_id
      ? get_org_storage_key(current_org_id)
      : PLATFORM_STORAGE_KEY;
  }

  async function persist_config(storage_key: string, config: BrandingConfig): Promise<void> {
    await save_branding_to_storage(storage_key, config, get_app_settings_storage());
  }

  return {
    subscribe,

    initialize: async (): Promise<void> => {
      if (!browser) return;
      const app_settings = get_app_settings_storage();
      current_org_id = await app_settings.get_setting(CURRENT_ORG_ID_KEY);
      const key = current_org_id ? get_org_storage_key(current_org_id) : PLATFORM_STORAGE_KEY;
      const loaded = await load_branding_from_storage(key, app_settings);
      set(loaded || DEFAULT_PLATFORM_BRANDING);
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
        if (org_id) {
          await app_settings.set_setting(CURRENT_ORG_ID_KEY, org_id);
        } else {
          await app_settings.remove_setting(CURRENT_ORG_ID_KEY);
        }
      }

      if (!org_id) {
        const platform_branding = await load_branding_from_storage(PLATFORM_STORAGE_KEY, app_settings);
        set(platform_branding || DEFAULT_PLATFORM_BRANDING);
        return;
      }

      let org_branding = await load_branding_from_storage(get_org_storage_key(org_id), app_settings);

      if (!org_branding && org_name) {
        org_branding = {
          ...DEFAULT_PLATFORM_BRANDING,
          organization_name: org_name,
          organization_email: org_email || DEFAULT_PLATFORM_BRANDING.organization_email,
          organization_address: org_address || DEFAULT_PLATFORM_BRANDING.organization_address,
        };
        await save_branding_to_storage(get_org_storage_key(org_id), org_branding, app_settings);
      }

      set(org_branding || DEFAULT_PLATFORM_BRANDING);
    },

    get_current_org_id: (): string | null => {
      return current_org_id;
    },

    set: async (config: BrandingConfig): Promise<void> => {
      await persist_config(get_current_storage_key(), config);
      set(config);
    },

    update: async (updater: (config: BrandingConfig) => BrandingConfig): Promise<void> => {
      const current_config = get({ subscribe });
      const updated = updater(current_config);
      await persist_config(get_current_storage_key(), updated);
      set(updated);
    },

    update_organization_name: async (name: string): Promise<void> => {
      const current_config = get({ subscribe });
      const updated = { ...current_config, organization_name: name };
      await persist_config(get_current_storage_key(), updated);
      set(updated);
    },

    update_organization_logo: async (logo_url: string): Promise<void> => {
      const current_config = get({ subscribe });
      const updated = { ...current_config, organization_logo_url: logo_url };
      await persist_config(get_current_storage_key(), updated);
      set(updated);
    },

    update_social_media_links: async (links: SocialMediaLink[]): Promise<void> => {
      const current_config = get({ subscribe });
      const updated = { ...current_config, social_media_links: links };
      await persist_config(get_current_storage_key(), updated);
      set(updated);
    },

    reset_to_default: async (): Promise<void> => {
      if (browser) {
        await get_app_settings_storage().remove_setting(get_current_storage_key());
      }
      set(DEFAULT_PLATFORM_BRANDING);
    },
  };
}

export const branding_store = create_branding_store();
