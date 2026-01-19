import { writable } from "svelte/store";
import { browser } from "$app/environment";

export interface SocialMediaLink {
  platform: string;
  url: string;
}

export interface BrandingConfig {
  organization_name: string;
  organization_logo_url: string;
  organization_tagline: string;
  social_media_links: SocialMediaLink[];
}

const default_branding: BrandingConfig = {
  organization_name: "Sports Organisation",
  organization_logo_url: "",
  organization_tagline:
    "Track competitions, teams, players, officials and fixtures for your sport all in one place.",
  social_media_links: [
    { platform: "twitter", url: "" },
    { platform: "github", url: "" },
    { platform: "linkedin", url: "" },
  ],
};

const storage_key = "sports-org-branding";

function create_branding_store() {
  let initial_branding = default_branding;

  if (browser) {
    const stored = localStorage.getItem(storage_key);
    if (stored) {
      try {
        initial_branding = JSON.parse(stored);
      } catch (e) {
        initial_branding = default_branding;
      }
    }
  }

  const { subscribe, set, update } = writable<BrandingConfig>(initial_branding);

  return {
    subscribe,
    set: (config: BrandingConfig) => {
      if (browser) {
        localStorage.setItem(storage_key, JSON.stringify(config));
      }
      set(config);
    },
    update: (updater: (config: BrandingConfig) => BrandingConfig) => {
      update((config) => {
        const updated = updater(config);
        if (browser) {
          localStorage.setItem(storage_key, JSON.stringify(updated));
        }
        return updated;
      });
    },
    update_organization_name: (name: string) => {
      update((config) => ({ ...config, organization_name: name }));
    },
    update_organization_logo: (logo_url: string) => {
      update((config) => ({ ...config, organization_logo_url: logo_url }));
    },
    update_social_media_links: (links: SocialMediaLink[]) => {
      update((config) => ({ ...config, social_media_links: links }));
    },
    reset_to_default: () => {
      if (browser) {
        localStorage.removeItem(storage_key);
      }
      set(default_branding);
    },
  };
}

export const branding_store = create_branding_store();
