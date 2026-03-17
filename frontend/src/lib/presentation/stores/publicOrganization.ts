import { writable, derived } from "svelte/store";
import { browser } from "$app/environment";
import { get_app_settings_storage } from "$lib/infrastructure/container";

const PUBLIC_ORG_STORAGE_KEY = "sports-org-public-org-id";
const PUBLIC_ORG_NAME_STORAGE_KEY = "sports-org-public-org-name";

interface PublicOrganizationState {
  organization_id: string;
  organization_name: string;
}

function load_saved_public_org(): PublicOrganizationState {
  return { organization_id: "", organization_name: "" };
}

async function save_public_org(
  organization_id: string,
  organization_name: string,
): Promise<boolean> {
  if (!browser) return false;

  const app_settings = get_app_settings_storage();
  await app_settings.set_setting(PUBLIC_ORG_STORAGE_KEY, organization_id);
  await app_settings.set_setting(PUBLIC_ORG_NAME_STORAGE_KEY, organization_name);
  return true;
}

async function clear_public_org(): Promise<boolean> {
  if (!browser) return false;

  const app_settings = get_app_settings_storage();
  await app_settings.remove_setting(PUBLIC_ORG_STORAGE_KEY);
  await app_settings.remove_setting(PUBLIC_ORG_NAME_STORAGE_KEY);
  return true;
}

function create_public_organization_store() {
  const initial_state = load_saved_public_org();
  const { subscribe, set } =
    writable<PublicOrganizationState>(initial_state);

  async function set_organization(
    organization_id: string,
    organization_name: string,
  ): Promise<boolean> {
    if (!organization_id) return false;

    await save_public_org(organization_id, organization_name);
    set({ organization_id, organization_name });
    console.log(
      `[PublicOrg] Set public organization: ${organization_name} (${organization_id})`,
    );
    return true;
  }

  async function detect_from_url_params(search_params: URLSearchParams): Promise<boolean> {
    const org_id = search_params.get("org") ?? "";
    if (!org_id) return false;

    return set_organization(org_id, "");
  }

  async function clear(): Promise<boolean> {
    await clear_public_org();
    set({ organization_id: "", organization_name: "" });
    return true;
  }

  async function initialize(): Promise<void> {
    if (!browser) return;
    const app_settings = get_app_settings_storage();
    const saved_id = (await app_settings.get_setting(PUBLIC_ORG_STORAGE_KEY)) ?? "";
    const saved_name = (await app_settings.get_setting(PUBLIC_ORG_NAME_STORAGE_KEY)) ?? "";
    set({ organization_id: saved_id, organization_name: saved_name });
  }

  return {
    subscribe,
    set_organization,
    detect_from_url_params,
    clear,
    initialize,
  };
}

export const public_organization_store = create_public_organization_store();

const public_organization_id = derived(
  public_organization_store,
  ($store) => $store.organization_id,
);

const public_organization_name = derived(
  public_organization_store,
  ($store) => $store.organization_name,
);
