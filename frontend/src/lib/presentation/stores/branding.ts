import { writable, get } from "svelte/store";
import { browser } from "$app/environment";

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
  organization_name: "Sports Organisation",
  organization_logo_url: "",
  organization_tagline:
    "Professional sports management platform for competitions, teams, players and officials.",
  organization_email: "info@sportsorg.local",
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

function load_branding_from_storage(
  storage_key: string,
): BrandingConfig | null {
  if (!browser) return null;
  const stored = localStorage.getItem(storage_key);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

function save_branding_to_storage(
  storage_key: string,
  config: BrandingConfig,
): void {
  if (!browser) return;
  localStorage.setItem(storage_key, JSON.stringify(config));
}

function create_branding_store() {
  let current_org_id: string | null = null;

  if (browser) {
    current_org_id = localStorage.getItem(CURRENT_ORG_ID_KEY);
  }

  function get_initial_branding(): BrandingConfig {
    if (!current_org_id) {
      const platform_branding =
        load_branding_from_storage(PLATFORM_STORAGE_KEY);
      return platform_branding || DEFAULT_PLATFORM_BRANDING;
    }
    const org_branding = load_branding_from_storage(
      get_org_storage_key(current_org_id),
    );
    return org_branding || DEFAULT_PLATFORM_BRANDING;
  }

  const { subscribe, set, update } = writable<BrandingConfig>(
    get_initial_branding(),
  );

  function get_current_storage_key(): string {
    return current_org_id
      ? get_org_storage_key(current_org_id)
      : PLATFORM_STORAGE_KEY;
  }

  return {
    subscribe,

    set_organization_context: (
      org_id: string | null,
      org_name?: string,
      org_email?: string,
      org_address?: string,
    ) => {
      current_org_id = org_id;

      if (browser) {
        if (org_id) {
          localStorage.setItem(CURRENT_ORG_ID_KEY, org_id);
        } else {
          localStorage.removeItem(CURRENT_ORG_ID_KEY);
        }
      }

      if (!org_id) {
        const platform_branding =
          load_branding_from_storage(PLATFORM_STORAGE_KEY);
        set(platform_branding || DEFAULT_PLATFORM_BRANDING);
        return;
      }

      let org_branding = load_branding_from_storage(
        get_org_storage_key(org_id),
      );

      if (!org_branding && org_name) {
        org_branding = {
          ...DEFAULT_PLATFORM_BRANDING,
          organization_name: org_name,
          organization_email:
            org_email || DEFAULT_PLATFORM_BRANDING.organization_email,
          organization_address:
            org_address || DEFAULT_PLATFORM_BRANDING.organization_address,
        };
        save_branding_to_storage(get_org_storage_key(org_id), org_branding);
      }

      set(org_branding || DEFAULT_PLATFORM_BRANDING);
    },

    get_current_org_id: (): string | null => {
      return current_org_id;
    },

    set: (config: BrandingConfig) => {
      const storage_key = get_current_storage_key();
      save_branding_to_storage(storage_key, config);
      set(config);
    },

    update: (updater: (config: BrandingConfig) => BrandingConfig) => {
      update((config) => {
        const updated = updater(config);
        const storage_key = get_current_storage_key();
        save_branding_to_storage(storage_key, updated);
        return updated;
      });
    },

    update_organization_name: (name: string) => {
      update((config) => {
        const updated = { ...config, organization_name: name };
        const storage_key = get_current_storage_key();
        save_branding_to_storage(storage_key, updated);
        return updated;
      });
    },

    update_organization_logo: (logo_url: string) => {
      update((config) => {
        const updated = { ...config, organization_logo_url: logo_url };
        const storage_key = get_current_storage_key();
        save_branding_to_storage(storage_key, updated);
        return updated;
      });
    },

    update_social_media_links: (links: SocialMediaLink[]) => {
      update((config) => {
        const updated = { ...config, social_media_links: links };
        const storage_key = get_current_storage_key();
        save_branding_to_storage(storage_key, updated);
        return updated;
      });
    },

    reset_to_default: () => {
      const storage_key = get_current_storage_key();
      if (browser) {
        localStorage.removeItem(storage_key);
      }
      set(DEFAULT_PLATFORM_BRANDING);
    },
  };
}

export const branding_store = create_branding_store();
