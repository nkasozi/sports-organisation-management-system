import { writable, derived } from "svelte/store";
import { browser } from "$app/environment";

const PUBLIC_ORG_STORAGE_KEY = "sports-org-public-org-id";
const PUBLIC_ORG_NAME_STORAGE_KEY = "sports-org-public-org-name";

interface PublicOrganizationState {
  organization_id: string;
  organization_name: string;
}

function load_saved_public_org(): PublicOrganizationState {
  if (!browser) return { organization_id: "", organization_name: "" };

  const saved_id = localStorage.getItem(PUBLIC_ORG_STORAGE_KEY) ?? "";
  const saved_name = localStorage.getItem(PUBLIC_ORG_NAME_STORAGE_KEY) ?? "";

  return { organization_id: saved_id, organization_name: saved_name };
}

function save_public_org(organization_id: string, organization_name: string): boolean {
  if (!browser) return false;

  localStorage.setItem(PUBLIC_ORG_STORAGE_KEY, organization_id);
  localStorage.setItem(PUBLIC_ORG_NAME_STORAGE_KEY, organization_name);
  return true;
}

function clear_public_org(): boolean {
  if (!browser) return false;

  localStorage.removeItem(PUBLIC_ORG_STORAGE_KEY);
  localStorage.removeItem(PUBLIC_ORG_NAME_STORAGE_KEY);
  return true;
}

function create_public_organization_store() {
  const initial_state = load_saved_public_org();
  const { subscribe, set, update } = writable<PublicOrganizationState>(initial_state);

  function set_organization(organization_id: string, organization_name: string): boolean {
    if (!organization_id) return false;

    save_public_org(organization_id, organization_name);
    set({ organization_id, organization_name });
    console.log(
      `[PublicOrg] Set public organization: ${organization_name} (${organization_id})`,
    );
    return true;
  }

  function detect_from_url_params(search_params: URLSearchParams): boolean {
    const org_id = search_params.get("org") ?? "";
    if (!org_id) return false;

    const org_name = search_params.get("org_name") ?? "";
    return set_organization(org_id, org_name);
  }

  function clear(): boolean {
    clear_public_org();
    set({ organization_id: "", organization_name: "" });
    return true;
  }

  return {
    subscribe,
    set_organization,
    detect_from_url_params,
    clear,
  };
}

export const public_organization_store = create_public_organization_store();

export const public_organization_id = derived(
  public_organization_store,
  ($store) => $store.organization_id,
);

export const public_organization_name = derived(
  public_organization_store,
  ($store) => $store.organization_name,
);
