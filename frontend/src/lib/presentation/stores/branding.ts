import { writable } from "svelte/store";
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
}

const default_branding: BrandingConfig = {
  organization_name: "Sports Organisation",
  organization_logo_url: "",
  organization_tagline:
    "Track competitions, teams, players, officials and fixtures for your sport all in one place.",
  organization_email: "contact@sportsorg.example",
  organization_address: "123 Sports Avenue, Stadium City, SC 12345",
  social_media_links: [
    { platform: "twitter", url: "" },
    { platform: "github", url: "" },
    { platform: "linkedin", url: "" },
  ],
  header_footer_style: "pattern",
  header_pattern: "pattern",
  footer_pattern: "solid_color",
  background_pattern_url: "/african-mosaic-bg.svg",
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
