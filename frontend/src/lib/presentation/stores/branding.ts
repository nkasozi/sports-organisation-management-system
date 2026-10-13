import { get, type Readable, writable } from "svelte/store";

import type { OrganizationSettings } from "$lib/core/entities/OrganizationSettings";

import {
  BRANDING_CONTEXT_STATUS,
  BRANDING_LOG_EVENTS,
} from "./brandingConstants";
import {
  apply_organization_settings_branding,
  type BrandingStoreContext,
} from "./brandingOrganizationSettingsSync";
import {
  initialize_branding,
  persist_and_set_branding,
  read_branding_organization_context,
  set_branding_organization_context,
} from "./brandingStoreActions";
import type {
  BrandingConfig,
  BrandingOrganizationContext,
  SocialMediaLink,
} from "./brandingTypes";
import { DEFAULT_PLATFORM_BRANDING } from "./brandingTypes";

export type {
  BrandingConfig,
  HeaderFooterStyle,
  SocialMediaLink,
} from "./brandingTypes";

function refresh_branding_from_organization_settings(
  context: BrandingStoreContext,
  settings: OrganizationSettings,
): void {
  apply_organization_settings_branding(context, settings);
  console.log("[BrandingStore] Refreshed from realtime update", {
    event: BRANDING_LOG_EVENTS.REFRESHED_REALTIME,
    organization_id: settings.organization_id,
  });
}

interface BrandingFieldUpdaters {
  update_organization_name: (name: string) => Promise<void>;
  update_organization_logo: (logo_url: string) => Promise<void>;
  update_social_media_links: (links: SocialMediaLink[]) => Promise<void>;
}

function build_branding_field_updaters(
  context: BrandingStoreContext,
): BrandingFieldUpdaters {
  const persist_with = (changes: Partial<BrandingConfig>): Promise<void> =>
    persist_and_set_branding(context, {
      ...context.read_config(),
      ...changes,
    });

  return {
    update_organization_name: (name: string): Promise<void> =>
      persist_with({ organization_name: name }),
    update_organization_logo: (logo_url: string): Promise<void> =>
      persist_with({ organization_logo_url: logo_url }),
    update_social_media_links: (links: SocialMediaLink[]): Promise<void> =>
      persist_with({ social_media_links: links }),
  };
}

interface BrandingStore
  extends Readable<BrandingConfig>, BrandingFieldUpdaters {
  initialize: () => Promise<void>;
  set_organization_context: (
    organization_context: BrandingOrganizationContext,
  ) => Promise<void>;
  refresh_from_organization_settings: (settings: OrganizationSettings) => void;
  get_current_org_id_state: () => BrandingOrganizationContext;
  set: (config: BrandingConfig) => Promise<void>;
  update: (
    updater: (config: BrandingConfig) => BrandingConfig,
  ) => Promise<void>;
  reset_to_default: () => Promise<void>;
}

function create_branding_store(): BrandingStore {
  const { subscribe, set } = writable<BrandingConfig>(
    DEFAULT_PLATFORM_BRANDING,
  );
  const context: BrandingStoreContext = {
    read_config: (): BrandingConfig => get({ subscribe }),
    set_config: set,
    organization_context: {
      state: { status: BRANDING_CONTEXT_STATUS.PLATFORM },
    },
  };

  return {
    subscribe,
    initialize: (): Promise<void> => initialize_branding(context),
    set_organization_context: (
      organization_context: BrandingOrganizationContext,
    ): Promise<void> =>
      set_branding_organization_context(context, organization_context),
    refresh_from_organization_settings: (
      settings: OrganizationSettings,
    ): void => refresh_branding_from_organization_settings(context, settings),
    get_current_org_id_state: (): BrandingOrganizationContext =>
      read_branding_organization_context(context),
    set: (config: BrandingConfig): Promise<void> =>
      persist_and_set_branding(context, config),
    update: (
      updater: (config: BrandingConfig) => BrandingConfig,
    ): Promise<void> =>
      persist_and_set_branding(context, updater(context.read_config())),
    ...build_branding_field_updaters(context),
    reset_to_default: async (): Promise<void> => {
      set(DEFAULT_PLATFORM_BRANDING);
    },
  };
}

export const branding_store = create_branding_store();
