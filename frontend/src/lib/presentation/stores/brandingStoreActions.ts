import { browser } from "$app/environment";
import { get_app_settings_storage } from "$lib/infrastructure/container";

import {
  BRANDING_CONTEXT_STATUS,
  BRANDING_LOG_EVENTS,
} from "./brandingConstants";
import {
  type BrandingStoreContext,
  load_branding_from_org_settings,
  persist_branding_config,
} from "./brandingOrganizationSettingsSync";
import type {
  BrandingConfig,
  BrandingOrganizationContext,
} from "./brandingTypes";
import {
  CURRENT_ORG_ID_KEY,
  DEFAULT_PLATFORM_BRANDING,
  PLATFORM_STORAGE_KEY,
} from "./brandingTypes";

function parse_stored_platform_branding(stored: string): BrandingConfig {
  try {
    return JSON.parse(stored) as BrandingConfig;
  } catch (error) {
    console.warn("[BrandingStore] Stored platform branding is unreadable", {
      event: BRANDING_LOG_EVENTS.STORED_PLATFORM_BRANDING_PARSE_FAILED,
      error: String(error),
    });
    return DEFAULT_PLATFORM_BRANDING;
  }
}

async function load_stored_platform_branding(
  context: BrandingStoreContext,
): Promise<void> {
  const stored =
    await get_app_settings_storage().get_setting(PLATFORM_STORAGE_KEY);
  context.set_config(
    stored ? parse_stored_platform_branding(stored) : DEFAULT_PLATFORM_BRANDING,
  );
}

async function load_scoped_branding(
  context: BrandingStoreContext,
  scoped_context: Parameters<typeof load_branding_from_org_settings>[1],
): Promise<void> {
  const load_result = await load_branding_from_org_settings(
    context,
    scoped_context,
  );
  if (load_result.success) return;
  console.warn("[BrandingStore] Keeping current branding after load failure", {
    event: BRANDING_LOG_EVENTS.SETTINGS_LOAD_FAILED,
    organization_id: scoped_context.organization_id,
  });
}

export async function initialize_branding(
  context: BrandingStoreContext,
): Promise<void> {
  if (!browser) return;
  const app_settings = get_app_settings_storage();
  const current_org_id = await app_settings.get_setting(CURRENT_ORG_ID_KEY);
  if (current_org_id) {
    const scoped_context = {
      status: BRANDING_CONTEXT_STATUS.SCOPED,
      organization_id: current_org_id,
    };
    context.organization_context.state = scoped_context;
    await load_scoped_branding(context, scoped_context);
    return;
  }

  context.organization_context.state = {
    status: BRANDING_CONTEXT_STATUS.PLATFORM,
  };
  await load_stored_platform_branding(context);
}

async function store_current_organization_id(
  context: BrandingOrganizationContext,
): Promise<void> {
  if (!browser) return;
  const app_settings = get_app_settings_storage();
  context.status === BRANDING_CONTEXT_STATUS.SCOPED
    ? await app_settings.set_setting(
        CURRENT_ORG_ID_KEY,
        context.organization_id,
      )
    : await app_settings.remove_setting(CURRENT_ORG_ID_KEY);
}

export async function set_branding_organization_context(
  context: BrandingStoreContext,
  organization_context: BrandingOrganizationContext,
): Promise<void> {
  context.organization_context.state =
    organization_context.status === BRANDING_CONTEXT_STATUS.SCOPED
      ? {
          status: BRANDING_CONTEXT_STATUS.SCOPED,
          organization_id: organization_context.organization_id,
        }
      : { status: BRANDING_CONTEXT_STATUS.PLATFORM };
  await store_current_organization_id(organization_context);
  if (organization_context.status !== BRANDING_CONTEXT_STATUS.SCOPED) {
    await load_stored_platform_branding(context);
    return;
  }
  await load_scoped_branding(context, organization_context);
}

export function read_branding_organization_context(
  context: BrandingStoreContext,
): BrandingOrganizationContext {
  const organization_context_state = context.organization_context.state;
  return organization_context_state.status === BRANDING_CONTEXT_STATUS.SCOPED
    ? {
        status: BRANDING_CONTEXT_STATUS.SCOPED,
        organization_id: organization_context_state.organization_id,
      }
    : { status: BRANDING_CONTEXT_STATUS.PLATFORM };
}

export async function persist_and_set_branding(
  context: BrandingStoreContext,
  config: BrandingConfig,
): Promise<void> {
  const persist_result = await persist_branding_config(context, config);
  if (!persist_result.success) return;
  context.set_config(config);
}
