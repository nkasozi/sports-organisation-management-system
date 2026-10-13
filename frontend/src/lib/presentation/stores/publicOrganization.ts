import { type Readable, writable } from "svelte/store";

import { browser } from "$app/environment";
import type { Organization } from "$lib/core/entities/Organization";
import type { ScalarValueInput } from "$lib/core/types/DomainScalars";
import { get_app_settings_storage } from "$lib/infrastructure/container";

const PUBLIC_ORG_STORAGE_KEY = "sports-org-public-org-id";
const PUBLIC_ORG_NAME_STORAGE_KEY = "sports-org-public-org-name";
const PUBLIC_ORG_URL_PARAM = "org";
const NO_PUBLIC_ORG_VALUE = "";
const PUBLIC_ORG_SET_EVENT = "public_organization_set";

interface PublicOrganizationState {
  organization_id: ScalarValueInput<Organization["id"]> | "";
  organization_name: ScalarValueInput<Organization["name"]> | "";
}

function create_empty_public_org_state(): PublicOrganizationState {
  return {
    organization_id: NO_PUBLIC_ORG_VALUE,
    organization_name: NO_PUBLIC_ORG_VALUE,
  };
}

async function save_public_org(
  organization_id: PublicOrganizationState["organization_id"],
  organization_name: PublicOrganizationState["organization_name"],
): Promise<boolean> {
  if (!browser) return false;

  const app_settings = get_app_settings_storage();
  await app_settings.set_setting(PUBLIC_ORG_STORAGE_KEY, organization_id);
  await app_settings.set_setting(
    PUBLIC_ORG_NAME_STORAGE_KEY,
    organization_name,
  );
  return true;
}

async function clear_public_org(): Promise<boolean> {
  if (!browser) return false;

  const app_settings = get_app_settings_storage();
  await app_settings.remove_setting(PUBLIC_ORG_STORAGE_KEY);
  await app_settings.remove_setting(PUBLIC_ORG_NAME_STORAGE_KEY);
  return true;
}

type PublicOrganizationStateSetter = (state: PublicOrganizationState) => void;

async function set_public_organization(
  set: PublicOrganizationStateSetter,
  organization_id: PublicOrganizationState["organization_id"],
  organization_name: PublicOrganizationState["organization_name"],
): Promise<boolean> {
  if (!organization_id) return false;

  await save_public_org(organization_id, organization_name);
  set({ organization_id, organization_name });
  console.log("[PublicOrg] Set public organization", {
    event: PUBLIC_ORG_SET_EVENT,
    organization_id,
  });
  return true;
}

async function detect_public_organization_from_url_params(
  set: PublicOrganizationStateSetter,
  search_params: URLSearchParams,
): Promise<boolean> {
  const org_id = (search_params.get(PUBLIC_ORG_URL_PARAM) ??
    NO_PUBLIC_ORG_VALUE) as PublicOrganizationState["organization_id"];
  if (!org_id) return false;

  return set_public_organization(set, org_id, NO_PUBLIC_ORG_VALUE);
}

async function clear_public_organization(
  set: PublicOrganizationStateSetter,
): Promise<boolean> {
  await clear_public_org();
  set(create_empty_public_org_state());
  return true;
}

async function initialize_public_organization(
  set: PublicOrganizationStateSetter,
): Promise<void> {
  if (!browser) return;
  const app_settings = get_app_settings_storage();
  const saved_id = ((await app_settings.get_setting(PUBLIC_ORG_STORAGE_KEY)) ??
    NO_PUBLIC_ORG_VALUE) as PublicOrganizationState["organization_id"];
  const saved_name = ((await app_settings.get_setting(
    PUBLIC_ORG_NAME_STORAGE_KEY,
  )) ?? NO_PUBLIC_ORG_VALUE) as PublicOrganizationState["organization_name"];
  set({ organization_id: saved_id, organization_name: saved_name });
}

interface PublicOrganizationStore extends Readable<PublicOrganizationState> {
  set_organization: (
    organization_id: PublicOrganizationState["organization_id"],
    organization_name: PublicOrganizationState["organization_name"],
  ) => Promise<boolean>;
  detect_from_url_params: (search_params: URLSearchParams) => Promise<boolean>;
  clear: () => Promise<boolean>;
  initialize: () => Promise<void>;
}

function create_public_organization_store(): PublicOrganizationStore {
  const { subscribe, set } = writable<PublicOrganizationState>(
    create_empty_public_org_state(),
  );

  return {
    subscribe,
    set_organization: (
      organization_id: PublicOrganizationState["organization_id"],
      organization_name: PublicOrganizationState["organization_name"],
    ): Promise<boolean> =>
      set_public_organization(set, organization_id, organization_name),
    detect_from_url_params: (
      search_params: URLSearchParams,
    ): Promise<boolean> =>
      detect_public_organization_from_url_params(set, search_params),
    clear: (): Promise<boolean> => clear_public_organization(set),
    initialize: (): Promise<void> => initialize_public_organization(set),
  };
}

export const public_organization_store = create_public_organization_store();
